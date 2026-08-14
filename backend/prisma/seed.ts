import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roleNames = ['ADMIN', 'RESPONSABLE', 'VENDEUR', 'MAGASINIER'] as const;
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const expenseCategories = [
    'Loyer', 'Électricité', 'Eau', 'Transport / Carburant', 'Salaires',
    'Emballage', 'Entretien / Réparation', 'Téléphone / Internet',
    'Taxes / Impôts', 'Autre',
  ];
  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const products = [
    { name: 'Queue de porc rasé', referencePurchasePrice: 6920, referenceSalePrice: 9000 },
    { name: 'Cotis semi viandé', referencePurchasePrice: 10100, referenceSalePrice: 12500 },
    { name: 'Dos de poulet', referencePurchasePrice: 5510, referenceSalePrice: 8100 },
  ];
  for (const p of products) {
    await prisma.product.upsert({
      where: { name: p.name },
      update: {},
      create: { ...p, alertThreshold: 500 },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'ADMIN' } });
  const passwordHash = await bcrypt.hash('ChangeMoi123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@dianefrigo.local' },
    update: {},
    create: {
      name: 'Administrateur',
      email: 'admin@dianefrigo.local',
      passwordHash,
      roleId: adminRole.id,
    },
  });

  // Objectif du mois en cours (Phase 4 — feuille "Graphiques" de l'Excel)
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  await prisma.monthlyGoal.upsert({
    where: { month: firstOfMonth },
    update: {},
    create: { month: firstOfMonth, targetProfit: 5_000_000 },
  });

  console.log('Seed terminé. Connexion : admin@dianefrigo.local / ChangeMoi123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
