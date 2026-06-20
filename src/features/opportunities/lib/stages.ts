import type { OpportunityStage } from '@/types/api';

export const STAGES: { key: OpportunityStage; label: string }[] = [
  { key: 'calificacion', label: 'Calificación' },
  { key: 'propuesta', label: 'Propuesta' },
  { key: 'negociacion', label: 'Negociación' },
  { key: 'cierre', label: 'Cierre' },
  { key: 'ganada', label: 'Ganada' },
  { key: 'perdida', label: 'Perdida' },
];

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label]),
);
