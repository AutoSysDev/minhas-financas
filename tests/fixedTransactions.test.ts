import { describe, it, expect } from 'vitest';
import { TransactionType } from '../types';
import {
  monthKeyFromDate,
  monthKeyFromParts,
  daysInMonth,
  lastDayOfMonth,
  occurrenceDate,
  previousMonthEnd,
  isRepetitionTransaction,
  buildOccurrenceRows,
  fixedTransactionLabel,
  stripTransferPrefix,
  FixedTemplate,
} from '../utils/fixedTransactions';

const template = (overrides: Partial<FixedTemplate> = {}): FixedTemplate => ({
  id: 'fixed-1',
  description: 'Aluguel',
  amount: 1500,
  type: TransactionType.EXPENSE,
  category: 'Moradia',
  account_id: 'acc-1',
  card_id: null,
  destination_account_id: null,
  day_of_month: 5,
  start_date: '2026-01-05',
  end_date: null,
  is_paid_default: false,
  ...overrides,
});

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

describe('fixedTransactionLabel', () => {
  it('rotula a série pelo tipo da transação', () => {
    expect(fixedTransactionLabel(TransactionType.EXPENSE)).toBe('Despesa fixa');
    expect(fixedTransactionLabel(TransactionType.INCOME)).toBe('Receita fixa');
    expect(fixedTransactionLabel(TransactionType.TRANSFER)).toBe('Transferência fixa');
  });
});

describe('stripTransferPrefix', () => {
  it('remove o prefixo da perna para guardar a descrição base no modelo', () => {
    expect(stripTransferPrefix('Transferência enviada: Reserva')).toBe('Reserva');
    expect(stripTransferPrefix('Transferência recebida: Reserva')).toBe('Reserva');
    expect(stripTransferPrefix('Reserva')).toBe('Reserva');
  });
});

describe('buildOccurrenceRows', () => {
  it('monta a ocorrência de despesa fixa com o tipo do modelo', () => {
    const rows = buildOccurrenceRows('user-1', template(), 2026, 2);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      user_id: 'user-1',
      description: 'Aluguel',
      amount: 1500,
      date: '2026-03-05',
      type: TransactionType.EXPENSE,
      category: 'Moradia',
      account_id: 'acc-1',
      card_id: null,
      is_paid: false,
      fixed_transaction_id: 'fixed-1',
      fixed_month: '2026-03-01',
      fixed_leg: 'single',
    });
  });

  it('monta a ocorrência de receita fixa respeitando o status de pagamento padrão', () => {
    const rows = buildOccurrenceRows(
      'user-1',
      template({
        type: TransactionType.INCOME,
        description: 'Salário',
        category: 'Salário',
        is_paid_default: true,
      }),
      2026,
      2
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      type: TransactionType.INCOME,
      description: 'Salário',
      is_paid: true,
      fixed_leg: 'single',
    });
  });

  it('monta as duas pernas de uma transferência fixa', () => {
    const rows = buildOccurrenceRows(
      'user-1',
      template({
        type: TransactionType.TRANSFER,
        description: 'Reserva',
        category: null,
        account_id: 'acc-origem',
        destination_account_id: 'acc-destino',
      }),
      2026,
      2
    );

    expect(rows).toHaveLength(2);

    const [out, incoming] = rows;
    expect(out).toMatchObject({
      type: TransactionType.EXPENSE,
      description: 'Transferência enviada: Reserva',
      category: 'Transferência',
      account_id: 'acc-origem',
      is_paid: true,
      fixed_leg: 'out',
      fixed_transaction_id: 'fixed-1',
      fixed_month: '2026-03-01',
    });
    expect(incoming).toMatchObject({
      type: TransactionType.INCOME,
      description: 'Transferência recebida: Reserva',
      category: 'Transferência',
      account_id: 'acc-destino',
      is_paid: true,
      fixed_leg: 'in',
      fixed_transaction_id: 'fixed-1',
      fixed_month: '2026-03-01',
    });
  });

  it('não gera ocorrência fora da vigência do modelo', () => {
    expect(buildOccurrenceRows('user-1', template({ start_date: '2026-04-01' }), 2026, 2)).toHaveLength(0);
    expect(buildOccurrenceRows('user-1', template({ end_date: '2026-02-28' }), 2026, 2)).toHaveLength(0);
  });

  it('não gera pernas de transferência sem conta de destino', () => {
    const rows = buildOccurrenceRows(
      'user-1',
      template({ type: TransactionType.TRANSFER, destination_account_id: null }),
      2026,
      2
    );

    expect(rows).toHaveLength(0);
  });
});
