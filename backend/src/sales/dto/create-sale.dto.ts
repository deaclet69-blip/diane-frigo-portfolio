import { Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString,
  Min, ValidateNested,
} from 'class-validator';

export class SaleItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitSalePrice!: number;
}

export class CreateSaleDto {
  @IsString()
  customerId!: string;

  @IsDateString()
  date!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items!: SaleItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsIn(['paid', 'partial', 'credit'])
  paymentStatus!: 'paid' | 'partial' | 'credit';

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  leaveInDeposit?: boolean;

  @IsOptional()
  @IsBoolean()
  allowOverstock?: boolean; // override ADMIN — vente > stock disponible

  // Numéro de facture personnalisé (optionnel — demande utilisateur).
  // Laisser vide pour la génération automatique séquentielle habituelle.
  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
