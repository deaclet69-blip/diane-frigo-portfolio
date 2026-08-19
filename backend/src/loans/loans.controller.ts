import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { LoansService } from './loans.service';
import { UpsertLoanDto } from './dto/upsert-loan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('investissement')
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
