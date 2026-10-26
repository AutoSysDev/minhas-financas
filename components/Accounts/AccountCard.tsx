import React from 'react';
import { Account } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../Icon';
import { PrivateValue } from '../PrivateValue';
import { BANKS } from '../../constants';
import { formatCurrency, getAccountCumulativeBalance } from '../../utils/helpers';
import { useFinance } from '../../context/FinanceContext';

interface AccountCardProps {
  account: Account;
  onClick: (account: Account) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({ account, onClick }) => {
  const { transactions } = useFinance();

  const bank = BANKS.find(b => b.name === account.bankName);
  const currentBalance = getAccountCumulativeBalance(transactions, account, new Date().getFullYear(), new Date().getMonth());

  // Determine gradient based on bank color or default
  const bgStyle = bank?.color
    ? { background: `linear-gradient(135deg, ${bank.color} 0%, ${adjustColor(bank.color, -60)} 100%)` }
    : { background: `linear-gradient(135deg, #334155 0%, #0f172a 100%)` };

  // Calculate Overdraft Usage
  const overdraftLimit = Number(account.overdraftLimit || 0);
  const overdraftUsed = currentBalance < 0 ? Math.abs(currentBalance) : 0; // Usage based on negative balance
  const overdraftPercentage = overdraftLimit > 0 ? Math.min(100, (overdraftUsed / overdraftLimit) * 100) : 0;
  const isOverdraftActive = account.category === 'Corrente' && overdraftLimit > 0;

  return (
    <div
      onClick={() => onClick(account)}
      className={`group relative sm:h-48 h-40 sm:rounded-3xl rounded-2xl sm:p-5 p-4 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl shadow-lg border border-white/10 flex flex-col justify-between select-none ${account.ignoreInTotal ? 'opacity-75 grayscale-[0.5]' : ''}`}
      style={bgStyle}
    >
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none"></div>

      {/* Decorative Circles */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-20px] left-[-20px] w-32 h-32 bg-black/20 rounded-full blur-2xl pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full text-white">

        {/* Top Row: Icon + Badges */}
        <div className="flex justify-between items-start">
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-full shadow-lg transition-transform group-hover:scale-105">
            {bank?.logo ? (
              <img src={bank.logo} alt={bank.name} className="h-8 w-8 object-contain" />
            ) : (
              <Icon name={account.icon || 'account_balance'} className="text-2xl text-gray-800" />
            )}
          </div>

          {/* Indicators */}
          <div className="flex gap-1.5">
            {/* Category Badge */}
            {account.category && (
              <div className="bg-black/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/90">
                {account.category}
              </div>
            )}

            {account.isDefaultForDebit && (
              <div className="bg-teal-500/80 backdrop-blur-md p-1.5 rounded-full border border-teal-200/30 text-white shadow-sm" title="Conta Padrão para Débito">
                <Icon name="check" className="text-xs font-bold" />
              </div>
            )}

            {account.ignoreInTotal && (
              <div className="bg-rose-500/80 backdrop-blur-md p-1.5 rounded-full border border-rose-200/30 text-white shadow-sm" title="Ignorada no Saldo Total">
                <Icon name="visibility_off" className="text-xs" />
              </div>
            )}
            {account.showInSummary === false && (
              <div className="bg-gray-500/80 backdrop-blur-md p-1.5 rounded-full border border-gray-200/30 text-white shadow-sm" title="Oculta no Resumo">
                <Icon name="visibility_off" className="text-xs" />
              </div>
            )}
          </div>
        </div>

        {/* Middle Row: Overdraft Indicator */}
        <div className="flex-1 flex flex-col justify-center">
          {isOverdraftActive && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1.5">
                <span>Cheque Especial</span>
                <span className={overdraftPercentage > 80 ? 'text-rose-300' : 'text-teal-300'}>{Math.round(overdraftPercentage)}%</span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${overdraftPercentage > 90 ? 'bg-rose-500' : overdraftPercentage > 50 ? 'bg-yellow-400' : 'bg-teal-400'}`}
                  style={{ width: `${overdraftPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] mt-1 opacity-60 font-medium">
                <span>Uso: {formatCurrency(overdraftUsed)}</span>
                <span>Lim: {formatCurrency(overdraftLimit)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row: Balance & Name */}
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider opacity-80 mb-0.5 font-bold">Saldo Disponível</p>
            <p className="text-2xl font-black tracking-tight text-white drop-shadow-md">
              <PrivateValue>{formatCurrency(currentBalance)}</PrivateValue>
            </p>
          </div>
          <div className="text-right pl-4">
            <p className="text-sm font-bold opacity-95 truncate max-w-[120px]">{account.name}</p>
            <p className="text-[10px] uppercase opacity-70 tracking-wide truncate max-w-[120px]">{account.bankName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for color adjustment (if not already imported)
function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}
