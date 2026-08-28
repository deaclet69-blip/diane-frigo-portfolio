import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type TraceabilityGranularity = 'day' | 'week' | 'month' | 'year';

export interface TraceabilityRow {
  period: string;
  label: string;
  recettes: number;
  chiffreAffaires: number;
  coutMarchandises: number;
  margeBrute: number;
  charges: number;
  resultatNet: number;
}

export interface VelocityRow {
  productId: string;
  productName: string;
  quantitySoldWindow: number;
  avgDailyQuantity: number;
  currentStock: number;
  daysOfStockRemaining: number | null; // null si le produit ne s'écoule pas du tout sur la période
  rank: number;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vitesse d'écoulement par produit (demande utilisateur) : classe les
   * produits du plus vendu au moins vendu sur une fenêtre récente (par
   * défaut 30 jours), avec le nombre de jours de stock restants au rythme
   * actuel — pour savoir quoi racheter en priorité.
   */
  async velocityReport(windowDays = 30) {
    const since = new Date(Date.now() - windowDays * 86400000);

    const [products, items, movements] = await Promise.all([
      this.prisma.product.findMany({ where: { isActive: true } }),
      this.prisma.invoiceItem.findMany({
        where: { invoice: { voidedAt: null, date: { gte: since } } },
      }),
      this.prisma.stockMovement.findMany(),
    ]);

    const soldByProduct = new Map<string, number>();
    for (const it of items) {
      soldByProduct.set(it.productId, (soldByProduct.get(it.productId) ?? 0) + it.quantity);
    }

    const rows: Omit<VelocityRow, 'rank'>[] = products.map((p) => {
      const productMovements = movements.filter((m) => m.productId === p.id);
      const get = (t: string) => productMovements
        .filter((m) => m.movementType === t)
        .reduce((acc, m) => acc + m.quantity, 0);
      const currentStock = get('ENTRY') + get('INVENTORY_ADJUSTMENT') - get('EXIT');

      const quantitySoldWindow = soldByProduct.get(p.id) ?? 0;
      const avgDailyQuantity = quantitySoldWindow / windowDays;
      const daysOfStockRemaining = avgDailyQuantity > 0 ? currentStock / avgDailyQuantity : null;

      return { productId: p.id, productName: p.name, quantitySoldWindow, avgDailyQuantity, currentStock, daysOfStockRemaining };
    });

    return rows
      .sort((a, b) => b.quantitySoldWindow - a.quantitySoldWindow)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async productsReport() {
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { voidedAt: null } },
      include: { product: true },
    });

    const map = new Map<string, { productName: string; quantity: number; revenue: number; profit: number }>();
    for (const it of items) {
      const key = it.productId;
      const entry = map.get(key) ?? { productName: it.product.name, quantity: 0, revenue: 0, profit: 0 };
      entry.quantity += it.quantity;
      entry.revenue += Number(it.lineTotal);
      entry.profit += Number(it.lineProfit);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }

  async customersReport() {
    const invoices = await this.prisma.invoice.findMany({
      where: { voidedAt: null },
      include: { customer: true, items: true },
    });

    const map = new Map<string, { customerName: string; orderCount: number; revenue: number; quantity: number }>();
    for (const inv of invoices) {
      const key = inv.customerId;
      const entry = map.get(key) ?? { customerName: inv.customer.name, orderCount: 0, revenue: 0, quantity: 0 };
      entry.orderCount += 1;
      entry.revenue += Number(inv.total);
      entry.quantity += inv.items.reduce((acc, i) => acc + i.quantity, 0);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
  }

  async expensesReport() {
    const expenses = await this.prisma.expense.findMany({
      include: { category: true },
    });
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category.name, (map.get(e.category.name) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  async salesReport(from?: string, to?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        voidedAt: null,
        date: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { items: true },
    });
    return {
      invoiceCount: invoices.length,
      totalRevenue: invoices.reduce((acc, i) => acc + Number(i.total), 0),
      totalProfit: invoices.reduce(
        (acc, inv) => acc + inv.items.reduce((s, it) => s + Number(it.lineProfit), 0), 0,
      ),
    };
  }

  /**
   * Traçabilité de l'argent — vue jour / semaine / mois / année pour le
   * comptable ou le vendeur : recettes réellement encaissées (Payment),
   * chiffre d'affaires facturé (InvoiceItem.lineTotal), coût des
   * marchandises, marge brute, charges (Expense) et résultat net par
   * période. `from`/`to` (format YYYY-MM-DD) filtrent une plage de dates ;
   * sans filtre, tout l'historique est agrégé.
   */
  async traceability(granularity: TraceabilityGranularity, from?: string, to?: string) {
    const hasFilter = !!from || !!to;
    const dateFilter = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };

    const [items, payments, expenses] = await Promise.all([
      this.prisma.invoiceItem.findMany({
        where: { invoice: { voidedAt: null, ...(hasFilter ? { date: dateFilter } : {}) } },
        include: { invoice: { select: { date: true } } },
      }),
      this.prisma.payment.findMany({ where: hasFilter ? { date: dateFilter } : {} }),
      this.prisma.expense.findMany({ where: hasFilter ? { date: dateFilter } : {} }),
    ]);

    const buckets = new Map<string, TraceabilityRow>();
    const getBucket = (key: string): TraceabilityRow => {
      let row = buckets.get(key);
      if (!row) {
        row = {
          period: key,
          label: this.periodLabel(key, granularity),
          recettes: 0,
          chiffreAffaires: 0,
          coutMarchandises: 0,
          margeBrute: 0,
          charges: 0,
          resultatNet: 0,
        };
        buckets.set(key, row);
      }
      return row;
    };

    for (const item of items) {
      const row = getBucket(this.periodKey(new Date(item.invoice.date), granularity));
      row.chiffreAffaires += Number(item.lineTotal);
      row.coutMarchandises += item.quantity * Number(item.unitPurchasePrice);
      row.margeBrute += Number(item.lineProfit);
    }
    for (const p of payments) {
      getBucket(this.periodKey(new Date(p.date), granularity)).recettes += Number(p.amount);
    }
    for (const e of expenses) {
      getBucket(this.periodKey(new Date(e.date), granularity)).charges += Number(e.amount);
    }

    const rows = Array.from(buckets.values())
      .map((r) => ({ ...r, resultatNet: r.margeBrute - r.charges }))
      .sort((a, b) => a.period.localeCompare(b.period));

    const totals = rows.reduce(
      (acc, r) => ({
        recettes: acc.recettes + r.recettes,
        chiffreAffaires: acc.chiffreAffaires + r.chiffreAffaires,
        coutMarchandises: acc.coutMarchandises + r.coutMarchandises,
        margeBrute: acc.margeBrute + r.margeBrute,
        charges: acc.charges + r.charges,
        resultatNet: acc.resultatNet + r.resultatNet,
      }),
      { recettes: 0, chiffreAffaires: 0, coutMarchandises: 0, margeBrute: 0, charges: 0, resultatNet: 0 },
    );

    return { granularity, rows, totals };
  }

  private periodKey(date: Date, granularity: TraceabilityGranularity): string {
    if (granularity === 'day') return date.toISOString().slice(0, 10);
    if (granularity === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (granularity === 'year') return String(date.getFullYear());
    // semaine ISO approximative — même logique que FinancesService.getRecettes
    const onejan = new Date(date.getFullYear(), 0, 1);
    const week = Math.ceil(((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `${date.getFullYear()}-S${week}`;
  }

  private periodLabel(key: string, granularity: TraceabilityGranularity): string {
    if (granularity === 'day') {
      return new Date(key).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (granularity === 'month') {
      const [y, m] = key.split('-');
      return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    }
    if (granularity === 'year') return key;
    const [year, week] = key.split('-S');
    return `Semaine ${week} — ${year}`;
  }

  /** Entrées de stock avec date, fournisseur et prix d'achat (demande utilisateur). */
  async stockEntriesReport(from?: string, to?: string) {
    const entries = await this.prisma.stockMovement.findMany({
      where: {
        movementType: 'ENTRY',
        date: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { product: { select: { name: true } }, supplier: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 300,
    });
    return entries.map((e) => ({
      date: e.date,
      productName: e.product.name,
      quantity: e.quantity,
      unitCost: e.unitCost ? Number(e.unitCost) : null,
      totalCost: e.unitCost ? Number(e.unitCost) * e.quantity : null,
      supplierName: e.supplier?.name ?? null,
      note: e.note,
    }));
  }
}
