import { api } from './api';
import type { StockEntryReportRow, TraceabilityGranularity, TraceabilityReport } from '../types';

export function getProductsReport() {
  return api.get('/reports/products').then((r) => r.data);
}

export function getCustomersReport() {
  return api.get('/reports/customers').then((r) => r.data);
}

export function getExpensesReport() {
  return api.get('/reports/expenses').then((r) => r.data);
}

export function getSalesReport(from?: string, to?: string) {
  return api.get('/reports/sales', { params: { from, to } }).then((r) => r.data);
}

export function getStockEntriesReport(from?: string, to?: string) {
  return api.get<StockEntryReportRow[]>('/reports/stock-entries', { params: { from, to } }).then((r) => r.data);
}

export function getTraceabilityReport(granularity: TraceabilityGranularity, from?: string, to?: string) {
  return api
    .get<TraceabilityReport>('/reports/traceability', { params: { granularity, from, to } })
    .then((r) => r.data);
}
