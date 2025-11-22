import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { Budget, Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatDate } from '../utils/helpers';

const Budgets: React.FC = () => {
  const { budgets, transactions, addBudget } = useFinance();
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isNewBudgetModalOpen, setIsNewBudgetModalOpen] = useState(false);

  // Calculate spent for each budget based on category
  const budgetsWithData = budgets.map(budget => {
    const spent = transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.category === budget.category)
      .reduce((acc, t) => acc + t.amount, 0);
    return { ...budget, spent };
  });

  const totalBudget = budgetsWithData.reduce((acc, curr) => acc + curr.limit, 0);
  const totalSpent = budgetsWithData.reduce((acc, curr) => acc + curr.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const totalPercentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0 relative">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">Orçamentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Planejamento mensal de gastos.</p>
        </div>
        <button
          onClick={() => setIsNewBudgetModalOpen(true)}
          className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-teal-500 text-white text-sm font-medium leading-normal gap-2 hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
        >
          <Icon name="add" />
          <span className="truncate hidden md:inline">Novo Orçamento</span>
          <span className="md:hidden">Novo</span>
        </button>
      </div>

      {/* Resumo Unificado */}
      <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05] overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Orçado</p>
            <p className="text-sm md:text-lg font-bold text-white truncate w-full">
              {formatCurrency(totalBudget)}
            </p>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gasto</p>
            <p className="text-sm md:text-lg font-bold text-white truncate w-full">
              {formatCurrency(totalSpent)}
            </p>
          </div>
          <div className="p-4 flex flex-col items-center justify-center text-center bg-white/[0.02]">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Restante</p>
            <p className={`text-sm md:text-lg font-bold truncate w-full ${totalRemaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(totalRemaining)}
            </p>
          </div>
        </div>
        <div className="relative h-1.5 w-full bg-white/[0.05]">
          <div className="absolute h-full bg-teal-500 transition-all duration-500 rounded-r-full shadow-[0_0_10px_rgba(45,212,191,0.5)]" style={{ width: `${totalPercentage}%` }}></div>
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div className="grid grid-cols-1 gap-4">
        {budgetsWithData.map(budget => {
          const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
          const isOverBudget = percentage > 100;
          const isWarning = percentage > 85 && !isOverBudget;
          const remaining = budget.limit - budget.spent;
          let progressColor = '#22c55e'; // Green-500
          if (isOverBudget) progressColor = '#ef4444'; // Red-500
          else if (isWarning) progressColor = '#eab308'; // Yellow-500
          const remainingTextClass = remaining < 0 ? 'text-red-400' : 'text-white';

          return (
            <div
              key={budget.id}
              onClick={() => setSelectedBudget(budget)}
              className="bg-white/[0.02] backdrop-blur-md rounded-2xl shadow-sm border border-white/[0.05] p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.04] hover:border-teal-500/30 transition-all active:scale-[0.99] group"
            >
              <div
                className="size-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-sm text-2xl"
                style={{ backgroundColor: budget.color }}
              >
                <Icon name="category" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-base text-white truncate group-hover:text-teal-400 transition-colors">{budget.category}</h3>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${remainingTextClass}`}>
                      {remaining < 0 ? '-' : ''} {formatCurrency(Math.abs(remaining))}
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal ml-1 uppercase">restante</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                    style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: progressColor }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{formatCurrency(budget.spent)} de {formatCurrency(budget.limit)}</span>
                  <span className={isOverBudget ? 'text-red-400 font-bold' : ''}>{percentage.toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isNewBudgetModalOpen && (
        <NewBudgetModal onClose={() => setIsNewBudgetModalOpen(false)} onSave={addBudget} />
      )}

      {selectedBudget && (
        <BudgetActionModal budget={selectedBudget} onClose={() => setSelectedBudget(null)} allTransactions={transactions} />
      )}
    </div>
  );
};

const NewBudgetModal: React.FC<{ onClose: () => void; onSave: (b: any) => void }> = ({ onClose, onSave }) => {
  const [category, setCategory] = useState('Alimentação');
  const [limit, setLimit] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [color, setColor] = useState('#137fec');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      category,
      limit: parseFloat(limit),
      period,
      color
    });
    onClose();
  };

  const categories = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Vestuário', 'Assinaturas'];
  const colors = ['#137fec', '#16a34a', '#facc15', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <Modal isOpen={true} onClose={onClose} title="Novo Orçamento">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Categoria</label>
          <div className="relative">
            <Dropdown
              options={categories.map(cat => ({ label: cat, value: cat }))}
              value={category}
              onChange={setCategory}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Limite de Gasto</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input type="number" step="0.01" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0,00" required className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-xl font-bold text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3">Cor de Identificação</label>
          <div className="flex flex-wrap gap-3">
            {colors.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className={`size-10 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }}>
                {color === c && <Icon name="check" className="text-white text-sm font-bold" />}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full h-12 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all active:scale-95 mt-4">
          Definir Orçamento
        </button>
      </form>
    </Modal>
  );
};

const BudgetActionModal: React.FC<{ budget: any; onClose: () => void; allTransactions: any[] }> = ({ budget, onClose, allTransactions }) => {
  const [view, setView] = useState<'options' | 'chart' | 'details'>('options');
  const remaining = Math.max(0, budget.limit - budget.spent);
  const chartData = [
    { name: 'Gasto', value: budget.spent, color: budget.spent > budget.limit ? '#ef4444' : budget.color },
    { name: 'Restante', value: remaining, color: 'rgba(255,255,255,0.1)' }
  ];
  const transactions = allTransactions.filter(t => t.category === budget.category);

  return (
    <Modal isOpen={true} onClose={onClose} title={view === 'options' ? budget.category : view === 'chart' ? 'Análise de Gastos' : 'Detalhes'}>
      <div className="space-y-4">
        {view !== 'options' && (
          <button onClick={() => setView('options')} className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition-colors mb-2">
            <Icon name="arrow_back" />
            <span>Voltar</span>
          </button>
        )}

        {view === 'options' && (
          <div className="flex flex-col gap-4">
            <p className="text-center text-gray-400 mb-2">O que você deseja visualizar?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setView('chart')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-white/[0.1] bg-white/[0.02] hover:border-teal-500/50 hover:bg-teal-500/10 transition-all group">
                <div className="p-4 rounded-full bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform"><Icon name="pie_chart" className="text-3xl" /></div>
                <span className="font-bold text-white">Ver Gráfico</span>
              </button>
              <button onClick={() => setView('details')} className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-white/[0.1] bg-white/[0.02] hover:border-teal-500/50 hover:bg-teal-500/10 transition-all group">
                <div className="p-4 rounded-full bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform"><Icon name="list_alt" className="text-3xl" /></div>
                <span className="font-bold text-white">Detalhes</span>
              </button>
            </div>
          </div>
        )}

        {view === 'chart' && (
          <div className="flex flex-col items-center">
            <div className="w-full h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1a1d21', borderColor: '#333', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs text-gray-400 font-medium">Gasto</span>
                <span className="text-xl font-bold text-white">{((budget.spent / budget.limit) * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {view === 'details' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-2">Histórico Recente</h3>
            {transactions.length > 0 ? (
              <div className="divide-y divide-white/[0.05]">
                {transactions.map(t => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-white/[0.05] flex items-center justify-center text-gray-400">
                        <Icon name={t.type === TransactionType.EXPENSE ? 'shopping_bag' : 'payments'} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{t.description}</p>
                        <p className="text-xs text-gray-500">{formatDate(t.date)}</p>
                      </div>
                    </div>
                    <p className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-500">Nenhuma transação encontrada.</div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Budgets;
