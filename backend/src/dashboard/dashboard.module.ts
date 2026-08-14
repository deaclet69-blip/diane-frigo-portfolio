import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { StockModule } from '../stock/stock.module';
import { FinancesModule } from '../finances/finances.module';

@Module({
  imports: [StockModule, FinancesModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
