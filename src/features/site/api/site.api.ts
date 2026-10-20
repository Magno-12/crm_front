import { api } from '@/api/client';

export interface SiteField {
  clave: string;
  grupo: string;
  etiqueta: string;
  multilinea: boolean;
  ayuda: string;
  /** Lo que se publicaría hoy. */
  valor: string;
  /** El texto con el que vino el sitio, para poder deshacer. */
  original: string;
  editado: boolean;
}

export interface SiteGroup {
  grupo: string;
  titulo: string;
  campos: SiteField[];
}

export async function getSiteContent(): Promise<SiteGroup[]> {
  const { data } = await api.get<SiteGroup[]>('/site-content');
  return data;
}

export async function saveSiteContent(
  cambios: Record<string, string>,
): Promise<{ editados: number; mensaje: string }> {
  const { data } = await api.put('/site-content', { cambios });
  return data;
}

export async function publishSite(): Promise<{ ok: boolean; detalle: string }> {
  const { data } = await api.post('/site-content/publicar');
  return data;
}
