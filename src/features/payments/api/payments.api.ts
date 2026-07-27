import { api } from '@/api/client';
import type { Page } from '@/types/api';

export type PaymentMethod =
  | 'efectivo'
  | 'transferencia'
  | 'consignacion'
  | 'cheque'
  | 'tarjeta'
  | 'otro';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  consignacion: 'Consignación',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

export interface PaymentRead {
  id: string;
  number: string;
  client_id: string;
  client_name: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  payment_date: string;
  amount: string | number;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface PendingInvoice {
  id: string;
  number: string;
  issue_date: string;
  due_date: string | null;
  total: number;
  saldo: number;
}

export interface PortfolioClient {
  client_id: string | null;
  client_name: string | null;
  nit: string | null;
  saldo: number;
  facturas: number;
  vencido: number;
  dias_max: number;
}

export interface Portfolio {
  total: number;
  vencido: number;
  al_dia: number;
  clientes: PortfolioClient[];
  antiguedad: { name: string; value: number }[];
}

export async function listPayments(params: {
  q?: string;
  client_id?: string;
  page?: number;
  page_size?: number;
}): Promise<Page<PaymentRead>> {
  const { data } = await api.get<Page<PaymentRead>>('/payments', { params });
  return data;
}

export async function createPayment(body: {
  client_id: string;
  invoice_id?: string | null;
  payment_date?: string | null;
  amount: string | number;
  method: PaymentMethod;
  reference?: string | null;
  notes?: string | null;
}): Promise<PaymentRead> {
  const { data } = await api.post<PaymentRead>('/payments', body);
  return data;
}

export async function deletePayment(id: string): Promise<void> {
  await api.delete(`/payments/${id}`);
}

export async function getPortfolio(): Promise<Portfolio> {
  const { data } = await api.get<Portfolio>('/portfolio');
  return data;
}

/** Facturas pendientes de un cliente, para aplicar el recibo. */
export async function getClientPending(clientId: string): Promise<PendingInvoice[]> {
  const { data } = await api.get<PendingInvoice[]>(`/portfolio/client/${clientId}`);
  return data;
}
