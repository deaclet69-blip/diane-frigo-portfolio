import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { LossesService } from './losses.service';
import { CreateLossDto } from './dto/create-loss.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'RESPONSABLE', 'MAGASINIER')
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
