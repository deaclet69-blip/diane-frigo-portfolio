import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  getSummary(@Query('period') period?: 'month' | 'all') {
    return this.dashboardService.getSummary(period ?? 'month');
  }

  @Get('full')
  getFullDashboard() {
    return this.dashboardService.getFullDashboard();
  }
}
