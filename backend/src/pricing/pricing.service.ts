import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

function mround(value: number, multiple: number): number {
  if (multiple <= 0) return value;
  return Math.round(value / multiple) * multiple;
}

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /** Il n'existe qu'une seule ligne de paramètres — on la crée si absente. */
  async getSettings() {
    const existing = await this.prisma.pricingSettings.findFirst();
    if (existing) return existing;
    return this.prisma.pricingSettings.create({ data: {} });
  }

  async updateSettings(patch: Partial<{
    targetMarginFloor: number; targetMarginWholesaleBulk: number; targetMarginWholesale: number;
    targetMarginRetail: number; marginAlertCritical: number; marginAlertGood: number;
    marginAlertExcellent: number; stockRotationFastDays: number; stockRotationDormantDays: number;
    acceptableLossRate: number; priceRoundingFcfa: number;
    estimatedMonthlyFixedCharges: number; estimatedMonthlyCartonsSold: number;
  }>, userId: string) {
    const current = await this.getSettings();
    const updated = await this.prisma.pricingSettings.update({ where: { id: current.id }, data: patch });
    await this.audit.log({
      userId, action: 'update', entityType: 'pricing_settings', entityId: current.id, afterData: patch,
    });
    return updated;
  }

  /**
   * Prix d'achat moyen pondéré par produit, calculé à partir des entrées de
   * stock réelles (Stock!D pondéré par Stock!G dans l'Excel) — retombe sur
   * le prix de référence du produit si aucune entrée n'a de coût renseigné.
   */
  private async getAvgPurchasePrice(productId: string, referencePrice: number): Promise<number> {
    const entries = await this.prisma.stockMovement.findMany({
      where: { productId, movementType: 'ENTRY', unitCost: { not: null } },
    });
    if (entries.length === 0) return referencePrice;
    const totalQty = entries.reduce((acc, e) => acc + e.quantity, 0);
    const totalValue = entries.reduce((acc, e) => acc + e.quantity * Number(e.unitCost), 0);
    return totalQty > 0 ? totalValue / totalQty : referencePrice;
  }

  /**
   * Charges par carton — reproduit fidèlement la feuille "Charges" (colonnes
   * L:O, "Historique mensuel") de ton Excel réel :
   * - Sur les 12 derniers mois (hors mois en cours), on ne garde que ceux
   *   où une charge Fixe a été enregistrée ("mois avec données").
   * - S'il y en a 2 ou plus : moyenne réelle = (charges Fixe moyennes sur
   *   ces mois) ÷ (cartons vendus moyens sur CES MÊMES mois).
   * - Sinon (pas encore assez d'historique) : on retombe sur l'estimation
   *   de départ saisie manuellement (Paramètres > section 7).
   */
  private async getChargesPerCarton(): Promise<{
    value: number; usingRealAverage: boolean; monthsWithData: number;
  }> {
    const settings = await this.getSettings();
    const now = new Date();

    const monthlyData: { fixedCharges: number; cartonsSold: number }[] = [];
    for (let i = 1; i <= 12; i++) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const [fixedAgg, exitsAgg] = await Promise.all([
        this.prisma.expense.aggregate({
          _sum: { amount: true },
          where: { chargeType: 'FIXE', date: { gte: start, lt: end } },
        }),
        this.prisma.stockMovement.aggregate({
          _sum: { quantity: true },
          where: { movementType: 'EXIT', date: { gte: start, lt: end } },
        }),
      ]);
      monthlyData.push({
        fixedCharges: Number(fixedAgg._sum.amount ?? 0),
        cartonsSold: Number(exitsAgg._sum.quantity ?? 0),
      });
    }

    const monthsWithData = monthlyData.filter((m) => m.fixedCharges > 0);

    if (monthsWithData.length >= 2) {
      const avgFixedCharges = monthsWithData.reduce((acc, m) => acc + m.fixedCharges, 0) / monthsWithData.length;
      const avgCartonsSold = monthsWithData.reduce((acc, m) => acc + m.cartonsSold, 0) / monthsWithData.length;
      return {
        value: avgCartonsSold > 0 ? avgFixedCharges / avgCartonsSold : 0,
        usingRealAverage: true,
        monthsWithData: monthsWithData.length,
      };
    }

    const estFixed = Number(settings.estimatedMonthlyFixedCharges);
    const estCartons = settings.estimatedMonthlyCartonsSold;
    return {
      value: estCartons > 0 ? estFixed / estCartons : 0,
      usingRealAverage: false,
      monthsWithData: monthsWithData.length,
    };
  }

  /** Reproduit "Analyse Rentabilité Produits" : coût de revient + 4 prix suggérés, par produit. */
  async getProfitabilityAnalysis() {
    const [settings, products, chargesPerCartonInfo] = await Promise.all([
      this.getSettings(),
      this.prisma.product.findMany({ where: { isActive: true } }),
      this.getChargesPerCarton(),
    ]);

    const rounding = settings.priceRoundingFcfa;
    const chargesPerCarton = chargesPerCartonInfo.value;

    const rows = await Promise.all(
      products.map(async (p) => {
        const avgPurchasePrice = await this.getAvgPurchasePrice(p.id, Number(p.referencePurchasePrice));
        const costOfGoods = avgPurchasePrice + chargesPerCarton;
        return {
          productId: p.id,
          productName: p.name,
          avgPurchasePrice,
          chargesPerCarton,
          costOfGoods,
          suggestedPrices: {
            floor: mround(costOfGoods / (1 - Number(settings.targetMarginFloor)), rounding),
            wholesaleBulk: mround(costOfGoods / (1 - Number(settings.targetMarginWholesaleBulk)), rounding),
            wholesale: mround(costOfGoods / (1 - Number(settings.targetMarginWholesale)), rounding),
            retail: mround(costOfGoods / (1 - Number(settings.targetMarginRetail)), rounding),
          },
        };
      }),
    );

    return {
      chargesPerCarton,
      usingRealAverage: chargesPerCartonInfo.usingRealAverage,
      monthsWithData: chargesPerCartonInfo.monthsWithData,
      rows,
    };
  }

  /** "Vérificateur de prix" — verdict immédiat sur un prix proposé. */
  async checkPrice(productId: string, proposedPrice: number) {
    const analysis = await this.getProfitabilityAnalysis();
    const row = analysis.rows.find((r) => r.productId === productId);
    if (!row) throw new NotFoundException('Product not found');

    const marginFcfa = proposedPrice - row.costOfGoods;
    const marginPercent = proposedPrice > 0 ? marginFcfa / proposedPrice : 0;

    let verdict: string;
    if (proposedPrice < row.costOfGoods) verdict = '🔴 LOSS — you are losing money';
    else if (proposedPrice < row.suggestedPrices.floor) verdict = '🟠 BELOW FLOOR PRICE';
    else if (proposedPrice < row.suggestedPrices.wholesaleBulk) verdict = '🟡 Floor / bulk wholesale zone';
    else if (proposedPrice < row.suggestedPrices.wholesale) verdict = '🟡 Bulk wholesale / wholesale zone';
    else if (proposedPrice < row.suggestedPrices.retail) verdict = '🟢 Wholesale / retail zone';
    else verdict = '🟢 Retail price or higher';

    return { ...row, proposedPrice, marginFcfa, marginPercent, verdict };
  }
}
