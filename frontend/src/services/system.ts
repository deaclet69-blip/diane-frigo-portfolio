import { api } from './api';

export function resetAllData(password: string) {
  return api.post<{ success: boolean; resetAt: string }>('/system/reset-data', { password }).then((r) => r.data);
}
