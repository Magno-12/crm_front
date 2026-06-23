import { api } from '@/api/client';
import type { AlertsResponse } from '@/types/api';

export async function getAlerts(): Promise<AlertsResponse> {
  const { data } = await api.get<AlertsResponse>('/alerts');
  return data;
}
