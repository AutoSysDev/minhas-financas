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

/** Verifica se a transação foi gerada pelo recurso de Repetição (não pode virar despesa fixa). */
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
