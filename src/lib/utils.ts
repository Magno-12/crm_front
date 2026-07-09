import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formatea un número como moneda colombiana (COP). */
export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

/** Formatea un número compacto (1.2M, 124K). */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  );
}

/** Zona horaria de Colombia: mostramos todas las fechas/horas en hora local del país. */
const CO_TZ = 'America/Bogota';

/** True si la cadena es solo fecha (YYYY-MM-DD), sin componente de hora. */
function isDateOnly(iso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso);
}

/**
 * Convierte una fecha-hora del backend a Date.
 * El backend guarda instantes en UTC pero los serializa SIN zona ("2026-07-09T19:30:00").
 * Si no trae offset ni «Z», lo tratamos como UTC para no correr la hora.
 */
function toDate(iso: string): Date {
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(iso);
  return new Date(hasTz ? iso : `${iso}Z`);
}

/** Formatea una fecha ISO a formato legible (hora de Colombia). */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  if (isDateOnly(iso)) {
    // Fecha sin hora: formatear el día tal cual, sin corrimiento de zona.
    const parts = iso.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
  return toDate(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: CO_TZ,
  });
}

/** Fecha y hora (para aperturas y respuestas de correo), en hora de Colombia. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return toDate(iso).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: CO_TZ,
  });
}

/** Muestra solo la fecha si viene sin hora (YYYY-MM-DD); si no, fecha y hora. */
export function formatDateOrTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.length === 10 ? formatDate(iso) : formatDateTime(iso);
}
