import { api } from './api';
import type { DepositBalance } from '../types';

export function getDepositBalances(customerId?: string) {
  return api.get<DepositBalance[]>('/deposits', { params: { customerId } }).then((r) => r.data);
}

export function getDepositMovements(customerId?: string) {
  return api.get('/deposits/movements', { params: { customerId } }).then((r) => r.data);
}

export function createWithdrawal(payload: {
  customerId: string; productId: string; quantity: number; date: string; note?: string;
}) {
  return api.post('/deposits/withdrawals', payload).then((r) => r.data);
}
