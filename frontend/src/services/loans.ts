import { api } from './api';
import type { Loan, LoanStatus } from '../types';

export function getActiveLoan() {
  return api.get<Loan | null>('/loans/active').then((r) => r.data);
}

export function getLoanStatus() {
  return api.get<LoanStatus>('/loans/status').then((r) => r.data);
}

export function upsertLoan(payload: {
  totalAmount: number; constructionAmount?: number; equipmentAmount?: number;
  otherAmount?: number; customProfitGoal?: number;
}) {
  return api.put<Loan>('/loans', payload).then((r) => r.data);
}
