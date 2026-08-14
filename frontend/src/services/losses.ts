import { api } from './api';
import type { Loss, MonthlyLossRate, LossReason } from '../types';

export function getLosses(params: { from?: string; to?: string; productId?: string } = {}) {
  return api.get<Loss[]>('/losses', { params }).then((r) => r.data);
}

export function getMonthlyLossRate() {
  return api.get<MonthlyLossRate>('/losses/monthly-rate').then((r) => r.data);
}

export function createLoss(payload: {
  productId: string; quantity: number; date: string; reason: LossReason; note?: string;
}) {
  return api.post<Loss>('/losses', payload).then((r) => r.data);
}
