import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { PRODUCT_IMAGES } from './product-images';

let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
function randInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}

@Injectable()
export class DemoSeedService {
  constructor(private prisma: PrismaService) {}

  // Empêche deux régénérations de tourner en même temps (ex. la tâche
  // automatique de 4h qui chevaucherait un essai manuel) — sans ce verrou,
  // les deux exécutions se marchent dessus et mélangent anciennes et
  // nouvelles données (bug signalé par l'utilisateur : lignes "Rent" en
  // double, une en FCFA, une en dollars, pour le même mois).
  private isReseeding = false;

  async reseed() {
    if (this.isReseeding) {
      throw new Error('A regeneration is already in progress — please wait a moment and try again.');
    }
    this.isReseeding = true;
    try {
      return await this.doReseed();
    } finally {
      this.isReseeding = false;
    }
  }

  private async doReseed() {
    seed = 42;

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

    // Sécurité de la démo publique : tout compte créé lors d'une session
    // précédente (autre que le compte démo lui-même) est supprimé à chaque
    // reseed, pour qu'un compte créé par un visiteur ne survive jamais
    // indéfiniment.
    await this.prisma.user.deleteMany({
      where: { email: { not: 'demo@dianefrigo.app' } },
    });

    const roleNames = ['ADMIN', 'RESPONSABLE', 'VENDEUR', 'MAGASINIER'] as const;
    for (const name of roleNames) {
      await this.prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    }
    const responsableRole = await this.prisma.role.findUniqueOrThrow({ where: { name: 'RESPONSABLE' } });

    const demoPasswordHash = await bcrypt.hash('Demo1234!', 10);

    // Jamais de compte ADMIN public — le compte démo garde toutes les
    // fonctionnalités métier mais ne peut jamais gérer les utilisateurs,
    // les rôles, les permissions, ni déclencher d'action ADMIN.
    // upsert (pas juste "créer si absent") : même si ce compte a été altéré
    // pendant une session précédente (rôle changé, désactivé...), le
    // reseed le remet systématiquement dans son état sécurisé d'origine.
    const demoUser = await this.prisma.user.upsert({
      where: { email: 'demo@dianefrigo.app' },
      update: {
        name: 'Demo User',
        passwordHash: demoPasswordHash,
        roleId: responsableRole.id,
        isActive: true,
        permissions: ['dashboard', 'ventes', 'stock', 'produits', 'clients', 'depots', 'achats',
          'charges', 'pertes', 'rentabilite', 'rapports', 'investissement', 'assistant'],
      },
      create: {
        name: 'Demo User',
        email: 'demo@dianefrigo.app',
        passwordHash: demoPasswordHash,
        roleId: responsableRole.id,
        permissions: ['dashboard', 'ventes', 'stock', 'produits', 'clients', 'depots', 'achats',
          'charges', 'pertes', 'rentabilite', 'rapports', 'investissement', 'assistant'],
      },
    });

    const categoryDefs = [
      { name: 'Poultry', products: ['Frozen Chicken Wings', 'Turkey Drumsticks', 'Chicken Thighs'] },
      { name: 'Pork', products: ['Pork Ribs', 'Pork Shoulder Cuts'] },
      { name: 'Seafood', products: ['Fish Fillets', 'Frozen Shrimp'] },
    ];
    const productPriceDefaults: Record<string, [number, number]> = {
      'Frozen Chicken Wings': [9, 14],
      'Turkey Drumsticks': [10, 15],
      'Chicken Thighs': [10, 14],
      'Pork Ribs': [17, 21],
      'Pork Shoulder Cuts': [15, 20],
      'Fish Fillets': [12, 15],
      'Frozen Shrimp': [21, 27],
    };

    const products: { id: string; name: string; purchasePrice: number; salePrice: number }[] = [];
    for (const cat of categoryDefs) {
      const category = await this.prisma.category.create({ data: { name: cat.name } });
      for (const pname of cat.products) {
        const [purchasePrice, salePrice] = productPriceDefaults[pname];
        const product = await this.prisma.product.create({
          data: {
            name: pname, referencePurchasePrice: purchasePrice, referenceSalePrice: salePrice,
            alertThreshold: 300, categoryId: category.id, unit: 'box',
            imageUrl: PRODUCT_IMAGES[pname],
          },
        });
        products.push({ id: product.id, name: pname, purchasePrice, salePrice });
      }
    }

    const supplierNames = ['Atlantic Foods Ltd', 'Prime Meat Supply Co.', 'Coastal Seafood Traders'];
    const suppliers = [];
    for (const name of supplierNames) {
      suppliers.push(await this.prisma.supplier.create({
        data: { name, phone: `+242 0${randInt(5, 6)} ${randInt(100, 999)} ${randInt(1000, 9999)}` },
      }));
    }

    const expenseCategoryNames = ['Rent', 'Electricity', 'Water', 'Transport / Fuel', 'Salaries', 'Packaging', 'Maintenance', 'Phone / Internet', 'Taxes', 'Other'];
    const expenseCategories = [];
    for (const name of expenseCategoryNames) {
      expenseCategories.push(await this.prisma.expenseCategory.create({ data: { name } }));
    }

    const customerDefs = [
      { name: 'Golden Palace Restaurant', type: 'GROS' as const },
      { name: 'Fresh Mart Grocery', type: 'GROS' as const },
      { name: 'John Kimbala', type: 'DETAIL' as const },
      { name: 'Sarah Milandou', type: 'DETAIL' as const },
      { name: 'Riverside Diner', type: 'GROS' as const },
      { name: 'Grace Batantou', type: 'DETAIL' as const },
      { name: 'City Wholesale Foods', type: 'GROS' as const },
      { name: 'Patrick Nzaou', type: 'DETAIL' as const },
    ];
    const customers = [];
    for (const c of customerDefs) {
      customers.push(await this.prisma.customer.create({ data: { name: c.name, customerType: c.type } }));
    }

    await this.prisma.pricingSettings.create({
      data: {
        targetMarginFloor: 0.08, targetMarginWholesaleBulk: 0.10, targetMarginWholesale: 0.15, targetMarginRetail: 0.20,
        marginAlertCritical: 0.08, marginAlertGood: 0.15, marginAlertExcellent: 0.20,
        stockRotationFastDays: 7, stockRotationDormantDays: 30, acceptableLossRate: 0.02,
        priceRoundingFcfa: 1, estimatedMonthlyFixedCharges: 2000, estimatedMonthlyCartonsSold: 400,
      },
    });

    const today = new Date();
    const monthsAgo = (n: number, day: number) => new Date(today.getFullYear(), today.getMonth() - n, day);

    for (const p of products) {
      await this.prisma.stockMovement.create({
        data: {
          productId: p.id, movementType: 'ENTRY', quantity: randInt(400, 700),
          date: monthsAgo(3, 1), unitCost: p.purchasePrice, supplierId: pick(suppliers).id,
          referenceType: 'manual_entry', note: 'Initial physical inventory', createdById: demoUser.id,
        },
      });
    }

    for (const p of products) {
      for (let w = 0; w < 6; w++) {
        const date = monthsAgo(3, 1 + w * 14 + randInt(0, 3));
        if (date > today) continue;
        await this.prisma.stockMovement.create({
          data: {
            productId: p.id, movementType: 'ENTRY', quantity: randInt(150, 350),
            date, unitCost: Math.max(1, p.purchasePrice + randInt(-1, 1)), supplierId: pick(suppliers).id,
            referenceType: 'manual_entry', createdById: demoUser.id,
          },
        });
      }
    }

    let invoiceCounter = 1;
    const invoiceNumber = () => String(invoiceCounter++).padStart(5, '0');

    for (let dayOffset = 85; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      if (date > today) continue;
      const salesToday = randInt(1, 5);

      for (let s = 0; s < salesToday; s++) {
        const customer = pick(customers);
        const isWholesale = customer.customerType === 'GROS' ? rand() < 0.85 : rand() < 0.1;
        const lineCount = randInt(1, 3);
        const lines: { productId: string; quantity: number; unitSalePrice: number; unitPurchasePrice: number }[] = [];
        const usedProducts = new Set<string>();

        for (let l = 0; l < lineCount; l++) {
          const product = pick(products);
          if (usedProducts.has(product.id)) continue;
          usedProducts.add(product.id);
          const qty = isWholesale ? randInt(20, 60) : randInt(1, 8);
          const margin = isWholesale ? 0.12 : 0.20;
          const unitSalePrice = Math.round(product.purchasePrice * (1 + margin));
          lines.push({ productId: product.id, quantity: qty, unitSalePrice, unitPurchasePrice: product.purchasePrice });
        }
        if (lines.length === 0) continue;

        const total = lines.reduce((acc, l) => acc + l.quantity * l.unitSalePrice, 0);
        const invNum = invoiceNumber();

        const invoice = await this.prisma.invoice.create({
          data: {
            invoiceNumber: invNum, customerId: customer.id, date, status: 'PAID',
            saleType: isWholesale ? 'GROS' : 'DETAIL',
            subtotal: total, discount: 0, total, amountPaid: total, balanceDue: 0,
            createdById: demoUser.id,
            items: {
              create: lines.map((l) => ({
                productId: l.productId, quantity: l.quantity,
                unitPurchasePrice: l.unitPurchasePrice, unitSalePrice: l.unitSalePrice,
                lineTotal: l.quantity * l.unitSalePrice,
                unitMargin: l.unitSalePrice - l.unitPurchasePrice,
                lineProfit: l.quantity * (l.unitSalePrice - l.unitPurchasePrice),
              })),
            },
          },
        });

        await this.prisma.payment.create({ data: { invoiceId: invoice.id, amount: total, date, method: 'Cash' } });

        await this.prisma.stockMovement.createMany({
          data: lines.map((l) => ({
            productId: l.productId, movementType: 'EXIT' as const, quantity: l.quantity,
            date, referenceType: 'invoice', referenceId: invoice.id, createdById: demoUser.id,
          })),
        });
      }
    }

    const monthlyRent = expenseCategories.find((c) => c.name === 'Rent')!;
    const monthlySalaries = expenseCategories.find((c) => c.name === 'Salaries')!;
    const monthlyElectricity = expenseCategories.find((c) => c.name === 'Electricity')!;
    const monthlyTransport = expenseCategories.find((c) => c.name === 'Transport / Fuel')!;

    // Pour le mois EN COURS (m=0), un jour fixe comme "le 28" peut tomber
    // dans le futur si on régénère tôt dans le mois (ex. le 7) — on plafonne
    // alors au jour réel du mois, jamais au-delà d'aujourd'hui. Les mois
    // passés (m>0) sont déjà entièrement écoulés, aucun risque pour eux.
    const safeDay = (monthOffset: number, desiredDay: number) =>
      monthOffset === 0 ? Math.min(desiredDay, today.getDate()) : desiredDay;

    for (let m = 2; m >= 0; m--) {
      await this.prisma.expense.create({
        data: { categoryId: monthlyRent.id, description: 'Monthly warehouse rent', amount: 750, date: monthsAgo(m, safeDay(m, 1)), chargeType: 'FIXE', createdById: demoUser.id },
      });
      await this.prisma.expense.create({
        data: { categoryId: monthlySalaries.id, description: 'Staff salaries', amount: 1400, date: monthsAgo(m, safeDay(m, 28)), chargeType: 'FIXE', createdById: demoUser.id },
      });
      await this.prisma.expense.create({
        data: { categoryId: monthlyElectricity.id, description: 'Electricity bill', amount: randInt(200, 300), date: monthsAgo(m, safeDay(m, 5)), chargeType: 'FIXE', createdById: demoUser.id },
      });
      await this.prisma.expense.create({
        data: { categoryId: monthlyTransport.id, description: 'Delivery fuel', amount: randInt(100, 200), date: monthsAgo(m, safeDay(m, 15)), chargeType: 'VARIABLE', createdById: demoUser.id },
      });
    }

    const loss1 = await this.prisma.loss.create({
      data: { productId: products[0].id, quantity: 8, reason: 'RUPTURE_CHAINE_FROID', date: monthsAgo(1, 10), unitCost: products[0].purchasePrice, totalValue: 8 * products[0].purchasePrice, createdById: demoUser.id },
    });
    await this.prisma.stockMovement.create({
      data: { productId: products[0].id, movementType: 'EXIT', quantity: 8, date: monthsAgo(1, 10), referenceType: 'loss', referenceId: loss1.id, createdById: demoUser.id },
    });
    const loss2 = await this.prisma.loss.create({
      data: { productId: products[3].id, quantity: 3, reason: 'CASSE', date: monthsAgo(0, 3), unitCost: products[3].purchasePrice, totalValue: 3 * products[3].purchasePrice, createdById: demoUser.id },
    });
    await this.prisma.stockMovement.create({
      data: { productId: products[3].id, movementType: 'EXIT', quantity: 3, date: monthsAgo(0, 3), referenceType: 'loss', referenceId: loss2.id, createdById: demoUser.id },
    });

    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    await this.prisma.monthlyGoal.create({ data: { month: firstOfMonth, targetProfit: 6000 } });

    return { invoicesCreated: invoiceCounter - 1, reseedAt: new Date().toISOString() };
  }
}
