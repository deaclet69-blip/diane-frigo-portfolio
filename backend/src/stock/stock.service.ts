import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';

export type StockStatus = 'RUPTURE' | 'ALERTE' | 'OK';

function computeStatus(currentStock: number, alertThreshold: number): StockStatus {
  if (currentStock <= 0) return 'RUPTURE';
  if (currentStock <= alertThreshold) return 'ALERTE';
  return 'OK';
}

@Injectable()
export class StockService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Stock actuel = Entrées + Ajustements d'inventaire (positifs) − Sorties.
   * Remplace le calcul en cascade fragile de l'Excel (INDEX/MATCH ligne par
   * ligne) par une simple somme indépendante de l'ordre des lignes.
   */
  private async computeCurrentStock(productId: string): Promise<number> {
    const sums = await this.prisma.stockMovement.groupBy({
      by: ['movementType'],
      where: { productId },
      _sum: { quantity: true },
    });
    const get = (type: string) =>
      Number(sums.find((s) => s.movementType === type)?._sum.quantity ?? 0);
    return get('ENTRY') + get('INVENTORY_ADJUSTMENT') - get('EXIT');
  }

  /** Vue "Stock actuel" : liste des produits avec stock, valeur et statut. */
  async getOverview() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    const results = await Promise.all(
      products.map(async (product) => {
        const currentStock = await this.computeCurrentStock(product.id);
        const value = currentStock * Number(product.referencePurchasePrice);
        return {
          id: product.id,
          name: product.name,
          category: product.category?.name ?? null,
          unit: product.unit,
          imageUrl: product.imageUrl,
          currentStock,
          alertThreshold: product.alertThreshold,
          status: computeStatus(currentStock, product.alertThreshold),
          referencePurchasePrice: Number(product.referencePurchasePrice),
          referenceSalePrice: Number(product.referenceSalePrice),
          value,
        };
      }),
    );

    return {
      items: results,
      totals: {
        totalProducts: results.length,
        totalStock: results.reduce((acc, r) => acc + r.currentStock, 0),
        totalValue: results.reduce((acc, r) => acc + r.value, 0),
        ruptureCount: results.filter((r) => r.status === 'RUPTURE').length,
        alertCount: results.filter((r) => r.status === 'ALERTE').length,
      },
    };
  }

  async getAlerts() {
    const overview = await this.getOverview();
    return overview.items.filter((i) => i.status !== 'OK');
  }

  async getProductDetail(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    const currentStock = await this.computeCurrentStock(productId);
    const movements = await this.prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
      // 2000 au lieu de 200 — mêmes raisons que Ventes (import Excel notamment).
      take: 2000,
      include: { createdBy: { select: { name: true } } },
    });

    return {
      product: {
        ...product,
        referencePurchasePrice: Number(product.referencePurchasePrice),
        referenceSalePrice: Number(product.referenceSalePrice),
      },
      currentStock,
      status: computeStatus(currentStock, product.alertThreshold),
      value: currentStock * Number(product.referencePurchasePrice),
      movements,
      note: 'Ventes, CA et bénéfice par produit arrivent avec le module Ventes (Phase 3)',
    };
  }

  async getMovements(filters: { productId?: string; from?: string; to?: string }) {
    return this.prisma.stockMovement.findMany({
      where: {
        productId: filters.productId,
        date: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
      },
      include: {
        product: { select: { name: true } },
        createdBy: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 500,
    });
  }

  /** Entrée manuelle, sortie manuelle (perte/casse) ou ajustement d'inventaire. */
  async createMovement(dto: CreateStockMovementDto, userId: string) {
    if (dto.movementType === 'EXIT') {
      const currentStock = await this.computeCurrentStock(dto.productId);
      if (dto.quantity > currentStock) {
        throw new BadRequestException(
          `Insufficient stock: ${currentStock} box(es) available, ${dto.quantity} requested.`,
        );
      }
    }

    const movement = await this.prisma.stockMovement.create({
      data: {
        productId: dto.productId,
        movementType: dto.movementType,
        quantity: dto.quantity,
        date: new Date(dto.date),
        unitCost: dto.movementType === 'ENTRY' ? dto.unitCost : undefined,
        supplierId: dto.movementType === 'ENTRY' ? dto.supplierId : undefined,
        referenceType: dto.movementType === 'INVENTORY_ADJUSTMENT' ? 'inventory' : 'manual_entry',
        note: dto.note,
        createdById: userId,
      },
    });

    await this.audit.log({
      userId,
      action: 'create',
      entityType: 'stock_movement',
      entityId: movement.id,
      afterData: movement,
    });

    return movement;
  }

  /**
   * Corrige un mouvement de stock saisi par erreur (demande utilisateur).
   * Restreint aux mouvements manuels — jamais ceux liés à une facture ou à
   * un import, pour ne jamais désynchroniser une vente de son stock.
   */
  async updateMovement(id: string, dto: UpdateStockMovementDto, userId: string) {
    const before = await this.prisma.stockMovement.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Movement not found');
    if (before.referenceType === 'invoice' || before.referenceType === 'excel_import') {
      throw new ForbiddenException(
        "Ce mouvement est lié à une facture ou à un import — corrige plutôt la facture, ou annule-la pour recréditer le stock.",
      );
    }

    if (dto.quantity !== undefined && before.movementType === 'EXIT') {
      const currentStock = await this.computeCurrentStock(before.productId);
      const stockWithoutThisMovement = currentStock + before.quantity;
      if (dto.quantity > stockWithoutThisMovement) {
        throw new BadRequestException(
          `Insufficient stock for this correction: ${stockWithoutThisMovement} box(es) available at most.`,
        );
      }
    }

    const movement = await this.prisma.stockMovement.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        unitCost: dto.unitCost,
        supplierId: dto.supplierId,
        note: dto.note,
      },
    });

    await this.audit.log({
      userId, action: 'update', entityType: 'stock_movement', entityId: id,
      beforeData: before, afterData: movement,
    });

    return movement;
  }
}
