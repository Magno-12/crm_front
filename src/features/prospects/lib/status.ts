import type { ProspectStatus } from '@/types/api';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive';

export const PROSPECT_STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  nuevo: { label: 'Nuevo prospecto', variant: 'secondary' },
  contactado: { label: 'Prospecto contactado', variant: 'default' },
  fidelizado: { label: 'Fidelizado', variant: 'success' },
  no_fidelizado: { label: 'No fidelizado', variant: 'destructive' },
};

export const PROSPECT_STATUSES: ProspectStatus[] = [
  'nuevo',
  'contactado',
  'fidelizado',
  'no_fidelizado',
];

export function statusMeta(status: string) {
  return PROSPECT_STATUS_META[status] ?? { label: status, variant: 'secondary' as BadgeVariant };
}

export const SEGMENT_META: Record<string, { label: string; short: string }> = {
  persona_juridica: { label: 'Persona Jurídica', short: 'P. Jurídica' },
  persona_natural: { label: 'Persona Natural', short: 'P. Natural' },
  alcaldia: { label: 'Alcaldía', short: 'Alcaldía' },
  ese: { label: 'ESE', short: 'ESE' },
  cooperativa: { label: 'Cooperativa', short: 'Cooperativa' },
  otro: { label: 'Otro', short: 'Otro' },
};

// Orden de prioridad acordado: naturales, jurídicas, alcaldías, ESE, cooperativas, otros.
export const SEGMENTS = [
  'persona_natural',
  'persona_juridica',
  'alcaldia',
  'ese',
  'cooperativa',
  'otro',
] as const;

// Segmentos de la base de mercadeo (las cooperativas tienen pantalla propia).
export const MARKET_SEGMENTS = SEGMENTS.filter((s) => s !== 'cooperativa');

export function segmentLabel(segment: string): string {
  return SEGMENT_META[segment]?.short ?? segment;
}
