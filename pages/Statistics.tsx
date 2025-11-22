import React from 'react';
import { Icon } from '../components/Icon';
import { ExpensePieChart, SavingsBarChart, IncomeExpenseChart } from '../components/Charts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { TransactionType } from '../types';

const Statistics: React.FC = () => {
  const { transactions } = useFinance();

  // Cálculos básicos para o resumo do topo
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Dados para o Gráfico de Pizza (Despesas por Categoria)
  const categoryExpenses = transactions
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

    const income = transactions
      .filter(t => (t.type === TransactionType.INCOME || t.type === 'INCOME') && t.date.startsWith(monthStr))
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const expense = transactions
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

  return (
    <div className="flex flex-col gap-8 animate-fade-in pb-20 md:pb-0">
      <div>
        <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Estatísticas</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Visualização gráfica do seu comportamento financeiro.</p>
      </div>

      {/* Resumo Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl p-6 border border-white/[0.05] shadow-sm flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
          <div className="size-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <Icon name="trending_up" className="text-2xl" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Entradas</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl p-6 border border-white/[0.05] shadow-sm flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
          <div className="size-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.3)]">
            <Icon name="trending_down" className="text-2xl" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Total Saídas</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl p-6 border border-white/[0.05] shadow-sm flex items-center gap-4 hover:bg-white/[0.04] transition-colors">
          <div className="size-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            <Icon name="savings" className="text-2xl" />
          </div>
          <div>
            <p className="text-sm text-gray-400">Saldo Líquido</p>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(balance)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
          <h3 className="text-lg font-bold text-white mb-4">Distribuição de Gastos</h3>
          <ExpensePieChart data={categoryData} />
        </div>
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
          <h3 className="text-lg font-bold text-white mb-4">Economia Mensal</h3>
          <SavingsBarChart data={savingsData} />
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
        <h3 className="text-lg font-bold text-white mb-4">Fluxo de Caixa Anual</h3>
        <div className="h-80">
          <IncomeExpenseChart data={monthlyEvolutionData} />
        </div>
      </div>
    </div>
  );
};

export default Statistics;
