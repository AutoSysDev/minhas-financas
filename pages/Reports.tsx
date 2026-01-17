import React, { useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { ExpensePieChart, IncomeExpenseChart, SavingsBarChart } from '../components/Charts';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, getTransactionDate } from '../utils/helpers';
import { Dropdown } from '../components/Dropdown';

const Reports: React.FC = () => {
  const { transactions, accounts, categories } = useFinance();
  const { toast } = useToast();
  const { isPremium } = useAuth();
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todas');
  const [accountFilter, setAccountFilter] = useState<string>('Todos');
  const [paidFilter, setPaidFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const dateOk = (() => {
        if (!dateRange.start && !dateRange.end) return true;
        const d = getTransactionDate(t.date);
        const start = dateRange.start ? getTransactionDate(dateRange.start) : null;
        const end = dateRange.end ? getTransactionDate(dateRange.end) : null;
        if (start && d < start) return false;
        if (end && d > end) return false;
        return true;
      })();
      if (!dateOk) return false;
      if (typeFilter !== 'all') {
        const isIncome = t.type === TransactionType.INCOME || t.type === 'INCOME';
        const isExpense = t.type === TransactionType.EXPENSE || t.type === 'EXPENSE';
        if (typeFilter === 'income' && !isIncome) return false;
        if (typeFilter === 'expense' && !isExpense) return false;
      }
      if (paidFilter !== 'all') {
        const isPaid = Boolean(t.isPaid);
        if (paidFilter === 'paid' && !isPaid) return false;
        if (paidFilter === 'pending' && isPaid) return false;
      }
      if (categoryFilter !== 'Todas' && t.category !== categoryFilter) return false;
      if (accountFilter !== 'Todos' && t.accountId !== accountFilter) return false;
      return true;
    });
  }, [transactions, typeFilter, categoryFilter, accountFilter, paidFilter, dateRange]);

  // Dados para o Gráfico de Pizza (Despesas por Categoria)
  const categoryExpenses = filteredTransactions
    .filter(t => (t.type === TransactionType.EXPENSE || t.type === 'EXPENSE') && t.amount > 0)
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
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });

  const monthlyEvolutionData = last6Months.map(date => {
    const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });

    const income = filteredTransactions
      .filter(t => (t.type === TransactionType.INCOME || t.type === 'INCOME') && t.date.startsWith(monthStr))
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const expense = filteredTransactions
      .filter(t => (t.type === TransactionType.EXPENSE || t.type === 'EXPENSE') && t.date.startsWith(monthStr))
      .reduce((acc, t) => acc + Number(t.amount), 0);

    return {
      month: monthName,
      income,
      expense,
      savings: income - expense
    };
  });

  const savingsData = monthlyEvolutionData.map(d => ({
    month: d.month,
    savings: d.savings
  }));

  const totalIncome = filteredTransactions
    .filter(t => t.type === TransactionType.INCOME || t.type === 'INCOME')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE || t.type === 'EXPENSE')
    .reduce((acc, t) => acc + Number(t.amount), 0);
  const paidCount = filteredTransactions.filter(t => t.isPaid).length;
  const pendingCount = filteredTransactions.filter(t => !t.isPaid).length;

  const exportCsv = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Conta'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.date,
        '"' + String(t.description || '').replace(/"/g, '""') + '"',
        t.category || '',
        t.type,
        Number(t.amount).toFixed(2),
        t.isPaid ? 'Pago' : 'Pendente',
        t.accountId || ''
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exportado');
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div>
        <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Relatórios Detalhados</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Análise profunda da sua saúde financeira.</p>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Tipo</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'all' }, { label: 'Receitas', value: 'income' }, { label: 'Despesas', value: 'expense' }]}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as any)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Categoria</label>
            <Dropdown
              options={[{ label: 'Todas', value: 'Todas' }, ...categories.map(c => ({ label: c.name, value: c.name }))]}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Conta</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'Todos' }, ...accounts.map(a => ({ label: a.name, value: a.id }))]}
              value={accountFilter}
              onChange={(v) => setAccountFilter(v)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Status</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'all' }, { label: 'Pagos', value: 'paid' }, { label: 'Pendentes', value: 'pending' }]}
              value={paidFilter}
              onChange={(v) => setPaidFilter(v as any)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">De</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2">Até</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.1] rounded-lg text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-xs text-gray-400">Receitas</p>
            <p className="text-lg font-bold text-white"><PrivateValue>{formatCurrency(totalIncome)}</PrivateValue></p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-xs text-gray-400">Despesas</p>
            <p className="text-lg font-bold text-white"><PrivateValue>{formatCurrency(totalExpense)}</PrivateValue></p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-xs text-gray-400">Pagas</p>
            <p className="text-lg font-bold text-white">{paidCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <p className="text-xs text-gray-400">Pendentes</p>
            <p className="text-lg font-bold text-white">{pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
        <h3 className="text-lg font-bold text-white mb-4">Fluxo de Caixa (Semestral)</h3>
        <div className="h-80">
          <PrivateValue>
            <IncomeExpenseChart data={monthlyEvolutionData} />
          </PrivateValue>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
          <h3 className="text-lg font-bold text-white mb-4">Distribuição de Despesas</h3>
          <PrivateValue>
            <ExpensePieChart data={categoryData} />
          </PrivateValue>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
          <h3 className="text-lg font-bold text-white mb-4">Crescimento Patrimonial</h3>
          <PrivateValue>
            <SavingsBarChart data={savingsData} />
          </PrivateValue>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={() => { if (!isPremium) { toast.warning('Disponível no plano Premium'); return; } exportCsv(); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${isPremium ? 'bg-teal-500 text-white hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]' : 'bg-white/[0.05] text-gray-300'}`}
        >
          <Icon name="description" />
          Exportar CSV
        </button>
        <button
          onClick={() => { if (!isPremium) { toast.warning('Disponível no plano Premium'); return; } printReport(); }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${isPremium ? 'bg-white/[0.05] text-gray-200 hover:bg-white/[0.1]' : 'bg-white/[0.03] text-gray-400'}`}
        >
          <Icon name="print" />
          Imprimir
        </button>
      </div>
    </div>
  );
};

export default Reports;
