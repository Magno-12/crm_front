import { type ReactNode } from 'react';
import { useCan } from '@/features/auth/hooks/useAuth';

/** Renderiza children solo si el usuario tiene el/los permiso(s). */
export function Can({ code, children }: { code: string | string[]; children: ReactNode }) {
  return useCan(code) ? <>{children}</> : null;
}
