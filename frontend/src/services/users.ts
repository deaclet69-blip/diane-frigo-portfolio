import { api } from './api';
import type { AppUser } from '../types';

export function getUsers() {
  return api.get<AppUser[]>('/users').then((r) => r.data);
}

export function createUser(payload: { name: string; email: string; password: string; roleName: string }) {
  return api.post<AppUser>('/users', payload).then((r) => r.data);
}

export function setUserActive(id: string, isActive: boolean) {
  return api.patch(`/users/${id}/active`, { isActive }).then((r) => r.data);
}

export function changeUserRole(id: string, roleName: string) {
  return api.patch(`/users/${id}/role`, { roleName }).then((r) => r.data);
}
