import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async productsReport() {
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { voidedAt: null } },
      include: { product: true },
    });

    const map = new Map<string, { productName: string; quantity: number; revenue: number; profit: number }>();
    for (const it of items) {
      const key = it.productId;
      const entry = map.get(key) ?? { productName: it.product.name, quantity: 0, revenue: 0, profit: 0 };
      entry.quantity += it.quantity;
      entry.revenue += Number(it.lineTotal);
      entry.profit += Number(it.lineProfit);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }

  async customersReport() {
    const invoices = await this.prisma.invoice.findMany({
      where: { voidedAt: null },
      include: { customer: true, items: true },
    });

    const map = new Map<string, { customerName: string; orderCount: number; revenue: number; quantity: number }>();
    for (const inv of invoices) {
      const key = inv.customerId;
      const entry = map.get(key) ?? { customerName: inv.customer.name, orderCount: 0, revenue: 0, quantity: 0 };
      entry.orderCount += 1;
      entry.revenue += Number(inv.total);
      entry.quantity += inv.items.reduce((acc, i) => acc + i.quantity, 0);
      map.set(key, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 20);
  }

  async expensesReport() {
    const expenses = await this.prisma.expense.findMany({
      include: { category: true },
    });
    const map = new Map<string, number>();
    for (const e of expenses) {
      map.set(e.category.name, (map.get(e.category.name) ?? 0) + Number(e.amount));
    }
    return Array.from(map.entries()).map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }

  async salesReport(from?: string, to?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        voidedAt: null,
        date: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { items: true },
    });
    return {
      invoiceCount: invoices.length,
      totalRevenue: invoices.reduce((acc, i) => acc + Number(i.total), 0),
      totalProfit: invoices.reduce(
        (acc, inv) => acc + inv.items.reduce((s, it) => s + Number(it.lineProfit), 0), 0,
      ),
    };
  }

  /** Entrées de stock avec date, fournisseur et prix d'achat (demande utilisateur). */
  async stockEntriesReport(from?: string, to?: string) {
    const entries = await this.prisma.stockMovement.findMany({
      where: {
        movementType: 'ENTRY',
        date: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { product: { select: { name: true } }, supplier: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take: 300,
    });
    return entries.map((e) => ({
      date: e.date,
      productName: e.product.name,
      quantity: e.quantity,
      unitCost: e.unitCost ? Number(e.unitCost) : null,
      totalCost: e.unitCost ? Number(e.unitCost) * e.quantity : null,
      supplierName: e.supplier?.name ?? null,
      note: e.note,
    }));
  }
}
