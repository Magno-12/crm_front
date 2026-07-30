import { api } from '@/api/client';

export interface CiiuRead {
  code: string;
  nivel: string | null;
  description: string;
}

/** Busca en el catálogo CIIU por código o por nombre de la actividad. */
export async function searchCiiu(q: string, limit = 8): Promise<CiiuRead[]> {
  const { data } = await api.get<CiiuRead[]>('/ciiu', { params: { q, limit } });
  return data;
}

export interface CiiuStatus {
  total: number;
  ejemplo: { code: string; description: string } | null;
}

/** Cuántas actividades hay cargadas (0 = falta subir el archivo del DANE). */
export async function getCiiuStatus(): Promise<CiiuStatus> {
  const { data } = await api.get<CiiuStatus>('/ciiu/status');
  return data;
}

export interface CiiuImportResult {
  creados: number;
  actualizados: number;
  omitidos: number;
  total: number;
}

/** Carga el catálogo CIIU desde el archivo del DANE (.xlsx o .csv). */
export async function importCiiu(file: File): Promise<CiiuImportResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<CiiuImportResult>('/ciiu/import', form);
  return data;
}
