import { api } from './api';

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
