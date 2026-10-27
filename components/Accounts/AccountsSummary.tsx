import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../Icon';
import { PrivateValue } from '../PrivateValue';
import { formatCurrency, getAccountCumulativeBalance, getTotalCumulativeBalance } from '../../utils/helpers';

export const AccountsSummary: React.FC = () => {
  const { accounts, transactions } = useFinance();
  const { theme } = useTheme();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Filter accounts that should be included in the total
  const activeAccounts = accounts.filter(a => !a.ignoreInTotal);

  // Calculate total balance for current month
  const totalBalance = getTotalCumulativeBalance(transactions, activeAccounts, currentYear, currentMonth);

  // Calculate total balance for previous month
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const prevTotalBalance = getTotalCumulativeBalance(transactions, activeAccounts, prevYear, prevMonth);

  const diff = totalBalance - prevTotalBalance;
  const percentage = prevTotalBalance !== 0 ? (diff / Math.abs(prevTotalBalance)) * 100 : 0;

  return (
    <div className={`sm:rounded-3xl rounded-2xl sm:p-8 p-5 border transition-all relative overflow-hidden ${theme === 'light' ? 'bg-white border-gray-200 shadow-xl' : 'bg-gradient-to-br from-[#1a1f2e] to-background-main border-white/[0.05] shadow-2xl'}`}>
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className={`text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>
            <Icon name="account_balance" className="text-teal-500" />
            Patrimônio Total
          </h2>
          <div className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            <PrivateValue>{formatCurrency(totalBalance)}</PrivateValue>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${diff >= 0 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
              <Icon name={diff >= 0 ? 'trending_up' : 'trending_down'} className="text-sm" />
              <span>{Math.abs(percentage).toFixed(1)}%</span>
            </div>
            <span className={`text-xs font-medium ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>
              {diff >= 0 ? '+' : ''}{formatCurrency(diff)} este mês
            </span>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="flex gap-8 border-l pl-8 border-white/10">
          <div>
            <p className={`text-[10px] uppercase font-bold mb-1 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>Contas Ativas</p>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>{accounts.length}</p>
          </div>
          <div>
            <p className={`text-[10px] uppercase font-bold mb-1 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}>Bancos</p>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
              {new Set(accounts.map(a => a.bankName)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
