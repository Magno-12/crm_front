import { api, API_URL } from '@/api/client';

export interface SiteField {
  clave: string;
  grupo: string;
  /** Dentro de «Servicios», de cuál de los nueve es. Vacío si el grupo no se divide. */
  subgrupo: string;
  etiqueta: string;
  multilinea: boolean;
  ayuda: string;
  /** Lo que se publicaría hoy. */
  valor: string;
  /** El texto con el que vino el sitio, para poder deshacer. */
  original: string;
  editado: boolean;
}

export interface SiteImageSlot {
  clave: string;
  etiqueta: string;
  ayuda: string;
  /** Si pertenece a un bloque, se muestra junto a los textos de ese bloque. */
  subgrupo: string;
}

export interface SiteGroup {
  grupo: string;
  titulo: string;
  campos: SiteField[];
  subgrupos: string[];
  /** Nombre de la colección de fichas si el grupo lleva, vacío si no. */
  coleccion: string;
  imagenes: SiteImageSlot[];
}

export interface SiteCard {
  id: string;
  titulo: string;
  subtitulo: string;
  texto: string;
  orden: number;
  visible: boolean;
  tiene_foto: boolean;
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

/**
 * Dirección pública de una imagen ya cargada.
 *
 * Lleva la fecha del último cambio para que el navegador no muestre la anterior
 * después de reemplazarla.
 */
export function siteImageUrl(clave: string, version?: string | number): string {
  const sufijo = version ? `?v=${encodeURIComponent(String(version))}` : '';
  return `${API_URL}/site-content/imagenes/${encodeURIComponent(clave)}${sufijo}`;
}

export async function uploadSiteImage(clave: string, file: File): Promise<{ mensaje: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.put(
    `/site-content/imagenes/${encodeURIComponent(clave)}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function deleteSiteImage(clave: string): Promise<void> {
  await api.delete(`/site-content/imagenes/${encodeURIComponent(clave)}`);
}

export async function listSiteCards(coleccion: string): Promise<SiteCard[]> {
  const { data } = await api.get<SiteCard[]>(`/site-content/colecciones/${coleccion}`);
  return data;
}

export async function createSiteCard(
  coleccion: string,
  body: Partial<Pick<SiteCard, 'titulo' | 'subtitulo' | 'texto'>>,
): Promise<{ id: string }> {
  const { data } = await api.post(`/site-content/colecciones/${coleccion}`, body);
  return data;
}

export async function updateSiteCard(
  coleccion: string,
  id: string,
  body: Partial<Pick<SiteCard, 'titulo' | 'subtitulo' | 'texto' | 'orden' | 'visible'>>,
): Promise<void> {
  await api.patch(`/site-content/colecciones/${coleccion}/${id}`, body);
}

export async function deleteSiteCard(coleccion: string, id: string): Promise<void> {
  await api.delete(`/site-content/colecciones/${coleccion}/${id}`);
}

/** La foto de una ficha vive con la clave `item.<id>`. */
export const cardImageKey = (id: string): string => `item.${id}`;
