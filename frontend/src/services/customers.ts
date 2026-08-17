import { api } from './api';
import type { Customer, CustomerDetail } from '../types';

export function getCustomers(search?: string) {
  return api.get<Customer[]>('/customers', { params: { search } }).then((r) => r.data);
}

export function getCustomerDetail(id: string) {
  return api.get<CustomerDetail>(`/customers/${id}`).then((r) => r.data);
}

export function createCustomer(payload: {
  name: string; phone?: string; address?: string; customerType?: string; notes?: string;
}) {
  return api.post<Customer>('/customers', payload).then((r) => r.data);
}

export function checkCustomerName(name: string) {
  return api.get<{ exists: boolean; matches: Customer[] }>('/customers/check-name', { params: { name } }).then((r) => r.data);
}

export function createCustomerWithDedup(payload: {
  name: string; phone?: string; customerType?: string; forceDistinct?: boolean;
}) {
  return api.post<Customer>('/customers/dedup', payload).then((r) => r.data);
}

export function updateCustomer(id: string, payload: Partial<{
  name: string; phone: string; address: string; customerType: string; notes: string;
}>) {
  return api.patch<Customer>(`/customers/${id}`, payload).then((r) => r.data);
}

export function deleteCustomer(id: string) {
  return api.delete(`/customers/${id}`).then((r) => r.data);
}

export function mergeCustomer(sourceId: string, targetId: string) {
  return api.post(`/customers/${sourceId}/merge`, { targetId }).then((r) => r.data);
}
