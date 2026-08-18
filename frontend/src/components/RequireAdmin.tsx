import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getCurrentUser } from '../services/auth';

export default function RequireAdmin({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  return user?.role === 'ADMIN' ? <>{children}</> : <Navigate to="/" replace />;
}
