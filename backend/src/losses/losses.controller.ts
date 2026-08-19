import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { LossesService } from './losses.service';
import { CreateLossDto } from './dto/create-loss.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('pertes')
@Controller('losses')
export class LossesController {
  constructor(private lossesService: LossesService) {}

  @Get()
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('productId') productId?: string,
  ) {
    return this.lossesService.findAll({ from, to, productId });
  }

  @Get('monthly-rate')
  getMonthlyRate() {
    return this.lossesService.getMonthlyLossRate();
  }

  @Post()
  create(@Body() dto: CreateLossDto, @CurrentUser() user: { id: string }) {
    return this.lossesService.create(dto, user.id);
  }
}
