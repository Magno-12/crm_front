import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { TokenResponse } from '@/types/api';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

/**
 * El access token vive SOLO en memoria (no en localStorage).
 * El refresh token va en cookie HttpOnly gestionada por el backend.
 */
let accessToken: string | null = null;
const subscribers = new Set<(token: string | null) => void>();

export function setAccessToken(token: string | null): void {
  accessToken = token;
  subscribers.forEach((cb) => cb(token));
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function onTokenChange(cb: (token: string | null) => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // envía la cookie de refresh
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Refresh automático del access token ante un 401 (una sola vez por request).
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const resp = await axios.post<TokenResponse>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    setAccessToken(resp.data.access_token);
    return resp.data.access_token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthRoute = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Extrae un mensaje legible de un error de API (Problem Details). */
export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; title?: string } | undefined;
    return data?.detail ?? data?.title ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}
