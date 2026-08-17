import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.supplier.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : {},
      orderBy: { name: 'asc' },
    });
  }

  create(name: string, phone?: string) {
    return this.prisma.supplier.create({ data: { name, phone } });
  }
}
