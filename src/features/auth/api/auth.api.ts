import { api } from '@/api/client';
import type { TokenResponse, UserPublic } from '@/types/api';

export async function loginRequest(email: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>('/auth/login', { email, password });
  return data;
}

export async function fetchMe(): Promise<UserPublic> {
  const { data } = await api.get<UserPublic>('/auth/me');
  return data;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<UserPublic> {
  const { data } = await api.post<UserPublic>('/auth/change-password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}
