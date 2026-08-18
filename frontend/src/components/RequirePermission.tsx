import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getCurrentUser } from '../services/auth';
import { hasPermission } from '../constants/permissions';

export default function RequirePermission({ perm, children }: { perm: string; children: ReactNode }) {
  const user = getCurrentUser();
  return hasPermission(user, perm) ? <>{children}</> : <Navigate to="/" replace />;
}
