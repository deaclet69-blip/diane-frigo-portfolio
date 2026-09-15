import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ChargeType } from '@prisma/client';

@Injectable()
export class ExpensesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll(filters: { from?: string; to?: string; chargeType?: string }) {
    return this.prisma.expense.findMany({
      where: {
        chargeType: filters.chargeType as any,
        date: {
          gte: filters.from ? new Date(filters.from) : undefined,
          lte: filters.to ? new Date(filters.to) : undefined,
        },
      },
      include: { category: true, createdBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async create(dto: CreateExpenseDto, userId: string) {
    const expense = await this.prisma.expense.create({
      data: { ...dto, date: new Date(dto.date), createdById: userId },
      include: { category: true },
    });
    await this.audit.log({
      userId, action: 'create', entityType: 'expense', entityId: expense.id, afterData: expense,
    });
    return expense;
  }

  /**
   * Reclasser une charge (Fixe / Variable / Exceptionnel) — utile pour le
   * cas concret identifié à l'Étape 1 (la ligne "Argent débiter du compte"
   * de 10 000 000 FCFA, classée "Exceptionnel" dans le fichier Excel réel).
   * Rappel : les 3 types réduisent tous le résultat net ; seul le type
   * Fixe entre dans le calcul du coût de revient par carton.
   */
  async reclassify(id: string, chargeType: ChargeType, userId: string) {
    const before = await this.prisma.expense.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Expense not found');
    const expense = await this.prisma.expense.update({ where: { id }, data: { chargeType } });
    await this.audit.log({
      userId, action: 'update', entityType: 'expense', entityId: id,
      beforeData: { chargeType: before.chargeType }, afterData: { chargeType },
    });
    return expense;
  }

  async remove(id: string, userId: string) {
    const before = await this.prisma.expense.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Expense not found');
    await this.prisma.expense.delete({ where: { id } });
    await this.audit.log({
      userId, action: 'delete', entityType: 'expense', entityId: id, beforeData: before,
    });
    return { success: true };
  }
}
