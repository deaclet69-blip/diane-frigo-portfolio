import { Module } from '@nestjs/common';
import { BusinessSnapshotService } from './business-snapshot.service';
import { AiAdvisorService } from './ai-advisor.service';
import { AiAdvisorController } from './ai-advisor.controller';
import { StockModule } from '../stock/stock.module';
import { FinancesModule } from '../finances/finances.module';
import { ReportsModule } from '../reports/reports.module';
import { PricingModule } from '../pricing/pricing.module';
import { LossesModule } from '../losses/losses.module';
import { LoansModule } from '../loans/loans.module';

@Module({
  imports: [StockModule, FinancesModule, ReportsModule, PricingModule, LossesModule, LoansModule],
  providers: [BusinessSnapshotService, AiAdvisorService],
  controllers: [AiAdvisorController],
})
export class AiAdvisorModule {}
