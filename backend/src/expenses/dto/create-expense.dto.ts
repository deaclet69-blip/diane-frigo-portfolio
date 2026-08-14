import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ChargeType } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsEnum(ChargeType)
  chargeType!: ChargeType;
}
