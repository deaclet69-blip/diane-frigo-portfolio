import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { FinancesService } from '../finances/finances.service';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private financesService: FinancesService,
  ) {}

  async getSummary(period: 'month' | 'all' = 'month') {
    const [financeSummary, stockOverview, recovery] = await Promise.all([
      this.financesService.getSummary(period),
      this.stockService.getOverview(),
      this.financesService.getRecoveryStatus(),
    ]);

    return {
      period,
      revenue: financeSummary.revenue,
      operatingExpenses: financeSummary.charges,
      grossProfit: financeSummary.grossProfit,
      netResult: financeSummary.netResult,
      treasury: financeSummary.treasury,
      totalProducts: stockOverview.totals.totalProducts,
      currentStockCartons: stockOverview.totals.totalStock,
      currentStockValue: stockOverview.totals.totalValue,
      lowStockAlertsCount: stockOverview.totals.ruptureCount + stockOverview.totals.alertCount,
      ruptureCount: stockOverview.totals.ruptureCount,
      recoveryProgressPercent: recovery.progressPercent,
      recoveryAmountRemaining: recovery.amountRemaining,
    };
  }

  private timeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days} j`;
  }

  /**
   * Vue complète du dashboard "futuriste" : KPI du jour, tendance CA 7j,
   * ventes par produit, alertes, activité récente, top produits par marge,
   * stock par catégorie, résumé financier du mois. Réutilise les services
   * existants — rien n'est recalculé en double.
   */
  async getFullDashboard() {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startYesterday = new Date(startToday.getTime() - 86400000);
    const start7d = new Date(startToday.getTime() - 6 * 86400000);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      itemsToday, itemsYesterday, items7d, monthSummary, stockOverview, deposits,
      unpaidInvoices, recentInvoices, recentStockMovements, recentExpenses,
      productsReport, categories,
    ] = await Promise.all([
      this.prisma.invoiceItem.findMany({ where: { invoice: { voidedAt: null, date: { gte: startToday } } } }),
      this.prisma.invoiceItem.findMany({ where: { invoice: { voidedAt: null, date: { gte: startYesterday, lt: startToday } } } }),
      this.prisma.invoiceItem.findMany({
        where: { invoice: { voidedAt: null, date: { gte: start7d } } },
        include: { invoice: { select: { date: true } }, product: { select: { name: true } } },
      }),
      this.financesService.getSummary('month'),
      this.stockService.getOverview(),
      this.prisma.deposit.findMany({ include: { movements: true } }),
      this.prisma.invoice.findMany({ where: { voidedAt: null, balanceDue: { gt: 0 } } }),
      this.prisma.invoice.findMany({
        where: { voidedAt: null }, orderBy: { createdAt: 'desc' }, take: 4,
        include: { customer: { select: { name: true } } },
      }),
      this.prisma.stockMovement.findMany({
        where: { referenceType: { in: ['manual_entry', 'excel_import'] } }, orderBy: { createdAt: 'desc' }, take: 3,
        include: { product: { select: { name: true } } },
      }),
      this.prisma.expense.findMany({ orderBy: { date: 'desc' }, take: 3, include: { category: true } }),
      this.reportsProductsReport(),
      this.prisma.category.findMany({ include: { products: true } }),
    ]);

    const revenueToday = itemsToday.reduce((acc, i) => acc + Number(i.lineTotal), 0);
    const profitToday = itemsToday.reduce((acc, i) => acc + Number(i.lineProfit), 0);
    const revenueYesterday = itemsYesterday.reduce((acc, i) => acc + Number(i.lineTotal), 0);
    const profitYesterday = itemsYesterday.reduce((acc, i) => acc + Number(i.lineProfit), 0);
    const pctChange = (curr: number, prev: number) => (prev > 0 ? ((curr - prev) / prev) * 100 : null);

    // Tendance CA 7 derniers jours
    const trendMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(start7d.getTime() + i * 86400000);
      trendMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const it of items7d) {
      const key = new Date(it.invoice.date).toISOString().slice(0, 10);
      trendMap.set(key, (trendMap.get(key) ?? 0) + Number(it.lineTotal));
    }
    const revenueTrend = Array.from(trendMap.entries()).map(([date, revenue]) => ({ date, revenue }));

    // Ventes par produit (7 derniers jours)
    const byProduct = new Map<string, number>();
    for (const it of items7d) byProduct.set(it.product.name, (byProduct.get(it.product.name) ?? 0) + Number(it.lineTotal));
    const totalByProduct = Array.from(byProduct.values()).reduce((a, b) => a + b, 0);
    const salesByProduct = Array.from(byProduct.entries())
      .map(([name, value]) => ({ name, value, percent: totalByProduct > 0 ? (value / totalByProduct) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    // Dépôts clients (agrégé)
    let depositsCartons = 0;
    for (const d of deposits) {
      const dep = d.movements.filter((m) => m.movementType === 'DEPOSIT').reduce((a, m) => a + m.quantity, 0);
      const wd = d.movements.filter((m) => m.movementType === 'WITHDRAWAL').reduce((a, m) => a + m.quantity, 0);
      depositsCartons += Math.max(0, dep - wd);
    }
    const depositsValue = stockOverview.items.length > 0
      ? depositsCartons * (stockOverview.totals.totalValue / Math.max(1, stockOverview.totals.totalStock))
      : 0;

    const receivablesTotal = unpaidInvoices.reduce((acc, i) => acc + Number(i.balanceDue), 0);
    const receivablesCount = unpaidInvoices.length;

    // Alertes
    const alerts: { type: string; title: string; detail: string; timeAgo: string }[] = [];
    const alertItems = stockOverview.items.filter((i) => i.status !== 'OK');
    if (alertItems.length > 0) {
      alerts.push({
        type: 'warning', title: 'Stock faible',
        detail: `${alertItems.length} produit(s) sont en stock faible`, timeAgo: '',
      });
    }
    const ruptures = stockOverview.items.filter((i) => i.status === 'RUPTURE');
    if (ruptures.length > 0) {
      alerts.push({
        type: 'error', title: 'Rupture de stock',
        detail: `${ruptures.length} produit(s) en rupture de stock`, timeAgo: '',
      });
    }
    if (receivablesCount > 0) {
      alerts.push({
        type: 'error', title: 'Paiement en retard',
        detail: `${receivablesCount} facture(s) ont un solde impayé`, timeAgo: '',
      });
    }
    if (depositsCartons > 0) {
      alerts.push({
        type: 'info', title: 'Dépôt à retirer',
        detail: `${deposits.filter((d) => d.movements.length > 0).length} client(s) ont des dépôts à retirer`, timeAgo: '',
      });
    }

    // Activité récente (factures + entrées de stock + charges, fusionnées et triées)
    const activity: { type: string; label: string; sublabel: string; amount: number; date: Date }[] = [
      ...recentInvoices.map((inv) => ({
        type: 'sale', label: `Vente #${inv.invoiceNumber}`, sublabel: inv.customer.name,
        amount: Number(inv.total), date: inv.createdAt,
      })),
      ...recentStockMovements.map((m) => ({
        type: 'stock', label: `Entrée de stock`, sublabel: `${m.product.name} — ${m.quantity} cartons`,
        amount: m.unitCost ? Number(m.unitCost) * m.quantity : 0, date: m.createdAt,
      })),
      ...recentExpenses.map((e) => ({
        type: 'expense', label: `Dépense`, sublabel: e.category.name,
        amount: Number(e.amount), date: e.date,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5)
      .map((a) => ({ ...a, timeAgo: this.timeAgo(a.date) }));

    // Stock par catégorie
    const stockByCategoryMap = new Map<string, number>();
    for (const item of stockOverview.items) {
      const cat = categories.find((c) => c.products.some((p) => p.id === item.id));
      // Tant qu'aucune catégorie n'est assignée à un produit (Paramètres >
      // Produits), on regroupe par PRODUIT plutôt que par un "Autres" qui
      // n'apporte rien à lire (demande utilisateur).
      const key = cat?.name ?? item.name;
      stockByCategoryMap.set(key, (stockByCategoryMap.get(key) ?? 0) + item.currentStock);
    }
    const totalStockCartons = stockOverview.totals.totalStock;
    const stockByCategory = Array.from(stockByCategoryMap.entries())
      .map(([category, cartons]) => ({ category, cartons, percent: totalStockCartons > 0 ? (cartons / totalStockCartons) * 100 : 0 }))
      .sort((a, b) => b.cartons - a.cartons);

    return {
      kpis: {
        revenueToday, profitToday,
        revenueChangePercent: pctChange(revenueToday, revenueYesterday),
        profitChangePercent: pctChange(profitToday, profitYesterday),
        stockValue: stockOverview.totals.totalValue,
        stockCartons: stockOverview.totals.totalStock,
        depositsValue, depositsCartons,
        receivablesTotal, receivablesCount,
      },
      revenueTrend,
      salesByProduct,
      alerts,
      recentActivity: activity,
      topProductsByMargin: productsReport.slice(0, 5),
      stockByCategory,
      monthlySummary: {
        revenue: monthSummary.revenue,
        expenses: monthSummary.charges,
        netProfit: monthSummary.netResult,
        avgMarginPercent: monthSummary.revenue > 0 ? (monthSummary.grossProfit / monthSummary.revenue) * 100 : 0,
      },
    };
  }

  private async reportsProductsReport() {
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { voidedAt: null } },
      include: { product: true },
    });
    const map = new Map<string, { productName: string; quantity: number; margin: number; revenue: number }>();
    for (const it of items) {
      const entry = map.get(it.productId) ?? { productName: it.product.name, quantity: 0, margin: 0, revenue: 0 };
      entry.quantity += it.quantity;
      entry.margin += Number(it.lineProfit);
      entry.revenue += Number(it.lineTotal);
      map.set(it.productId, entry);
    }
    return Array.from(map.values())
      .map((e) => ({ ...e, marginPercent: e.revenue > 0 ? (e.margin / e.revenue) * 100 : 0 }))
      .sort((a, b) => b.margin - a.margin);
  }
}
