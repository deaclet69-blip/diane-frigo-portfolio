import { api } from './api';
import type { AuthUser } from '../types';

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user as AuthUser;
}

export function logout() {
  localStorage.clear();
  window.location.href = '/#/login';
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}
