import { describe, expect, it } from 'vitest';
import { cn, formatCOP, formatDate } from './utils';

describe('cn', () => {
  it('combina clases y resuelve conflictos de tailwind', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', false, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('formatCOP', () => {
  it('formatea como pesos colombianos sin decimales', () => {
    const result = formatCOP(1500000);
    expect(result).toContain('1.500.000');
  });
});

describe('formatDate', () => {
  it('devuelve guion para valores vacíos', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
  });
});
