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
