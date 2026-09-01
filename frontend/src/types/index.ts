export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'RESPONSABLE' | 'VENDEUR' | 'MAGASINIER';
  permissions: string[];
}

export interface DashboardSummary {
  period: 'month' | 'all';
  revenue: number;
  operatingExpenses: number;
  grossProfit: number;
  netResult: number;
  treasury: number;
  totalProducts: number;
  currentStockCartons: number;
  currentStockValue: number;
  lowStockAlertsCount: number;
  ruptureCount: number;
  recoveryProgressPercent: number;
  recoveryAmountRemaining: number;
}

export interface FinanceSummary {
  period: 'month' | 'all';
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  chargesFixe: number;
  chargesVariable: number;
  chargesExceptionnel: number;
  charges: number;
  netResult: number;
}

export interface RecoveryStatus {
  grossProfit: number;
  charges: number;
  netResult: number;
  isPositive: boolean;
  amountRemaining: number;
  progressPercent: number;
  goal: number | null;
  perProduct: {
    productId: string;
    productName: string;
    unitMargin: number;
    cartonsNeeded: number | null;
    currentStock: number;
    stockSufficient: boolean | null;
  }[];
}

export type ChargeType = 'FIXE' | 'VARIABLE' | 'EXCEPTIONNEL';

export interface Expense {
  id: string;
  categoryId: string;
  description: string | null;
  amount: number;
  date: string;
  chargeType: ChargeType;
  category: { name: string };
  createdBy?: { name: string };
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface MonthlyChartPoint {
  month: string;
  ca: number;
  charges: number;
}

export type StockStatus = 'RUPTURE' | 'ALERTE' | 'OK';

export interface StockOverviewItem {
  id: string;
  name: string;
  category: string | null;
  unit: string;
  imageUrl?: string | null;
  currentStock: number;
  alertThreshold: number;
  status: StockStatus;
  referencePurchasePrice: number;
  referenceSalePrice: number;
  value: number;
}

export interface StockOverview {
  items: StockOverviewItem[];
  totals: {
    totalProducts: number;
    totalStock: number;
    totalValue: number;
    ruptureCount: number;
    alertCount: number;
  };
}

export interface StockMovement {
  id: string;
  productId: string;
  movementType: 'ENTRY' | 'EXIT' | 'INVENTORY_ADJUSTMENT';
  quantity: number;
  date: string;
  unitCost?: number | null;
  supplierId?: string | null;
  referenceType: string | null;
  note: string | null;
  createdAt: string;
  product?: { name: string };
  createdBy?: { name: string };
  supplier?: { name: string } | null;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

export interface ProductDetail {
  product: {
    id: string;
    name: string;
    unit: string;
    referencePurchasePrice: number;
    referenceSalePrice: number;
    alertThreshold: number;
    category: { name: string } | null;
  };
  currentStock: number;
  status: StockStatus;
  value: number;
  movements: StockMovement[];
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  customerType: 'DETAIL' | 'GROS' | 'MIXTE' | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  invoices: Invoice[];
  deposits: { id: string; product: Product; movements: any[] }[];
  stats: {
    orderCount: number;
    totalRevenue: number;
    totalQuantity: number;
    lastOrderDate: string | null;
    totalDebt: number;
  };
}

export interface InvoiceItem {
  id: string;
  productId: string;
  quantity: number;
  unitPurchasePrice: number;
  unitSalePrice: number;
  lineTotal: number;
  unitMargin: number;
  lineProfit: number;
  product?: { name: string };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  status: 'PAID' | 'PARTIAL' | 'CREDIT';
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  isDepositSale: boolean;
  saleType: 'DETAIL' | 'GROS' | 'MIXTE';
  voidedAt: string | null;
  voidedReason: string | null;
  createdAt: string;
  customer?: { name: string };
  items: InvoiceItem[];
  payments?: { id: string; amount: number; date: string; method: string | null }[];
}

export interface DepositBalance {
  id: string;
  customer: { id: string; name: string };
  product: { id: string; name: string };
  deposited: number;
  withdrawn: number;
  balance: number;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  referencePurchasePrice: number;
  referenceSalePrice: number;
  alertThreshold: number;
  isActive: boolean;
  category: { id: string; name: string } | null;
  imageUrl?: string | null;
}

export interface AiSummary {
  text: string;
  generatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ===== Phase 6 : Tarification, Pertes, Investissement =====

export interface PricingSettings {
  id: string;
  targetMarginFloor: number;
  targetMarginWholesaleBulk: number;
  targetMarginWholesale: number;
  targetMarginRetail: number;
  marginAlertCritical: number;
  marginAlertGood: number;
  marginAlertExcellent: number;
  stockRotationFastDays: number;
  stockRotationDormantDays: number;
  acceptableLossRate: number;
  priceRoundingFcfa: number;
  estimatedMonthlyFixedCharges: number;
  estimatedMonthlyCartonsSold: number;
}

export interface ProfitabilityRow {
  productId: string;
  productName: string;
  avgPurchasePrice: number;
  chargesPerCarton: number;
  costOfGoods: number;
  suggestedPrices: {
    floor: number;
    wholesaleBulk: number;
    wholesale: number;
    retail: number;
  };
}

export interface ProfitabilityAnalysis {
  chargesPerCarton: number;
  usingRealAverage: boolean;
  monthsWithData: number;
  rows: ProfitabilityRow[];
}

export interface PriceCheckResult extends ProfitabilityRow {
  proposedPrice: number;
  marginFcfa: number;
  marginPercent: number;
  verdict: string;
}

export type LossReason = 'RUPTURE_CHAINE_FROID' | 'EXPIRATION' | 'CASSE' | 'VOL' | 'ERREUR_MANUTENTION' | 'AUTRE';

export interface Loss {
  id: string;
  productId: string;
  quantity: number;
  date: string;
  reason: LossReason;
  unitCost: number;
  totalValue: number;
  note: string | null;
  product: { name: string };
  createdBy?: { name: string };
}

export interface MonthlyLossRate {
  lossValue: number;
  revenue: number;
  rate: number;
  acceptableRate: number;
  isAboveAcceptable: boolean;
}

export interface Loan {
  id: string;
  totalAmount: number;
  constructionAmount: number;
  equipmentAmount: number;
  otherAmount: number;
  customProfitGoal: number | null;
}

export interface LoanStatus {
  loan: {
    totalAmount: number;
    constructionAmount: number;
    equipmentAmount: number;
    otherAmount: number;
    customProfitGoal: number | null;
  };
  repayment: {
    cumulativeRevenueCollected: number;
    percentRepaid: number;
    remainingToSell: number;
    isFullyRepaid: boolean;
  };
  profitObjective: {
    target: number;
    netProfitAlreadyRealized: number;
    remainingToGenerateProfit: number;
    percentAchieved: number;
  };
  projections: {
    velocityWindowDays: number;
    avgDailyRevenue: number;
    avgDailyProfit: number;
    daysToRepayLoan: number | null;
    daysToProfitObjective: number | null;
    stockRunwayDays: number | null;
    requiredDailyProfitBeforeStockOut: number | null;
  };
  perProduct: {
    productId: string;
    productName: string;
    unitMargin: number;
    cartonsNeeded: number | null;
    currentStock: number;
    stockSufficient: boolean | null;
    saleRangeLow: number | null;
    saleRangeHigh: number | null;
  }[];
  stockValueAtSalePrice: number;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: { name: string };
  permissions: string[];
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
  user: { name: string; email: string };
}

export interface FullDashboard {
  kpis: {
    revenueToday: number;
    profitToday: number;
    revenueChangePercent: number | null;
    profitChangePercent: number | null;
    stockValue: number;
    stockCartons: number;
    depositsValue: number;
    depositsCartons: number;
    receivablesTotal: number;
    receivablesCount: number;
  };
  revenueTrend: { date: string; revenue: number }[];
  salesByProduct: { name: string; value: number; percent: number }[];
  alerts: { type: string; title: string; detail: string; timeAgo: string; link: string }[];
  recentActivity: { type: string; label: string; sublabel: string; amount: number; timeAgo: string }[];
  topProductsByMargin: { productName: string; quantity: number; margin: number; revenue: number; marginPercent: number }[];
  stockByCategory: { category: string; cartons: number; percent: number }[];
  monthlySummary: {
    revenue: number; expenses: number; netProfit: number; avgMarginPercent: number;
    monthlyTarget: number | null; monthlyTargetProgressPercent: number;
  };
}

export interface StockEntryReportRow {
  date: string;
  productName: string;
  quantity: number;
  unitCost: number | null;
  totalCost: number | null;
  supplierName: string | null;
  note: string | null;
}

export type TraceabilityGranularity = 'day' | 'week' | 'month' | 'year';

export interface TraceabilityRow {
  period: string;
  label: string;
  recettes: number;
  chiffreAffaires: number;
  coutMarchandises: number;
  margeBrute: number;
  charges: number;
  resultatNet: number;
}

export interface TraceabilityReport {
  granularity: TraceabilityGranularity;
  rows: TraceabilityRow[];
  totals: {
    recettes: number;
    chiffreAffaires: number;
    coutMarchandises: number;
    margeBrute: number;
    charges: number;
    resultatNet: number;
  };
}

export interface ImportReport {
  totalRows: number;
  stockEntriesFound: number;
  invoicesFound: number;
  newProducts: string[];
  errors: { rowNumber: number; reason: string }[];
  duplicates: { rowNumber: number; reason: string }[];
  missingData: { rowNumber: number; reason: string }[];
  importedInvoices?: number;
  importedEntries?: number;
}
