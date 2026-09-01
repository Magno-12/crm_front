import { Calendar, Mail, MapPin, MessageCircle, MoreHorizontal, Phone, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FollowUpOutcome, FollowUpType } from '@/types/api';

/** Por dónde se hizo el contacto. El icono deja verlo de un vistazo en las listas. */
export const FOLLOWUP_TYPES: { value: FollowUpType; label: string; icon: LucideIcon }[] = [
  { value: 'LLAMADA', label: 'Llamada', icon: Phone },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
  { value: 'CORREO', label: 'Correo', icon: Mail },
  { value: 'VISITA', label: 'Visita', icon: MapPin },
  { value: 'CITA', label: 'Cita', icon: Calendar },
  { value: 'REUNION', label: 'Reunión', icon: Users },
  { value: 'OTROS', label: 'Otros', icon: MoreHorizontal },
];

const POR_VALOR = new Map(FOLLOWUP_TYPES.map((t) => [t.value as string, t]));

/** Etiqueta legible de un canal, incluidos los heredados que ya no se ofrecen. */
export function typeLabel(type: string): string {
  return POR_VALOR.get(type)?.label ?? (type === 'NOTA' ? 'Nota' : type);
}

export function typeIcon(type: string): LucideIcon {
  return POR_VALOR.get(type)?.icon ?? MoreHorizontal;
}

/**
 * En qué quedó el contacto. `mueve` es el estado al que pasa el prospecto al
 * guardar; los que no lo traen dejan el estado quieto a propósito (marcar y no
 * lograr hablar no es haber contactado).
 */
export const OUTCOMES: { value: FollowUpOutcome; label: string; mueve?: string }[] = [
  { value: 'CONTESTO', label: 'Contestó', mueve: 'Contactado' },
  { value: 'NO_CONTESTO', label: 'No contestó' },
  { value: 'BUZON', label: 'Entró a buzón' },
  { value: 'VOLVER_A_LLAMAR', label: 'Pidió que lo llamaran después' },
  { value: 'PIDIO_INFORMACION', label: 'Pidió información o propuesta', mueve: 'Contactado' },
  { value: 'AGENDO_CITA', label: 'Agendó cita', mueve: 'Contactado' },
  { value: 'EN_NEGOCIACION', label: 'En negociación', mueve: 'Contactado' },
  { value: 'NO_INTERESADO', label: 'No está interesado', mueve: 'No fidelizado' },
  { value: 'DATO_ERRADO', label: 'Dato equivocado o inexistente', mueve: 'No fidelizado' },
];

const OUTCOME_LABELS = new Map(OUTCOMES.map((o) => [o.value as string, o.label]));

/** Los seguimientos viejos traen el resultado escrito a mano: se muestra tal cual. */
export function outcomeLabel(outcome: string): string {
  return OUTCOME_LABELS.get(outcome) ?? outcome;
}

/** Valor del selector cuando el asesor no registra en qué quedó. */
export const SIN_RESULTADO = 'sin_resultado';
