import { api } from './api';
import type { FullDashboard } from '../types';

export function getFullDashboard() {
  return api.get<FullDashboard>('/dashboard/full').then((r) => r.data);
}
