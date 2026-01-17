import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Dropdown } from '../components/Dropdown';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { TransactionType } from '../types';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/helpers';

import { BANKS } from '../constants';

const Invoice: React.FC = () => {
  const { theme } = useTheme();
  const { cards, transactions, accounts } = useFinance();
  const [searchParams] = useSearchParams();
  const [selectedCardId, setSelectedCardId] = useState('');

  // Month Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    const cardIdFromUrl = searchParams.get('cardId');
    if (cardIdFromUrl) {
      setSelectedCardId(cardIdFromUrl);
    } else if (cards.length > 0) {
      setSelectedCardId(cards[0].id);
    }
  }, [searchParams, cards]);

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];

  if (!selectedCard) return <div className="p-10 text-center text-gray-400">Nenhum cartão cadastrado.</div>;

  // --- Date Helpers ---
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const getTransactionDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
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

  // --- Filtering ---
  // 1. Filter by Card
  const cardTransactionsAll = transactions.filter(t => t.cardId === selectedCard.id);

  // 2. Filter by Month (Credit Card Logic)
  // A fatura que vence no mês M (currentDate) fecha no mês M ou M-1 dependendo do dia de fechamento vs vencimento.
  // Regra geral: O fechamento ocorre ~7-10 dias antes do vencimento.
  // Se o vencimento é dia 5 e o fechamento dia 29, o fechamento da fatura de Fevereiro ocorreu em 29 de Janeiro.
  // Portanto, as transações da fatura de Fevereiro são as ocorridas entre o dia após o fechamento de Dezembro até o fechamento de Janeiro.

  const getInvoiceTransactions = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed (Jan=0)
    const closingDay = selectedCard.closingDay || 1;
    const dueDay = selectedCard.dueDay || 10;

    // Determinar a data de fechamento da fatura selecionada (que vence em currentDate)
    let closingDateOfSelectedInvoice: Date;
    if (dueDay > closingDay) {
      // Ex: Vence dia 15, fecha dia 5. A fatura de Fevereiro fecha em 5 de Fevereiro.
      closingDateOfSelectedInvoice = new Date(year, month, closingDay);
    } else {
      // Ex: Vence dia 5, fecha dia 29. A fatura de Fevereiro fecha em 29 de Janeiro.
      closingDateOfSelectedInvoice = new Date(year, month - 1, closingDay);
    }

    // A data de início é o dia seguinte ao fechamento anterior
    const startDateOfSelectedInvoice = new Date(closingDateOfSelectedInvoice);
    startDateOfSelectedInvoice.setMonth(startDateOfSelectedInvoice.getMonth() - 1);
    startDateOfSelectedInvoice.setDate(startDateOfSelectedInvoice.getDate() + 1);

    // Ajustar para o início do dia e fim do dia para comparação precisa
    startDateOfSelectedInvoice.setHours(0, 0, 0, 0);
    closingDateOfSelectedInvoice.setHours(23, 59, 59, 999);

    return cardTransactionsAll.filter(t => {
      const tDate = getTransactionDate(t.date);

      // 1. Lógica Padrão: Transações dentro do ciclo de fechamento
      const isInCycle = tDate >= startDateOfSelectedInvoice && tDate <= closingDateOfSelectedInvoice;

      // 2. Lógica Especial: Saldo Inicial
      // Se for um "Saldo Inicial (Fatura)" e a data for no mesmo mês/ano da fatura que estamos visualizando
      const isInitialBalanceForThisMonth =
        t.description === 'Saldo Inicial (Fatura)' &&
        tDate.getMonth() === month &&
        tDate.getFullYear() === year;

      return isInCycle || isInitialBalanceForThisMonth;
    });
  };

  const cardTransactions = getInvoiceTransactions();

  // Calculate Invoice Totals for the selected month
  const currentInvoiceAmount = cardTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  // Note: "limitPercentage" and "availableLimit" usually depend on the *current* accumulated invoice, 
  // but for past months it might be different. For simplicity, we'll show the calculated total for the selected month 
  // as the "Fatura Atual" (or "Fatura de [Mês]") and keep the global limit info as is (or maybe hide it for past months).
  // However, usually users want to see the limit status relative to the *current* real-time state, 
  // but the "Fatura" value should reflect the selected month.

  // Let's update the displayed "Fatura Atual" to be the sum of transactions for the selected month.
  // And keep the limit bar reflecting the *current* card status (which is global), or maybe we shouldn't show limit for past months?
  // The user asked for "navigation", so likely they want to see history.
  // We will show the total of the selected month as the main value.

  const limitPercentage = Math.min((selectedCard.currentInvoice / selectedCard.limit) * 100, 100); // This is global current status
  const availableLimit = selectedCard.limit - selectedCard.currentInvoice; // This is global current status

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-grow lg:w-2/3 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className={`text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Faturas de Cartão</h1>
            <div className="w-full sm:w-auto min-w-[280px]">
              <label className="flex flex-col">
                <p className={`text-sm font-medium leading-normal pb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Selecione o Cartão</p>
                <div className="relative">
                  <Dropdown
                    options={cards.map(card => {
                      let logo = undefined;
                      if (card.linkedAccountId) {
                        const linkedAccount = accounts.find(a => a.id === card.linkedAccountId);
                        if (linkedAccount) {
                          const bank = BANKS.find(b => b.name === linkedAccount.bankName);
                          logo = bank?.logo;
                        }
                      }
                      return { label: `${card.name} **** ${card.lastDigits}`, value: card.id, logo };
                    })}
                    value={selectedCardId}
                    onChange={setSelectedCardId}
                    className="w-full"
                  />
                </div>
              </label>
            </div>
          </div>

          {/* Navegador de Mês */}
          <div className={`flex items-center justify-between backdrop-blur-md border p-1 rounded-xl shadow-sm w-full md:max-w-md mx-auto transition-all ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <button onClick={() => navigateMonth(-1)} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
              <Icon name="chevron_left" />
            </button>
            <button
              onClick={() => setIsMonthPickerOpen(true)}
              className={`flex flex-col items-center px-4 py-1 rounded-lg transition-colors cursor-pointer ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}
            >
              <span className={`text-sm font-bold capitalize leading-none transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
              </span>
              <span className={`text-[10px] font-medium leading-none mt-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>
                {currentDate.getFullYear()}
              </span>
            </button>
            <button onClick={() => navigateMonth(1)} className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}>
              <Icon name="chevron_right" />
            </button>
          </div>

          <div className={`backdrop-blur-md rounded-xl shadow-sm p-4 border transition-all ${theme === 'light' ? 'bg-white border-gray-100 shadow-slate-200/50' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            {/* Simplified summary based on real data */}
            <div className="flex flex-col items-stretch justify-start md:flex-row md:items-center">
              <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-3 py-4 md:px-6">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-base font-medium transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                    Fatura de <span className={`capitalize transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</span>
                  </p>
                  <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-300 border border-yellow-500/30">Aberta</span>
                </div>
                <p className={`text-3xl font-bold leading-tight tracking-[-0.015em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {formatCurrency(currentInvoiceAmount)}
                </p>
              </div>
            </div>

            {/* Limit info - keeping it global as it refers to the card's current state */}
            <div className={`flex flex-col gap-3 p-4 border-t mt-4 transition-colors ${theme === 'light' ? 'border-gray-100' : 'border-white/[0.05]'}`}>
              <div className={`w-full rounded-full h-2.5 transition-colors ${theme === 'light' ? 'bg-gray-100' : 'bg-white/[0.05]'}`}>
                <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]" style={{ width: `${limitPercentage}%` }}></div>
              </div>
              <p className={`text-sm font-normal leading-normal transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                Limite Disponível (Atual): <span className={`font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{formatCurrency(availableLimit)}</span>
              </p>
            </div>
          </div>

          <div className={`backdrop-blur-md rounded-xl shadow-sm border transition-all ${theme === 'light' ? 'bg-white border-gray-100 shadow-slate-200/50' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <div className="p-6">
              <h3 className={`text-lg font-bold mb-4 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Detalhes da Fatura</h3>
              <ul className={`divide-y transition-colors ${theme === 'light' ? 'divide-gray-50' : 'divide-white/[0.05]'}`}>
                {cardTransactions.length > 0 ? cardTransactions.map(t => (
                  <li key={t.id} className={`py-4 flex items-center justify-between transition-colors px-2 rounded-lg -mx-2 ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : (theme === 'light' ? 'bg-teal-50 text-teal-600' : 'bg-white/[0.05] text-teal-400')}`}>
                        <Icon name={t.type === TransactionType.INCOME ? 'payment' : 'shopping_cart'} />
                      </div>
                      <div>
                        <p className={`font-semibold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.description}</p>
                        <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>{formatDate(t.date)}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : (theme === 'light' ? 'text-slate-900' : 'text-white')}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                  </li>
                )) : (
                  <li className={`py-8 text-center transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Nenhuma transação nesta fatura.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Month Picker Modal */}
      {isMonthPickerOpen && (
        <MonthYearPicker
          currentDate={currentDate}
          onSelect={setCurrentDate}
          onClose={() => setIsMonthPickerOpen(false)}
        />
      )}
    </div>
  );
};

// --- Month/Year Picker Component (Copied from Transactions.tsx) ---
const MonthYearPicker: React.FC<{
  currentDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}> = ({ currentDate, onSelect, onClose }) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const pickerRef = useRef<HTMLDivElement>(null);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    onSelect(newDate);
    onClose();
  };

  const isCurrentMonth = (monthIndex: number) => {
    return currentDate.getMonth() === monthIndex && currentDate.getFullYear() === selectedYear;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={pickerRef}
        className={`backdrop-blur-xl border rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-up ring-1 transition-all ${theme === 'light'
          ? 'bg-white/90 border-gray-200 ring-black/5 shadow-slate-200/50'
          : 'bg-[#0f1216]/90 border-white/[0.08] ring-white/5'
          }`}
      >
        {/* Year Selector */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/[0.05] text-gray-300'}`}
          >
            <Icon name="chevron_left" />
          </button>
          <h3 className={`text-xl font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedYear}</h3>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/[0.05] text-gray-300'}`}
          >
            <Icon name="chevron_right" />
          </button>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-3 gap-2">
          {months.map((month, index) => (
            <button
              key={month}
              onClick={() => handleMonthSelect(index)}
              className={`
                p-3 rounded-xl text-sm font-semibold transition-all
                ${isCurrentMonth(index)
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : (theme === 'light' ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]')
                }
              `}
            >
              {month.substring(0, 3)}
            </button>
          ))}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`mt-6 w-full py-3 rounded-xl font-semibold transition-colors ${theme === 'light' ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'}`}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default Invoice;
