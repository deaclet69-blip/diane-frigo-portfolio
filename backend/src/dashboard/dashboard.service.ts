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
}
