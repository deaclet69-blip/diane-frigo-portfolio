import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const hasToken = !!localStorage.getItem('accessToken');
  return hasToken ? <>{children}</> : <Navigate to="/login" replace />;
}
