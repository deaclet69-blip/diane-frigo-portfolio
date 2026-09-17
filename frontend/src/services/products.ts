import { api } from './api';
import type { Product } from '../types';

export function getProducts(includeInactive = false) {
  return api.get<Product[]>('/products', { params: { includeInactive } }).then((r) => r.data);
}

export function createProduct(payload: {
  name: string;
  categoryId?: string;
  unit?: string;
  referencePurchasePrice: number;
  referenceSalePrice: number;
  alertThreshold?: number;
  imageUrl?: string;
}) {
  return api.post<Product>('/products', payload).then((r) => r.data);
}

export function updateProduct(id: string, payload: Partial<Product>) {
  return api.patch<Product>(`/products/${id}`, payload).then((r) => r.data);
}
