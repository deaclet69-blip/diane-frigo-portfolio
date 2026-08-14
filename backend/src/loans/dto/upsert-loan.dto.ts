import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpsertLoanDto {
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  constructionAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  equipmentAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  otherAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  customProfitGoal?: number;
}
