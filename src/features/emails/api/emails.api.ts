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
  /** Re-campaña: según la interacción con esta campaña anterior. */
  source_campaign_id?: string;
  source_filter?: 'opened' | 'clicked' | 'not_opened';
}

export async function getAudienceCount(
  filters: CampaignFilters & { template_id?: string; skip_sent?: boolean },
): Promise<number> {
  const { data } = await api.get<{ count: number }>('/emails/audience', { params: filters });
  return data.count;
}

export async function sendCampaign(
  body: CampaignFilters & {
    /** Plantilla existente, o mensaje escrito a mano (custom_subject + custom_body). */
    template_id?: string | null;
    custom_subject?: string | null;
    custom_body?: string | null;
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

export interface SendLimits {
  daily_limit: number;
  remaining_today: number;
  sent_today: number;
}

/** Límite diario de envíos según el plan contratado, y cuántos quedan hoy. */
export async function getSendLimits(): Promise<SendLimits> {
  const { data } = await api.get<SendLimits>('/emails/limits');
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
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error: string | null;
  opens: number;
  clicks: number;
}

export type RecipientStatus = 'sent' | 'opened' | 'clicked' | 'no_enviados';

export async function getRecipients(
  status: RecipientStatus,
  campaignId?: string | null,
  page = 1,
): Promise<Paged<OpeningRow>> {
  const { data } = await api.get<Paged<OpeningRow>>('/emails/recipients', {
    params: { status, campaign_id: campaignId ?? undefined, page, page_size: 50 },
  });
  return data;
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
  campaignId?: string | null,
): Promise<Paged<ResponseRow>> {
  const { data } = await api.get<Paged<ResponseRow>>('/emails/responses', {
    params: {
      page,
      page_size: 50,
      include_unmatched: includeUnmatched,
      campaign_id: campaignId ?? undefined,
    },
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
  clicked_at: string | null;
  opens: number;
  clicks: number;
  error: string | null;
  date: string;
}

export interface ProspectCampaignGroup {
  campaign_id: string | null;
  campaign_name: string;
  finished: boolean;
  started_at: string | null;
  finished_at: string | null;
  sent: number;
  opened: number;
  clicked: number;
  no_enviados: number;
  responded: number;
  responded_at: string | null;
  sends: ProspectSendItem[];
}

export interface ProspectTracking {
  current: ProspectCampaignGroup[];
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
  sent_rate: number;
  failed: number;
  no_enviados: number;
  no_enviados_rate: number;
  opened: number;
  open_rate: number;
  clicked: number;
  click_rate: number;
  responses: number;
  response_rate: number;
  quota_reached: boolean;
  started_at: string;
  finished_at: string | null;
  start_date: string | null;
  end_date: string | null;
  send_date: string | null;
  envios_count: number;
}

export interface CampaignEnvio {
  date: string | null;
  audience: number;
  sent: number;
  no_enviados: number;
  opened: number;
  clicked: number;
  responded: number;
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
  envios: CampaignEnvio[];
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
  dates: { start_date: string | null; end_date: string | null; name?: string | null },
): Promise<CampaignDetail> {
  const { data } = await api.patch<CampaignDetail>(`/emails/campaigns/${id}/dates`, dates);
  return data;
}

export interface CampaignDeleted {
  name: string;
  campaigns_deleted: number;
  sends_deleted: number;
  responses_unlinked: number;
}

export async function deleteCampaign(id: string): Promise<CampaignDeleted> {
  const { data } = await api.delete<CampaignDeleted>(`/emails/campaigns/${id}`);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/emails/templates/${id}`);
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64
  content_type?: string | null;
}

export interface SendMessageBody {
  to_email: string;
  subject: string;
  body: string;
  prospect_id?: string | null;
  from_email?: string;
  attachments?: EmailAttachment[];
}

export async function sendMessage(body: SendMessageBody): Promise<void> {
  await api.post('/emails/send-message', body);
}
