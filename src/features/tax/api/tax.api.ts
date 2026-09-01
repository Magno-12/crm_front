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

export interface CalendarSuggestion {
  obligacion: string;
  tipo_contribuyente: string | null;
  periodo: string | null;
  due_date: string;
}

/** Vencimientos sugeridos del calendario DIAN 2026 según obligación + NIT. */
export async function searchTaxCalendar(q: string, nit?: string): Promise<CalendarSuggestion[]> {
  const { data } = await api.get<CalendarSuggestion[]>('/tax-calendar', {
    params: { q, nit, limit: 12 },
  });
  return data;
}

export interface ClienteSinControl {
  client_id: string;
  razon_social: string;
  nit: string;
  /** Obligaciones que le aplican según las áreas del contrato. */
  sugeridas: string[];
}

/** Clientes fidelizados con contrato a los que aún no se les registró ninguna obligación. */
export async function getClientesSinControl(): Promise<ClienteSinControl[]> {
  const { data } = await api.get<ClienteSinControl[]>('/tax-obligations/clientes-sin-control');
  return data;
}
