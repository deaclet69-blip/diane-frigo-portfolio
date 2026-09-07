import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PricingService } from '../pricing/pricing.service';
import { CreateLossDto } from './dto/create-loss.dto';

@Injectable()
export class LossesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private pricingService: PricingService,
  ) {}

  findAll(filters: { from?: string; to?: string; productId?: string }) {
    return this.prisma.loss.findMany({
      where: {
        productId: filters.productId,
        date: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
      },
      include: { product: { select: { name: true } }, createdBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Amélioration par rapport à l'Excel : dans le fichier, la feuille
   * "Pertes" est déconnectée de la feuille "Stock" (il faut les tenir à
   * jour séparément, un risque d'incohérence). Ici, enregistrer une perte
   * décrémente automatiquement le vrai stock, dans la même transaction.
   */
  async create(dto: CreateLossDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const sums = await tx.stockMovement.groupBy({
        by: ['movementType'],
        where: { productId: dto.productId },
        _sum: { quantity: true },
      });
      const get = (t: string) => Number(sums.find((s: any) => s.movementType === t)?._sum.quantity ?? 0);
      const currentStock = get('ENTRY') + get('INVENTORY_ADJUSTMENT') - get('EXIT');
      if (dto.quantity > currentStock) {
        throw new BadRequestException(
          `Insufficient stock: ${currentStock} box(es) available, ${dto.quantity} reported as loss.`,
        );
      }

      const analysis = await this.pricingService.getProfitabilityAnalysis();
      const row = analysis.rows.find((r) => r.productId === dto.productId);
      const unitCost = row?.costOfGoods ?? 0;
      const totalValue = dto.quantity * unitCost;

      const loss = await tx.loss.create({
        data: {
          productId: dto.productId,
          quantity: dto.quantity,
          date: new Date(dto.date),
          reason: dto.reason,
          unitCost,
          totalValue,
          note: dto.note,
          createdById: userId,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          movementType: 'EXIT',
          quantity: dto.quantity,
          date: new Date(dto.date),
          referenceType: 'loss',
          referenceId: loss.id,
          note: `Perte : ${dto.reason}`,
          createdById: userId,
        },
      });

      await this.audit.log({
        userId, action: 'create', entityType: 'loss', entityId: loss.id, afterData: loss,
      });

      return loss;
    });
  }

  /** Taux de perte du mois = valeur des pertes / valeur du CA du mois — comparé au seuil acceptable. */
  async getMonthlyLossRate() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [losses, settings, revenueAgg] = await Promise.all([
      this.prisma.loss.aggregate({ _sum: { totalValue: true }, where: { date: { gte: start, lt: end } } }),
      this.pricingService.getSettings(),
      this.prisma.invoiceItem.aggregate({
        _sum: { lineTotal: true },
        where: { invoice: { voidedAt: null, date: { gte: start, lt: end } } },
      }),
    ]);

    const lossValue = Number(losses._sum.totalValue ?? 0);
    const revenue = Number(revenueAgg._sum.lineTotal ?? 0);
    const rate = revenue > 0 ? lossValue / revenue : 0;

    return {
      lossValue,
      revenue,
      rate,
      acceptableRate: Number(settings.acceptableLossRate),
      isAboveAcceptable: rate > Number(settings.acceptableLossRate),
    };
  }
}
