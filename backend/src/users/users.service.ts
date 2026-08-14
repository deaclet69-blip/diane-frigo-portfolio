import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { name: true } },
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async create(
    dto: { name: string; email: string; password: string; roleName: 'ADMIN' | 'RESPONSABLE' | 'VENDEUR' | 'MAGASINIER' },
    actorId: string,
  ) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: dto.roleName } });
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash, roleId: role.id },
      select: { id: true, name: true, email: true, isActive: true, role: true },
    });
    await this.audit.log({
      userId: actorId, action: 'create', entityType: 'user', entityId: user.id, afterData: user,
    });
    return user;
  }

  async setActive(id: string, isActive: boolean, actorId: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, isActive: true },
    });
    await this.audit.log({
      userId: actorId, action: 'update', entityType: 'user', entityId: id, afterData: { isActive },
    });
    return user;
  }

  async changeRole(id: string, roleName: 'ADMIN' | 'RESPONSABLE' | 'VENDEUR' | 'MAGASINIER', actorId: string) {
    const role = await this.prisma.role.findUniqueOrThrow({ where: { name: roleName } });
    const user = await this.prisma.user.update({
      where: { id },
      data: { roleId: role.id },
      select: { id: true, name: true, email: true, role: true },
    });
    await this.audit.log({
      userId: actorId, action: 'update', entityType: 'user', entityId: id, afterData: { roleName },
    });
    return user;
  }
}
