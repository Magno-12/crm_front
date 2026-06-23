import { api } from '@/api/client';
import type { TaxObligationCreate, TaxObligationRead, TaxSummary } from '@/types/api';

export async function listObligations(params: {
  client_id?: string;
  status?: string;
  type?: string;
}): Promise<TaxObligationRead[]> {
  const { data } = await api.get<TaxObligationRead[]>('/tax-obligations', { params });
  return data;
}

export async function getTaxSummary(): Promise<TaxSummary> {
  const { data } = await api.get<TaxSummary>('/tax-obligations/summary');
  return data;
}

export async function createObligation(body: TaxObligationCreate): Promise<TaxObligationRead> {
  const { data } = await api.post<TaxObligationRead>('/tax-obligations', body);
  return data;
}

export async function markObligation(
  id: string,
  status: 'pendiente' | 'cumplida',
): Promise<TaxObligationRead> {
  const { data } = await api.patch<TaxObligationRead>(`/tax-obligations/${id}`, { status });
  return data;
}

export async function deleteObligation(id: string): Promise<void> {
  await api.delete(`/tax-obligations/${id}`);
}
