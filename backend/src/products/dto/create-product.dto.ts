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

  // Data URL base64 (ex: "data:image/jpeg;base64,...") envoyée par le
  // frontend après redimensionnement/compression côté navigateur.
  // Chaîne vide = suppression de l'image (voir ProductsService).
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
