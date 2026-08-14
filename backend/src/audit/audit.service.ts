import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    action: 'create' | 'update' | 'void' | 'login';
    entityType: string;
    entityId: string;
    beforeData?: unknown;
    afterData?: unknown;
  }) {
    return this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        beforeData: params.beforeData as any,
        afterData: params.afterData as any,
      },
    });
  }
}
