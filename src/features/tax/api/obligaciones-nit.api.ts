import { api } from '@/api/client';

export interface ObligacionPorNit {
  id: string;
  tipo: string;
  periodo: string;
  vence: string;
  dias: number;
  estado: string;
  semaforo: 'cumplida' | 'vencida' | 'proxima' | 'al_dia';
}

export interface ObligacionesPorNit {
  cliente: { id: string; razon_social: string; nit: string } | null;
  obligaciones: ObligacionPorNit[];
}

/** Vencimientos tributarios de ese NIT (para consultarlos desde la ficha). */
export async function getObligacionesPorNit(nit: string): Promise<ObligacionesPorNit> {
  const { data } = await api.get<ObligacionesPorNit>(
    `/tax-obligations/by-nit/${encodeURIComponent(nit)}`,
  );
  return data;
}
