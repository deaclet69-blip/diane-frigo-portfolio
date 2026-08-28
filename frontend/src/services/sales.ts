import { api } from './api';
import type { Invoice } from '../types';

export interface CreateSalePayload {
  customerId: string;
  date: string;
  invoiceNumber?: string;
  items: { productId: string; quantity: number; unitSalePrice: number }[];
  discount?: number;
  paymentStatus: 'paid' | 'partial' | 'credit';
  amountPaid?: number;
  paymentMethod?: string;
  leaveInDeposit?: boolean;
  allowOverstock?: boolean;
  saleType?: 'DETAIL' | 'GROS';
}

export function createSale(payload: CreateSalePayload) {
  return api.post<{ invoice: Invoice; totalProfit: number }>('/sales', payload).then((r) => r.data);
}

export function getInvoices(params: { customerId?: string; status?: string } = {}) {
  return api.get<Invoice[]>('/invoices', { params }).then((r) => r.data);
}

export function getInvoiceDetail(id: string) {
  return api.get<Invoice>(`/invoices/${id}`).then((r) => r.data);
}

export function addPayment(invoiceId: string, payload: { amount: number; date: string; method?: string }) {
  return api.post(`/invoices/${invoiceId}/payments`, payload).then((r) => r.data);
}

export function voidInvoice(invoiceId: string, reason: string) {
  return api.post(`/invoices/${invoiceId}/void`, { reason }).then((r) => r.data);
}
