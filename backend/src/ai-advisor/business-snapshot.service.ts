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

    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { voidedAt: null, date: { gte: fourteenDaysAgo } } },
      include: { invoice: { select: { date: true } }, product: { select: { name: true } } },
    });

    const lastWeek = items.filter((i: any) => new Date(i.invoice.date) >= sevenDaysAgo);
    const priorWeek = items.filter((i: any) => new Date(i.invoice.date) < sevenDaysAgo);

    const sum = (arr: any[]) => arr.reduce((acc, i) => acc + Number(i.lineTotal), 0);
    const byProduct = (arr: any[]) => {
      const map = new Map<string, number>();
      for (const i of arr) map.set(i.product.name, (map.get(i.product.name) ?? 0) + i.quantity);
      return Array.from(map.entries()).map(([name, quantity]) => ({ name, quantity }));
    };

    return {
      revenueLast7Days: sum(lastWeek),
      revenuePrior7Days: sum(priorWeek),
      quantityByProductLast7Days: byProduct(lastWeek),
    };
  }

  /** Clients qui achetaient régulièrement mais n'ont rien commandé depuis 14+ jours. */
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
      }))
      .slice(0, 15);
  }

  private async getOverdueDebts() {
    const invoices = await this.prisma.invoice.findMany({
      where: { voidedAt: null, balanceDue: { gt: 0 } },
      include: { customer: { select: { name: true } } },
      orderBy: { date: 'asc' },
      take: 20,
    });
    return invoices.map((i: any) => ({
      customer: i.customer.name,
      invoiceNumber: i.invoiceNumber,
      balanceDue: Number(i.balanceDue),
      date: i.date,
    }));
  }

  /**
   * Compile un instantané complet de l'activité — c'est ce "contexte" qui
   * est envoyé à l'IA pour qu'elle puisse donner des analyses et des
   * suggestions pertinentes, plutôt que des généralités.
   */
  async getSnapshot() {
    const [stock, financeSummary, recovery, salesTrend, topCustomers, decliningCustomers, overdueDebts,
      pricingAnalysis, monthlyLossRate, loanStatus] =
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
        this.loansService.getStatus().catch(() => null), // peut ne pas exister — géré gracieusement
      ]);

    return {
      generatedAt: new Date().toISOString(),
      stock: {
        items: stock.items.map((i) => ({
          produit: i.name, stockActuel: i.currentStock, statut: i.status, seuilAlerte: i.alertThreshold,
        })),
        valeurTotale: stock.totals.totalValue,
        enRupture: stock.totals.ruptureCount,
        enAlerte: stock.totals.alertCount,
      },
      finances: {
        caMois: financeSummary.revenue,
        chargesFixeMois: financeSummary.chargesFixe,
        chargesVariableMois: financeSummary.chargesVariable,
        chargesExceptionnelMois: financeSummary.chargesExceptionnel,
        margeBrute: financeSummary.grossProfit,
        resultatNetMois: financeSummary.netResult,
        resultatNetCumule: recovery.netResult,
        objectifRecuperationPourcent: recovery.progressPercent,
      },
      ventes: {
        caSemaineActuelle: salesTrend.revenueLast7Days,
        caSemainePrecedente: salesTrend.revenuePrior7Days,
        evolutionPourcent: salesTrend.revenuePrior7Days > 0
          ? ((salesTrend.revenueLast7Days - salesTrend.revenuePrior7Days) / salesTrend.revenuePrior7Days) * 100
          : null,
        quantitesParProduitSemaine: salesTrend.quantityByProductLast7Days,
      },
      clients: {
        top: topCustomers.slice(0, 5),
        enBaisseActivite: decliningCustomers,
        dettesEnCours: overdueDebts,
      },
      tarification: pricingAnalysis ? {
        chargesParCarton: pricingAnalysis.chargesPerCarton,
        produits: pricingAnalysis.rows.map((r) => ({
          produit: r.productName, coutDeRevient: r.costOfGoods, prixPlancherSuggere: r.suggestedPrices.floor,
        })),
      } : null,
      pertes: monthlyLossRate ? {
        valeurPertesMois: monthlyLossRate.lossValue,
        tauxPerte: monthlyLossRate.rate,
        seuilAcceptable: monthlyLossRate.acceptableRate,
        depasseSeuil: monthlyLossRate.isAboveAcceptable,
      } : null,
      pret: loanStatus ? {
        montantTotal: loanStatus.loan.totalAmount,
        pourcentRembourse: loanStatus.repayment.percentRepaid,
        objectifBenefice: loanStatus.profitObjective.target,
        pourcentObjectifAtteint: loanStatus.profitObjective.percentAchieved,
        joursDeStockRestants: loanStatus.projections.stockRunwayDays,
      } : null,
    };
  }
}
