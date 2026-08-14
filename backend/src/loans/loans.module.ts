import { Module } from '@nestjs/common';
import { LoansService } from './loans.service';
import { LoansController } from './loans.controller';
import { StockModule } from '../stock/stock.module';
import { FinancesModule } from '../finances/finances.module';

@Module({
  imports: [StockModule, FinancesModule],
  providers: [LoansService],
  controllers: [LoansController],
  exports: [LoansService],
})
export class LoansModule {}
