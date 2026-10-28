import { TransactionType } from '../types';
import type { FixedLeg } from '../types';

export type { FixedLeg };

const pad = (value: number) => String(value).padStart(2, '0');

/** Converte "YYYY-MM-DD" para o primeiro dia do mês de referência. */
export const monthKeyFromDate = (date: string): string => `${date.slice(0, 7)}-01`;

/** Monta o primeiro dia do mês a partir de ano e índice de mês (0-11). */
export const monthKeyFromParts = (year: number, monthIndex: number): string =>
  `${year}-${pad(monthIndex + 1)}-01`;

/** Quantidade de dias do mês. */
export const daysInMonth = (year: number, monthIndex: number): number =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

/** Último dia do mês no formato YYYY-MM-DD. */
export const lastDayOfMonth = (year: number, monthIndex: number): string =>
  `${year}-${pad(monthIndex + 1)}-${pad(daysInMonth(year, monthIndex))}`;

/**
 * Data da ocorrência no mês, limitada ao último dia disponível.
 * Ex.: dia 31 em fevereiro vira 28 (ou 29 em ano bissexto).
 */
export const occurrenceDate = (year: number, monthIndex: number, dayOfMonth: number): string =>
  `${year}-${pad(monthIndex + 1)}-${pad(Math.min(Math.max(1, dayOfMonth), daysInMonth(year, monthIndex)))}`;

/** Último dia do mês anterior ao mês de referência (YYYY-MM-01). */
export const previousMonthEnd = (month: string): string => {
  const [year, monthNumber] = month.split('-').map(Number);
  const previous = new Date(Date.UTC(year, monthNumber - 1, 0));
  return `${previous.getUTCFullYear()}-${pad(previous.getUTCMonth() + 1)}-${pad(previous.getUTCDate())}`;
};

/** Verifica se a transação foi gerada pelo recurso de Repetição (não pode virar série fixa). */
export const isRepetitionTransaction = (transaction: {
  description?: string | null;
  installments?: number | null;
  originalTransactionId?: string | null;
  original_transaction_id?: string | null;
}): boolean => {
  if ((transaction.installments || 0) > 1) return true;
  if (transaction.originalTransactionId || transaction.original_transaction_id) return true;
  return /\(\d+\/\d+\)\s*$/.test(transaction.description || '');
};

/** Rótulo humano da série, conforme o tipo da transação. */
export const fixedTransactionLabel = (type: TransactionType): string => {
  if (type === TransactionType.INCOME) return 'Receita fixa';
  if (type === TransactionType.TRANSFER) return 'Transferência fixa';
  return 'Despesa fixa';
};

/** Remove o prefixo de perna para guardar a descrição base no modelo. */
export const stripTransferPrefix = (description: string): string =>
  description.replace(/^Transferência (enviada|recebida):\s*/, '');

/** Modelo mensal de uma transação fixa, como fica no banco. */
export interface FixedTemplate {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category?: string | null;
  account_id?: string | null;
  card_id?: string | null;
  destination_account_id?: string | null;
  day_of_month: number;
  start_date: string;
  end_date?: string | null;
  is_paid_default?: boolean | null;
}

/** Uma perna da ocorrência mensal (transferência tem duas). */
export interface FixedOccurrenceRow {
  user_id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  category: string | null;
  card_id: string | null;
  account_id: string | null;
  is_paid: boolean;
  installments: null;
  installment_number: null;
  fixed_transaction_id: string;
  fixed_month: string;
  fixed_leg: FixedLeg;
}

/**
 * Monta as linhas da ocorrência mensal de um modelo fixo.
 * Receita/despesa geram uma linha; transferência gera saída e entrada.
 */
export const buildOccurrenceRows = (
  userId: string,
  template: FixedTemplate,
  year: number,
  monthIndex: number
): FixedOccurrenceRow[] => {
  const month = monthKeyFromParts(year, monthIndex);
  const monthEnd = lastDayOfMonth(year, monthIndex);

  if (template.start_date > monthEnd) return [];
  if (template.end_date && template.end_date < month) return [];

  const date = occurrenceDate(year, monthIndex, template.day_of_month);
  if (date < template.start_date) return [];
  if (template.end_date && date > template.end_date) return [];

  const base = {
    user_id: userId,
    amount: template.amount,
    date,
    category: template.category ?? null,
    installments: null,
    installment_number: null,
    fixed_transaction_id: template.id,
    fixed_month: month,
  };

  if (template.type === TransactionType.TRANSFER) {
    if (!template.destination_account_id) return [];

    return [
      {
        ...base,
        description: `Transferência enviada: ${template.description}`,
        type: TransactionType.EXPENSE,
        category: 'Transferência',
        card_id: null,
        account_id: template.account_id ?? null,
        is_paid: true,
        fixed_leg: 'out',
      },
      {
        ...base,
        description: `Transferência recebida: ${template.description}`,
        type: TransactionType.INCOME,
        category: 'Transferência',
        card_id: null,
        account_id: template.destination_account_id,
        is_paid: true,
        fixed_leg: 'in',
      },
    ];
  }

  return [
    {
      ...base,
      description: template.description,
      type: template.type,
      card_id: template.card_id ?? null,
      account_id: template.account_id ?? null,
      is_paid: Boolean(template.is_paid_default),
      fixed_leg: 'single',
    },
  ];
};

