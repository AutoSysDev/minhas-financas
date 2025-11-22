import React from 'react';
import { Icon } from '../components/Icon';
import { ExpensePieChart, IncomeExpenseChart, SavingsBarChart } from '../components/Charts';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';

const Reports: React.FC = () => {
  const { transactions } = useFinance();

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
    <div className="flex flex-col gap-8 animate-fade-in">
      <div>
        <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Relatórios Detalhados</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Análise profunda da sua saúde financeira.</p>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
        <h3 className="text-lg font-bold text-white mb-4">Fluxo de Caixa (Semestral)</h3>
        <div className="h-80">
          <IncomeExpenseChart data={monthlyEvolutionData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
          <h3 className="text-lg font-bold text-white mb-4">Distribuição de Despesas</h3>
          <ExpensePieChart data={categoryData} />
        </div>
        <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-6 border border-white/[0.05]">
          <h3 className="text-lg font-bold text-white mb-4">Crescimento Patrimonial</h3>
          <SavingsBarChart data={savingsData} />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => alert("Gerando PDF...")}
          className="flex items-center gap-2 px-6 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
        >
          <Icon name="download" />
          Exportar Relatório PDF
        </button>
      </div>
    </div>
  );
};

export default Reports;
