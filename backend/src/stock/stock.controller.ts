import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  // Lecture : tout le monde connecté (VENDEUR en lecture seule, cf. matrice §7 —
  // l'écriture est bloquée plus bas par @Roles sur POST)
  @Get()
  getOverview() {
    return this.stockService.getOverview();
  }

  @Get('alerts')
  getAlerts() {
    return this.stockService.getAlerts();
  }

  @Get('movements')
  getMovements(
    @Query('productId') productId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.stockService.getMovements({ productId, from, to });
  }

  @Get(':productId')
  getProductDetail(@Param('productId') productId: string) {
    return this.stockService.getProductDetail(productId);
  }

  @Roles('ADMIN', 'RESPONSABLE', 'MAGASINIER')
  @Post('movements')
  createMovement(@Body() dto: CreateStockMovementDto, @CurrentUser() user: { id: string }) {
    return this.stockService.createMovement(dto, user.id);
  }
}
