import { api } from './api';

export interface ProductCategory {
  id: string;
  name: string;
}

export function getCategories() {
  return api.get<ProductCategory[]>('/categories').then((r) => r.data);
}

export function createCategory(name: string) {
  return api.post<ProductCategory>('/categories', { name }).then((r) => r.data);
}
