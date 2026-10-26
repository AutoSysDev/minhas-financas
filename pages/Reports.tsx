import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { ExpensePieChart, IncomeExpenseChart, SavingsBarChart } from '../components/Charts';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, getTransactionDate } from '../utils/helpers';
import { buildCategoryData, buildMonthlyEvolution, monthOverMonth } from '../utils/financeInsights';
import { Dropdown } from '../components/Dropdown';
import { useTheme } from '../context/ThemeContext';

const Reports: React.FC = () => {
  const { transactions, accounts, categories } = useFinance();
  const { theme } = useTheme();
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

  // Dados para o Gráfico de Pizza (Despesas por Categoria) — com cor real + Outros
  const categoryData = useMemo(
    () => buildCategoryData(filteredTransactions, categories, { type: TransactionType.EXPENSE, top: 6 }),
    [filteredTransactions, categories]
  );

  // Evolução mensal usa o mesmo parse de data do resto do app
  const monthlyEvolutionData = useMemo(
    () => buildMonthlyEvolution(filteredTransactions, new Date(), 6),
    [filteredTransactions]
  );

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
    const accountName = (id?: string) => accounts.find(a => a.id === id)?.name || '';
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Conta'];
    const csvContent = [
      headers.join(';'),
      ...filteredTransactions.map(t => [
        t.date,
        '"' + String(t.description || '').replace(/"/g, '""') + '"',
        t.category || '',
        t.type,
        Number(t.amount).toFixed(2).replace('.', ','),
        t.isPaid ? 'Pago' : 'Pendente',
        accountName(t.accountId)
      ].join(';'))
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
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
    <div className="flex flex-col gap-8 animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Relatórios</h1>
          <p className={`mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Para baixar, conferir e prestar contas. Para entender o mês, veja Estatísticas.</p>
        </div>
        <Link to="/statistics" className={`text-xs font-bold px-3 py-2 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200 text-teal-700' : 'bg-white/[0.05] border-white/[0.1] text-teal-300'}`}>Ir para Estatísticas</Link>
      </div>

      <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/[0.05]'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Tipo</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'all' }, { label: 'Receitas', value: 'income' }, { label: 'Despesas', value: 'expense' }]}
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as any)}
              className="w-full"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Categoria</label>
            <Dropdown
              options={[{ label: 'Todas', value: 'Todas' }, ...categories.map(c => ({ label: c.name, value: c.name }))]}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              className="w-full"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Conta</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'Todos' }, ...accounts.map(a => ({ label: a.name, value: a.id }))]}
              value={accountFilter}
              onChange={(v) => setAccountFilter(v)}
              className="w-full"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Status</label>
            <Dropdown
              options={[{ label: 'Todos', value: 'all' }, { label: 'Pagos', value: 'paid' }, { label: 'Pendentes', value: 'pending' }]}
              value={paidFilter}
              onChange={(v) => setPaidFilter(v as any)}
              className="w-full"
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>De</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg outline-none ${theme === 'light' ? 'bg-white border-gray-200 text-slate-900' : 'bg-white/[0.05] border-white/[0.1] text-white [&::-webkit-calendar-picker-indicator]:invert'}`}
            />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-2 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Até</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg outline-none ${theme === 'light' ? 'bg-white border-gray-200 text-slate-900' : 'bg-white/[0.05] border-white/[0.1] text-white [&::-webkit-calendar-picker-indicator]:invert'}`}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Receitas</p>
            <p className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(totalIncome)}</PrivateValue></p>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Despesas</p>
            <p className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(totalExpense)}</PrivateValue></p>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Pagas</p>
            <p className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{paidCount}</p>
          </div>
          <div className={`p-4 rounded-xl border ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Pendentes</p>
            <p className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{pendingCount}</p>
          </div>
        </div>
        {(dateRange.start || dateRange.end || categoryFilter !== 'Todas' || accountFilter !== 'Todos' || typeFilter !== 'all' || paidFilter !== 'all') && (
          <button onClick={() => { setTypeFilter('all'); setCategoryFilter('Todas'); setAccountFilter('Todos'); setPaidFilter('all'); setDateRange({ start: '', end: '' }); }} className={`mt-4 text-xs underline ${theme === 'light' ? 'text-teal-700' : 'text-teal-300'}`}>Limpar filtros</button>
        )}
      </div>

      <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/[0.05]'}`}>
        <h3 className={`text-lg font-bold mb-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Fluxo de Caixa (6 meses)</h3>
        <p className={`text-xs mb-4 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Receitas menos despesas: {(() => { const last = monthlyEvolutionData[monthlyEvolutionData.length - 1]; const prev = monthlyEvolutionData[monthlyEvolutionData.length - 2]; if (!last || !prev) return '—'; const r = monthOverMonth(last.savings, prev.savings); return `${formatCurrency(last.savings)} no último mês${r.pct !== null ? ` (${r.pct >= 0 ? '+' : ''}${r.pct.toFixed(0)}% vs anterior)` : ''}`; })()}</p>
        <div className="h-80">
          <PrivateValue>
            <IncomeExpenseChart data={monthlyEvolutionData} />
          </PrivateValue>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/[0.05]'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Distribuição de Despesas</h3>
          <PrivateValue>
            <ExpensePieChart data={categoryData} />
          </PrivateValue>
        </div>
        <div className={`backdrop-blur-md rounded-xl shadow-sm p-6 border ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/[0.05]'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Economia mensal (receita − despesa)</h3>
          <PrivateValue>
            <SavingsBarChart data={savingsData} />
          </PrivateValue>
        </div>
      </div>

      <div className={`backdrop-blur-md rounded-xl shadow-sm border overflow-hidden ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/[0.02] border-white/[0.05]'}`}>
        <div className="flex items-center justify-between p-6 pb-3">
          <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Prévia ({filteredTransactions.length})</h3>
          <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Mostrando 20 primeiros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={theme === 'light' ? 'bg-gray-50 text-slate-500' : 'bg-white/[0.05] text-gray-400'}>
              <tr>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className={theme === 'light' ? 'divide-y divide-gray-50' : 'divide-y divide-white/[0.05]'}>
              {filteredTransactions.slice(0, 20).map(t => (
                <tr key={t.id}>
                  <td className={`px-6 py-3 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{formatDate(t.date)}</td>
                  <td className={`px-6 py-3 font-medium ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.description}</td>
                  <td className={`px-6 py-3 ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>{t.category}</td>
                  <td className={`px-6 py-3 text-right font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(t.amount)}</PrivateValue></td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={4} className={`px-6 py-10 text-center ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Nada para exportar com esses filtros.</td></tr>
              )}
            </tbody>
          </table>
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
