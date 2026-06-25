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

export async function getAudienceCount(filters: CampaignFilters): Promise<number> {
  const { data } = await api.get<{ count: number }>('/emails/audience', { params: filters });
  return data.count;
}

export async function sendCampaign(
  body: CampaignFilters & { template_id: string; limit?: number },
): Promise<{ queued: number; message: string }> {
  const { data } = await api.post<{ queued: number; message: string }>('/emails/campaign', body);
  return data;
}
