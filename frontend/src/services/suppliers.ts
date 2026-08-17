import { api } from './api';
import type { Supplier } from '../types';

export function getSuppliers(search?: string) {
  return api.get<Supplier[]>('/suppliers', { params: { search } }).then((r) => r.data);
}

export function createSupplier(name: string, phone?: string) {
  return api.post<Supplier>('/suppliers', { name, phone }).then((r) => r.data);
}
