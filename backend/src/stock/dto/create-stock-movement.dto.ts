import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MovementType } from '@prisma/client';

export class CreateStockMovementDto {
  @IsString()
  productId!: string;

  @IsEnum(MovementType)
  movementType!: MovementType;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsDateString()
  date!: string;

  // Renseigné pour une ENTRY : sert au calcul du prix d'achat moyen pondéré
  // (Finances > Tarification). Optionnel — retombe sur le prix de
  // référence du produit si absent.
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
