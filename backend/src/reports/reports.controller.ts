import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE')
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
}
