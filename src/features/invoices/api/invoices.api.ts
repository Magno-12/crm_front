import { api, getAccessToken } from '@/api/client';
import type { InvoiceCreate, InvoiceRead, Page } from '@/types/api';

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1';

export async function listInvoices(params: {
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<InvoiceRead>> {
  const { data } = await api.get<Page<InvoiceRead>>('/invoices', { params });
  return data;
}

export async function getInvoice(id: string): Promise<InvoiceRead> {
  const { data } = await api.get<InvoiceRead>(`/invoices/${id}`);
  return data;
}

export async function createInvoice(body: InvoiceCreate): Promise<InvoiceRead> {
  const { data } = await api.post<InvoiceRead>('/invoices', body);
  return data;
}

export async function updateInvoiceStatus(id: string, status: string): Promise<InvoiceRead> {
  const { data } = await api.patch<InvoiceRead>(`/invoices/${id}/status`, { status });
  return data;
}

/** Descarga el PDF de la factura (con auth) y lo abre en una pestaña nueva. */
export async function openInvoicePdf(id: string, number: string): Promise<void> {
  const resp = await fetch(`${API_URL}/invoices/${id}/pdf`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!resp.ok) throw new Error('No se pudo generar el PDF');
  const blob = await resp.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${number}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
