import { Module } from '@nestjs/common';
import { LossesService } from './losses.service';
import { LossesController } from './losses.controller';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [PricingModule],
  providers: [LossesService],
  controllers: [LossesController],
  exports: [LossesService],
})
export class LossesModule {}
