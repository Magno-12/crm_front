import { api } from '@/api/client';
import type { ServiceCreate, ServiceRead } from '@/types/api';

export async function listServices(onlyActive = false): Promise<ServiceRead[]> {
  const { data } = await api.get<ServiceRead[]>('/services', {
    params: { only_active: onlyActive },
  });
  return data;
}

export async function createService(
  body: ServiceCreate & { area_contrato?: string | null },
): Promise<ServiceRead> {
  const { data } = await api.post<ServiceRead>('/services', body);
  return data;
}

/** Las nueve áreas del contrato marco; cada una arrastra su anexo técnico. */
export const AREAS_CONTRATO: { value: string; label: string }[] = [
  { value: '01', label: '01 · Auditoría' },
  { value: '02', label: '02 · Revisoría Fiscal' },
  { value: '03', label: '03 · Control Interno y Riesgos' },
  { value: '04', label: '04 · Contabilidad y Outsourcing' },
  { value: '05', label: '05 · Gestión Tributaria' },
  { value: '06', label: '06 · Consultoría Financiera' },
  { value: '07', label: '07 · Procesos de Insolvencia' },
  { value: '08', label: '08 · Sector Público' },
  { value: '09', label: '09 · Cumplimiento Normativo' },
];

/** Actualiza un servicio del catálogo (por ejemplo, su área del contrato). */
export async function updateService(
  id: string,
  body: Partial<{
    name: string;
    category: string;
    description: string;
    norma: string | null;
    area_contrato: string | null;
    default_value: string;
    is_active: boolean;
  }>,
): Promise<ServiceRead> {
  const { data } = await api.patch<ServiceRead>(`/services/${id}`, body);
  return data;
}
