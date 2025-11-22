import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';
import { formatCurrency } from '../utils/helpers';

const Calendar: React.FC = () => {
  const { transactions } = useFinance();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Navegação de Mês
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setSelectedDate(newDate); // Reseta seleção para o novo mês
  };

  // Utilitários de Data
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Helper para normalizar datas das transações
  const getTransactionDate = (dateStr: string) => {
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Fallback para formato Mock
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

  // Agrupar transações por dia
  const getTransactionsForDay = (day: number) => {
    return transactions.filter(t => {
      const tDate = getTransactionDate(t.date);
      return tDate.getDate() === day &&
        tDate.getMonth() === currentDate.getMonth() &&
        tDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Cabeçalho dos dias
    const header = daysOfWeek.map(day => (
      <div key={day} className="h-8 flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
        {day}
      </div>
    ));

    // Dias vazios antes do dia 1
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-16 md:h-20 bg-white/[0.01] border border-white/[0.05]"></div>);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const dayTransactions = getTransactionsForDay(day);
      const hasIncome = dayTransactions.some(t => t.type === TransactionType.INCOME);
      const hasExpense = dayTransactions.some(t => t.type === TransactionType.EXPENSE);

      // Totais do dia
      const dayIncome = dayTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const dayExpense = dayTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);

      const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth();
      const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          className={`
            h-16 md:h-20 border border-white/[0.05] p-1 md:p-2 cursor-pointer transition-all flex flex-col justify-between group
            ${isSelected ? 'bg-teal-500/10 border-teal-500/50 shadow-[inset_0_0_20px_rgba(45,212,191,0.1)]' : 'bg-white/[0.02] hover:bg-white/[0.05]'}
          `}
        >
          <div className="flex justify-between items-start">
            <span className={`
              text-sm font-bold size-7 flex items-center justify-center rounded-full
              ${isToday ? 'bg-teal-500 text-white shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'text-gray-300'}
            `}>
              {day}
            </span>
            <div className="flex gap-1">
              {hasIncome && <div className="size-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>}
              {hasExpense && <div className="size-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>}
            </div>
          </div>

          <div className="flex flex-col gap-0.5 mt-1">
            {dayIncome > 0 && (
              <p className="text-[10px] text-green-400 font-bold truncate text-right bg-green-500/10 rounded px-1 py-0.5 border border-green-500/20">
                +{formatCurrency(dayIncome).replace('R$', '')}
              </p>
            )}
            {dayExpense > 0 && (
              <p className="text-[10px] text-red-400 font-bold truncate text-right bg-red-500/10 rounded px-1 py-0.5 border border-red-500/20">
                -{formatCurrency(dayExpense).replace('R$', '')}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-white/[0.05] border border-white/[0.05] rounded-xl overflow-hidden shadow-sm backdrop-blur-md">
        {header}
        {days}
      </div>
    );
  };

  const selectedDayTransactions = getTransactionsForDay(selectedDate.getDate());

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0 h-full">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">Calendário</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Visualize suas movimentações por data.</p>
        </div>

        <div className="flex items-center justify-between bg-white/[0.05] border border-white/[0.1] p-1 rounded-xl shadow-sm min-w-[200px] backdrop-blur-md">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/[0.1] rounded-lg text-gray-400 transition-colors">
            <Icon name="chevron_left" />
          </button>
          <span className="text-sm font-bold text-white capitalize">
            {monthName}
          </span>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/[0.1] rounded-lg text-gray-400 transition-colors">
            <Icon name="chevron_right" />
          </button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 h-full">
        {/* Calendário */}
        <div className="flex-1">
          {renderCalendarDays()}
        </div>

        {/* Detalhes do Dia Selecionado */}
        <div className="w-full xl:w-80 shrink-0">
          <div className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05] p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/[0.05]">
              <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/20">
                <Icon name="calendar_month" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Movimentações de</p>
                <h3 className="text-lg font-bold text-white">
                  {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                </h3>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
              {selectedDayTransactions.length > 0 ? (
                selectedDayTransactions.map(t => (
                  <div key={t.id} className="p-3 rounded-xl bg-white/[0.03] flex items-center justify-between gap-3 border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-bold text-white truncate">{t.description}</p>
                      <span className="text-[10px] text-gray-400 bg-white/[0.05] px-1.5 py-0.5 rounded w-fit mt-1 border border-white/[0.05]">
                        {t.category}
                      </span>
                    </div>
                    <p className={`text-sm font-bold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                  <Icon name="event_busy" className="text-3xl mb-2 opacity-50" />
                  <p className="text-sm text-center">Nenhuma transação <br />neste dia.</p>
                </div>
              )}
            </div>

            {selectedDayTransactions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/[0.05] flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400">Saldo do dia</span>
                <span className={`text-base font-black ${selectedDayTransactions.reduce((acc, t) => acc + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0) >= 0
                  ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {formatCurrency(selectedDayTransactions.reduce((acc, t) => acc + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
