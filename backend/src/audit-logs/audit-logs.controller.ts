import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll(@Query('entityType') entityType?: string, @Query('take') take?: string) {
    return this.prisma.auditLog.findMany({
      where: entityType ? { entityType } : {},
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: take ? Number(take) : 100,
    });
  }
}
