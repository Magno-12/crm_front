import type { ProspectStatus } from '@/types/api';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive';

export const PROSPECT_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  nuevo: { label: 'Nuevo', variant: 'secondary' },
  contactado: { label: 'Contactado', variant: 'default' },
  interesado: { label: 'Interesado', variant: 'default' },
  en_negociacion: { label: 'En negociación', variant: 'warning' },
  propuesta_enviada: { label: 'Propuesta enviada', variant: 'warning' },
  pendiente_respuesta: { label: 'Pendiente respuesta', variant: 'warning' },
  ganado: { label: 'Ganado', variant: 'success' },
  perdido: { label: 'Perdido', variant: 'destructive' },
  fidelizado: { label: 'Fidelizado', variant: 'success' },
};

export const PROSPECT_STATUSES: ProspectStatus[] = [
  'nuevo',
  'contactado',
  'interesado',
  'en_negociacion',
  'propuesta_enviada',
  'pendiente_respuesta',
  'ganado',
  'perdido',
  'fidelizado',
];

export function statusMeta(status: string) {
  return PROSPECT_STATUS_META[status] ?? { label: status, variant: 'secondary' as BadgeVariant };
}

export const SEGMENT_META: Record<string, { label: string; short: string }> = {
  persona_juridica: { label: 'Persona Jurídica', short: 'P. Jurídica' },
  persona_natural: { label: 'Persona Natural', short: 'P. Natural' },
  alcaldia: { label: 'Alcaldía', short: 'Alcaldía' },
  ese: { label: 'ESE', short: 'ESE' },
  otro: { label: 'Otro', short: 'Otro' },
};

export const SEGMENTS = ['persona_juridica', 'persona_natural', 'alcaldia', 'ese', 'otro'] as const;

export function segmentLabel(segment: string): string {
  return SEGMENT_META[segment]?.short ?? segment;
}
