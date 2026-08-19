import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('rapports')
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('products')
  products() {
    return this.reportsService.productsReport();
  }

  @Get('customers')
  customers() {
    return this.reportsService.customersReport();
  }

  @Get('expenses')
  expenses() {
    return this.reportsService.expensesReport();
  }

  @Get('sales')
  sales(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.salesReport(from, to);
  }

  @Get('stock-entries')
  stockEntries(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.stockEntriesReport(from, to);
  }

  @Get('traceability')
  traceability(
    @Query('granularity') granularity: 'day' | 'week' | 'month' | 'year' = 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.traceability(granularity, from, to);
  }
}
