import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SystemService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async resetAllData(actorId: string, password: string) {
    const actor = await this.prisma.user.findUnique({ where: { id: actorId } });
    if (!actor) {
      throw new UnauthorizedException('User not found');
    }
    const passwordOk = await bcrypt.compare(password, actor.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Incorrect password');
    }

    // Ordre pensé pour respecter les contraintes de clé étrangère.
    // Les comptes utilisateurs (User/Role) ne sont JAMAIS supprimés par
    // cette action : uniquement les données métier enregistrées.
    await this.prisma.$transaction([
      this.prisma.payment.deleteMany(),
      this.prisma.invoiceItem.deleteMany(),
      this.prisma.depositMovement.deleteMany(),
      this.prisma.deposit.deleteMany(),
      this.prisma.invoice.deleteMany(),
      this.prisma.stockMovement.deleteMany(),
      this.prisma.loss.deleteMany(),
      this.prisma.expense.deleteMany(),
      this.prisma.loan.deleteMany(),
      this.prisma.monthlyGoal.deleteMany(),
      this.prisma.auditLog.deleteMany(),
      this.prisma.product.deleteMany(),
      this.prisma.customer.deleteMany(),
      this.prisma.supplier.deleteMany(),
      this.prisma.category.deleteMany(),
      this.prisma.expenseCategory.deleteMany(),
      this.prisma.pricingSettings.deleteMany(),
    ]);

    // Nouvelle entrée d'audit après coup (la table vient d'être vidée), pour
    // garder une trace de qui a déclenché la réinitialisation et quand.
    await this.audit.log({
      userId: actorId,
      action: 'reset',
      entityType: 'system',
      entityId: 'all-data',
      afterData: { resetAt: new Date().toISOString() },
    });

    return { success: true, resetAt: new Date().toISOString() };
  }
}
