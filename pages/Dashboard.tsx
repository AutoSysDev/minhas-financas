
import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { ExpensePieChart, IncomeExpenseChart } from '../components/Charts';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/helpers';
import { TransactionType } from '../types';

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
  const { accounts, transactions } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Lógica de Navegação de Data ---
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();
  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

  // Helper para normalizar datas (lidando com o mock '25 Nov' e datas ISO 'YYYY-MM-DD')
  const getTransactionDate = (dateStr: string) => {
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

  // --- 1. Filtros do Mês Selecionado (Fluxo de Caixa) ---
  const monthlyTransactions = transactions.filter(t => {
    const tDate = getTransactionDate(t.date);
    return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
  });

  const totalIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalTransfers = monthlyTransactions
    .filter(t => t.type === TransactionType.TRANSFER)
    .reduce((acc, t) => acc + t.amount, 0);

  // --- 2. Cálculo de Saldo Histórico (Contas) ---
  // Para mostrar o saldo correto em meses passados, pegamos o saldo atual e revertemos
  // as transações que aconteceram DEPOIS do mês selecionado.
  const nextMonthStart = new Date(selectedYear, selectedMonth + 1, 1);

  const futureTransactions = transactions.filter(t => {
    const tDate = getTransactionDate(t.date);
    return tDate >= nextMonthStart;
  });

  const historicalAccounts = accounts.map(acc => {
    let histBalance = acc.balance;
    // Reverter transações futuras
    futureTransactions.forEach(t => {
      if (t.accountId === acc.id) {
        // Se foi RECEITA no futuro, subtraímos para voltar ao passado
        if (t.type === TransactionType.INCOME) {
          histBalance -= t.amount;
        } else {
          // Se foi DESPESA ou TRANSFERÊNCIA (saída) no futuro, somamos de volta
          histBalance += t.amount;
        }
      }
    });
    return { ...acc, balance: histBalance };
  });

  const totalBalance = historicalAccounts.reduce((acc, curr) => acc + curr.balance, 0);

  // --- 3. Dados para o Mini Gráfico (Sparkline) ---
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0">

      {/* Cabeçalho com Navegação de Data */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Visão geral do seu patrimônio.</p>
        </div>

        {/* Navegador de Mês */}
        <div className="flex items-center justify-between bg-white/[0.02] backdrop-blur-md border border-white/[0.05] p-1 rounded-xl shadow-sm w-full md:w-auto min-w-[240px]">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="chevron_left" />
          </button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-white capitalize leading-none">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-none mt-1">
              {currentDate.getFullYear()}
            </span>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
      </div>

      {/* Seção 1: Resumo de Contas (Grid Vertical e Compacto) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Saldos em {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
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
              <p className="text-xl font-black tracking-tight"><PrivateValue>{formatCurrency(totalBalance)}</PrivateValue></p>
              <p className="text-[10px] text-teal-200/70 mt-0.5">Soma de todas as contas</p>
            </div>
          </div>

          {/* Cards das Contas Individuais - Histórico */}
          {historicalAccounts.map(acc => (
            <div
              key={acc.id}
              className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-xl p-4 shadow-sm flex items-center justify-between gap-4 hover:bg-white/[0.04] hover:border-teal-500/30 transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0" style={{ backgroundColor: acc.color }}>
                  {acc.logoText}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white truncate text-sm">{acc.name}</p>
                  <p className="text-[10px] text-gray-500 truncate uppercase tracking-wide">{acc.bankName}</p>
                </div>
              </div>
              <p className="text-base font-bold text-white whitespace-nowrap"><PrivateValue>{formatCurrency(acc.balance)}</PrivateValue></p>
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Receitas */}
        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/[0.05] shadow-lg relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="account_balance_wallet" className="text-6xl text-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-400 mb-1">Saldo Total</p>
            <h3 className="text-3xl font-bold text-white tracking-tight"><PrivateValue>{formatCurrency(totalBalance)}</PrivateValue></h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-teal-400 bg-teal-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="trending_up" className="text-sm" />
              <span>+12% este mês</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/[0.05] shadow-lg relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="arrow_downward" className="text-6xl text-green-400" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-400 mb-1">Receitas (Mês)</p>
            <h3 className="text-3xl font-bold text-white tracking-tight"><PrivateValue>{formatCurrency(totalIncome)}</PrivateValue></h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="arrow_upward" className="text-sm" />
              <span>+5% vs mês anterior</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-md rounded-2xl p-6 border border-white/[0.05] shadow-lg relative overflow-hidden group hover:bg-white/[0.04] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="arrow_upward" className="text-6xl text-red-400" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-gray-400 mb-1">Despesas (Mês)</p>
            <h3 className="text-3xl font-bold text-white tracking-tight"><PrivateValue>{formatCurrency(totalExpense)}</PrivateValue></h3>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-red-400 bg-red-400/10 w-fit px-2 py-1 rounded-lg">
              <Icon name="arrow_downward" className="text-sm" />
              <span>-2% vs mês anterior</span>
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
            <div className="h-64 mb-8">
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
