import { api } from './api';
import type { StockOverview, StockMovement, ProductDetail } from '../types';

export function getStockOverview() {
  return api.get<StockOverview>('/stock').then((r) => r.data);
}

export function getStockAlerts() {
  return api.get<StockOverview['items']>('/stock/alerts').then((r) => r.data);
}

export function getProductDetail(productId: string) {
  return api.get<ProductDetail>(`/stock/${productId}`).then((r) => r.data);
}

export function getMovements(params: { productId?: string; from?: string; to?: string } = {}) {
  return api.get<StockMovement[]>('/stock/movements', { params }).then((r) => r.data);
}

export function createMovement(payload: {
  productId: string;
  movementType: 'ENTRY' | 'EXIT' | 'INVENTORY_ADJUSTMENT';
  quantity: number;
  date: string;
  unitCost?: number;
  supplierId?: string;
  note?: string;
}) {
  return api.post<StockMovement>('/stock/movements', payload).then((r) => r.data);
}

export function updateMovement(
  id: string,
  payload: {
    quantity?: number;
    unitCost?: number;
    supplierId?: string;
    note?: string;
  },
) {
  return api.patch<StockMovement>(`/stock/movements/${id}`, payload).then((r) => r.data);
}
