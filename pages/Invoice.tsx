import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { Dropdown } from '../components/Dropdown';
import { MonthYearPicker } from '../components/MonthYearPicker';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { TransactionType, Card } from '../types';
import { useSearchParams, Link } from 'react-router-dom';
import { formatCurrency, formatDate, getTransactionDate } from '../utils/helpers';
import { BANKS } from '../constants';

const Invoice: React.FC = () => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const { cards, transactions, accounts, categories, updateTransaction } = useFinance();
  const [searchParams] = useSearchParams();
  const [selectedCardId, setSelectedCardId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  // Month Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);

  useEffect(() => {
    const cardIdFromUrl = searchParams.get('cardId');
    if (cardIdFromUrl) {
      setSelectedCardId(cardIdFromUrl);
    } else {
      setSelectedCardId('all');
    }
  }, [searchParams]);

  // --- Date Helpers ---
  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // --- Invoice Logic (ciclo real: fechamento -> vencimento) ---
  const getInvoiceData = (card: Card) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const closingDay = Math.min(Math.max(card.closingDay || 1, 1), 28);
    const dueDay = Math.min(Math.max(card.dueDay || 10, 1), 28);

    // Fechamento sempre no mês exibido; vencimento no mesmo mês ou no seguinte
    const closingDate = new Date(year, month, closingDay, 23, 59, 59, 999);
    const dueDate = closingDay < dueDay
      ? new Date(year, month, dueDay, 23, 59, 59, 999)
      : new Date(year, month + 1, dueDay, 23, 59, 59, 999);

    const startDate = new Date(closingDate);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const cardTransactions = transactions.filter(t => {
      if ((t as any).cardId !== card.id) return false;
      const tDate = getTransactionDate(t.date);
      tDate.setHours(12, 0, 0, 0);
      const s = new Date(startDate); s.setHours(0, 0, 0, 0);
      const e = new Date(closingDate); e.setHours(23, 59, 59, 999);
      return tDate >= s && tDate <= e;
    });

    const totalAmount = cardTransactions
      .reduce((acc, t) => acc + (t.type === TransactionType.EXPENSE ? Number(t.amount) : -Number(t.amount)), 0);

    const isClosed = new Date() > closingDate;
    const unpaidCount = cardTransactions.filter(t => !t.isPaid).length;

    return { transactions: cardTransactions, totalAmount, closingDate, dueDate, startDate, isClosed, unpaidCount };
  };

  const selectedCard = cards.find(c => c.id === selectedCardId);

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative pb-20 md:pb-0">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className={`text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Faturas</h1>

          <div className="w-full sm:w-auto min-w-[280px]">
            <Dropdown
              options={[
                { label: 'Todas as Faturas', value: 'all', icon: 'dashboard' },
                ...cards.map(card => {
                  let logo = undefined;
                  if (card.linkedAccountId) {
                    const linkedAccount = accounts.find(a => a.id === card.linkedAccountId);
                    if (linkedAccount) {
                      const bank = BANKS.find(b => b.name === linkedAccount.bankName);
                      logo = bank?.logo;
                    }
                  }
                  return { label: `${card.name} **** ${card.lastDigits}`, value: card.id, logo };
                })
              ]}
              value={selectedCardId}
              onChange={setSelectedCardId}
              className="w-full"
            />
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

        {selectedCardId === 'all' ? (
          <>
            <AllInvoicesTotal cards={cards} currentDate={currentDate} getInvoiceData={getInvoiceData} />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cards.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-500">Nenhum cartão cadastrado.</div>
              ) : cards.map(card => {
                const { totalAmount, dueDate, isClosed, unpaidCount } = getInvoiceData(card);
                const linkedAccount = accounts.find(a => a.id === card.linkedAccountId);
                const bank = linkedAccount ? BANKS.find(b => b.name === linkedAccount.bankName) : null;

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`cursor-pointer group relative overflow-hidden rounded-2xl border p-6 transition-all hover:shadow-lg ${theme === 'light'
                      ? 'bg-white border-gray-100 hover:border-teal-500/30'
                      : 'bg-[#1c1c1e] border-white/[0.05] hover:border-teal-500/30'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-full flex items-center justify-center ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'}`}>
                          {bank?.logo ? (
                            <img src={bank.logo} alt="" className="size-10 rounded-full object-cover" />
                          ) : (
                            <Icon name="credit_card" className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{card.name}</h3>
                          <p className="text-xs text-gray-500">**** {card.lastDigits}</p>
                        </div>
                      </div>
                      <Icon name="chevron_right" className="text-gray-400 group-hover:text-teal-500 transition-colors" />
                    </div>

                    <div className="mb-4">
                      <p className="text-xs text-gray-500 font-medium uppercase mb-1">Valor da Fatura</p>
                      <p className={`text-2xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        <PrivateValue>{formatCurrency(totalAmount)}</PrivateValue>
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">{unpaidCount} item(ns) em aberto</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-md font-medium ${isClosed
                        ? (theme === 'light' ? 'bg-red-100 text-red-700' : 'bg-red-500/20 text-red-400')
                        : (theme === 'light' ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-400')
                        }`}>
                        {isClosed ? 'Fechada' : 'Aberta'}
                      </span>
                      <span className="text-gray-500">Vence dia {dueDate.getDate()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : selectedCard ? (
          (() => {
            const { transactions: cardTransactions, totalAmount, dueDate, closingDate, isClosed, unpaidCount } = getInvoiceData(selectedCard);
            const limitPercentage = selectedCard.limit > 0 ? Math.min((totalAmount / selectedCard.limit) * 100, 100) : 0;
            const availableLimit = selectedCard.limit - totalAmount;
            const filtered = cardTransactions
              .filter(t => !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase()))
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const handlePayInvoice = async () => {
              const unpaid = cardTransactions.filter(t => !t.isPaid);
              if (unpaid.length === 0) {
                toast.info('Fatura já está paga.');
                return;
              }
              if (!window.confirm(`Marcar ${unpaid.length} item(ns) de ${formatCurrency(totalAmount)} como pagos?`)) return;
              setIsPaying(true);
              try {
                await Promise.all(unpaid.map(t => updateTransaction(t.id, { isPaid: true })));
                toast.success('Fatura paga!');
              } catch (e: any) {
                toast.error('Erro ao pagar: ' + e.message);
              } finally {
                setIsPaying(false);
              }
            };

            return (
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow lg:w-2/3 space-y-6">
                  <button onClick={() => setSelectedCardId('all')} className={`text-xs font-bold flex items-center gap-1 ${theme === 'light' ? 'text-slate-500 hover:text-slate-800' : 'text-gray-400 hover:text-white'}`}>
                    <Icon name="arrow_back" className="text-sm" /> Todas as faturas
                  </button>
                  <div className={`backdrop-blur-md rounded-xl shadow-sm p-4 border transition-all ${theme === 'light' ? 'bg-white border-gray-100 shadow-slate-200/50' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                    <div className="flex flex-col items-stretch justify-start md:flex-row md:items-center">
                      <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-3 py-4 md:px-6">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-base font-medium transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                            Fatura de <span className={`capitalize transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</span>
                          </p>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${isClosed
                            ? 'bg-red-500/15 text-red-400 border-red-500/30'
                            : 'bg-green-500/15 text-green-400 border-green-500/30'}`}>{isClosed ? 'Fechada' : 'Aberta'}</span>
                        </div>
                        <p className={`text-3xl font-bold leading-tight tracking-[-0.015em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                          <PrivateValue>{formatCurrency(totalAmount)}</PrivateValue>
                        </p>
                        <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                          Fecha dia {closingDate.getDate()} • Vence dia {dueDate.getDate()} • {unpaidCount} em aberto
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <button onClick={handlePayInvoice} disabled={isPaying || unpaidCount === 0} className="px-4 h-10 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 disabled:opacity-50 flex items-center gap-2">
                            <Icon name="payments" /> {isPaying ? 'Pagando...' : 'Pagar fatura'}
                          </button>
                          <Link to={`/transactions?action=new`} className={`px-4 h-10 rounded-xl border text-xs font-bold flex items-center gap-2 ${theme === 'light' ? 'bg-white border-gray-200 text-slate-700' : 'bg-white/[0.05] border-white/[0.1] text-gray-200'}`}>
                            <Icon name="add" /> Lançar gasto
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className={`flex flex-col gap-3 p-4 border-t mt-4 transition-colors ${theme === 'light' ? 'border-gray-100' : 'border-white/[0.05]'}`}>
                      <div className={`w-full rounded-full h-2.5 transition-colors ${theme === 'light' ? 'bg-gray-100' : 'bg-white/[0.05]'}`}>
                        <div className="bg-teal-500 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]" style={{ width: `${limitPercentage}%` }}></div>
                      </div>
                      <p className={`text-sm font-normal leading-normal transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                        Limite Disponível: <span className={`font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(availableLimit)}</PrivateValue></span>
                        <span className="ml-2 text-xs">({limitPercentage.toFixed(0)}% usado)</span>
                      </p>
                    </div>
                  </div>

                  <div className={`backdrop-blur-md rounded-xl shadow-sm border transition-all ${theme === 'light' ? 'bg-white border-gray-100 shadow-slate-200/50' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                    <div className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h3 className={`text-lg font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Detalhes da Fatura</h3>
                        <div className="relative">
                          <Icon name="search" className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`} />
                          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar na fatura..." className={`pl-9 pr-3 py-2 rounded-lg border text-sm outline-none ${theme === 'light' ? 'bg-white border-gray-200 text-slate-900 placeholder-slate-400' : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-500'}`} />
                        </div>
                      </div>
                      <ul className={`divide-y transition-colors ${theme === 'light' ? 'divide-gray-50' : 'divide-white/[0.05]'}`}>
                        {filtered.length > 0 ? filtered.map(t => {
                          const cat = categories.find(c => c.name === t.category);
                          return (
                            <li key={t.id} className={`py-4 flex items-center justify-between transition-colors px-2 rounded-lg -mx-2 ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.02]'}`}>
                              <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: `${cat?.color || '#14b8a6'}20`, color: cat?.color || '#14b8a6' }}>
                                  <Icon name={cat?.icon || (t.type === TransactionType.INCOME ? 'payment' : 'shopping_cart')} />
                                </div>
                                <div>
                                  <p className={`font-semibold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.description}</p>
                                  <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>{t.category} • {formatDate(t.date)}{t.installments && t.installments > 1 ? ` • ${t.installmentNumber}/${t.installments}` : ''} • {t.isPaid ? 'Paga' : 'Em aberto'}</p>
                                </div>
                              </div>
                              <p className={`font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : (theme === 'light' ? 'text-slate-900' : 'text-white')}`}>
                                <PrivateValue>{t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}</PrivateValue>
                              </p>
                            </li>
                          );
                        }) : (
                          <li className={`py-8 text-center transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>{searchTerm ? 'Nada encontrado para a busca.' : 'Nenhuma transação nesta fatura.'}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="p-10 text-center text-gray-400">Cartão não encontrado.</div>
        )}
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

const AllInvoicesTotal: React.FC<{ cards: Card[]; currentDate: Date; getInvoiceData: (c: Card) => { totalAmount: number } }> = ({ cards, currentDate, getInvoiceData }) => {
  const { theme } = useTheme();
  const totals = useMemo(() => {
    const per = cards.map(c => getInvoiceData(c).totalAmount);
    const total = per.reduce((s, v) => s + v, 0);
    return { total, count: cards.length };
  }, [cards, currentDate, getInvoiceData]);
  if (cards.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
      <div>
        <p className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Total das faturas • {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</p>
        <p className={`text-2xl font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(totals.total)}</PrivateValue></p>
      </div>
      <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{totals.count} cartão(ões)</p>
    </div>
  );
};

export default Invoice;
