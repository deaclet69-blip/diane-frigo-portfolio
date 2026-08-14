import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Les clients fusionnés (mergedIntoId renseigné) sont masqués de la liste
  // active mais jamais supprimés — leur historique reste consultable.
  async findAll(search?: string) {
    return this.prisma.customer.findMany({
      where: {
        mergedIntoId: null,
        ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        invoices: {
          where: { voidedAt: null },
          orderBy: { date: 'desc' },
          include: { items: true },
        },
        deposits: { include: { movements: true, product: true } },
      },
    });
    if (!customer) throw new NotFoundException('Client introuvable');

    const orderCount = customer.invoices.length;
    const totalRevenue = customer.invoices.reduce((acc, inv) => acc + Number(inv.total), 0);
    const totalQuantity = customer.invoices.reduce(
      (acc, inv) => acc + inv.items.reduce((s, it) => s + it.quantity, 0),
      0,
    );
    const lastOrderDate = customer.invoices[0]?.date ?? null;
    const totalDebt = customer.invoices.reduce((acc, inv) => acc + Number(inv.balanceDue), 0);

    return {
      ...customer,
      stats: { orderCount, totalRevenue, totalQuantity, lastOrderDate, totalDebt },
    };
  }

  async create(dto: CreateCustomerDto, userId: string) {
    const customer = await this.prisma.customer.create({ data: dto });
    await this.audit.log({
      userId, action: 'create', entityType: 'customer', entityId: customer.id, afterData: customer,
    });
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, userId: string) {
    const before = await this.prisma.customer.findUnique({ where: { id } });
    const customer = await this.prisma.customer.update({ where: { id }, data: dto });
    await this.audit.log({
      userId, action: 'update', entityType: 'customer', entityId: id, beforeData: before, afterData: customer,
    });
    return customer;
  }

  /**
   * Fusionne un client "doublon" (ex. NATIFE) dans un client "principal"
   * (ex. NATIF) : réattribue tout l'historique (factures, dépôts) puis
   * masque le doublon. Rien n'est supprimé — traçable dans audit_logs.
   *
   * Limite connue : si source ET cible ont toutes les deux un dépôt sur le
   * même produit, la contrainte UNIQUE(customerId, productId) rejettera la
   * fusion — à gérer manuellement dans ce cas rare (regrouper les soldes
   * avant de fusionner).
   */
  async merge(sourceId: string, targetId: string, userId: string) {
    if (sourceId === targetId) {
      throw new BadRequestException('Impossible de fusionner un client avec lui-même.');
    }
    const [source, target] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: sourceId } }),
      this.prisma.customer.findUnique({ where: { id: targetId } }),
    ]);
    if (!source || !target) throw new NotFoundException('Client introuvable');

    await this.prisma.$transaction([
      this.prisma.invoice.updateMany({ where: { customerId: sourceId }, data: { customerId: targetId } }),
      this.prisma.deposit.updateMany({ where: { customerId: sourceId }, data: { customerId: targetId } }),
      this.prisma.customer.update({ where: { id: sourceId }, data: { mergedIntoId: targetId } }),
    ]);

    await this.audit.log({
      userId, action: 'update', entityType: 'customer_merge', entityId: sourceId,
      beforeData: { sourceId, sourceName: source.name },
      afterData: { mergedIntoId: targetId, targetName: target.name },
    });

    return { success: true, mergedInto: targetId };
  }
}
