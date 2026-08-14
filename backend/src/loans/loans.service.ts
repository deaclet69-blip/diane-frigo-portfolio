import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StockService } from '../stock/stock.service';
import { FinancesService } from '../finances/finances.service';
import { UpsertLoanDto } from './dto/upsert-loan.dto';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private stockService: StockService,
    private financesService: FinancesService,
  ) {}

  async getActiveLoan() {
    return this.prisma.loan.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  async upsert(dto: UpsertLoanDto, userId: string) {
    const existing = await this.getActiveLoan();
    let loan;
    if (existing) {
      loan = await this.prisma.loan.update({ where: { id: existing.id }, data: dto });
    } else {
      loan = await this.prisma.loan.create({ data: dto });
    }
    await this.audit.log({
      userId, action: existing ? 'update' : 'create', entityType: 'loan', entityId: loan.id, afterData: loan,
    });
    return loan;
  }

  private async getVelocity(windowDays: number) {
    const since = new Date(Date.now() - windowDays * 86400000);
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { voidedAt: null, date: { gte: since } } },
    });
    const revenue = items.reduce((acc, i) => acc + Number(i.lineTotal), 0);
    const profit = items.reduce((acc, i) => acc + Number(i.lineProfit), 0);
    const quantity = items.reduce((acc, i) => acc + i.quantity, 0);
    return {
      avgDailyRevenue: revenue / windowDays,
      avgDailyProfit: profit / windowDays,
      avgDailyQuantity: quantity / windowDays,
    };
  }

  /**
   * Reproduit la feuille "Investissement" : % du prêt remboursé par les
   * recettes encaissées, puis (une fois remboursé) un objectif de bénéfice
   * équivalent, avec estimation du temps nécessaire selon le rythme de
   * vente récent et le nombre de jours de stock restant.
   */
  async getStatus() {
    const loan = await this.getActiveLoan();
    if (!loan) throw new NotFoundException("Aucun prêt enregistré. Configure-le dans Finances > Investissement.");

    const [payments, stockOverview, recovery, velocity] = await Promise.all([
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
      this.stockService.getOverview(),
      this.financesService.getRecoveryStatus(),
      this.getVelocity(loan.velocityWindowDays),
    ]);

    const totalAmount = Number(loan.totalAmount);
    const cumulativeRevenueCollected = Number(payments._sum.amount ?? 0);
    const percentRepaid = totalAmount > 0 ? Math.min(100, (cumulativeRevenueCollected / totalAmount) * 100) : 100;
    const remainingToSell = Math.max(0, totalAmount - cumulativeRevenueCollected);
    const isFullyRepaid = remainingToSell <= 0;

    const profitObjective = Number(loan.customProfitGoal ?? loan.totalAmount);
    const netProfitAlreadyRealized = recovery.netResult;
    const remainingToGenerateProfit = Math.max(0, profitObjective - netProfitAlreadyRealized);

    const daysToRepayLoan = velocity.avgDailyRevenue > 0 ? remainingToSell / velocity.avgDailyRevenue : null;
    const daysToProfitObjective = velocity.avgDailyProfit > 0 ? remainingToGenerateProfit / velocity.avgDailyProfit : null;

    const totalStockCartons = stockOverview.totals.totalStock;
    const stockRunwayDays = velocity.avgDailyQuantity > 0 ? totalStockCartons / velocity.avgDailyQuantity : null;
    const requiredDailyProfitBeforeStockOut =
      stockRunwayDays && stockRunwayDays > 0 ? remainingToGenerateProfit / stockRunwayDays : null;

    // Répartition par produit du nombre de cartons à vendre pour atteindre
    // l'objectif de bénéfice, plafonné par le stock disponible.
    const perProduct = stockOverview.items.map((item) => {
      const unitMargin = item.referenceSalePrice - item.referencePurchasePrice;
      const cartonsNeeded = unitMargin > 0 ? Math.ceil(remainingToGenerateProfit / unitMargin) : null;
      return {
        productId: item.id,
        productName: item.name,
        unitMargin,
        cartonsNeeded,
        currentStock: item.currentStock,
        stockSufficient: cartonsNeeded !== null ? item.currentStock >= cartonsNeeded : null,
        saleRangeLow: cartonsNeeded ? cartonsNeeded * item.referencePurchasePrice : null,
        saleRangeHigh: cartonsNeeded ? cartonsNeeded * item.referenceSalePrice : null,
      };
    });

    return {
      loan: {
        totalAmount, constructionAmount: Number(loan.constructionAmount),
        equipmentAmount: Number(loan.equipmentAmount), otherAmount: Number(loan.otherAmount),
        customProfitGoal: loan.customProfitGoal ? Number(loan.customProfitGoal) : null,
      },
      repayment: {
        cumulativeRevenueCollected, percentRepaid, remainingToSell, isFullyRepaid,
      },
      profitObjective: {
        target: profitObjective, netProfitAlreadyRealized, remainingToGenerateProfit,
        percentAchieved: profitObjective > 0 ? Math.min(100, (netProfitAlreadyRealized / profitObjective) * 100) : 100,
      },
      projections: {
        velocityWindowDays: loan.velocityWindowDays,
        avgDailyRevenue: velocity.avgDailyRevenue,
        avgDailyProfit: velocity.avgDailyProfit,
        daysToRepayLoan, daysToProfitObjective,
        stockRunwayDays, requiredDailyProfitBeforeStockOut,
      },
      perProduct,
      stockValueAtSalePrice: stockOverview.totals.totalValue,
    };
  }
}
