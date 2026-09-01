import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AddPaymentDto } from './dto/add-payment.dto';
import { VoidInvoiceDto } from './dto/void-invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findAll(filters: { customerId?: string; status?: string; from?: string; to?: string }) {
    return this.prisma.invoice.findMany({
      where: {
        customerId: filters.customerId,
        status: filters.status as any,
        date: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
      },
      include: {
        customer: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { date: 'desc' },
      // 2000 au lieu de 200 — avec plusieurs centaines de ventes réelles
      // (import Excel notamment), 200 coupait les plus anciennes de la
      // liste sans prévenir (bug détecté par l'utilisateur).
      take: 2000,
    });
  }

  async findById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: { orderBy: { date: 'desc' } },
        depositMovements: { include: { deposit: { include: { product: true } } } },
      },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable');
    return invoice;
  }

  async addPayment(invoiceId: string, dto: AddPaymentDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Facture introuvable');
    if (invoice.voidedAt) throw new BadRequestException('Cette facture est annulée.');

    const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
    if (newAmountPaid > Number(invoice.total)) {
      throw new BadRequestException('Le montant payé dépasserait le total de la facture.');
    }
    const newBalance = Number(invoice.total) - newAmountPaid;
    const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: { invoiceId, amount: dto.amount, date: new Date(dto.date), method: dto.method, note: dto.note },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { amountPaid: newAmountPaid, balanceDue: newBalance, status: newStatus },
      }),
    ]);

    await this.audit.log({
      userId, action: 'update', entityType: 'invoice', entityId: invoiceId,
      beforeData: { amountPaid: invoice.amountPaid }, afterData: { amountPaid: newAmountPaid },
    });

    return payment;
  }

  /**
   * Annulation : jamais de suppression physique. On marque voidedAt/voidedReason,
   * on repasse le stock en sens inverse (entrée compensatoire) et on annule
   * les mouvements de dépôt liés — tout est tracé dans audit_logs.
   */
  async voidInvoice(id: string, dto: VoidInvoiceDto, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { items: true, depositMovements: true },
    });
    if (!invoice) throw new NotFoundException('Facture introuvable');
    if (invoice.voidedAt) throw new BadRequestException('Cette facture est déjà annulée.');

    await this.prisma.$transaction([
      this.prisma.invoice.update({
        where: { id },
        data: { voidedAt: new Date(), voidedReason: dto.reason },
      }),
      this.prisma.stockMovement.createMany({
        data: invoice.items.map((item) => ({
          productId: item.productId,
          movementType: 'ENTRY' as const,
          quantity: item.quantity,
          date: new Date(),
          referenceType: 'invoice_void',
          referenceId: invoice.id,
          note: `Annulation facture ${invoice.invoiceNumber} : ${dto.reason}`,
          createdById: userId,
        })),
      }),
      ...(invoice.depositMovements.length > 0
        ? [
            this.prisma.depositMovement.createMany({
              data: invoice.depositMovements
                .filter((m) => m.movementType === 'DEPOSIT')
                .map((m) => ({
                  depositId: m.depositId,
                  movementType: 'WITHDRAWAL' as const,
                  quantity: m.quantity,
                  date: new Date(),
                  note: `Annulation facture ${invoice.invoiceNumber}`,
                })),
            }),
          ]
        : []),
    ]);

    await this.audit.log({
      userId, action: 'void', entityType: 'invoice', entityId: id,
      beforeData: invoice, afterData: { voidedReason: dto.reason },
    });

    return { success: true };
  }
}
