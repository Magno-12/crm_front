import { api } from '@/api/client';
import type {
  EmailSendRequest,
  EmailSendResult,
  EmailTemplateCreate,
  EmailTemplateRead,
} from '@/types/api';

export async function listTemplates(): Promise<EmailTemplateRead[]> {
  const { data } = await api.get<EmailTemplateRead[]>('/emails/templates');
  return data;
}

export async function listSenders(): Promise<string[]> {
  const { data } = await api.get<string[]>('/emails/senders');
  return data;
}

export async function createTemplate(body: EmailTemplateCreate): Promise<EmailTemplateRead> {
  const { data } = await api.post<EmailTemplateRead>('/emails/templates', body);
  return data;
}

export async function sendEmail(body: EmailSendRequest): Promise<EmailSendResult> {
  const { data } = await api.post<EmailSendResult>('/emails/send', body);
  return data;
}

export interface CampaignFilters {
  segmento?: string;
  estado?: string;
  actividad_ciiu?: string;
}

export async function getAudienceCount(
  filters: CampaignFilters & { template_id?: string; skip_sent?: boolean },
): Promise<number> {
  const { data } = await api.get<{ count: number }>('/emails/audience', { params: filters });
  return data.count;
}

export async function sendCampaign(
  body: CampaignFilters & {
    template_id: string;
    skip_sent?: boolean;
    from_email?: string;
    limit?: number;
  },
): Promise<{ queued: number; message: string }> {
  const { data } = await api.post<{ queued: number; message: string }>('/emails/campaign', body);
  return data;
}

// ---- Apertura de correos (aperturas, respuestas, reenviar) ----
export interface OpeningRow {
  id: string;
  prospect_id: string | null;
  razon_social: string | null;
  recipient_email: string;
  subject: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  opens: number;
  clicks: number;
}

export interface ResponseRow {
  id: string;
  prospect_id: string | null;
  razon_social: string | null;
  from_email: string;
  subject: string;
  snippet: string;
  received_at: string;
}

interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

export async function getOpenings(page = 1): Promise<Paged<OpeningRow>> {
  const { data } = await api.get<Paged<OpeningRow>>('/emails/openings', {
    params: { page, page_size: 50 },
  });
  return data;
}

export async function getResponses(page = 1): Promise<Paged<ResponseRow>> {
  const { data } = await api.get<Paged<ResponseRow>>('/emails/responses', {
    params: { page, page_size: 50 },
  });
  return data;
}

export async function getResponsesByProspect(prospectId: string): Promise<ResponseRow[]> {
  const { data } = await api.get<ResponseRow[]>(`/emails/responses/by-prospect/${prospectId}`);
  return data;
}

export async function resendEmail(sendId: string): Promise<void> {
  await api.post(`/emails/resend/${sendId}`);
}
