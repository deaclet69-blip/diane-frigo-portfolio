import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Injectable()
export class DepositsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Solde = Σ(DEPOSIT) − Σ(WITHDRAWAL) par (client, produit).
   * Remplace la feuille "Dépôts - Solde" de l'Excel (jamais alimentée) par
   * un calcul toujours à jour à partir des mouvements réels.
   */
  async getBalances(customerId?: string) {
    const deposits = await this.prisma.deposit.findMany({
      where: customerId ? { customerId } : {},
      include: { customer: true, product: true, movements: true },
    });

    return deposits
      .map((d) => {
        const deposited = d.movements
          .filter((m) => m.movementType === 'DEPOSIT')
          .reduce((acc, m) => acc + m.quantity, 0);
        const withdrawn = d.movements
          .filter((m) => m.movementType === 'WITHDRAWAL')
          .reduce((acc, m) => acc + m.quantity, 0);
        return {
          id: d.id,
          customer: { id: d.customer.id, name: d.customer.name },
          product: { id: d.product.id, name: d.product.name },
          deposited,
          withdrawn,
          balance: deposited - withdrawn,
        };
      })
      .filter((d) => d.balance > 0 || d.deposited > 0); // masque les soldes historiques vides
  }

  async getMovements(customerId?: string) {
    return this.prisma.depositMovement.findMany({
      where: customerId ? { deposit: { customerId } } : {},
      include: { deposit: { include: { customer: true, product: true } } },
      orderBy: { date: 'desc' },
      take: 2000, // idem Ventes/Stock
    });
  }

  async createWithdrawal(dto: CreateWithdrawalDto, userId: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { customerId_productId: { customerId: dto.customerId, productId: dto.productId } },
      include: { movements: true },
    });

    const deposited = deposit?.movements.filter((m) => m.movementType === 'DEPOSIT')
      .reduce((acc, m) => acc + m.quantity, 0) ?? 0;
    const withdrawn = deposit?.movements.filter((m) => m.movementType === 'WITHDRAWAL')
      .reduce((acc, m) => acc + m.quantity, 0) ?? 0;
    const balance = deposited - withdrawn;

    if (!deposit || dto.quantity > balance) {
      throw new BadRequestException(
        `Insufficient balance: ${balance} box(es) available on deposit, ${dto.quantity} requested.`,
      );
    }

    const movement = await this.prisma.depositMovement.create({
      data: {
        depositId: deposit.id,
        movementType: 'WITHDRAWAL',
        quantity: dto.quantity,
        date: new Date(dto.date),
        note: dto.note,
      },
    });

    await this.audit.log({
      userId, action: 'create', entityType: 'deposit_movement', entityId: movement.id, afterData: movement,
    });

    return movement;
  }
}
