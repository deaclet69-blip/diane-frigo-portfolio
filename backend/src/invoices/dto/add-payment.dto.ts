import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddPaymentDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
