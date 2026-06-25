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
  actividad_ciiu?: string;
  regimen?: string;
  ingresos_min?: string;
  ingresos_max?: string;
  activos_min?: string;
  activos_max?: string;
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

export async function importProspects(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ImportResult>('/prospects/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
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
