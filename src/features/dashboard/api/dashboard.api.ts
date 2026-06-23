import { api } from '@/api/client';
import type {
  ConversionRow,
  DashboardSummary,
  KpisResponse,
  NamedValue,
  TrendPoint,
} from '@/types/api';

interface ChartResponse<T> {
  title: string;
  data: T[];
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

export async function getPipeline(): Promise<NamedValue[]> {
  const { data } = await api.get<ChartResponse<NamedValue>>('/dashboard/charts/pipeline');
  return data.data;
}

export async function getConversion(): Promise<ConversionRow[]> {
  const { data } = await api.get<ChartResponse<ConversionRow>>('/dashboard/charts/conversion');
  return data.data;
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
