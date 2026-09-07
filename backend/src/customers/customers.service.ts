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
    if (!customer) throw new NotFoundException('Customer not found');

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

  /**
   * Vérifie si un nom de client correspond exactement à un client déjà
   * existant — utilisé par l'écran "Nouvelle vente" pour proposer une
   * confirmation ("est-ce la même personne ?") avant de créer un doublon.
   */
  async checkNameExists(name: string) {
    const matches = await this.prisma.customer.findMany({
      where: { name: { equals: name.trim(), mode: 'insensitive' }, mergedIntoId: null },
    });
    return { exists: matches.length > 0, matches };
  }

  /**
   * Crée un client en garantissant l'unicité du nom : si le nom existe déjà
   * ET que l'appelant confirme que ce n'est PAS la même personne, un
   * suffixe numéroté est ajouté automatiquement (ex. "Natif (2)").
   */
  async createWithDedup(dto: CreateCustomerDto, forceDistinct: boolean, userId: string) {
    if (!forceDistinct) {
      const { exists, matches } = await this.checkNameExists(dto.name);
      if (exists) return matches[0]; // même personne → on réutilise la fiche existante
    }

    let finalName = dto.name.trim();
    if (forceDistinct) {
      const { matches } = await this.checkNameExists(dto.name);
      if (matches.length > 0) {
        let n = 2;
        while (matches.some((m) => m.name.toLowerCase() === `${dto.name.trim()} (${n})`.toLowerCase())) n++;
        finalName = `${dto.name.trim()} (${n})`;
      }
    }

    return this.create({ ...dto, name: finalName }, userId);
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
   * Suppression réelle — uniquement si le client n'a AUCUN historique
   * (aucune facture, aucun dépôt). Dans le cas contraire, on refuse
   * explicitement (les données financières ne doivent jamais disparaître) —
   * on propose de le désactiver via la fusion ou de le laisser tel quel.
   */
  async remove(id: string, userId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: { invoices: true, deposits: true },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    if (customer.invoices.length > 0 || customer.deposits.length > 0) {
      throw new BadRequestException(
        "Ce client a un historique (ventes ou dépôts) — impossible de le supprimer. Tu peux le fusionner avec un autre client si c'est un doublon.",
      );
    }

    await this.prisma.customer.delete({ where: { id } });
    await this.audit.log({
      userId, action: 'update', entityType: 'customer_delete', entityId: id, beforeData: customer,
    });
    return { success: true };
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
      throw new BadRequestException('Cannot merge a customer with itself.');
    }
    const [source, target] = await Promise.all([
      this.prisma.customer.findUnique({ where: { id: sourceId } }),
      this.prisma.customer.findUnique({ where: { id: targetId } }),
    ]);
    if (!source || !target) throw new NotFoundException('Customer not found');

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
