
import React, { useState, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { ExpensePieChart, IncomeExpenseChart } from '../components/Charts';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, getTransactionDate, getMonthlyIncome, getMonthlyExpenses, getMonthlyPendingIncome, getMonthlyPendingExpenses, getMonthlyForecastWithCarry, getAccountMonthNet, getTotalNetForMonth, getMonthlyPredictedBalanceStrict, getTotalCumulativeBalance, getInvestmentsTotalUntil, getAccountCumulativeBalance } from '../utils/helpers';
import { TransactionType } from '../types';
import { MonthNavigation } from '../components/MonthNavigation';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { BANKS } from '../constants';
// SharedViewToggle removed

// Componente Sparkline (Mini Gráfico)
const Sparkline: React.FC<{ data: number[], color: string }> = ({ data, color }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  // Normalizar dados para caber em altura 40px e largura 100px
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 40 - ((val - min) / range) * 40;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" height="40" viewBox="0 0 100 40" preserveAspectRatio="none" className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

const Dashboard: React.FC = () => {
  const { accounts, recalculateBalances, investments, loading } = useFinance();
  const { data: transactionsData, isLoading: isLoadingTransactions } = useTransactions();
  const transactions = transactionsData || [];

  const [currentDate, setCurrentDate] = useState(new Date());


  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();
  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

  // --- 1. Cálculos Mensais usando Helpers Centralizados ---
  const { summary: forecastSummary, transfers: forecastTransfers } = useMemo(() => {
    try {
      if (!transactions || transactions.length === 0) {
        return {
          summary: { carryIn: 0, net: 0, final: 0, carryOut: 0 },
          transfers: []
        };
      }
      return getMonthlyForecastWithCarry(transactions, selectedYear, selectedMonth);
    } catch (error) {
      console.error("Error calculating forecast:", error);
      return {
        summary: { carryIn: 0, net: 0, final: 0, carryOut: 0 },
        transfers: []
      };
    }
  }, [transactions, selectedYear, selectedMonth]);

  console.log('Dashboard Render:', { loading, isLoadingTransactions, hasData: transactions.length > 0 });

  const totalIncome = getMonthlyIncome(transactions, selectedYear, selectedMonth);
  const totalExpense = getMonthlyExpenses(transactions, selectedYear, selectedMonth);
  const pendingIncome = getMonthlyPendingIncome(transactions, selectedYear, selectedMonth);
  const pendingExpenses = getMonthlyPendingExpenses(transactions, selectedYear, selectedMonth);

  // Saldo do mês (apenas consolidado do período selecionado)
  const monthlyBalanceDisplay = getTotalNetForMonth(transactions, accounts, selectedYear, selectedMonth);

  const predictedBalanceDisplay = forecastSummary.carryOut;
  const periodIncomeTotal = totalIncome + pendingIncome;
  const periodExpenseTotal = totalExpense + pendingExpenses;
  const periodLabel = `${currentDate.toLocaleDateString('pt-BR', { month: 'long' })} ${selectedYear}`;

  const [isForecastMounted, setIsForecastMounted] = useState(false);
  const [isForecastExpanded, setIsForecastExpanded] = useState(false);
  const toggleForecast = () => {
    if (!isForecastExpanded) {
      setIsForecastMounted(true);
      requestAnimationFrame(() => setIsForecastExpanded(true));
    } else {
      setIsForecastExpanded(false);
      setTimeout(() => setIsForecastMounted(false), 200);
    }
  };

  // Patrimônio Total (saldo acumulado até o mês selecionado + investimentos)
  const investmentsBalance = getInvestmentsTotalUntil(investments, selectedYear, selectedMonth);
  const accountsCumulativeBalance = getTotalCumulativeBalance(transactions, accounts, selectedYear, selectedMonth);
  const totalPatrimony = accountsCumulativeBalance + investmentsBalance;

  // Filtro de transações do mês (para gráficos e categorias)
  const monthlyTransactions = transactions.filter(t => {
    const tDate = getTransactionDate(t.date);
    return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
  });
  const hasMonthlyData = monthlyTransactions.length > 0;
  const prevDate = new Date(selectedYear, selectedMonth, 1);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const startOfMonthBalance = getTotalCumulativeBalance(transactions, accounts, prevDate.getFullYear(), prevDate.getMonth());

  const totalTransfers = monthlyTransactions
    .filter(t => t.type === TransactionType.TRANSFER)
    .reduce((acc, t) => acc + t.amount, 0);

  const referenceDate = isCurrentMonth ? new Date() : new Date(selectedYear, selectedMonth + 1, 0);

  const last7DaysExpenses = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(referenceDate);
    d.setDate(d.getDate() - (6 - i));

    const checkDay = d.getDate();
    const checkMonth = d.getMonth();
    const checkYear = d.getFullYear();

    return transactions
      .filter(t => {
        const tDate = getTransactionDate(t.date);
        return t.type === TransactionType.EXPENSE &&
          tDate.getDate() === checkDay &&
          tDate.getMonth() === checkMonth &&
          tDate.getFullYear() === checkYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  });

  const sparklineData = last7DaysExpenses.some(v => v > 0) ? last7DaysExpenses : [0, 0, 0, 0, 0, 0, 0];

  // --- 4. Dados para o Gráfico de Pizza (Categorias) ---
  const categoryExpenses = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => {
      const category = t.category || 'Outros';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const CATEGORY_COLORS = ['#137fec', '#16a34a', '#820ad1', '#ff7a00', '#ef4444', '#6b7280', '#eab308', '#db2777'];

  const categoryData = Object.entries(categoryExpenses)
    .map(([name, value]) => ({ name, value: value as number, color: '#000000' }))
    .filter(item => (item.value as number) > 0)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .slice(0, 5);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  categoryData.forEach((item, index) => {
    item.color = COLORS[index % COLORS.length];
  }); // Top 5 categorias

  // --- 5. Dados para o Gráfico de Evolução (Últimos 6 meses) ---
  const monthlyEvolutionData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() - (5 - i));
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthName = d.toLocaleDateString('pt-BR', { month: 'short' });

    const monthTrans = transactions.filter(t => {
      const tDate = getTransactionDate(t.date);
      return tDate.getMonth() === month && tDate.getFullYear() === year;
    });

    const income = monthTrans
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);

    const expense = monthTrans
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, t) => acc + t.amount, 0);

    return {
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      income,
      expense
    };
  });

  if (loading || isLoadingTransactions) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0">

      {/* Cabeçalho com Navegação de Data */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Visão geral do seu patrimônio.</p>
            <button onClick={recalculateBalances} className="text-[10px] bg-white/5 hover:bg-white/10 text-gray-500 px-2 py-0.5 rounded border border-white/5 transition-colors" title="Recalcular Saldos">
              <Icon name="refresh" className="text-xs" />
            </button>
          </div>
        </div>

        {/* Navegador de Mês */}
        <MonthNavigation
          currentDate={currentDate}
          onMonthChange={setCurrentDate}
          className="w-full md:w-auto min-w-[240px]"
        />
      </div>

      {/* Seção 1: Resumo de Contas (Grid Vertical e Compacto) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Minhas Contas (Saldo Atual)
          </h3>
          <Link to="/accounts" className="text-primary text-xs font-bold hover:underline">Gerenciar</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">

          {/* Card de Saldo Geral */}
          <div className="bg-gradient-to-br from-teal-900/80 to-blue-900/80 backdrop-blur-md text-white rounded-xl p-4 shadow-lg border border-white/10 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-white/10 rounded-lg"><Icon name="account_balance_wallet" className="text-base" /></div>
              <span className="font-medium text-teal-100 text-xs">Patrimônio Total</span>
            </div>
            <div>
              <p className="text-xl font-black tracking-tight"><PrivateValue>{formatCurrency(totalPatrimony)}</PrivateValue></p>
              <p className="text-[10px] text-teal-200/70 mt-0.5">Saldo + Investimentos</p>
            </div>
          </div>

          {/* Cards das Contas Individuais - Saldo Atual */}
          {accounts.map(acc => (
            <div
              key={acc.id}
              className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 hover:bg-white/[0.04] hover:border-teal-500/30 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0 overflow-hidden relative" style={{ backgroundColor: acc.color }}>
                  {(() => {
                    const bank = BANKS.find(b => b.name === acc.bankName);
                    if (bank?.logo) {
                      return <img src={bank.logo} alt={acc.bankName} className="w-full h-full object-cover" />;
                    }
                    return acc.logoText;
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate text-sm">{acc.name}</p>
                  <p className="text-[10px] text-gray-500 truncate uppercase tracking-wide">{acc.bankName}</p>
                </div>
              </div>
              <p className="text-base font-bold text-white whitespace-nowrap"><PrivateValue>{formatCurrency(getAccountCumulativeBalance(transactions, acc.id, selectedYear, selectedMonth))}</PrivateValue></p>
            </div>
          ))}

          <Link to="/accounts" className="flex items-center justify-center gap-2 bg-white/[0.01] border-2 border-dashed border-white/[0.05] rounded-xl cursor-pointer hover:bg-white/[0.03] hover:border-teal-500/30 transition-colors p-4 min-h-[80px] group">
            <div className="size-8 rounded-full bg-white/[0.05] flex items-center justify-center shadow-sm border border-white/[0.05] group-hover:bg-teal-500/20 group-hover:text-teal-400 transition-colors">
              <Icon name="add" className="text-gray-400 text-base group-hover:text-teal-400" />
            </div>
            <span className="text-xs font-bold text-gray-400 group-hover:text-teal-400 transition-colors">Nova Conta</span>
          </Link>
        </div>
      </div>

      {/* Seção 2: Visão Geral do Mês (Fluxo Compacto) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Saldo Total (Repetido para contexto do grid, mas com foco no mês) */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/[0.05] shadow-lg relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="account_balance_wallet" className="text-6xl text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-400 mb-1">Saldo Atual</p>
            <h3 className="text-3xl font-bold text-white tracking-tight"><PrivateValue>{formatCurrency(accountsCumulativeBalance)}</PrivateValue></h3>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-teal-400 bg-teal-400/10 w-fit px-2 py-1 rounded-lg">
                <Icon name="event" className="text-sm" />
                <span>{periodLabel}</span>
              </div>
              {!hasMonthlyData && (
                <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">Sem transações</span>
              )}
            </div>
          </div>
        </div>

        {/* Saldo Previsto (NOVO) */}
        <div
          className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 backdrop-blur-md rounded-2xl p-6 border border-indigo-500/20 shadow-lg relative overflow-hidden group hover:bg-indigo-500/10 hover:border-indigo-400/40 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          onClick={toggleForecast}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleForecast(); } }}
          tabIndex={0}
          role="button"
          aria-expanded={isForecastExpanded}
          aria-controls="forecast-details"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="timeline" className="text-6xl text-indigo-400" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-indigo-200 mb-1">Saldo Previsto</p>
            <h3 className="text-3xl font-bold text-white tracking-tight"><PrivateValue>{formatCurrency(predictedBalanceDisplay)}</PrivateValue></h3>
            {isForecastMounted && (
              <div
                id="forecast-details"
                aria-hidden={!isForecastExpanded}
                className={`mt-4 ${isForecastExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 ease-out`}
                style={{ willChange: 'opacity' }}
              >
                <div className="grid grid-cols-2 gap-2 text-[11px] text-indigo-200">
                  <div className="flex items-center justify-between bg-indigo-500/10 px-2 py-1 rounded">
                    <span>Saldo inicial</span>
                    <span className="font-bold"><PrivateValue>{formatCurrency(startOfMonthBalance)}</PrivateValue></span>
                  </div>
                  <div className="flex items-center justify-between bg-indigo-500/10 px-2 py-1 rounded">
                    <span>Receitas</span>
                    <span className="font-bold text-green-300"><PrivateValue>{formatCurrency(periodIncomeTotal)}</PrivateValue></span>
                  </div>
                  <div className="flex items-center justify-between bg-indigo-500/10 px-2 py-1 rounded">
                    <span>Despesas</span>
                    <span className="font-bold text-red-300"><PrivateValue>{formatCurrency(periodExpenseTotal)}</PrivateValue></span>
                  </div>
                  <div className="flex items-center justify-between bg-indigo-500/10 px-2 py-1 rounded">
                    <span>Acumulado anterior</span>
                    <span className="font-bold"><PrivateValue>{formatCurrency(forecastSummary.carryIn)}</PrivateValue></span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-indigo-500/20 px-2 py-1 rounded">
                    <span>Saldo final</span>
                    <span className="font-black"><PrivateValue>{formatCurrency(forecastSummary.carryOut)}</PrivateValue></span>
                  </div>
                </div>
                {forecastTransfers.length > 0 && (
                  <div className="mt-3 text-[10px] text-indigo-300">
                    <div className="flex items-center gap-1 mb-1">
                      <Icon name="swap_horiz" className="text-sm" />
                      <span>Histórico de transferências</span>
                    </div>
                    <ul className="space-y-0.5">
                      {forecastTransfers.slice(Math.max(0, forecastTransfers.length - 3)).map((tr, i) => (
                        <li key={i} className="flex items-center justify-between bg-white/5 px-2 py-1 rounded">
                          <span>{tr.from} → {tr.to}</span>
                          <span className="font-bold"><PrivateValue>{formatCurrency(tr.amount)}</PrivateValue></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Receitas */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/[0.05] shadow-lg relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="arrow_upward" className="text-6xl text-green-400" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-400 mb-1">Receitas (Mês)</p>
            <h3 className="text-3xl font-bold text-white tracking-tight"><PrivateValue>{formatCurrency(totalIncome)}</PrivateValue></h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="pending" className="text-sm" />
              <span>{periodLabel} • <PrivateValue>{formatCurrency(pendingIncome)}</PrivateValue> pendente</span>
            </div>
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/[0.05] shadow-lg relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="arrow_downward" className="text-6xl text-red-400" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-400 mb-1">Despesas (Mês)</p>
            <h3 className="text-3xl font-bold text-white tracking-tight"><PrivateValue>{formatCurrency(totalExpense)}</PrivateValue></h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="pending" className="text-sm" />
              <span>{periodLabel} • <PrivateValue>{formatCurrency(pendingExpenses)}</PrivateValue> pendente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 3: Gráficos e Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico de Pizza */}
        <div className="lg:col-span-1 bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-5 border border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Top Categorias</h3>
            <Link to="/reports" className="text-[10px] font-bold text-teal-400 hover:text-teal-300 uppercase">Ver tudo</Link>
          </div>
          <ExpensePieChart data={categoryData} />
        </div>

        {/* Gráfico de Evolução + Acesso Rápido */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-5 border border-white/[0.05]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Fluxo de Caixa</h3>
                <p className="text-xs text-gray-400">Receitas vs Despesas</p>
              </div>
            </div>
            <div className="h-auto w-full mb-8">
              <IncomeExpenseChart data={monthlyEvolutionData} />
            </div>
          </div>

          {/* Acesso Rápido (Horizontal) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link to="/transactions?action=new" className="flex items-center gap-3 p-3 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-xl shadow-[0_0_15px_-5px_rgba(45,212,191,0.3)] hover:bg-teal-500/20 transition-all active:scale-95 group">
              <div className="p-1.5 bg-teal-500/20 rounded-lg group-hover:bg-teal-500/30 transition-colors"><Icon name="add" className="text-lg" /></div>
              <span className="font-bold text-xs">Nova Transação</span>
            </Link>
            <Link to="/invoice" className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all group">
              <div className="p-1.5 bg-yellow-500/10 text-yellow-500 rounded-lg group-hover:bg-yellow-500/20 transition-colors"><Icon name="receipt" className="text-lg" /></div>
              <span className="font-bold text-xs text-gray-300 group-hover:text-white">Pagar Fatura</span>
            </Link>
            <Link to="/budgets" className="flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:bg-white/[0.05] hover:border-white/10 transition-all group">
              <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg group-hover:bg-purple-500/20 transition-colors"><Icon name="pie_chart" className="text-lg" /></div>
              <span className="font-bold text-xs text-gray-300 group-hover:text-white">Ver Orçamentos</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
