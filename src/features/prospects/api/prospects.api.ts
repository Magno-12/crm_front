import { api } from '@/api/client';
import type {
  FollowUpCreate,
  FollowUpRead,
  ImportResult,
  Page,
  ProspectCreate,
  ProspectRead,
  ProspectUpdate,
} from '@/types/api';

export interface ProspectFilters {
  q?: string;
  estado?: string;
  ciudad?: string;
  segmento?: string;
  /** Excluye un segmento (la base de mercadeo excluye a las cooperativas). */
  exclude_segmento?: string;
  actividad_ciiu?: string;
  regimen?: string;
  ingresos_min?: string;
  ingresos_max?: string;
  activos_min?: string;
  activos_max?: string;
  en_gestion?: boolean;
  page?: number;
  page_size?: number;
}

export async function listProspects(filters: ProspectFilters): Promise<Page<ProspectRead>> {
  const { data } = await api.get<Page<ProspectRead>>('/prospects', { params: filters });
  return data;
}

export async function getProspect(id: string): Promise<ProspectRead> {
  const { data } = await api.get<ProspectRead>(`/prospects/${id}`);
  return data;
}

export async function createProspect(body: ProspectCreate): Promise<ProspectRead> {
  const { data } = await api.post<ProspectRead>('/prospects', body);
  return data;
}

export async function updateProspect(id: string, body: ProspectUpdate): Promise<ProspectRead> {
  const { data } = await api.patch<ProspectRead>(`/prospects/${id}`, body);
  return data;
}

/** Bloquea o desbloquea el envío de correos a este prospecto (baja manual). */
export async function setEmailOptOut(id: string, optOut: boolean): Promise<ProspectRead> {
  const { data } = await api.patch<ProspectRead>(`/prospects/${id}`, { email_opt_out: optOut });
  return data;
}

export async function deleteProspect(id: string): Promise<void> {
  await api.delete(`/prospects/${id}`);
}

export async function assignProspect(id: string, userId: string): Promise<ProspectRead> {
  const { data } = await api.post<ProspectRead>(`/prospects/${id}/assign`, { user_id: userId });
  return data;
}

export async function convertToClient(id: string): Promise<{ id: string; nit: string }> {
  const { data } = await api.post<{ id: string; nit: string }>(
    `/prospects/${id}/convert-to-client`,
    {},
  );
  return data;
}

/** Importa una base de prospectos.
 *
 * En las bases de 2026 las hojas son departamentos, así que el segmento lo
 * define el archivo (persona_juridica / persona_natural). Sin ese dato se
 * deduce del nombre de la hoja, como en las bases antiguas.
 */
export async function importProspects(file: File, segmento?: string): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ImportResult>('/prospects/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: segmento ? { segmento } : undefined,
    timeout: 15 * 60 * 1000,
  });
  return data;
}

export interface PurgeResult {
  prospectos: number;
  conservados: number;
  correos: number;
  seguimientos: number;
}

/** Vacía la base de mercadeo para volver a cargarla. Conserva a los fidelizados. */
export async function purgeProspects(): Promise<PurgeResult> {
  const { data } = await api.delete<PurgeResult>('/prospects/purge', {
    params: { confirmar: 'BORRAR' },
    timeout: 15 * 60 * 1000,
  });
  return data;
}

/** Importa el Excel de entidades vigiladas por la Supersolidaria (cooperativas). */
export async function importCooperativas(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ImportResult>('/prospects/import-cooperativas', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export interface AttachmentRead {
  id: string;
  follow_up_id: string;
  prospect_id: string;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
}

/** Documentos adjuntos a los seguimientos del prospecto. */
export async function listAttachments(prospectId: string): Promise<AttachmentRead[]> {
  const { data } = await api.get<AttachmentRead[]>(`/prospects/${prospectId}/attachments`);
  return data;
}

export async function uploadAttachment(
  prospectId: string,
  followUpId: string,
  file: File,
): Promise<AttachmentRead> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<AttachmentRead>(
    `/prospects/${prospectId}/follow-ups/${followUpId}/attachments`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function downloadAttachment(prospectId: string, id: string): Promise<Blob> {
  const { data } = await api.get<Blob>(`/prospects/${prospectId}/attachments/${id}/download`, {
    responseType: 'blob',
  });
  return data;
}

export async function deleteAttachment(prospectId: string, id: string): Promise<void> {
  await api.delete(`/prospects/${prospectId}/attachments/${id}`);
}

export async function listFollowUps(prospectId: string): Promise<FollowUpRead[]> {
  const { data } = await api.get<FollowUpRead[]>(`/prospects/${prospectId}/follow-ups`);
  return data;
}

export async function createFollowUp(
  prospectId: string,
  body: FollowUpCreate,
): Promise<FollowUpRead> {
  const { data } = await api.post<FollowUpRead>(`/prospects/${prospectId}/follow-ups`, body);
  return data;
}

interface CiiuRow {
  code: string;
  nivel: string | null;
  description: string;
}

/** Busca códigos CIIU por código o descripción (catálogo DIAN). */
export async function searchCiiu(q: string): Promise<CiiuRow[]> {
  const { data } = await api.get<CiiuRow[]>('/ciiu', { params: { q, limit: 10 } });
  return data;
}

export interface RuesLookup {
  nit: string;
  razon_social: string | null;
  actividad_ciiu: string | null;
  ciiu_descripcion: string | null;
  camara: string | null;
  estado: string | null;
  organizacion_juridica: string | null;
}

/** Consulta el RUES (registro mercantil) por NIT vía datos.gov.co. */
export async function lookupRues(nit: string): Promise<RuesLookup | null> {
  const { data } = await api.get<RuesLookup | null>('/rues/lookup', { params: { nit } });
  return data;
}

export interface EmailSendRow {
  id: string;
  recipient_email: string;
  status: string;
  opens: number;
  clicks: number;
  opened_at: string | null;
  sent_at: string | null;
  created_at: string;
}

/** Correos enviados a un prospecto con su estado de apertura (tracking Resend). */
export async function emailSendsByProspect(prospectId: string): Promise<EmailSendRow[]> {
  const { data } = await api.get<EmailSendRow[]>(`/emails/by-prospect/${prospectId}`);
  return data;
}
