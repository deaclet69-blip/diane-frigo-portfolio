import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// Permet de corriger une entrée/sortie de stock saisie par erreur (demande
// utilisateur). Ne s'applique qu'aux mouvements manuels — jamais à ceux
// générés automatiquement par une vente (referenceType='invoice') ou un
// import (referenceType='excel_import'), pour ne pas désynchroniser une
// facture de son mouvement de stock.
export class UpdateStockMovementDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
