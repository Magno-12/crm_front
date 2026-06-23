export const TAX_TYPE_LABEL: Record<string, string> = {
  iva: 'IVA',
  retencion: 'Retención en la fuente',
  ica: 'ICA',
  renta: 'Renta',
  exogena: 'Información exógena',
  distrital: 'Información distrital',
  renovacion_cc: 'Renovación Cámara de Comercio',
  renovacion_rut: 'Renovación RUT',
};

export const TAX_TYPES = [
  'iva',
  'retencion',
  'ica',
  'renta',
  'exogena',
  'distrital',
  'renovacion_cc',
  'renovacion_rut',
] as const;

export function taxTypeLabel(t: string): string {
  return TAX_TYPE_LABEL[t] ?? t;
}

type Variant = 'success' | 'warning' | 'destructive';

interface SemaforoInfo {
  label: string;
  variant: Variant;
  dot: string;
}

export const SEMAFORO_META: Record<string, SemaforoInfo> = {
  verde: { label: 'Al día', variant: 'success', dot: 'bg-success' },
  amarillo: { label: 'Próxima a vencer', variant: 'warning', dot: 'bg-warning' },
  rojo: { label: 'Vencida', variant: 'destructive', dot: 'bg-destructive' },
};

const DEFAULT_SEMAFORO: SemaforoInfo = { label: 'Al día', variant: 'success', dot: 'bg-success' };

export function semaforoMeta(s: string): SemaforoInfo {
  return SEMAFORO_META[s] ?? DEFAULT_SEMAFORO;
}
