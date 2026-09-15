import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StockService } from '../stock/stock.service';
import { FinancesService } from '../finances/finances.service';
import { ReportsService } from '../reports/reports.service';
import { PricingService } from '../pricing/pricing.service';
import { LossesService } from '../losses/losses.service';
import { LoansService } from '../loans/loans.service';

@Injectable()
export class BusinessSnapshotService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private financesService: FinancesService,
    private reportsService: ReportsService,
    private pricingService: PricingService,
    private lossesService: LossesService,
    private loansService: LoansService,
  ) {}

  private async getSalesTrend() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

    // NO date limit here — the AI must be able to access the full sales
    // history, not just a recent window. Includes customer + invoice so we
    // can compute unique customers / transaction count / top customer /
    // best month per product (quantity + revenue alone aren't enough to
    // answer "which product attracted the most customers").
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { voidedAt: null } },
      include: {
        invoice: { select: { id: true, date: true, customer: { select: { name: true } } } },
        product: { select: { name: true } },
      },
    });

    const firstSaleDate = items.length
      ? items.reduce((min: Date, i: any) => (new Date(i.invoice.date) < min ? new Date(i.invoice.date) : min), new Date(items[0].invoice.date))
      : null;

    const lastWeek = items.filter((i: any) => new Date(i.invoice.date) >= sevenDaysAgo);
    const priorWeek = items.filter((i: any) => new Date(i.invoice.date) < sevenDaysAgo && new Date(i.invoice.date) >= fourteenDaysAgo);

    const sum = (arr: any[]) => arr.reduce((acc, i) => acc + Number(i.lineTotal), 0);

    const byProduct = (arr: any[]) => {
      type Agg = {
        quantity: number; revenue: number;
        invoiceIds: Set<string>; customers: Map<string, number>; months: Map<string, number>;
      };
      const map = new Map<string, Agg>();
      for (const i of arr) {
        const cur = map.get(i.product.name) ?? {
          quantity: 0, revenue: 0, invoiceIds: new Set<string>(), customers: new Map<string, number>(), months: new Map<string, number>(),
        };
        cur.quantity += i.quantity;
        cur.revenue += Number(i.lineTotal);
        cur.invoiceIds.add(i.invoice.id);
        const customerName = i.invoice.customer?.name ?? 'Unknown customer';
        cur.customers.set(customerName, (cur.customers.get(customerName) ?? 0) + i.quantity);
        const monthKey = new Date(i.invoice.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        cur.months.set(monthKey, (cur.months.get(monthKey) ?? 0) + Number(i.lineTotal));
        map.set(i.product.name, cur);
      }
      return Array.from(map.entries())
        .map(([name, v]) => {
          const topCustomerEntry = [...v.customers.entries()].sort((a, b) => b[1] - a[1])[0];
          const bestMonthEntry = [...v.months.entries()].sort((a, b) => b[1] - a[1])[0];
          return {
            name,
            quantity: v.quantity,
            revenue: v.revenue,
            transactions: v.invoiceIds.size,
            uniqueCustomers: v.customers.size,
            topCustomer: topCustomerEntry ? { name: topCustomerEntry[0], quantityBought: topCustomerEntry[1] } : null,
            bestMonth: bestMonthEntry ? { month: bestMonthEntry[0], revenue: bestMonthEntry[1] } : null,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);
    };

    return {
      revenueLast7Days: sum(lastWeek),
      revenuePrior7Days: sum(priorWeek),
      quantityByProductLast7Days: byProduct(lastWeek),
      quantityByProductAllTime: byProduct(items),
      periodStart: firstSaleDate ? firstSaleDate.toISOString().slice(0, 10) : null,
      periodEnd: now.toISOString().slice(0, 10),
    };
  }

  /** Customers who used to order regularly but haven't ordered in 14+ days. */
  private async getDecliningCustomers() {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000);
    const customers = await this.prisma.customer.findMany({
      where: { mergedIntoId: null },
      include: { invoices: { where: { voidedAt: null }, orderBy: { date: 'desc' }, take: 1 } },
    });
    return customers
      .filter((c: any) => c.invoices.length > 0 && new Date(c.invoices[0].date) < fourteenDaysAgo)
      .map((c: any) => ({
        name: c.name,
        lastOrderDate: c.invoices[0].date,
      }));
      // No .slice() — the AI sees every declining customer, not just the first 15.
  }

  private async getOverdueDebts() {
    const invoices = await this.prisma.invoice.findMany({
      where: { voidedAt: null, balanceDue: { gt: 0 } },
      include: { customer: { select: { name: true } } },
      orderBy: { date: 'asc' },
      // No take limit — every overdue debt, not just the first 20.
    });
    return invoices.map((i: any) => ({
      customer: i.customer.name,
      invoiceNumber: i.invoiceNumber,
      balanceDue: Number(i.balanceDue),
      date: i.date,
    }));
  }

  /**
   * Expense history by category over the last 4 months (including the
   * current one) — without this, the AI only ever saw the current month's
   * total, never what was paid in previous months (e.g. salaries), so it
   * couldn't make a reasonable estimate from real history.
   */
  private async getExpenseHistory() {
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < 4; i++) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), start, end });
    }

    const results = await Promise.all(
      months.map(async (m) => {
        const expenses = await this.prisma.expense.findMany({
          where: { date: { gte: m.start, lt: m.end } },
          include: { category: true },
        });
        const byCategory = new Map<string, number>();
        for (const e of expenses) {
          byCategory.set(e.category.name, (byCategory.get(e.category.name) ?? 0) + Number(e.amount));
        }
        return {
          month: m.label,
          byCategory: Array.from(byCategory.entries()).map(([category, amount]) => ({ category, amount })),
        };
      }),
    );
    return results;
  }

  /**
   * Compiles a full snapshot of the business — this is the "context" sent
   * to the AI so it can give relevant analysis and suggestions instead of
   * generic advice.
   */
  async getSnapshot() {
    const [stock, financeSummary, recovery, salesTrend, topCustomers, decliningCustomers, overdueDebts,
      pricingAnalysis, monthlyLossRate, loanStatus, expenseHistory] =
      await Promise.all([
        this.stockService.getOverview(),
        this.financesService.getSummary('month'),
        this.financesService.getRecoveryStatus(),
        this.getSalesTrend(),
        this.reportsService.customersReport(),
        this.getDecliningCustomers(),
        this.getOverdueDebts(),
        this.pricingService.getProfitabilityAnalysis().catch(() => null),
        this.lossesService.getMonthlyLossRate().catch(() => null),
        this.loansService.getStatus().catch(() => null), // may not exist — handled gracefully
        this.getExpenseHistory(),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      stock: {
        items: stock.items.map((i) => ({
          product: i.name, currentStock: i.currentStock, status: i.status, alertThreshold: i.alertThreshold,
        })),
        totalValue: stock.totals.totalValue,
        outOfStockCount: stock.totals.ruptureCount,
        lowStockCount: stock.totals.alertCount,
      },
      finances: {
        revenueThisMonth: financeSummary.revenue,
        fixedExpensesThisMonth: financeSummary.chargesFixe,
        variableExpensesThisMonth: financeSummary.chargesVariable,
        oneTimeExpensesThisMonth: financeSummary.chargesExceptionnel,
        grossMargin: financeSummary.grossProfit,
        netResultThisMonth: financeSummary.netResult,
        cumulativeNetResult: recovery.netResult,
        recoveryObjectivePercent: recovery.progressPercent,
        // Expense history by category over the last 4 months — useful for
        // estimating a recurring expense (e.g. "salaries") not yet
        // recorded this month, based on what was paid before.
        expenseHistoryByCategory: expenseHistory,
      },
      sales: {
        revenueThisWeek: salesTrend.revenueLast7Days,
        revenuePreviousWeek: salesTrend.revenuePrior7Days,
        percentChange: salesTrend.revenuePrior7Days > 0
          ? ((salesTrend.revenueLast7Days - salesTrend.revenuePrior7Days) / salesTrend.revenuePrior7Days) * 100
          : null,
        quantityByProductThisWeek: salesTrend.quantityByProductLast7Days,
        // NO date limit — the full sales history, from the very first sale
        // to today, so the AI can answer about any period, not just the
        // current week. Use "uniqueCustomers" (not quantity) to answer
        // "which product attracted the most customers".
        periodCovered: { start: salesTrend.periodStart, end: salesTrend.periodEnd },
        quantityAndRevenueByProductAllTime: salesTrend.quantityByProductAllTime,
      },
      customers: {
        top: topCustomers, // no .slice() — every customer, ranked
        decliningActivity: decliningCustomers,
        overdueDebts: overdueDebts,
      },
      pricing: pricingAnalysis ? {
        chargesFixedPerBox: pricingAnalysis.chargesFixedPerCarton,
        chargesVariablePerBox: pricingAnalysis.chargesVariablePerCarton,
        products: pricingAnalysis.rows.map((r) => ({
          product: r.productName, costBasis: r.costOfGoods, suggestedFloorPrice: r.suggestedPrices.floor,
        })),
      } : null,
      losses: monthlyLossRate ? {
        lossValueThisMonth: monthlyLossRate.lossValue,
        lossRate: monthlyLossRate.rate,
        acceptableThreshold: monthlyLossRate.acceptableRate,
        aboveThreshold: monthlyLossRate.isAboveAcceptable,
      } : null,
      loan: loanStatus ? {
        totalAmount: loanStatus.loan.totalAmount,
        percentRepaid: loanStatus.repayment.percentRepaid,
        profitTarget: loanStatus.profitObjective.target,
        percentTargetAchieved: loanStatus.profitObjective.percentAchieved,
        daysOfStockRemaining: loanStatus.projections.stockRunwayDays,
      } : null,
    };
  }
}
