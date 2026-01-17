
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const formatDate = (dateString: string): string => {
  // Assume YYYY-MM-DD input or keep as is if already formatted
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
  }
  return dateString;
};

export const getTransactionDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();

  // Formato ISO (YYYY-MM-DD)
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Fallback para formato Mock (ex: "25 Nov") assumindo ano atual
  const parts = dateStr.split(' ');
  if (parts.length === 2) {
    const day = parseInt(parts[0]);
    const monthStr = parts[1];
    const months: { [key: string]: number } = { 'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11 };
    const month = months[monthStr] !== undefined ? months[monthStr] : 0;
    const year = new Date().getFullYear();
    return new Date(year, month, day);
  }

  return new Date();
};

/**
 * Get the cumulative balance of an account up to the end of a specific month.
 * Sums all income and subtracts all expenses from the beginning of time until the end of the month.
 */
export const getAccountCumulativeBalance = (
  transactions: any[],
  accountId: string,
  year: number,
  month: number // 0-indexed (0 = Jan, 11 = Dec)
): number => {
  // Define the end of the target month
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  return transactions.reduce((acc, t) => {
    // Filter by account
    if (t.accountId !== accountId) return acc;

    // Filter by paid status
    if (!t.isPaid) return acc;

    // Filter by date (up to end of selected month)
    const d = getTransactionDate(t.date);
    if (d > endOfMonth) return acc;

    // Sum Income, Subtract Expense
    if (t.type === 'INCOME') {
      return acc + Number(t.amount);
    } else if (t.type === 'EXPENSE') {
      return acc - Number(t.amount);
    }

    return acc;
  }, 0);
};

/**
 * Get total cumulative balance across all accounts up to the end of a specific month.
 */
export const getTotalCumulativeBalance = (
  transactions: any[],
  accounts: any[],
  year: number,
  month: number
): number => {
  return accounts.reduce((total, account) => {
    return total + getAccountCumulativeBalance(transactions, account.id, year, month);
  }, 0);
};

export const getAccountMonthNet = (
  transactions: any[],
  accountId: string,
  year: number,
  month: number
): number => {
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
  return transactions.reduce((acc, t) => {
    if (t.accountId !== accountId) return acc;
    if (!t.isPaid) return acc;
    const d = getTransactionDate(t.date);
    if (d.getFullYear() !== year || d.getMonth() !== month) return acc;
    if (t.type === 'INCOME') return acc + Number(t.amount);
    if (t.type === 'EXPENSE') return acc - Number(t.amount);
    return acc;
  }, 0);
};

export const getTotalNetForMonth = (
  transactions: any[],
  accounts: any[],
  year: number,
  month: number
): number => {
  return accounts.reduce((total, account) => total + getAccountMonthNet(transactions, account.id, year, month), 0);
};

/**
 * Get monthly income (paid transactions only)
 */
export const getMonthlyIncome = (
  transactions: any[],
  year: number,
  month: number
): number => {
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  return transactions.reduce((acc, t) => {
    if (t.type !== 'INCOME') return acc;
    if (!t.isPaid) return acc;

    const tDate = getTransactionDate(t.date);
    if (tDate > endOfMonth) return acc;
    if (tDate.getMonth() !== month || tDate.getFullYear() !== year) return acc;

    return acc + Number(t.amount);
  }, 0);
};

/**
 * Get monthly expenses (paid transactions only)
 */
export const getMonthlyExpenses = (
  transactions: any[],
  year: number,
  month: number
): number => {
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  return transactions.reduce((acc, t) => {
    if (t.type !== 'EXPENSE') return acc;
    if (!t.isPaid) return acc;

    const tDate = getTransactionDate(t.date);
    if (tDate > endOfMonth) return acc;
    if (tDate.getMonth() !== month || tDate.getFullYear() !== year) return acc;

    return acc + Number(t.amount);
  }, 0);
};

/**
 * Get pending income for the month (unpaid transactions)
 */
export const getMonthlyPendingIncome = (
  transactions: any[],
  year: number,
  month: number
): number => {
  return transactions.reduce((acc, t) => {
    if (t.type !== 'INCOME') return acc;
    if (t.isPaid) return acc; // Only unpaid

    const tDate = getTransactionDate(t.date);
    if (tDate.getMonth() !== month || tDate.getFullYear() !== year) return acc;

    return acc + Number(t.amount);
  }, 0);
};

/**
 * Get pending expenses for the month (unpaid transactions)
 */
export const getMonthlyPendingExpenses = (
  transactions: any[],
  year: number,
  month: number
): number => {
  return transactions.reduce((acc, t) => {
    if (t.type !== 'EXPENSE') return acc;
    if (t.isPaid) return acc; // Only unpaid

    const tDate = getTransactionDate(t.date);
    if (tDate.getMonth() !== month || tDate.getFullYear() !== year) return acc;

    return acc + Number(t.amount);
  }, 0);
};

