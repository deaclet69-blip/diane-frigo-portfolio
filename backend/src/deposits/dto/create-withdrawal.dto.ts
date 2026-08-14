import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsString()
  customerId!: string;

  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
