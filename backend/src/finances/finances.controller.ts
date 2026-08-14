import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { IsDateString, IsNumber, Min } from 'class-validator';
import { FinancesService } from './finances.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

class SetGoalDto {
  @IsDateString()
  month!: string;

  @IsNumber()
  @Min(0)
  targetProfit!: number;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE')
@Controller('finances')
export class FinancesController {
  constructor(private financesService: FinancesService) {}

  @Get('recettes')
  getRecettes(@Query('granularity') granularity: 'day' | 'week' | 'month' | 'year' = 'month') {
    return this.financesService.getRecettes(granularity);
  }

  @Get('summary')
  getSummary(@Query('period') period?: 'month' | 'all') {
    return this.financesService.getSummary(period ?? 'month');
  }

  @Get('recovery')
  getRecovery() {
    return this.financesService.getRecoveryStatus();
  }

  @Get('monthly-chart')
  getMonthlyChart(@Query('months') months?: string) {
    return this.financesService.getMonthlyChart(months ? Number(months) : 12);
  }

  @Post('goal')
  setGoal(@Body() dto: SetGoalDto) {
    return this.financesService.setMonthlyGoal(dto.month, dto.targetProfit);
  }
}
