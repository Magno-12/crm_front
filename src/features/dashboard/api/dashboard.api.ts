import { api } from '@/api/client';
import type { DashboardSummary, KpisResponse, NamedValue, TrendPoint } from '@/types/api';

interface ChartResponse<T> {
  title: string;
  data: T[];
}

export interface EmailEngagement {
  sent: number;
  opened: number;
  clicked: number;
  open_rate: number;
  openers: {
    email: string;
    razon_social: string;
    opened_at: string | null;
    prospect_id: string | null;
  }[];
}

export async function getKpis(): Promise<KpisResponse> {
  const { data } = await api.get<KpisResponse>('/dashboard/kpis');
  return data;
}

export async function getSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/dashboard/summary');
  return data;
}

export async function getTrend(): Promise<TrendPoint[]> {
  const { data } = await api.get<ChartResponse<TrendPoint>>('/dashboard/charts/trend');
  return data.data;
}

export async function getEmailEngagement(): Promise<EmailEngagement> {
  const { data } = await api.get<EmailEngagement>('/dashboard/email-engagement');
  return data;
}

export async function getRevenueByService(): Promise<NamedValue[]> {
  const { data } = await api.get<ChartResponse<NamedValue>>('/dashboard/charts/revenue');
  return data.data;
}

export async function getProspectsByCity(): Promise<NamedValue[]> {
  const { data } = await api.get<ChartResponse<NamedValue>>('/dashboard/charts/by-service');
  return data.data;
}

export async function getRevenueByActivity(): Promise<NamedValue[]> {
  const { data } = await api.get<ChartResponse<NamedValue>>(
    '/dashboard/charts/revenue-by-activity',
  );
  return data.data;
}

export async function getTopClients(): Promise<NamedValue[]> {
  const { data } = await api.get<ChartResponse<NamedValue>>('/dashboard/top-clients');
  return data.data;
}
