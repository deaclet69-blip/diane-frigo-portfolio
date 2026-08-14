import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { UpsertLoanDto } from './dto/upsert-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE')
@Controller('loans')
export class LoansController {
  constructor(private loansService: LoansService) {}

  @Get('active')
  getActive() {
    return this.loansService.getActiveLoan();
  }

  @Get('status')
  getStatus() {
    return this.loansService.getStatus();
  }

  @Put()
  upsert(@Body() dto: UpsertLoanDto, @CurrentUser() user: { id: string }) {
    return this.loansService.upsert(dto, user.id);
  }
}
