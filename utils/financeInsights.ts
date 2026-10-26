import { TransactionType } from '../types';
import { getTransactionDate } from './helpers';

export interface CategorySlice {
  name: string;
  value: number;
  color: string;
}

const FALLBACK_COLORS = ['#14b8a6', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#06b6d4', '#ec4899'];

export function buildCategoryData(
  transactions: any[],
  categories: { name: string; color: string }[] = [],
  opts: { type?: string; top?: number } = {}
): CategorySlice[] {
  const { type = TransactionType.EXPENSE, top = 5 } = opts;
  const totals: Record<string, number> = {};
  transactions
    .filter(t => t.type === type && Number(t.amount) > 0)
    .forEach(t => {
      const key = t.category || 'Outros';
      totals[key] = (totals[key] || 0) + Number(t.amount);
    });

  const sorted = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const head = sorted.slice(0, Math.max(top - 1, 1));
  const tail = sorted.slice(Math.max(top - 1, 1));
  if (tail.length > 0) {
    head.push({ name: 'Outros', value: tail.reduce((s, x) => s + x.value, 0) });
  }

  return head
    .filter(x => x.value > 0)
    .map((x, i) => {
      if (x.name === 'Outros') return { ...x, color: '#6b7280' };
      const found = categories.find(c => c.name === x.name) as any;
      return { ...x, color: found?.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length] };
    });
}

export function buildMonthlyEvolution(transactions: any[], endDate: Date, months = 6) {
  const list: Date[] = Array.from({ length: months }).map((_, i) => {
    const d = new Date(endDate);
    d.setMonth(endDate.getMonth() - (months - 1 - i));
    return d;
  });

  return list.map(date => {
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      const td = getTransactionDate(t.date);
      if (td.getMonth() !== date.getMonth() || td.getFullYear() !== date.getFullYear()) return;
      if (t.type === TransactionType.INCOME || (t as any).type === 'INCOME') income += Number(t.amount);
      if (t.type === TransactionType.EXPENSE || (t as any).type === 'EXPENSE') expense += Number(t.amount);
    });
    return {
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1).replace('.', ''),
      income,
      expense,
      savings: income - expense,
    };
  });
}

export function monthOverMonth(current: number, previous: number): { diff: number; pct: number | null } {
  const diff = current - previous;
  if (!previous) return { diff, pct: null };
  return { diff, pct: (diff / Math.abs(previous)) * 100 };
}

export function insightForCategory(data: CategorySlice[], total: number): string {
  if (!data.length || !total) return 'Sem movimento no período. Que tal lançar a primeira transação do mês?';
  const top = data[0];
  const pct = ((top.value / total) * 100).toFixed(0);
  return `${top.name} lidera com ${pct}% dos gastos. Toque em uma categoria para ver as compras.`;
}
