import { api } from '@/api/client';

/** Departamentos de la base; con `departamento`, sus municipios. */
export async function getUbicaciones(departamento?: string): Promise<string[]> {
  const { data } = await api.get<string[]>('/prospects/ubicaciones', {
    params: departamento ? { departamento } : undefined,
  });
  return data;
}

/** Zonas comerciales de la base (P1 - SEDE, P1 - 2h Cali, P2 - Digital…). */
export async function getZonas(): Promise<string[]> {
  const { data } = await api.get<string[]>('/prospects/zonas');
  return data;
}
