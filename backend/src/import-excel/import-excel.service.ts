import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

interface ParsedRow {
  rowNumber: number;
  date: Date | null;
  productName: string | null;
  entries: number;
  exits: number;
  purchasePrice: number | null;
  salePrice: number | null;
  invoiceNumber: string | null;
  customerName: string | null;
  observation: string | null;
}

interface RowIssue {
  rowNumber: number;
  reason: string;
}

// Normalise les en-têtes (accents, casse) pour matcher les colonnes de
// l'Excel réel ("Prix d'achat", "N° Facture"...) sans dépendre de lettres
// de colonnes fixes, qui varient d'un classeur à l'autre.
function normalizeHeader(h: string): string {
  return h
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const HEADER_MAP: Record<string, string[]> = {
  date: ['date'],
  productName: ['produit'],
  entries: ['entrees', 'entree'],
  exits: ['sorties', 'sortie'],
  purchasePrice: ['prixachat'],
  salePrice: ['prixvente'],
  invoiceNumber: ['nfacture', 'numerofacture', 'facture'],
  customerName: ['client'],
  observation: ['observations', 'observation'],
};

@Injectable()
export class ImportExcelService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private parseWorkbook(buffer: Buffer): ParsedRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames.find((n) => normalizeHeader(n) === 'stock') ?? workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new BadRequestException('Aucune feuille "Stock" trouvée dans le fichier.');

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null });
    if (rows.length < 2) return [];

    // Trouve la ligne d'en-tête (première ligne avec au moins "Produit")
    const headerRowIndex = rows.findIndex((r) =>
      r.some((cell) => typeof cell === 'string' && normalizeHeader(cell) === 'produit'),
    );
    if (headerRowIndex === -1) {
      throw new BadRequestException('Impossible de trouver la ligne d\'en-tête (colonne "Produit" introuvable).');
    }

    const headerRow = rows[headerRowIndex].map((h) => (typeof h === 'string' ? normalizeHeader(h) : ''));
    const colIndex: Record<string, number> = {};
    for (const [field, aliases] of Object.entries(HEADER_MAP)) {
      const idx = headerRow.findIndex((h) => aliases.includes(h));
      if (idx !== -1) colIndex[field] = idx;
    }
    if (colIndex.productName === undefined) {
      throw new BadRequestException('Colonne "Produit" introuvable dans l\'en-tête.');
    }

    const parsed: ParsedRow[] = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every((c) => c === null || c === '')) continue;

      const get = (field: string) => (colIndex[field] !== undefined ? r[colIndex[field]] : null);
      const productName = get('productName');
      if (!productName) continue; // ligne vide / séparateur

      parsed.push({
        rowNumber: i + 1,
        date: get('date') instanceof Date ? get('date') : null,
        productName: String(productName).trim(),
        entries: Number(get('entries')) || 0,
        exits: Number(get('exits')) || 0,
        purchasePrice: get('purchasePrice') != null ? Number(get('purchasePrice')) : null,
        salePrice: get('salePrice') != null ? Number(get('salePrice')) : null,
        invoiceNumber: get('invoiceNumber') != null ? String(get('invoiceNumber')).trim() : null,
        customerName: get('customerName') != null ? String(get('customerName')).trim() : null,
        observation: get('observation') != null ? String(get('observation')).trim() : null,
      });
    }
    return parsed;
  }

  /**
   * Étape commune preview/confirm (§21 du brief) : validation, nettoyage,
   * détection des doublons, puis import réel si dryRun=false — toujours
   * dans une transaction unique, jamais de destruction de données existantes.
   */
  private async process(buffer: Buffer, userId: string, dryRun: boolean) {
    const rows = this.parseWorkbook(buffer);
    const products = await this.prisma.product.findMany();
    const productByName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p]));

    const existingInvoiceNumbers = new Set(
      (await this.prisma.invoice.findMany({ select: { invoiceNumber: true } })).map((i) => i.invoiceNumber),
    );

    const errors: RowIssue[] = [];
    const skippedDuplicates: RowIssue[] = [];
    const entryMovements: { row: ParsedRow; productId: string }[] = [];
    const saleGroups = new Map<string, { row: ParsedRow; productId: string }[]>();
    const looseExits: RowIssue[] = [];

    for (const row of rows) {
      const product = row.productName ? productByName.get(row.productName.trim().toLowerCase()) : undefined;
      if (!product) {
        errors.push({ rowNumber: row.rowNumber, reason: `Produit inconnu : "${row.productName}"` });
        continue;
      }
      if (!row.date) {
        errors.push({ rowNumber: row.rowNumber, reason: 'Date manquante ou illisible' });
        continue;
      }

      if (row.entries > 0) {
        entryMovements.push({ row, productId: product.id });
      }

      if (row.exits > 0) {
        if (!row.invoiceNumber) {
          looseExits.push({ rowNumber: row.rowNumber, reason: 'Sortie sans numéro de facture — ignorée (voir §21)' });
          continue;
        }
        if (existingInvoiceNumbers.has(row.invoiceNumber)) {
          skippedDuplicates.push({ rowNumber: row.rowNumber, reason: `Facture ${row.invoiceNumber} déjà importée` });
          continue;
        }
        const key = row.invoiceNumber;
        const group = saleGroups.get(key) ?? [];
        group.push({ row, productId: product.id });
        saleGroups.set(key, group);
      }
    }

    const report = {
      totalRows: rows.length,
      stockEntriesFound: entryMovements.length,
      invoicesFound: saleGroups.size,
      errors: [...errors, ...looseExits],
      duplicates: skippedDuplicates,
      missingData: errors.filter((e) => e.reason.includes('manquante')),
    };

    if (dryRun) {
      return { dryRun: true, report };
    }

    // Import réel — une seule transaction pour tout le fichier
    let importedInvoices = 0;
    let importedEntries = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const { row, productId } of entryMovements) {
        await tx.stockMovement.create({
          data: {
            productId,
            movementType: 'ENTRY',
            quantity: row.entries,
            date: row.date!,
            referenceType: 'excel_import',
            note: `Import Excel — ligne ${row.rowNumber}`,
            createdById: userId,
          },
        });
        importedEntries++;
      }

      for (const [invoiceNumber, lines] of saleGroups.entries()) {
        const first = lines[0].row;
        let customer = first.customerName
          ? await tx.customer.findFirst({ where: { name: first.customerName } })
          : null;
        if (!customer) {
          customer = await tx.customer.create({
            data: { name: first.customerName ?? `Client facture ${invoiceNumber}` },
          });
        }

        const itemsData = lines.map(({ row: r, productId }) => {
          const product = products.find((p) => p.id === productId)!;
          const unitPurchasePrice = r.purchasePrice ?? Number(product.referencePurchasePrice);
          const unitSalePrice = r.salePrice ?? Number(product.referenceSalePrice);
          const lineTotal = r.exits * unitSalePrice;
          const unitMargin = unitSalePrice - unitPurchasePrice;
          const lineProfit = r.exits * unitMargin;
          return { productId, quantity: r.exits, unitPurchasePrice, unitSalePrice, lineTotal, unitMargin, lineProfit };
        });
        const total = itemsData.reduce((acc, l) => acc + l.lineTotal, 0);

        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: customer.id,
            date: first.date!,
            status: 'PAID', // l'Excel ne trace pas de crédit/partiel — hypothèse "payé comptant" (cf. Étape 1)
            subtotal: total,
            discount: 0,
            total,
            amountPaid: total,
            balanceDue: 0,
            createdById: userId,
            items: { create: itemsData },
          },
        });

        await tx.stockMovement.createMany({
          data: itemsData.map((l) => ({
            productId: l.productId,
            movementType: 'EXIT' as const,
            quantity: l.quantity,
            date: first.date!,
            referenceType: 'excel_import',
            referenceId: invoice.id,
            createdById: userId,
          })),
        });

        importedInvoices++;
      }
    }, { timeout: 120000, maxWait: 20000 }); // délai généreux — un import peut porter sur des centaines de lignes

    await this.audit.log({
      userId, action: 'create', entityType: 'excel_import', entityId: 'bulk',
      afterData: { importedInvoices, importedEntries, ...report },
    });

    return {
      dryRun: false,
      report: { ...report, importedInvoices, importedEntries },
    };
  }

  preview(buffer: Buffer, userId: string) {
    return this.process(buffer, userId, true);
  }

  confirm(buffer: Buffer, userId: string) {
    return this.process(buffer, userId, false);
  }
}