/**
 * Get predicted balance for the month
 * Current monthly balance + pending income - pending expenses
 */
export const getMonthlyPredictedBalance = (
  transactions: any[],
  accounts: any[],
  year: number,
  month: number
): number => {
  const currentBalance = getTotalCumulativeBalance(transactions, accounts, year, month);
  const pendingIncome = getMonthlyPendingIncome(transactions, year, month);
  const pendingExpenses = getMonthlyPendingExpenses(transactions, year, month);

  return currentBalance + pendingIncome - pendingExpenses;
};

export const getMonthlyPredictedBalanceStrict = (
  transactions: any[],
  accounts: any[],
  year: number,
  month: number
): number => {
  const paidNet = getTotalNetForMonth(transactions, accounts, year, month);
  const pendingIncome = getMonthlyPendingIncome(transactions, year, month);
  const pendingExpenses = getMonthlyPendingExpenses(transactions, year, month);
  return paidNet + pendingIncome - pendingExpenses;
};

export const getInvestmentsTotalUntil = (
  investments: any[],
  year: number,
  month: number
): number => {
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
  return investments.reduce((acc, inv) => {
    const d = new Date(inv.date);
    if (d <= endOfMonth) return acc + Number(inv.amount);
    return acc;
  }, 0);
};

export const getMonthlyPatrimony = (
  transactions: any[],
  accounts: any[],
  investments: any[],
  year: number,
  month: number
): number => {
  const accountsBalance = getTotalCumulativeBalance(transactions, accounts, year, month);
  const invTotal = getInvestmentsTotalUntil(investments, year, month);
  return accountsBalance + invTotal;
};

export const getMonthlyForecastNet = (
  transactions: any[],
  year: number,
  month: number
): number => {
  const income = getMonthlyIncome(transactions, year, month);
  const expense = getMonthlyExpenses(transactions, year, month);
  const pendingIncome = getMonthlyPendingIncome(transactions, year, month);
  const pendingExpenses = getMonthlyPendingExpenses(transactions, year, month);
  return income + pendingIncome - (expense + pendingExpenses);
};

export const getMonthsRange = (
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): { year: number; month: number }[] => {
  const result: { year: number; month: number }[] = [];
  let y = startYear;
  let m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    result.push({ year: y, month: m });
    m += 1;
    if (m > 11) {
      m = 0;
      y += 1;
    }
  }
  return result;
};

export const calculateCarryOverChain = (
  transactions: any[],
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): {
  months: {
    year: number;
    month: number;
    carryIn: number;
    net: number;
    final: number;
    carryOut: number;
  }[];
  transfers: { from: string; to: string; amount: number }[];
} => {
  const months = getMonthsRange(startYear, startMonth, endYear, endMonth);
  const resultMonths: {
    year: number;
    month: number;
    carryIn: number;
    net: number;
    final: number;
    carryOut: number;
  }[] = [];
  const transfers: { from: string; to: string; amount: number }[] = [];

  let carry = 0;
  for (let i = 0; i < months.length; i++) {
    const { year, month } = months[i];
    const net = getMonthlyForecastNet(transactions, year, month);
    const carryIn = carry > 0 ? carry : 0;
    const final = carryIn + net;
    const carryOut = final > 0 ? final : 0;
    resultMonths.push({ year, month, carryIn, net, final, carryOut });
    if (carryOut > 0 && i < months.length - 1) {
      const next = months[i + 1];
      transfers.push({
        from: `${String(month + 1).padStart(2, '0')}/${year}`,
        to: `${String(next.month + 1).padStart(2, '0')}/${next.year}`,
        amount: carryOut
      });
    }
    carry = carryOut;
  }

  return { months: resultMonths, transfers };
};

export const getMonthlyForecastWithCarry = (
  transactions: any[],
  year: number,
  month: number,
  lookbackMonths: number = 12
): {
  summary: { carryIn: number; net: number; final: number; carryOut: number };
  transfers: { from: string; to: string; amount: number }[];
} => {
  const endYear = year;
  const endMonth = month;
  const startDate = new Date(year, month, 1);
  startDate.setMonth(startDate.getMonth() - Math.max(lookbackMonths - 1, 0));
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const { months, transfers } = calculateCarryOverChain(
    transactions,
    startYear,
    startMonth,
    endYear,
    endMonth
  );
  const current = months[months.length - 1];
  return {
    summary: { carryIn: current.carryIn, net: current.net, final: current.final, carryOut: current.carryOut },
    transfers
  };
};

export const logError = (
  context: string,
  error: any,
  info?: any,
  extra?: any
): void => {
  try {
    const payload = {
      context,
      name: error?.name,
      message: error?.message ?? String(error),
      stack: error?.stack,
      info,
      extra,
      timestamp: new Date().toISOString()
    };
    // Registro detalhado para análise futura
    console.error('[MonelyError]', payload);
  } catch (e) {
    console.error('[MonelyError] Failed to serialize error', e);
  }
};
