import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../components/Icon';
import { Dropdown } from '../components/Dropdown';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { useSearchParams } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/helpers';

import { BANKS } from '../constants';

const Invoice: React.FC = () => {
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

  // 2. Filter by Month
  const cardTransactions = cardTransactionsAll.filter(t => {
    const tDate = getTransactionDate(t.date);
    return tDate.getMonth() === currentDate.getMonth() && tDate.getFullYear() === currentDate.getFullYear();
  });

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
            <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Faturas de Cartão</h1>
            <div className="w-full sm:w-auto min-w-[280px]">
              <label className="flex flex-col">
                <p className="text-sm font-medium leading-normal pb-2 text-gray-400">Selecione o Cartão</p>
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
          <div className="flex items-center justify-between bg-white/[0.02] backdrop-blur-md border border-white/[0.05] p-1 rounded-xl shadow-sm w-full md:max-w-md mx-auto">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <Icon name="chevron_left" />
            </button>
            <button
              onClick={() => setIsMonthPickerOpen(true)}
              className="flex flex-col items-center px-4 py-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <span className="text-sm font-bold text-white capitalize leading-none">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
              </span>
              <span className="text-[10px] text-gray-500 font-medium leading-none mt-1">
                {currentDate.getFullYear()}
              </span>
            </button>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <Icon name="chevron_right" />
            </button>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm p-4 border border-white/[0.05]">
            {/* Simplified summary based on real data */}
            <div className="flex flex-col items-stretch justify-start md:flex-row md:items-center">
              <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-3 py-4 md:px-6">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-medium text-gray-400">
                    Fatura de <span className="capitalize text-white">{currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</span>
                  </p>
                  <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-xs font-semibold text-yellow-300 border border-yellow-500/30">Aberta</span>
                </div>
                <p className="text-white text-3xl font-bold leading-tight tracking-[-0.015em]">
                  {formatCurrency(currentInvoiceAmount)}
                </p>
              </div>
            </div>

            {/* Limit info - keeping it global as it refers to the card's current state */}
            <div className="flex flex-col gap-3 p-4 border-t border-white/[0.05] mt-4">
              <div className="w-full rounded-full bg-white/[0.05] h-2.5">
                <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]" style={{ width: `${limitPercentage}%` }}></div>
              </div>
              <p className="text-gray-400 text-sm font-normal leading-normal">
                Limite Disponível (Atual): <span className="text-white font-bold">{formatCurrency(availableLimit)}</span>
              </p>
            </div>
          </div>

          <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05]">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Detalhes da Fatura</h3>
              <ul className="divide-y divide-white/[0.05]">
                {cardTransactions.length > 0 ? cardTransactions.map(t => (
                  <li key={t.id} className="py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors px-2 rounded-lg -mx-2">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : 'bg-white/[0.05] text-teal-400'}`}>
                        <Icon name={t.type === TransactionType.INCOME ? 'payment' : 'shopping_cart'} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{t.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(t.date)}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-white'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                  </li>
                )) : (
                  <li className="py-8 text-center text-gray-500">Nenhuma transação nesta fatura.</li>
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
        className="bg-[#0f1216]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-up ring-1 ring-white/5"
      >
        {/* Year Selector */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelectedYear(selectedYear - 1)}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <Icon name="chevron_left" className="text-gray-300" />
          </button>
          <h3 className="text-xl font-bold text-white">{selectedYear}</h3>
          <button
            onClick={() => setSelectedYear(selectedYear + 1)}
            className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <Icon name="chevron_right" className="text-gray-300" />
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
                  : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
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
          className="mt-6 w-full py-3 rounded-xl bg-white/[0.05] text-gray-300 font-semibold hover:bg-white/[0.1] transition-colors"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default Invoice;
