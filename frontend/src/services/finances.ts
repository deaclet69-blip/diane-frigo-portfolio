import { api } from './api';
import type { FinanceSummary, RecoveryStatus, Expense, ExpenseCategory, MonthlyChartPoint, ChargeType } from '../types';

export function getFinanceSummary(period: 'month' | 'all' = 'month') {
  return api.get<FinanceSummary>('/finances/summary', { params: { period } }).then((r) => r.data);
}

export function getRecovery() {
  return api.get<RecoveryStatus>('/finances/recovery').then((r) => r.data);
}

export function getRecettes(granularity: 'day' | 'week' | 'month' | 'year' = 'month') {
  return api.get<{ period: string; revenue: number }[]>('/finances/recettes', { params: { granularity } }).then((r) => r.data);
}

export function getMonthlyChart(months = 12) {
  return api.get<MonthlyChartPoint[]>('/finances/monthly-chart', { params: { months } }).then((r) => r.data);
}

export function setMonthlyGoal(month: string, targetProfit: number) {
  return api.post('/finances/goal', { month, targetProfit }).then((r) => r.data);
}

export function getExpenses(params: { from?: string; to?: string; chargeType?: string } = {}) {
  return api.get<Expense[]>('/expenses', { params }).then((r) => r.data);
}

export function getExpenseCategories() {
  return api.get<ExpenseCategory[]>('/expense-categories').then((r) => r.data);
}

export function createExpenseCategory(name: string) {
  return api.post<ExpenseCategory>('/expense-categories', { name }).then((r) => r.data);
}

export function createExpense(payload: {
  categoryId: string; description?: string; amount: number; date: string;
  chargeType: ChargeType;
}) {
  return api.post<Expense>('/expenses', payload).then((r) => r.data);
}

export function reclassifyExpense(id: string, chargeType: ChargeType) {
  return api.patch(`/expenses/${id}/reclassify`, { chargeType }).then((r) => r.data);
}
