import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  findAll(includeInactive = false) {
    return this.prisma.product.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async create(dto: CreateProductDto, userId: string) {
    const product = await this.prisma.product.create({ data: dto });
    await this.audit.log({
      userId,
      action: 'create',
      entityType: 'product',
      entityId: product.id,
      afterData: product,
    });
    return product;
  }

  async update(id: string, dto: UpdateProductDto, userId: string) {
    const before = await this.findById(id);
    const product = await this.prisma.product.update({ where: { id }, data: dto });
    await this.audit.log({
      userId,
      action: 'update',
      entityType: 'product',
      entityId: id,
      beforeData: before,
      afterData: product,
    });
    return product;
  }
}
