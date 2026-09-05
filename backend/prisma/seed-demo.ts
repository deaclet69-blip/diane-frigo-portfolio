import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Petit générateur pseudo-aléatoire à graine fixe — pour que la démo soit
// reproductible (les mêmes "fausses" données à chaque réinitialisation).
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

async function main() {
  console.log('Seeding demo data (English, fictional)...');

  // --- Roles & demo user ---
  const roleNames = ['ADMIN', 'RESPONSABLE', 'VENDEUR', 'MAGASINIER'] as const;
  for (const name of roleNames) {
    await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
  }
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const passwordHash = await bcrypt.hash('Demo1234!', 10);
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@dianefrigo.app' },
    update: {},
    create: {
      name: 'Demo Admin',
      email: 'demo@dianefrigo.app',
      passwordHash,
      roleId: adminRole.id,
      permissions: ['dashboard', 'ventes', 'stock', 'produits', 'clients', 'depots', 'achats',
        'charges', 'pertes', 'rentabilite', 'rapports', 'investissement', 'assistant', 'utilisateurs', 'parametres'],
    },
  });

  // --- Categories & products ---
  const categoryDefs = [
    { name: 'Poultry', products: ['Frozen Chicken Wings', 'Turkey Drumsticks', 'Chicken Thighs'] },
    { name: 'Pork', products: ['Pork Ribs', 'Pork Shoulder Cuts'] },
    { name: 'Seafood', products: ['Fish Fillets', 'Frozen Shrimp'] },
  ];
  const productPriceDefaults: Record<string, [number, number]> = {
    'Frozen Chicken Wings': [5510, 8100],
    'Turkey Drumsticks': [6200, 9200],
    'Chicken Thighs': [5800, 8600],
    'Pork Ribs': [10100, 12500],
    'Pork Shoulder Cuts': [9200, 11800],
    'Fish Fillets': [6920, 9000],
    'Frozen Shrimp': [12500, 16000],
  };

  const products: { id: string; name: string; purchasePrice: number; salePrice: number }[] = [];
  for (const cat of categoryDefs) {
    const category = await prisma.category.upsert({
      where: { name: cat.name }, update: {}, create: { name: cat.name },
    });
    for (const pname of cat.products) {
      const [purchasePrice, salePrice] = productPriceDefaults[pname];
      const product = await prisma.product.upsert({
        where: { name: pname }, update: {},
        create: {
          name: pname, referencePurchasePrice: purchasePrice, referenceSalePrice: salePrice,
          alertThreshold: 300, categoryId: category.id,
        },
      });
      products.push({ id: product.id, name: pname, purchasePrice, salePrice });
    }
  }

  // --- Suppliers ---
  const supplierNames = ['Atlantic Foods Ltd', 'Prime Meat Supply Co.', 'Coastal Seafood Traders'];
  const suppliers = [];
  for (const name of supplierNames) {
    suppliers.push(await prisma.supplier.create({ data: { name, phone: `+242 0${randInt(5, 6)} ${randInt(100, 999)} ${randInt(1000, 9999)}` } }));
  }

  // --- Expense categories ---
  const expenseCategoryNames = ['Rent', 'Electricity', 'Water', 'Transport / Fuel', 'Salaries', 'Packaging', 'Maintenance', 'Phone / Internet', 'Taxes', 'Other'];
  const expenseCategories = [];
  for (const name of expenseCategoryNames) {
    expenseCategories.push(await prisma.expenseCategory.upsert({ where: { name }, update: {}, create: { name } }));
  }

  // --- Customers ---
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
    customers.push(await prisma.customer.create({ data: { name: c.name, customerType: c.type } }));
  }

  // --- Pricing settings ---
  const existingSettings = await prisma.pricingSettings.findFirst();
  if (existingSettings) {
    await prisma.pricingSettings.update({
      where: { id: existingSettings.id },
      data: { estimatedMonthlyFixedCharges: 1200000, estimatedMonthlyCartonsSold: 400 },
    });
  } else {
    await prisma.pricingSettings.create({
      data: {
        targetMarginFloor: 0.08, targetMarginWholesaleBulk: 0.10, targetMarginWholesale: 0.15, targetMarginRetail: 0.20,
        marginAlertCritical: 0.08, marginAlertGood: 0.15, marginAlertExcellent: 0.20,
        stockRotationFastDays: 7, stockRotationDormantDays: 30, acceptableLossRate: 0.02,
        priceRoundingFcfa: 100, estimatedMonthlyFixedCharges: 1200000, estimatedMonthlyCartonsSold: 400,
      },
    });
  }

  // --- 3 months of history: initial stock, sales, expenses ---
  const today = new Date();
  const monthsAgo = (n: number, day: number) => new Date(today.getFullYear(), today.getMonth() - n, day);

  // Initial stock entry per product, 3 months ago
  for (const p of products) {
    await prisma.stockMovement.create({
      data: {
        productId: p.id, movementType: 'ENTRY', quantity: randInt(400, 700),
        date: monthsAgo(3, 1), unitCost: p.purchasePrice, supplierId: pick(suppliers).id,
        referenceType: 'manual_entry', note: 'Initial physical inventory', createdById: demoUser.id,
      },
    });
  }

  // Restocking entries roughly every 2 weeks per product over 3 months
  for (const p of products) {
    for (let w = 0; w < 6; w++) {
      const date = monthsAgo(3, 1 + w * 14 + randInt(0, 3));
      if (date > today) continue;
      await prisma.stockMovement.create({
        data: {
          productId: p.id, movementType: 'ENTRY', quantity: randInt(150, 350),
          date, unitCost: p.purchasePrice + randInt(-200, 200), supplierId: pick(suppliers).id,
          referenceType: 'manual_entry', createdById: demoUser.id,
        },
      });
    }
  }

  // Sales — roughly 3-5 per day over the last ~85 days
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
        const unitSalePrice = Math.round((product.purchasePrice * (1 + margin)) / 100) * 100;
        lines.push({ productId: product.id, quantity: qty, unitSalePrice, unitPurchasePrice: product.purchasePrice });
      }
      if (lines.length === 0) continue;

      const total = lines.reduce((acc, l) => acc + l.quantity * l.unitSalePrice, 0);
      const invNum = invoiceNumber();

      const invoice = await prisma.invoice.create({
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

      await prisma.payment.create({ data: { invoiceId: invoice.id, amount: total, date, method: 'Cash' } });

      await prisma.stockMovement.createMany({
        data: lines.map((l) => ({
          productId: l.productId, movementType: 'EXIT' as const, quantity: l.quantity,
          date, referenceType: 'invoice', referenceId: invoice.id, createdById: demoUser.id,
        })),
      });
    }
  }

  // Monthly expenses for each of the last 3 months
  const monthlyRent = expenseCategories.find((c) => c.name === 'Rent')!;
  const monthlySalaries = expenseCategories.find((c) => c.name === 'Salaries')!;
  const monthlyElectricity = expenseCategories.find((c) => c.name === 'Electricity')!;
  const monthlyTransport = expenseCategories.find((c) => c.name === 'Transport / Fuel')!;

  for (let m = 2; m >= 0; m--) {
    await prisma.expense.create({
      data: { categoryId: monthlyRent.id, description: 'Monthly warehouse rent', amount: 450000, date: monthsAgo(m, 1), chargeType: 'FIXE', createdById: demoUser.id },
    });
    await prisma.expense.create({
      data: { categoryId: monthlySalaries.id, description: 'Staff salaries', amount: 850000, date: monthsAgo(m, 28), chargeType: 'FIXE', createdById: demoUser.id },
    });
    await prisma.expense.create({
      data: { categoryId: monthlyElectricity.id, description: 'Electricity bill', amount: randInt(120000, 180000), date: monthsAgo(m, 5), chargeType: 'FIXE', createdById: demoUser.id },
    });
    await prisma.expense.create({
      data: { categoryId: monthlyTransport.id, description: 'Delivery fuel', amount: randInt(60000, 120000), date: monthsAgo(m, 15), chargeType: 'VARIABLE', createdById: demoUser.id },
    });
  }

  // A couple of losses (avec le vrai mouvement de stock associé, comme le
  // ferait l'appli — sinon le stock resterait faussement élevé)
  const loss1 = await prisma.loss.create({
    data: { productId: products[0].id, quantity: 8, reason: 'RUPTURE_CHAINE_FROID', date: monthsAgo(1, 10), unitCost: products[0].purchasePrice, totalValue: 8 * products[0].purchasePrice, createdById: demoUser.id },
  });
  await prisma.stockMovement.create({
    data: { productId: products[0].id, movementType: 'EXIT', quantity: 8, date: monthsAgo(1, 10), referenceType: 'loss', referenceId: loss1.id, createdById: demoUser.id },
  });
  const loss2 = await prisma.loss.create({
    data: { productId: products[3].id, quantity: 3, reason: 'CASSE', date: monthsAgo(0, 3), unitCost: products[3].purchasePrice, totalValue: 3 * products[3].purchasePrice, createdById: demoUser.id },
  });
  await prisma.stockMovement.create({
    data: { productId: products[3].id, movementType: 'EXIT', quantity: 3, date: monthsAgo(0, 3), referenceType: 'loss', referenceId: loss2.id, createdById: demoUser.id },
  });

  // Monthly goal for current month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  await prisma.monthlyGoal.upsert({
    where: { month: firstOfMonth }, update: {}, create: { month: firstOfMonth, targetProfit: 4000000 },
  });

  console.log('Demo seed complete.');
  console.log('Login: demo@dianefrigo.app / Demo1234!');
  console.log(`Invoices created: ${invoiceCounter - 1}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
