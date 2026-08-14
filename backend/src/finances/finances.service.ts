import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

@Injectable()
export class FinancesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Recettes par jour/semaine/mois/année — remplace la feuille "Recettes"
   * de l'Excel (recalculée en direct depuis les vraies ventes).
   */
  async getRecettes(granularity: 'day' | 'week' | 'month' | 'year') {
    const items = await this.prisma.invoiceItem.findMany({
      where: { invoice: { voidedAt: null } },
      include: { invoice: { select: { date: true } } },
    });

    const buckets = new Map<string, number>();
    for (const item of items) {
      const d = new Date(item.invoice.date);
      let key: string;
      if (granularity === 'day') key = d.toISOString().slice(0, 10);
      else if (granularity === 'month') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      else if (granularity === 'year') key = String(d.getFullYear());
      else {
        // semaine ISO approximative
        const onejan = new Date(d.getFullYear(), 0, 1);
        const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
        key = `${d.getFullYear()}-S${week}`;
      }
      buckets.set(key, (buckets.get(key) ?? 0) + Number(item.lineTotal));
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, revenue]) => ({ period, revenue }));
  }

  /**
   * Résumé financier période courante. RÈGLE CONFIRMÉE dans le fichier
   * Excel réel (feuille Charges) : les 3 types de charges (Fixe, Variable,
   * Exceptionnel) réduisent TOUS le résultat net — la répartition par type
   * sert uniquement au calcul du coût de revient (voir PricingService),
   * pas à exclure quoi que ce soit du résultat.
   */
  async getSummary(period: 'month' | 'all' = 'month') {
    const { start } = monthRange();
    const dateFilter = period === 'month' ? { gte: start } : undefined;

    const [items, chargesByType] = await Promise.all([
      this.prisma.invoiceItem.findMany({
        where: dateFilter
          ? { invoice: { date: dateFilter, voidedAt: null } }
          : { invoice: { voidedAt: null } },
      }),
      this.prisma.expense.groupBy({
        by: ['chargeType'],
        _sum: { amount: true },
        where: dateFilter ? { date: dateFilter } : {},
      }),
    ]);

    const revenue = items.reduce((acc, i) => acc + Number(i.lineTotal), 0);
    const costOfGoods = items.reduce((acc, i) => acc + i.quantity * Number(i.unitPurchasePrice), 0);
    const grossProfit = items.reduce((acc, i) => acc + Number(i.lineProfit), 0);

    const getByType = (t: string) => Number(chargesByType.find((c: any) => c.chargeType === t)?._sum.amount ?? 0);
    const chargesFixe = getByType('FIXE');
    const chargesVariable = getByType('VARIABLE');
    const chargesExceptionnel = getByType('EXCEPTIONNEL');
    const charges = chargesFixe + chargesVariable + chargesExceptionnel;
    const netResult = grossProfit - charges;

    return {
      period, revenue, costOfGoods, grossProfit,
      chargesFixe, chargesVariable, chargesExceptionnel, charges,
      netResult,
      // conservé pour compatibilité avec l'existant : plus de distinction
      // "trésorerie" séparée, tout est dans `charges` désormais.
      treasury: 0,
    };
  }

  /**
   * Objectif de récupération — reproduit la logique déduite de la maquette :
   * % = bénéfice brut cumulé / charges cumulées (une fois à 100%, le
   * résultat net redevient positif). Calcul CUMULÉ DEPUIS LE DÉBUT
   * (contrairement au résumé mensuel ci-dessus), comme la feuille
   * "Récupération" de l'Excel. Toutes les charges comptent (cf. règle ci-dessus).
   */
  async getRecoveryStatus() {
    const [items, chargesAgg, currentMonthGoal] = await Promise.all([
      this.prisma.invoiceItem.findMany({
        where: { invoice: { voidedAt: null } },
        include: { product: true },
      }),
      this.prisma.expense.aggregate({ _sum: { amount: true } }),
      this.prisma.monthlyGoal.findUnique({ where: { month: monthRange().start } }),
    ]);

    const grossProfit = items.reduce((acc, i) => acc + Number(i.lineProfit), 0);
    const charges = Number(chargesAgg._sum.amount ?? 0);
    const netResult = grossProfit - charges;
    const isPositive = netResult >= 0;
    const amountRemaining = isPositive ? 0 : Math.abs(netResult);
    const progressPercent = charges > 0 ? Math.min(100, (grossProfit / charges) * 100) : 100;

    // Par produit : combien de cartons à vendre (au prix de référence) pour
    // combler l'écart, et si le stock actuel suffit.
    const products = await this.prisma.product.findMany({ where: { isActive: true } });
    const perProduct = await Promise.all(
      products.map(async (p) => {
        const unitMargin = Number(p.referenceSalePrice) - Number(p.referencePurchasePrice);
        const cartonsNeeded = unitMargin > 0 ? Math.ceil(amountRemaining / unitMargin) : null;
        const sums = await this.prisma.stockMovement.groupBy({
          by: ['movementType'],
          where: { productId: p.id },
          _sum: { quantity: true },
        });
        const get = (t: string) => Number(sums.find((s: any) => s.movementType === t)?._sum.quantity ?? 0);
        const currentStock = get('ENTRY') + get('INVENTORY_ADJUSTMENT') - get('EXIT');
        return {
          productId: p.id,
          productName: p.name,
          unitMargin,
          cartonsNeeded,
          currentStock,
          stockSufficient: cartonsNeeded !== null ? currentStock >= cartonsNeeded : null,
        };
      }),
    );

    return {
      grossProfit,
      charges,
      netResult,
      isPositive,
      amountRemaining,
      progressPercent,
      goal: currentMonthGoal ? Number(currentMonthGoal.targetProfit) : null,
      perProduct,
    };
  }

  async setMonthlyGoal(month: string, targetProfit: number) {
    const monthDate = new Date(month);
    const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    return this.prisma.monthlyGoal.upsert({
      where: { month: firstOfMonth },
      update: { targetProfit },
      create: { month: firstOfMonth, targetProfit },
    });
  }

  /** CA vs Charges par mois, pour le graphique du dashboard. */
  async getMonthlyChart(monthsBack = 12) {
    const now = new Date();
    const months: { key: string; start: Date; end: Date }[] = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      months.push({ key: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`, start, end });
    }

    const [items, expenses] = await Promise.all([
      this.prisma.invoiceItem.findMany({
        where: { invoice: { voidedAt: null } },
        include: { invoice: { select: { date: true } } },
      }),
      this.prisma.expense.findMany(),
    ]);

    return months.map(({ key, start, end }) => {
      const ca = items
        .filter((i: any) => new Date(i.invoice.date) >= start && new Date(i.invoice.date) < end)
        .reduce((acc, i) => acc + Number(i.lineTotal), 0);
      const charges = expenses
        .filter((e: any) => new Date(e.date) >= start && new Date(e.date) < end)
        .reduce((acc, e) => acc + Number(e.amount), 0);
      return { month: key, ca, charges };
    });
  }
}
