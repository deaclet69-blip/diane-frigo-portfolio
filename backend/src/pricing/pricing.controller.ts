import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { assertNotDemo } from '../common/assert-not-demo';

class UpdatePricingSettingsDto {
  @IsOptional() @IsNumber() @Min(0) @Max(1) targetMarginFloor?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) targetMarginWholesaleBulk?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) targetMarginWholesale?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) targetMarginRetail?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) marginAlertCritical?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) marginAlertGood?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) marginAlertExcellent?: number;
  @IsOptional() @IsNumber() @Min(1) stockRotationFastDays?: number;
  @IsOptional() @IsNumber() @Min(1) stockRotationDormantDays?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) acceptableLossRate?: number;
  @IsOptional() @IsNumber() @Min(1) priceRoundingFcfa?: number;
  @IsOptional() @IsNumber() @Min(0) estimatedMonthlyFixedCharges?: number;
  @IsOptional() @IsNumber() @Min(0) estimatedMonthlyCartonsSold?: number;
}

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermission('rentabilite')
@Controller('pricing')
export class PricingController {
  constructor(private pricingService: PricingService) {}

  @Get('settings')
  getSettings() {
    return this.pricingService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdatePricingSettingsDto, @CurrentUser() user: { id: string }) {
    assertNotDemo('Changing pricing settings');
    return this.pricingService.updateSettings(dto, user.id);
  }

  @Get('analysis')
  getAnalysis() {
    return this.pricingService.getProfitabilityAnalysis();
  }

  @Get('check')
  checkPrice(@Query('productId') productId: string, @Query('price') price: string) {
    return this.pricingService.checkPrice(productId, Number(price));
  }
}
