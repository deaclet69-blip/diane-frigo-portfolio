import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsNumber()
  @Min(0)
  referencePurchasePrice!: number;

  @IsNumber()
  @Min(0)
  referenceSalePrice!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  alertThreshold?: number;
}
