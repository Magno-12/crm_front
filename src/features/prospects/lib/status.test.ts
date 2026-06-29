import { describe, expect, it } from 'vitest';
import { statusMeta, PROSPECT_STATUSES } from './status';

describe('statusMeta', () => {
  it('mapea estados conocidos con su etiqueta y variante', () => {
    expect(statusMeta('fidelizado')).toEqual({ label: 'Fidelizado', variant: 'success' });
    expect(statusMeta('no_fidelizado').variant).toBe('destructive');
  });

  it('hace fallback para estados desconocidos', () => {
    expect(statusMeta('inexistente')).toEqual({ label: 'inexistente', variant: 'secondary' });
  });

  it('incluye los 4 estados del dominio', () => {
    expect(PROSPECT_STATUSES).toHaveLength(4);
  });
});
