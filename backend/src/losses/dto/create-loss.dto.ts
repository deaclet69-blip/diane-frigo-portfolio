import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { LossReason } from '@prisma/client';

export class CreateLossDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDateString()
  date!: string;

  @IsEnum(LossReason)
  reason!: LossReason;

  @IsOptional()
  @IsString()
  note?: string;
}
