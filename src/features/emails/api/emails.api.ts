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

export async function updateTemplate(
  id: string,
  body: Partial<{
    name: string;
    subject: string;
    body_html: string;
    variables: string[];
    is_active: boolean;
  }>,
): Promise<EmailTemplateRead> {
  const { data } = await api.patch<EmailTemplateRead>(`/emails/templates/${id}`, body);
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
    start_date?: string | null;
    end_date?: string | null;
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
  campana: string | null;
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

export async function getResponses(
  page = 1,
  includeUnmatched = false,
): Promise<Paged<ResponseRow>> {
  const { data } = await api.get<Paged<ResponseRow>>('/emails/responses', {
    params: { page, page_size: 50, include_unmatched: includeUnmatched },
  });
  return data;
}

export async function getResponsesByProspect(prospectId: string): Promise<ResponseRow[]> {
  const { data } = await api.get<ResponseRow[]>(`/emails/responses/by-prospect/${prospectId}`);
  return data;
}

export interface ProspectSendItem {
  id: string;
  recipient_email: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  opens: number;
  error: string | null;
  date: string;
}

export interface ProspectCampaignGroup {
  campaign_id: string | null;
  campaign_name: string;
  finished: boolean;
  sent: number;
  opened: number;
  responded: number;
  sends: ProspectSendItem[];
}

export interface ProspectTracking {
  active: ProspectCampaignGroup[];
  history: ProspectCampaignGroup[];
}

export async function getProspectTracking(prospectId: string): Promise<ProspectTracking> {
  const { data } = await api.get<ProspectTracking>(`/emails/prospect-tracking/${prospectId}`);
  return data;
}

export async function resendEmail(sendId: string): Promise<void> {
  await api.post(`/emails/resend/${sendId}`);
}

export interface CampaignHistoryRow {
  id: string;
  name: string;
  segmento: string | null;
  estado: string | null;
  audience: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;
  clicked: number;
  click_rate: number;
  responses: number;
  quota_reached: boolean;
  started_at: string;
  finished_at: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface CampaignRecipient {
  prospect_id: string | null;
  razon_social: string | null;
  recipient_email: string;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  responded: boolean;
  response_snippet: string | null;
}

export interface CampaignDetail {
  campaign: CampaignHistoryRow;
  recipients: CampaignRecipient[];
}

export async function getCampaigns(page = 1): Promise<Paged<CampaignHistoryRow>> {
  const { data } = await api.get<Paged<CampaignHistoryRow>>('/emails/campaigns', {
    params: { page, page_size: 50 },
  });
  return data;
}

export async function getCampaignDetail(id: string): Promise<CampaignDetail> {
  const { data } = await api.get<CampaignDetail>(`/emails/campaigns/${id}`);
  return data;
}

export async function updateCampaignDates(
  id: string,
  dates: { start_date: string | null; end_date: string | null },
): Promise<CampaignDetail> {
  const { data } = await api.patch<CampaignDetail>(`/emails/campaigns/${id}/dates`, dates);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/emails/templates/${id}`);
}

export interface SendMessageBody {
  to_email: string;
  subject: string;
  body: string;
  prospect_id?: string | null;
  from_email?: string;
}

export async function sendMessage(body: SendMessageBody): Promise<void> {
  await api.post('/emails/send-message', body);
}
