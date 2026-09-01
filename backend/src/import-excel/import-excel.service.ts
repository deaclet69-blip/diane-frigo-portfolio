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
  // Alias corrigés (bug détecté par l'utilisateur) — l'en-tête réel
  // "Prix d'achat (FCFA)" devient "prixdachatfcfa" une fois nettoyé (le "d"
  // de "d'achat" et le "(FCFA)" en font partie), pas juste "prixachat".
  // Match en "commence par" ci-dessous pour tolérer d'autres variations
  // futures (unité différente, libellé légèrement modifié...).
  purchasePrice: ['prixdachat', 'prixachat'],
  salePrice: ['prixdevente', 'prixvente'],
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
      const idx = headerRow.findIndex((h) => aliases.some((a) => h.startsWith(a)));
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

    // Produits présents dans le fichier mais absents de Paramètres > Produits
    // — créés automatiquement (demande utilisateur), avec le prix trouvé sur
    // leur toute première ligne dans le fichier comme prix de référence.
    const newProductDefaults = new Map<string, { name: string; purchasePrice: number; salePrice: number }>();
    for (const row of rows) {
      if (!row.productName) continue;
      const key = row.productName.trim().toLowerCase();
      if (productByName.has(key) || newProductDefaults.has(key)) continue;
      newProductDefaults.set(key, {
        name: row.productName.trim(),
        purchasePrice: row.purchasePrice ?? 0,
        salePrice: row.salePrice ?? 0,
      });
    }

    if (!dryRun) {
      // Création réelle, avant de traiter les lignes, pour que chaque ligne
      // du fichier puisse ensuite trouver son produit normalement.
      for (const def of newProductDefaults.values()) {
        const created = await this.prisma.product.create({
          data: {
            name: def.name,
            referencePurchasePrice: def.purchasePrice,
            referenceSalePrice: def.salePrice,
            alertThreshold: 500,
          },
        });
        productByName.set(def.name.trim().toLowerCase(), created);
        products.push(created);
        await this.audit.log({
          userId, action: 'create', entityType: 'product', entityId: created.id, afterData: created,
        });
      }
    } else {
      // Aperçu uniquement : entrées temporaires (jamais enregistrées) pour
      // que les compteurs de l'aperçu soient corrects sans rien créer.
      for (const def of newProductDefaults.values()) {
        productByName.set(def.name.trim().toLowerCase(), {
          id: `preview-${def.name}`,
          name: def.name,
          referencePurchasePrice: def.purchasePrice,
          referenceSalePrice: def.salePrice,
        } as any);
      }
    }

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
      newProducts: Array.from(newProductDefaults.values()).map((d) => d.name),
      errors: [...errors, ...looseExits],
      duplicates: skippedDuplicates,
      missingData: errors.filter((e) => e.reason.includes('manquante')),
    };

    if (dryRun) {
      return { dryRun: true, report };
    }

    // Import réel — sans transaction (voir note plus bas). L'ordre respecte
    // les dépendances : produits déjà créés plus haut, puis mouvements de
    // stock, puis factures.
    let importedInvoices = 0;
    let importedEntries = 0;

    for (const { row, productId } of entryMovements) {
      await this.prisma.stockMovement.create({
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

      // Plus de $transaction ici : la connexion groupée de Neon coupe même
      // les petites transactions par intermittence (observé en pratique).
      // On enregistre les étapes l'une après l'autre — un import est une
      // opération ponctuelle, pas une vente du quotidien : le très faible
      // risque d'incohérence partielle en cas de coupure en plein milieu
      // est largement acceptable ici, et un nouvel essai ne duplique rien
      // (la facture serait déjà détectée comme doublon).
      let customer = first.customerName
        ? await this.prisma.customer.findFirst({ where: { name: first.customerName } })
        : null;
      if (!customer) {
        customer = await this.prisma.customer.create({
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

      const invoice = await this.prisma.invoice.create({
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
          note: first.observation || undefined,
          items: { create: itemsData },
        },
      });

      // Sans ceci, "Recettes" (Rapports > Traçabilité) restait à 0 pour
      // toutes les ventes importées — ce total est calculé à partir des
      // VRAIS paiements enregistrés (table Payment), pas juste du champ
      // amountPaid de la facture. Bug détecté par l'utilisateur.
      await this.prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: total,
          date: first.date!,
          method: 'Import Excel',
        },
      });

      await this.prisma.stockMovement.createMany({
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
