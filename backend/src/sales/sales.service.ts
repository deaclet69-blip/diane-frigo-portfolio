import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private async generateInvoiceNumber(tx: any): Promise<string> {
    const last = await tx.invoice.findFirst({ orderBy: { createdAt: 'desc' } });
    const lastNumber = last ? parseInt(last.invoiceNumber, 10) || 0 : 0;
    return String(lastNumber + 1).padStart(5, '0');
  }

  private async computeCurrentStock(tx: any, productId: string): Promise<number> {
    const sums = await tx.stockMovement.groupBy({
      by: ['movementType'],
      where: { productId },
      _sum: { quantity: true },
    });
    const get = (type: string) => Number(sums.find((s: any) => s.movementType === type)?._sum.quantity ?? 0);
    return get('ENTRY') + get('INVENTORY_ADJUSTMENT') - get('EXIT');
  }

  /**
   * Orchestrateur "Nouvelle vente" (§4 et §18 du brief) : une seule
   * transaction SQL crée la facture, ses lignes, les mouvements de stock,
   * le paiement et, si besoin, le dépôt — tout ou rien.
   */
  async createSale(dto: CreateSaleDto, userId: string, userRole: string) {
    if (dto.allowOverstock && userRole !== 'ADMIN') {
      throw new ForbiddenException("Seul l'administrateur peut valider une vente au-delà du stock disponible.");
    }

    return this.prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: dto.items.map((i) => i.productId) } },
      });
      const productMap = new Map(products.map((p: any) => [p.id, p]));

      // 1. Vérification du stock disponible (sauf override ADMIN explicite)
      if (!dto.allowOverstock) {
        for (const item of dto.items) {
          const currentStock = await this.computeCurrentStock(tx, item.productId);
          if (item.quantity > currentStock) {
            const product = productMap.get(item.productId);
            throw new BadRequestException(
              `Stock insuffisant pour "${product?.name ?? item.productId}" : ${currentStock} disponible(s), ${item.quantity} demandé(s).`,
            );
          }
        }
      }

      // 2. Calcul des montants (marge = prix vente saisi − prix d'achat de référence)
      const lineData = dto.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) throw new BadRequestException(`Produit ${item.productId} introuvable`);
        const unitPurchasePrice = Number(product.referencePurchasePrice);
        const lineTotal = item.quantity * item.unitSalePrice;
        const unitMargin = item.unitSalePrice - unitPurchasePrice;
        const lineProfit = item.quantity * unitMargin;
        return { ...item, unitPurchasePrice, lineTotal, unitMargin, lineProfit };
      });

      const subtotal = lineData.reduce((acc, l) => acc + l.lineTotal, 0);
      const discount = dto.discount ?? 0;
      const total = subtotal - discount;
      const amountPaid = dto.paymentStatus === 'paid' ? total : (dto.amountPaid ?? 0);
      const balanceDue = total - amountPaid;
      const status = dto.paymentStatus.toUpperCase() as 'PAID' | 'PARTIAL' | 'CREDIT';

      // 3. Facture + lignes
      const invoiceNumber = await this.generateInvoiceNumber(tx);
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          customerId: dto.customerId,
          date: new Date(dto.date),
          status,
          subtotal,
          discount,
          total,
          amountPaid,
          balanceDue,
          isDepositSale: !!dto.leaveInDeposit,
          createdById: userId,
          items: {
            create: lineData.map((l) => ({
              productId: l.productId,
              quantity: l.quantity,
              unitPurchasePrice: l.unitPurchasePrice,
              unitSalePrice: l.unitSalePrice,
              lineTotal: l.lineTotal,
              unitMargin: l.unitMargin,
              lineProfit: l.lineProfit,
            })),
          },
        },
        include: { items: true, customer: true },
      });

      // 4. Mouvements de stock (toujours créés, même en cas de dépôt — le
      //    bien est considéré vendu dès la signature de la facture, cf. §12)
      await tx.stockMovement.createMany({
        data: lineData.map((l) => ({
          productId: l.productId,
          movementType: 'EXIT' as const,
          quantity: l.quantity,
          date: new Date(dto.date),
          referenceType: 'invoice',
          referenceId: invoice.id,
          createdById: userId,
        })),
      });

      // 5. Dépôt (si "laisser les produits en dépôt" est coché)
      if (dto.leaveInDeposit) {
        for (const l of lineData) {
          const deposit = await tx.deposit.upsert({
            where: { customerId_productId: { customerId: dto.customerId, productId: l.productId } },
            update: {},
            create: { customerId: dto.customerId, productId: l.productId },
          });
          await tx.depositMovement.create({
            data: {
              depositId: deposit.id,
              movementType: 'DEPOSIT',
              quantity: l.quantity,
              date: new Date(dto.date),
              invoiceId: invoice.id,
            },
          });
        }
      }

      // 6. Paiement
      if (amountPaid > 0) {
        await tx.payment.create({
          data: {
            invoiceId: invoice.id,
            amount: amountPaid,
            date: new Date(dto.date),
            method: dto.paymentMethod,
          },
        });
      }

      // 7. Audit
      await this.audit.log({
        userId, action: 'create', entityType: 'invoice', entityId: invoice.id, afterData: invoice,
      });

      return {
        invoice,
        totalProfit: lineData.reduce((acc, l) => acc + l.lineProfit, 0),
      };
    });
  }
}
