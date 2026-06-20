import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FullPageSpinner } from '@/components/common/states';
import { ForbiddenPage } from '@/components/common/ForbiddenPage';

interface ProtectedRouteProps {
  requires?: string | string[];
  children: ReactNode;
}

export function ProtectedRoute({ requires, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <Navigate to="/change-password" replace />;

  if (requires) {
    const needed = Array.isArray(requires) ? requires : [requires];
    const has = needed.every((p) => user.permissions.includes(p));
    if (!has) return <ForbiddenPage />;
  }

  return <>{children}</>;
}
