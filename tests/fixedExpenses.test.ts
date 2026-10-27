import { describe, it, expect } from 'vitest';
import {
  monthKeyFromDate,
  monthKeyFromParts,
  daysInMonth,
  lastDayOfMonth,
  occurrenceDate,
  previousMonthEnd,
  isRepetitionTransaction,
} from '../utils/fixedExpenses';

describe('fixedExpenses date helpers', () => {
  it('obtém o mês de referência da data', () => {
    expect(monthKeyFromDate('2026-01-31')).toBe('2026-01-01');
    expect(monthKeyFromParts(2026, 1)).toBe('2026-02-01');
  });

  it('respeita anos bissextos', () => {
    expect(daysInMonth(2026, 1)).toBe(28);
    expect(daysInMonth(2028, 1)).toBe(29);
    expect(lastDayOfMonth(2026, 1)).toBe('2026-02-28');
    expect(lastDayOfMonth(2028, 1)).toBe('2028-02-29');
  });

  it('limita o dia ao último dia do mês', () => {
    expect(occurrenceDate(2026, 1, 31)).toBe('2026-02-28');
    expect(occurrenceDate(2028, 1, 31)).toBe('2028-02-29');
    expect(occurrenceDate(2026, 3, 15)).toBe('2026-04-15');
  });

  it('calcula o fim do mês anterior', () => {
    expect(previousMonthEnd('2026-03-01')).toBe('2026-02-28');
    expect(previousMonthEnd('2026-01-01')).toBe('2025-12-31');
    expect(previousMonthEnd('2028-03-01')).toBe('2028-02-29');
  });
});

describe('isRepetitionTransaction', () => {
  it('detecta parcelamento e sufixo de repetição', () => {
    expect(isRepetitionTransaction({ installments: 12 })).toBe(true);
    expect(isRepetitionTransaction({ description: 'Aluguel (3/12)' })).toBe(true);
    expect(isRepetitionTransaction({ originalTransactionId: 'abc' })).toBe(true);
  });

  it('não confunde uma despesa fixa com repetição', () => {
    expect(isRepetitionTransaction({ description: 'Aluguel', installments: 1 })).toBe(false);
    expect(isRepetitionTransaction({ description: 'Aluguel', installments: null })).toBe(false);
  });
});
