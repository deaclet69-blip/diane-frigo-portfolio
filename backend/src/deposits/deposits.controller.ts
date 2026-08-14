import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { DepositsService } from './deposits.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE', 'VENDEUR')
@Controller('deposits')
export class DepositsController {
  constructor(private depositsService: DepositsService) {}

  @Get()
  getBalances(@Query('customerId') customerId?: string) {
    return this.depositsService.getBalances(customerId);
  }

  @Get('movements')
  getMovements(@Query('customerId') customerId?: string) {
    return this.depositsService.getMovements(customerId);
  }

  @Post('withdrawals')
  createWithdrawal(@Body() dto: CreateWithdrawalDto, @CurrentUser() user: { id: string }) {
    return this.depositsService.createWithdrawal(dto, user.id);
  }
}
