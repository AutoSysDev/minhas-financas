import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { ExpensePieChart, IncomeExpenseChart } from '../components/Charts';
import { Link } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext';
import { useSharedAccount } from '../context/SharedAccountContext';
import {
    formatCurrency,
    getTransactionDate,
    getMonthlyIncome,
    getMonthlyExpenses,
    getMonthlyPendingIncome,
    getMonthlyPendingExpenses,
    getMonthlyForecastWithCarry,
    getTotalNetForMonth,
    getTotalCumulativeBalance,
    getInvestmentsTotalUntil,
    getAccountCumulativeBalance
} from '../utils/helpers';
import { TransactionType } from '../types';
import { MonthNavigation } from '../components/MonthNavigation';
import { DashboardSkeleton } from '../components/DashboardSkeleton';
import { BANKS } from '../constants';

const SharedDashboard: React.FC = () => {
    const { accounts, transactions, recalculateBalances, investments, loading } = useFinance();
    const { isSharedViewActive, setIsSharedViewActive, sharedAccount, members } = useSharedAccount();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Enforce shared view ONLY when on this page
    useEffect(() => {
        setIsSharedViewActive(true);
        return () => {
            setIsSharedViewActive(false);
        };
    }, []);

    const selectedMonth = currentDate.getMonth();
    const selectedYear = currentDate.getFullYear();

    // Calculations
    const totalIncome = getMonthlyIncome(transactions, selectedYear, selectedMonth);
    const totalExpense = getMonthlyExpenses(transactions, selectedYear, selectedMonth);
    const pendingIncome = getMonthlyPendingIncome(transactions, selectedYear, selectedMonth);
    const pendingExpenses = getMonthlyPendingExpenses(transactions, selectedYear, selectedMonth);

    const { summary: forecastSummary } = useMemo(() => {
        return getMonthlyForecastWithCarry(transactions, selectedYear, selectedMonth);
    }, [transactions, selectedYear, selectedMonth]);

    const predictedBalanceDisplay = forecastSummary.carryOut;

    const investmentsBalance = getInvestmentsTotalUntil(investments, selectedYear, selectedMonth);
    const accountsCumulativeBalance = getTotalCumulativeBalance(transactions, accounts, selectedYear, selectedMonth);
    const totalPatrimony = accountsCumulativeBalance + investmentsBalance;

    const monthlyTransactions = transactions.filter(t => {
        const tDate = getTransactionDate(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    // Category data for chart
    const categoryExpenses = monthlyTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => {
            const category = t.category || 'Outros';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryExpenses)
        .map(([name, value]) => ({ name, value: value as number, color: '#000000' }))
        .filter(item => (item.value as number) > 0)
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 5);

    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    categoryData.forEach((item, index) => {
        item.color = COLORS[index % COLORS.length];
    });

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

    if (loading) return <DashboardSkeleton />;

    if (!sharedAccount) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white/[0.02] border border-white/[0.05] rounded-3xl backdrop-blur-md">
                <div className="size-20 rounded-full bg-teal-500/10 flex items-center justify-center mb-6">
                    <Icon name="group_add" className="text-4xl text-teal-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Sem Conta Compartilhada</h2>
                <p className="text-gray-400 max-w-md mb-8">
                    Você ainda não possui ou não faz parte de uma conta compartilhada.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        to="/settings?tab=shared"
                        className="px-8 py-3 bg-teal-500 text-white font-bold rounded-2xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
                    >
                        Ir para Configurações
                    </Link>

                    {members.length === 0 && (
                        <Link
                            to="/settings?tab=shared"
                            className="px-8 py-3 bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30 rounded-2xl hover:bg-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Icon name="mail" />
                            Ver Solicitações
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    // This screen is no longer reachable because we enforce shared view on mount
    if (!isSharedViewActive) return <DashboardSkeleton />;

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                            </span>
                            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">Modo Conjunto</span>
                        </div>
                    </div>
                    <h1 className="text-white text-3xl md:text-5xl font-black tracking-tight">Dashboard Conjunto</h1>
                    <p className="text-gray-400 mt-2 flex items-center gap-2">
                        <Icon name="people" className="text-teal-400" />
                        Visão consolidada de {members.length} membros da família.
                    </p>
                </div>

                <MonthNavigation
                    currentDate={currentDate}
                    onMonthChange={setCurrentDate}
                    className="w-full md:w-auto min-w-[280px]"
                />
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Patrimônio Total */}
                <div className="bg-gradient-to-br from-teal-500/10 to-blue-600/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity translate-x-4 -translate-y-4">
                        <Icon name="account_balance_wallet" className="text-8xl text-white" />
                    </div>
                    <p className="text-sm font-bold text-teal-400/80 mb-2 uppercase tracking-wider">Patrimônio Conjunto</p>
                    <div className="flex flex-col">
                        <h3 className="text-4xl font-black text-white tracking-tighter">
                            <PrivateValue>{formatCurrency(totalPatrimony)}</PrivateValue>
                        </h3>
                        <p className="text-xs text-gray-500 mt-2">Soma de todas as contas e investimentos</p>
                    </div>
                </div>

                {/* Saldo Previsto */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Icon name="timeline" className="text-8xl text-indigo-400" />
                    </div>
                    <p className="text-sm font-bold text-indigo-400/80 mb-2 uppercase tracking-wider">Saldo Previsto</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter">
                        <PrivateValue>{formatCurrency(predictedBalanceDisplay)}</PrivateValue>
                    </h3>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 bg-indigo-500/10 w-fit px-2 py-1 rounded-full">
                        <Icon name="trending_up" className="text-xs" />
                        <span>Estimativa para fim do mês</span>
                    </div>
                </div>

                {/* Receitas Totais */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
                    <p className="text-sm font-bold text-green-400/80 mb-2 uppercase tracking-wider">Receitas (Mês)</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter">
                        <PrivateValue>{formatCurrency(totalIncome + pendingIncome)}</PrivateValue>
                    </h3>
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500">
                            <span>Consolidado</span>
                            <span className="text-green-400 font-bold"><PrivateValue>{formatCurrency(totalIncome)}</PrivateValue></span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${(totalIncome / (totalIncome + pendingIncome || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Despesas Totais */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
                    <p className="text-sm font-bold text-red-400/80 mb-2 uppercase tracking-wider">Despesas (Mês)</p>
                    <h3 className="text-4xl font-black text-white tracking-tighter">
                        <PrivateValue>{formatCurrency(totalExpense + pendingExpenses)}</PrivateValue>
                    </h3>
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[11px] text-gray-500">
                            <span>Consolidado</span>
                            <span className="text-red-400 font-bold"><PrivateValue>{formatCurrency(totalExpense)}</PrivateValue></span>
                        </div>
                        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-red-500 h-full" style={{ width: `${(totalExpense / (totalExpense + pendingExpenses || 1)) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Charts Container */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Fluxo de Caixa Chart */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white">Fluxo de Caixa Familiar</h3>
                                <p className="text-sm text-gray-500">Histórico consolidado dos últimos 6 meses</p>
                            </div>
                            <Icon name="show_chart" className="text-2xl text-teal-400" />
                        </div>
                        <div className="h-[300px]">
                            <IncomeExpenseChart data={monthlyEvolutionData} />
                        </div>
                    </div>

                    {/* Category Breakdown (Simplified) */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 backdrop-blur-md">
                        <h3 className="text-xl font-bold text-white mb-6">Gastos por Categoria (Neste Mês)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                            <div className="h-[200px]">
                                <ExpensePieChart data={categoryData} />
                            </div>
                            <div className="space-y-4">
                                {categoryData.length > 0 ? categoryData.map((cat, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="size-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                                            <span className="text-sm text-gray-400">{cat.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-white"><PrivateValue>{formatCurrency(cat.value)}</PrivateValue></span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-500 italic">Nenhuma despesa registrada no período.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar info within the page */}
                <div className="flex flex-col gap-6">
                    {/* Members List */}
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] p-8 backdrop-blur-md">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Icon name="groups" className="text-teal-400" />
                            Membros Ativos
                        </h3>
                        <div className="space-y-4">
                            {members.map(member => (
                                <div key={member.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
                                    <div className="size-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center text-teal-400 font-bold border border-white/10">
                                        {member.email ? member.email.substring(0, 2).toUpperCase() : '??'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-white truncate">{member.email || 'Membro'}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{member.role === 'owner' ? 'Proprietário' : 'Membro'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Stats Summary */}
                    <div className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-white/[0.05] rounded-[2.5rem] p-8 backdrop-blur-md">
                        <h3 className="text-lg font-bold text-white mb-6">Eficiência Financeira</h3>
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center size-32 rounded-full border-8 border-teal-500/20 border-t-teal-500 relative mb-4">
                                <span className="text-2xl font-black text-white">
                                    {totalIncome + pendingIncome > 0
                                        ? Math.round((1 - (totalExpense + pendingExpenses) / (totalIncome + pendingIncome)) * 100)
                                        : 0}%
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 px-4">Economia conjunta em relação à receita total.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedDashboard;
