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

/** Formatea una fecha ISO a formato legible local. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Fecha y hora (para aperturas y respuestas de correo). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Muestra solo la fecha si viene sin hora (YYYY-MM-DD); si no, fecha y hora. */
export function formatDateOrTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return iso.length === 10 ? formatDate(iso) : formatDateTime(iso);
}
