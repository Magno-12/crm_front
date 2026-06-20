import { describe, expect, it } from 'vitest';
import { statusMeta, PROSPECT_STATUSES } from './status';

describe('statusMeta', () => {
  it('mapea estados conocidos con su etiqueta y variante', () => {
    expect(statusMeta('ganado')).toEqual({ label: 'Ganado', variant: 'success' });
    expect(statusMeta('perdido').variant).toBe('destructive');
  });

  it('hace fallback para estados desconocidos', () => {
    expect(statusMeta('inexistente')).toEqual({ label: 'inexistente', variant: 'secondary' });
  });

  it('incluye los 9 estados del dominio', () => {
    expect(PROSPECT_STATUSES).toHaveLength(9);
  });
});
