import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setAccessToken } from '@/api/client';
import type { TokenResponse, UserPublic } from '@/types/api';
import { loginRequest, logoutRequest } from '@/features/auth/api/auth.api';

interface AuthContextValue {
  user: UserPublic | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserPublic>;
  logout: () => Promise<void>;
  setUser: (user: UserPublic | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar, intenta rehidratar la sesión usando la cookie de refresh.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await api.post<TokenResponse>('/auth/refresh', {});
        if (!active) return;
        setAccessToken(data.access_token);
        setUser(data.user);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    // Aunque falle la petición (p. ej. token vencido), cerramos la sesión local.
    try {
      await logoutRequest();
    } catch {
      /* se ignora: la sesión se cierra igual del lado del cliente */
    }
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get<UserPublic>('/auth/me');
    setUser(data);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, setUser, refreshUser }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCan(code: string | string[]): boolean {
  const { user } = useAuth();
  if (!user) return false;
  const needed = Array.isArray(code) ? code : [code];
  return needed.every((c) => user.permissions.includes(c));
}
