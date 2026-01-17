import React, { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { ExpensePieChart, SavingsBarChart, IncomeExpenseChart } from '../components/Charts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, getMonthlyPatrimony, getTransactionDate, getMonthlyIncome, getMonthlyExpenses, getTotalNetForMonth } from '../utils/helpers';
import { TransactionType } from '../types';
import { MonthNavigation } from '../components/MonthNavigation';
import { Dropdown } from '../components/Dropdown';
import { useTheme } from '../context/ThemeContext';

const Statistics: React.FC = () => {
  const { transactions, accounts, investments, categories } = useFinance();
  const { theme } = useTheme();

  const [currentDate, setCurrentDate] = useState(() => {
    const saved = localStorage.getItem('stat-selected-date');
    return saved ? new Date(saved) : new Date();
  });
  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();

  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [accountFilter, setAccountFilter] = useState<string>('Todos');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');

  const baseFiltered = useMemo(() => {
    return transactions.filter(t => {
      if (categoryFilter !== 'Todas' && t.category !== categoryFilter) return false;
      if (accountFilter !== 'Todos' && t.accountId !== accountFilter) return false;
      if (typeFilter !== 'all') {
        const isIncome = t.type === TransactionType.INCOME || t.type === 'INCOME';
        const isExpense = t.type === TransactionType.EXPENSE || t.type === 'EXPENSE';
        if (typeFilter === 'income' && !isIncome) return false;
        if (typeFilter === 'expense' && !isExpense) return false;
      }
      return true;
    });
  }, [transactions, categoryFilter, accountFilter, typeFilter]);

  const monthlyTransactions = baseFiltered.filter(t => {
    const tDate = getTransactionDate(t.date);
    return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
  });

  const hasMonthlyData = monthlyTransactions.length > 0;

  const periodLabel = `${currentDate.toLocaleDateString('pt-BR', { month: 'long' })} ${selectedYear}`;

  // Cálculos básicos para o resumo do topo
  const totalIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME || t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount) * (t.isPaid ? 1 : 0), 0);
  const totalExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE || t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount) * (t.isPaid ? 1 : 0), 0);
  const balance = totalIncome - totalExpense;
  const pendingIncome = monthlyTransactions
    .filter(t => (t.type === TransactionType.INCOME || t.type === 'INCOME') && !t.isPaid)
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const pendingExpense = monthlyTransactions
    .filter(t => (t.type === TransactionType.EXPENSE || t.type === 'EXPENSE') && !t.isPaid)
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // Dados para o Gráfico de Pizza (Despesas por Categoria)
  const categoryExpenses = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE && t.amount > 0)
    .reduce((acc, t) => {
      const category = t.category || 'Outros';
      acc[category] = (acc[category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryExpenses)
    .map(([name, value]) => ({ name, value: value as number, color: '#000000' }))
    .filter(item => (item.value as number) > 0)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 5);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  categoryData.forEach((item, index) => {
    item.color = COLORS[index % COLORS.length];
  });

  // Dados para Evolução Mensal e Economia
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() - (5 - i));
    return d;
  });

  const monthlyEvolutionData = last6Months.map(date => {
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    const income = baseFiltered
      .filter(t => {
        const td = getTransactionDate(t.date);
        return (t.type === TransactionType.INCOME || t.type === 'INCOME') && t.isPaid && td.getMonth() === date.getMonth() && td.getFullYear() === date.getFullYear();
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = baseFiltered
      .filter(t => {
        const td = getTransactionDate(t.date);
        return (t.type === TransactionType.EXPENSE || t.type === 'EXPENSE') && t.isPaid && td.getMonth() === date.getMonth() && td.getFullYear() === date.getFullYear();
      })
      .reduce((acc, t) => acc + Number(t.amount), 0);
    return {
      month: monthName,
      income,
      expense,
      savings: income - expense
    };
  });

  const savingsData = last6Months.map(date => ({
    month: date.toLocaleDateString('pt-BR', { month: 'short' }),
    savings: getMonthlyPatrimony(transactions, accounts, investments, date.getFullYear(), date.getMonth())
  }));

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Estatísticas</h1>
          <p className={`mt-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Visualização gráfica do seu comportamento financeiro.</p>
        </div>
        <MonthNavigation
          currentDate={currentDate}
          onMonthChange={(date) => {
            setCurrentDate(date);
            try { localStorage.setItem('stat-selected-date', date.toISOString()); } catch { }
          }}
          className="w-full md:w-auto min-w-[240px]"
        />
      </div>

      <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border transition-all ${theme === 'light'
        ? 'bg-white border-gray-200'
        : 'bg-white/[0.02] border-white/[0.05]'
        }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Categoria</label>
            <Dropdown
              options={[{ label: 'Todas', value: 'Todas' }, ...categories.map(c => ({ label: c.name, value: c.name }))]}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              className="w-full"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Conta</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'Todos' }, ...accounts.map(a => ({ label: a.name, value: a.id }))]}
              value={accountFilter}
              onChange={(v) => setAccountFilter(v)}
              className="w-full"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Tipo</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'all' }, { label: 'Receitas', value: 'income' }, { label: 'Despesas', value: 'expense' }]}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as any)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`backdrop-blur-md rounded-xl p-6 border shadow-sm flex items-center gap-4 transition-all ${theme === 'light'
          ? 'bg-white border-gray-200 hover:bg-gray-50'
          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
          }`}>
          <div className="size-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <Icon name="trending_up" className="text-2xl" />
          </div>
          <div>
            <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Total Entradas</p>
            <p className={`text-xl font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(totalIncome)}</PrivateValue></p>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="event" className="text-sm" />
              <span>{periodLabel}</span>
            </div>
          </div>
        </div>
        <div className={`backdrop-blur-md rounded-xl p-6 border shadow-sm flex items-center gap-4 transition-all ${theme === 'light'
          ? 'bg-white border-gray-200 hover:bg-gray-50'
          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
          }`}>
          <div className="size-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <Icon name="trending_down" className="text-2xl" />
          </div>
          <div>
            <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Total Saídas</p>
            <p className={`text-xl font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(totalExpense)}</PrivateValue></p>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="event" className="text-sm" />
              <span>{periodLabel}</span>
            </div>
          </div>
        </div>
        <div className={`backdrop-blur-md rounded-xl p-6 border shadow-sm flex items-center gap-4 transition-all ${theme === 'light'
          ? 'bg-white border-gray-200 hover:bg-gray-50'
          : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
          }`}>
          <div className="size-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <Icon name="savings" className="text-2xl" />
          </div>
          <div>
            <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Saldo Líquido</p>
            <p className={`text-xl font-bold transition-colors ${balance >= 0 ? (theme === 'light' ? 'text-green-600' : 'text-green-400') : (theme === 'light' ? 'text-red-600' : 'text-red-400')}`}><PrivateValue>{formatCurrency(balance)}</PrivateValue></p>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-blue-400 bg-blue-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="event" className="text-sm" />
              <span>{periodLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl p-6 border border-white/[0.05] shadow-sm">
          <p className="text-sm text-gray-400">Entradas Pendentes</p>
          <p className="text-xl font-bold text-green-400"><PrivateValue>{formatCurrency(pendingIncome)}</PrivateValue></p>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl p-6 border border-white/[0.05] shadow-sm">
          <p className="text-sm text-gray-400">Saídas Pendentes</p>
          <p className="text-xl font-bold text-red-400"><PrivateValue>{formatCurrency(pendingExpense)}</PrivateValue></p>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl p-6 border border-white/[0.05] shadow-sm">
          <p className="text-sm text-gray-400">Transações no mês</p>
          <p className="text-xl font-bold text-white">{monthlyTransactions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border transition-all ${theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-white/[0.02] border-white/[0.05]'
          }`}>
          <h3 className={`text-lg font-bold mb-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Distribuição de Gastos</h3>
          <div className="min-h-[350px]">
            <PrivateValue>
              <ExpensePieChart data={categoryData} />
            </PrivateValue>
          </div>
          {!hasMonthlyData && (
            <div className={`text-center mt-4 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Nenhuma transação para este mês.</div>
          )}
        </div>
        <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border transition-all ${theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-white/[0.02] border-white/[0.05]'
          }`}>
          <h3 className={`text-lg font-bold mb-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Crescimento Patrimonial</h3>
          <PrivateValue>
            <SavingsBarChart data={savingsData} />
          </PrivateValue>
        </div>
      </div>

      <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border transition-all ${theme === 'light'
        ? 'bg-white border-gray-200'
        : 'bg-white/[0.02] border-white/[0.05]'
        }`}>
        <h3 className={`text-lg font-bold mb-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Top Categorias de Gastos</h3>
        <div className="space-y-2">
          {categoryData.length === 0 && <div className={theme === 'light' ? 'text-slate-500' : 'text-gray-500'}>Sem dados para exibir</div>}
          {categoryData.map((c, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${theme === 'light'
              ? 'bg-slate-50 border-slate-200'
              : 'bg-white/[0.02] border-white/[0.05]'
              }`}>
              <div className="flex items-center gap-3">
                <div className="size-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>{c.name}</span>
              </div>
              <span className={`text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(c.value)}</PrivateValue></span>
            </div>
          ))}
        </div>
      </div>

      <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border transition-all ${theme === 'light'
        ? 'bg-white border-gray-200'
        : 'bg-white/[0.02] border-white/[0.05]'
        }`}>
        <h3 className={`text-lg font-bold mb-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Fluxo de Caixa Anual</h3>
        <div className="h-80">
          <PrivateValue>
            <IncomeExpenseChart data={monthlyEvolutionData} />
          </PrivateValue>
        </div>
        {!hasMonthlyData && (
          <div className={`text-center mt-4 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Nenhuma transação para este mês.</div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
