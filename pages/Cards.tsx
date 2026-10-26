import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, getTransactionDate, calculateCurrentInvoiceAmount } from '../utils/helpers';
import { Card, TransactionType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { BANKS } from '../constants';

import { ImportInvoiceModal } from '../components/ImportInvoiceModal';

const BRAND_LABEL: Record<string, string> = {
  mastercard: 'Mastercard',
  visa: 'Visa',
  amex: 'Amex',
  elo: 'Elo',
  other: 'Outra',
};

const Cards: React.FC = () => {
  const { theme } = useTheme();
  const { cards, transactions, categories, accounts, addCard, updateCard, deleteCard } = useFinance();
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCard = (cardId: string) => {
    if (expandedCardId === cardId) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(cardId);
      const idx = cards.findIndex(c => c.id === cardId);
      if (idx >= 0) setActiveIndex(idx);
    }
  };

  const goToCard = (index: number) => {
    const total = cards.length;
    if (total === 0) return;
    const next = ((index % total) + total) % total;
    setActiveIndex(next);
    setExpandedCardId(cards[next].id);
  };

  // Totais consolidados — usa sempre o valor da fatura atual (mesmo cálculo do card)
  const perCardInvoice = cards.map(card => calculateCurrentInvoiceAmount(card, transactions));
  const totalLimit = cards.reduce((sum, c) => sum + Number(c.limit || 0), 0);
  const totalUsed = perCardInvoice.reduce((sum, v) => sum + Number(v || 0), 0);
  const totalAvailable = Math.max(totalLimit - totalUsed, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative pb-20 md:pb-0 min-h-[80vh]">
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-20">
        <h1 className={`text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Meus Cartões</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className={`flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-medium leading-normal gap-2 transition-colors border ${theme === 'light'
              ? 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
              : 'bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1]'
              }`}
          >
            <Icon name="upload_file" />
            <span className="truncate hidden md:inline">Importar</span>
          </button>
          <Link
            to="/invoice"
            className={`flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 text-sm font-medium leading-normal gap-2 transition-colors border ${theme === 'light'
              ? 'bg-white border-gray-200 text-slate-700 hover:bg-gray-50'
              : 'bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1]'
              }`}
          >
            <Icon name="receipt_long" />
            <span className="truncate hidden md:inline">Ver Faturas</span>
          </Link>
          <button
            onClick={() => setIsNewCardModalOpen(true)}
            className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-teal-500 text-white text-sm font-medium leading-normal gap-2 hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
          >
            <Icon name="add_card" />
            <span className="truncate hidden md:inline">Novo Cartão</span>
            <span className="md:hidden">Novo</span>
          </button>
        </div>
      </div>

      {cards.length > 0 && (
        <div className={`grid grid-cols-3 gap-3 p-4 rounded-2xl border ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Limite total</p>
            <p className={`text-base font-black ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(totalLimit)}</PrivateValue></p>
          </div>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Usado</p>
            <p className="text-base font-black text-amber-500"><PrivateValue>{formatCurrency(totalUsed)}</PrivateValue></p>
          </div>
          <div>
            <p className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Disponível</p>
            <p className="text-base font-black text-teal-500"><PrivateValue>{formatCurrency(totalAvailable)}</PrivateValue></p>
          </div>
        </div>
      )}

      {!isDesktop && cards.length > 1 && (
        <div className="flex items-center gap-2">
          <button onClick={() => goToCard(activeIndex - 1)} className={`p-2 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200 text-slate-600' : 'bg-white/[0.05] border-white/[0.1] text-gray-300'}`} aria-label="Cartão anterior">
            <Icon name="chevron_left" />
          </button>
          <div className="flex-1 flex gap-2 overflow-x-auto py-1">
            {cards.map((c, i) => (
              <button
                key={c.id}
                onClick={() => goToCard(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${expandedCardId === c.id || (!expandedCardId && i === activeIndex)
                  ? 'bg-teal-500 text-white border-teal-500'
                  : (theme === 'light' ? 'bg-white border-gray-200 text-slate-600' : 'bg-white/[0.05] border-white/[0.1] text-gray-300')}`}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name} •• {c.lastDigits}
              </button>
            ))}
          </div>
          <button onClick={() => goToCard(activeIndex + 1)} className={`p-2 rounded-lg border ${theme === 'light' ? 'bg-white border-gray-200 text-slate-600' : 'bg-white/[0.05] border-white/[0.1] text-gray-300'}`} aria-label="Próximo cartão">
            <Icon name="chevron_right" />
          </button>
        </div>
      )}

      <div
        className="relative w-full max-w-md mx-auto mt-2 perspective-1000 md:max-w-none md:perspective-none md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6"
        style={{ height: isDesktop ? 'auto' : (expandedCardId ? 'auto' : Math.max(340, 260 + Math.max(cards.length - 1, 0) * 60 + 20)) }}
      >
        <AnimatePresence>
          {cards.map((card, index) => {
            const isExpanded = expandedCardId === card.id;
            const isBlocked = card.status === 'blocked';
            const accentColor = card.color === '#000000' ? '#374151' : card.color;
            const currentInvoiceAmount = perCardInvoice[index] ?? calculateCurrentInvoiceAmount(card, transactions);

            const limitPercentage = card.limit > 0 ? Math.min((currentInvoiceAmount / card.limit) * 100, 100) : 0;
            const showAlert = limitPercentage >= 80;

            const isAnyExpanded = expandedCardId !== null;

            // Find linked account and bank logo
            const linkedAccount = accounts.find(a => a.id === card.linkedAccountId);
            const bank = linkedAccount ? BANKS.find(b => b.name === linkedAccount.bankName) : null;
            const bankLogo = bank?.logo;

            // Filter transactions for this card (current month)
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const cardTransactions = transactions.filter(t => {
              if (t.cardId !== card.id) return false;
              const tDate = getTransactionDate(t.date);
              return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
            }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <motion.div
                key={card.id}
                layout
                initial={false}
                animate={{
                  y: isDesktop ? 0 : (isExpanded ? 0 : (isAnyExpanded ? 1000 : index * 60)),
                  scale: isDesktop ? 1 : (isExpanded ? 1 : (isAnyExpanded ? 0.95 : 1 - index * 0.03)),
                  zIndex: isExpanded ? 50 : (cards.length - index),
                  opacity: isDesktop ? 1 : (isAnyExpanded && !isExpanded ? 0 : 1)
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                onClick={() => toggleCard(card.id)}
                role="button"
                aria-expanded={isExpanded}
                aria-label={`${card.name} final ${card.lastDigits}`}
                className={`
                  absolute w-full left-0 cursor-pointer rounded-2xl shadow-2xl overflow-hidden border
                  md:relative md:w-full md:left-auto
                  ${isExpanded ? 'h-auto min-h-[340px]' : 'h-[260px] hover:brightness-110'}
                  ${theme === 'light'
                    ? 'bg-white border-gray-100 shadow-slate-200/50'
                    : 'bg-[#1c1c1e] border-white/[0.05] shadow-black/40'
                  }
                `}
                style={{
                  transformOrigin: 'top center',
                  top: 0
                }}
              >
                {/* Colored Strip */}
                <div className="h-2 w-full" style={{ backgroundColor: accentColor }}></div>

                <div className={`p-6 flex flex-col h-full relative ${theme === 'light' ? 'bg-gradient-to-b from-gray-50 to-transparent' : 'bg-gradient-to-b from-white/[0.05] to-transparent'}`}>
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`size-12 rounded-xl flex items-center justify-center shadow-inner transition-colors overflow-hidden ${theme === 'light' ? 'bg-gray-100' : 'bg-white/[0.1]'}`}>
                      {bankLogo ? (
                        <img src={bankLogo} alt={bank?.name} className="w-full h-full object-cover" />
                      ) : (
                        <Icon name="credit_card" className={theme === 'light' ? 'text-slate-600' : 'text-white/80'} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className={`text-lg font-bold truncate pr-6 drop-shadow-md transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} title={card.name}>{card.name}</h3>
                        {isExpanded && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCard(card);
                            }}
                            className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${theme === 'light'
                              ? 'text-slate-400 hover:text-slate-600 bg-gray-100 hover:bg-gray-200'
                              : 'text-gray-400 hover:text-white bg-black/20 hover:bg-black/40'}`}
                          >
                            <Icon name="edit" className="text-lg" />
                          </motion.button>
                        )}
                      </div>
                      <p className={`text-sm font-mono tracking-wider transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>**** **** **** {card.lastDigits}</p>
                    </div>
                  </div>

                  {/* Content - Only fully visible when expanded or top of stack (conceptually) */}
                  <div className={`mt-auto space-y-4 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-80'}`}>
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className={`text-xs font-bold uppercase tracking-wider transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Fatura Atual</p>
                          <Link
                            to={`/invoice?cardId=${card.id}`}
                            className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors hover:underline ${theme === 'light' ? 'text-teal-600' : 'text-teal-400'}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon name="receipt_long" className="text-[12px]" />
                            Ver Fatura
                          </Link>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <p className={`text-2xl font-bold transition-colors ${isBlocked ? 'text-gray-500' : (theme === 'light' ? 'text-slate-900' : 'text-white')}`}>
                            <PrivateValue>{formatCurrency(currentInvoiceAmount)}</PrivateValue>
                          </p>
                        </div>
                      </div>
                      {card.brand === 'mastercard' ? (
                        <img src="/card-assets/logo-master.svg" alt="Mastercard" className="h-8 mb-1" />
                      ) : (
                        <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border mb-1 ${theme === 'light' ? 'bg-gray-100 border-gray-200 text-slate-600' : 'bg-white/[0.06] border-white/[0.1] text-gray-200'}`}>
                          {BRAND_LABEL[card.brand] || card.brand}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className={`w-full rounded-full h-2 overflow-hidden border transition-colors ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-black/30 border-white/5'}`}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${limitPercentage}%` }}
                          transition={{ delay: 0.2, duration: 1 }}
                          className={`h-full rounded-full ${limitPercentage >= 100 ? 'bg-gradient-to-r from-red-600 to-red-400' : limitPercentage >= 80 ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 'bg-gradient-to-r from-teal-600 to-teal-400'}`}
                        />
                      </div>
                      <div className={`flex justify-between items-center text-xs font-medium transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
                        <span>{limitPercentage.toFixed(0)}% utilizado (<PrivateValue>{formatCurrency(currentInvoiceAmount)}</PrivateValue>)</span>
                        <span><PrivateValue>{formatCurrency(card.limit)}</PrivateValue></span>
                      </div>
                      {showAlert && (
                        <p className={`text-[11px] font-bold flex items-center gap-1 ${limitPercentage >= 100 ? 'text-red-500' : 'text-amber-500'}`}>
                          <Icon name="warning" className="text-sm" />
                          {limitPercentage >= 100 ? 'Limite estourado' : 'Atenção: limite quase no fim'}
                        </p>
                      )}
                      <div className={`flex justify-between items-center text-[11px] mt-1 font-medium transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-white'}`}>
                        <span>Fecha dia {card.closingDay}</span>
                        <span>Vence dia {card.dueDay}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className={`mt-6 pt-6 border-t transition-colors ${theme === 'light' ? 'border-gray-100' : 'border-white/10'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`text-sm font-bold uppercase tracking-wider transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Fatura de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</h4>
                          <Link to={`/invoice?cardId=${card.id}`} className="text-xs text-teal-500 hover:text-teal-400 flex items-center gap-1 font-bold">
                            Ver histórico <Icon name="arrow_forward" className="text-sm" />
                          </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/invoice?cardId=${card.id}`} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 transition-colors">
                            <Icon name="payments" className="text-base" /> Pagar
                          </Link>
                          <button
                            onClick={() => updateCard(card.id, { status: isBlocked ? 'active' : 'blocked' })}
                            className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-bold transition-colors ${isBlocked
                              ? 'bg-green-500/10 border-green-500/30 text-green-500'
                              : (theme === 'light' ? 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50' : 'bg-white/[0.05] border-white/[0.1] text-gray-300 hover:bg-white/[0.1]')}`}
                          >
                            <Icon name={isBlocked ? 'lock_open' : 'lock'} className="text-base" />
                            {isBlocked ? 'Desbloquear' : 'Bloquear'}
                          </button>
                          <button
                            onClick={() => setExpandedCardId(null)}
                            className={`flex items-center justify-center gap-1.5 h-10 rounded-xl border text-xs font-bold transition-colors ${theme === 'light' ? 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50' : 'bg-white/[0.05] border-white/[0.1] text-gray-300 hover:bg-white/[0.1]'}`}
                          >
                            <Icon name="close" className="text-base" /> Fechar
                          </button>
                        </div>
                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                          {cardTransactions.length > 0 ? (
                            cardTransactions.map(t => {
                              const category = categories.find(c => c.name === t.category);
                              const iconName = category?.icon || 'category';
                              const iconColor = category?.color || '#9ca3af';

                              return (
                                <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl transition-all border ${theme === 'light'
                                  ? 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                                  : 'bg-white/[0.03] border-white/[0.02] hover:bg-white/[0.06]'
                                  }`}>
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="size-10 rounded-full flex items-center justify-center text-white shadow-lg"
                                      style={{ backgroundColor: `${iconColor}20`, color: iconColor }}
                                    >
                                      <Icon name={iconName} className="text-lg" />
                                    </div>
                                    <div>
                                      <p className={`text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.description}</p>
                                      <div className="flex items-center gap-2">
                                        <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{formatDate(t.date)}</p>
                                        {t.installments && t.installments > 1 && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${theme === 'light' ? 'bg-gray-200 text-slate-600' : 'bg-white/10 text-gray-300'}`}>
                                            {t.installmentNumber}/{t.installments}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`text-sm font-bold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-500' : (theme === 'light' ? 'text-slate-900' : 'text-white')}`}>
                                    <PrivateValue>{t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}</PrivateValue>
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8">
                              <div className={`size-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${theme === 'light' ? 'bg-gray-100' : 'bg-white/[0.05]'}`}>
                                <Icon name="receipt_long" className="text-gray-500 text-xl" />
                              </div>
                              <p className="text-sm text-gray-400">Nenhuma transação nesta fatura.</p>
                            </div>
                          )}
                        </div>

                        <div className={`mt-4 pt-4 border-t flex justify-between items-center transition-colors ${theme === 'light' ? 'border-gray-100' : 'border-white/10'}`}>
                          <span className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Total deste mês</span>
                          <span className={`text-lg font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            <PrivateValue>{formatCurrency(cardTransactions.reduce((acc, t) => t.type === TransactionType.EXPENSE ? acc + t.amount : acc - t.amount, 0))}</PrivateValue>
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Placeholder for empty state or add card at bottom of stack if needed */}
        {cards.length === 0 && (
          <button
            onClick={() => setIsNewCardModalOpen(true)}
            className={`w-full h-[240px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all group ${theme === 'light'
              ? 'border-gray-200 text-slate-400 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50'
              : 'border-white/[0.1] text-gray-400 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/5'
              }`}
          >
            <div className={`size-16 rounded-full flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-gray-100 group-hover:bg-teal-100' : 'bg-white/[0.05] group-hover:bg-teal-500/20'}`}>
              <Icon name="add" className="text-3xl" />
            </div>
            <span className="font-bold text-base">Adicionar seu primeiro cartão</span>
          </button>
        )}
      </div>

      {/* Overlay to close when clicking outside */}
      {expandedCardId && !isDesktop && (
        <div
          className="fixed inset-0 z-[35]"
          onClick={() => setExpandedCardId(null)}
        />
      )}

      {isNewCardModalOpen && (
        <NewCardModal onClose={() => setIsNewCardModalOpen(false)} onSave={addCard} />
      )}

      {editingCard && (
        <EditCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(updatedData) => {
            updateCard(editingCard.id, updatedData);
            setEditingCard(null);
          }}
          deleteCard={deleteCard}
        />
      )}

      {isImportModalOpen && (
        <ImportInvoiceModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
};

// Helper component for form rows - defined outside to prevent recreation
const FormRow: React.FC<{ icon: string; label: string; children: React.ReactNode }> = ({ icon, label, children }) => {
  const { theme } = useTheme();
  return (
    <div className={`flex items-center justify-between py-3 border-b transition-colors ${theme === 'light' ? 'border-gray-100' : 'border-white/[0.05]'}`}>
      <div className={`flex items-center gap-3 shrink-0 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>
        <Icon name={icon} className="text-xl" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex-1 flex justify-end min-w-0 ml-4">
        {children}
      </div>
    </div>
  );
};

const NewCardModal: React.FC<{ onClose: () => void; onSave: (c: any) => void }> = ({ onClose, onSave }) => {
  const { accounts } = useFinance();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const inputText = isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-gray-600';
  const [name, setName] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [limit, setLimit] = useState('');
  const [currentInvoice, setCurrentInvoice] = useState('');
  const [closingDay, setClosingDay] = useState('1');
  const [dueDay, setDueDay] = useState('10');
  const [color, setColor] = useState('#820ad1');
  const [brand, setBrand] = useState('mastercard');
  const [linkedAccountId, setLinkedAccountId] = useState('');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      lastDigits,
      limit: parseFloat(limit),
      currentInvoice: parseFloat(currentInvoice || '0'),
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color,
      brand,
      status: 'active',
      imageUrl: '',
      linkedAccountId: linkedAccountId || undefined
    });
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Novo Cartão"
      headerActions={
        <button
          onClick={handleSubmit}
          className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-full transition-colors"
        >
          Salvar
        </button>
      }
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <div className="space-y-1">

          {/* Nome e Cor */}
          <FormRow icon="sort" label="Nome do Cartão">
            <div className="flex items-center gap-3 w-full justify-end">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Descrição"
                className={`w-full max-w-[180px] bg-transparent text-right outline-none text-sm ${inputText}`}
              />
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                  className="size-6 rounded-full cursor-pointer ring-2 ring-white/20 hover:ring-white/50 transition-all"
                  style={{ backgroundColor: color }}
                />
                {isColorPickerOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsColorPickerOpen(false)}
                    />
                    <div className="absolute right-0 top-8 bg-[#1a1d21] border border-white/10 p-2 rounded-lg grid grid-cols-4 gap-2 z-50 shadow-xl w-[140px]">
                      {['#820ad1', '#ff7a00', '#000000', '#137fec', '#ef4444', '#16a34a', '#eab308', '#ec4899'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setColor(c);
                            setIsColorPickerOpen(false);
                          }}
                          className="size-6 rounded-full hover:scale-110 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </FormRow>

          {/* Limite */}
          <FormRow icon="attach_money" label="Limite">
            <div className={`flex items-center gap-1 ${inputText}`}>
              <span className="text-gray-500 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                placeholder="0,00"
                className={`bg-transparent text-right outline-none w-28 font-medium ${inputText}`}
              />
            </div>
          </FormRow>

          {/* Fatura Atual */}
          <FormRow icon="receipt" label="Fatura Atual">
            <div className={`flex items-center gap-1 ${inputText}`}>
              <span className="text-gray-500 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                value={currentInvoice}
                onChange={e => setCurrentInvoice(e.target.value)}
                placeholder="0,00"
                className={`bg-transparent text-right outline-none w-28 font-medium ${inputText}`}
              />
            </div>
          </FormRow>

          {/* Bandeira */}
          <FormRow icon="credit_card" label="Bandeira">
            <div className="w-40">
              <Dropdown
                options={[
                  { label: 'Mastercard', value: 'mastercard' },
                  { label: 'Visa', value: 'visa' },
                  { label: 'Amex', value: 'amex' },
                  { label: 'Elo', value: 'elo' }
                ]}
                value={brand}
                onChange={setBrand}
                className="w-full text-right"
                minimal
              />
            </div>
          </FormRow>

          {/* Conta Vinculada */}
          <FormRow icon="account_balance" label="Conta Vinculada">
            <div className="w-48 flex items-center justify-end gap-2">
              <Dropdown
                options={[
                  { label: 'Nenhuma', value: '' },
                  ...accounts.map(a => {
                    const bank = BANKS.find(b => b.name === a.bankName);
                    return {
                      label: a.name,
                      value: a.id,
                      logo: bank?.logo
                    };
                  })
                ]}
                value={linkedAccountId}
                onChange={setLinkedAccountId}
                className="w-full text-right"
                minimal
              />
              <Icon name="help" className="text-gray-600 text-xs cursor-help shrink-0" title="Vincular a uma conta para débito automático" />
            </div>
          </FormRow>

          {/* Dia Fechamento */}
          <FormRow icon="event_note" label="Dia do Fechamento">
            <div className="w-20">
              <Dropdown
                options={Array.from({ length: 31 }, (_, i) => ({
                  label: (i + 1).toString().padStart(2, '0'),
                  value: (i + 1).toString()
                }))}
                value={closingDay}
                onChange={setClosingDay}
                minimal
                className="text-right"
              />
            </div>
          </FormRow>

          {/* Dia Vencimento */}
          <FormRow icon="event" label="Dia do Vencimento">
            <div className="w-20">
              <Dropdown
                options={Array.from({ length: 31 }, (_, i) => ({
                  label: (i + 1).toString().padStart(2, '0'),
                  value: (i + 1).toString()
                }))}
                value={dueDay}
                onChange={setDueDay}
                minimal
                className="text-right"
              />
            </div>
          </FormRow>

          {/* Importação de Pagamentos */}
          <div className="mt-8">
            <p className="text-xs text-gray-500 mb-3 px-1 uppercase tracking-wider font-bold">Últimos 4 dígitos</p>
            <div className={`border rounded-xl p-4 ${isLight ? 'border-gray-200 bg-gray-50' : 'border-white/[0.1] bg-white/[0.02]'}`}>
              <input
                type="text"
                maxLength={4}
                value={lastDigits}
                onChange={e => setLastDigits(e.target.value)}
                placeholder="1234"
                className={`w-full bg-transparent text-sm outline-none ${inputText}`}
              />
            </div>
          </div>

        </div>
      </form>
    </Modal>
  );
};

const EditCardModal: React.FC<{ card: Card; onClose: () => void; onSave: (c: Partial<Card>) => void; deleteCard: (id: string) => Promise<void> }> = ({ card, onClose, onSave, deleteCard }) => {
  const [name, setName] = useState(card.name);
  const [lastDigits, setLastDigits] = useState(card.lastDigits);
  const [limit, setLimit] = useState(card.limit.toString());
  const [currentInvoice, setCurrentInvoice] = useState(card.currentInvoice.toString());
  const [closingDay, setClosingDay] = useState(card.closingDay.toString());
  const [dueDay, setDueDay] = useState(card.dueDay.toString());
  const [color, setColor] = useState(card.color);
  const [brand, setBrand] = useState(card.brand);
  const [status, setStatus] = useState(card.status);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      lastDigits,
      limit: parseFloat(limit),
      currentInvoice: parseFloat(currentInvoice),
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color,
      brand,
      status
    });
    onClose();
  };

  const colors = ['#820ad1', '#ff7a00', '#000000', '#137fec', '#ef4444', '#16a34a', '#eab308', '#ec4899'];

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este cartão? Todas as transações associadas também serão excluídas.')) {
      await deleteCard(card.id);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Editar Cartão"
      headerActions={
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors"
          title="Excluir Cartão"
        >
          <Icon name="delete" />
        </button>
      }
      maxWidth="max-w-sm"
      noPadding
    >
      <div className="p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Apelido</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider text-center">Cor</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                  className="size-[38px] rounded-lg border border-white/10 flex items-center justify-center transition-all hover:border-white/30"
                  style={{ backgroundColor: color }}
                >
                  <Icon name="palette" className="text-white/50 text-sm mix-blend-difference" />
                </button>
                {isColorPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsColorPickerOpen(false)} />
                    <div className="absolute right-0 top-11 bg-[#1a1d21] border border-white/10 p-2 rounded-xl grid grid-cols-4 gap-2 z-50 shadow-2xl w-[140px] animate-scale-up">
                      {colors.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setColor(c); setIsColorPickerOpen(false); }}
                          className={`size-6 rounded-full hover:scale-110 transition-transform ${color === c ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Final</label>
              <input
                type="text"
                maxLength={4}
                value={lastDigits}
                onChange={e => setLastDigits(e.target.value)}
                required
                placeholder="1234"
                className="w-full px-3 py-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Bandeira</label>
              <Dropdown
                options={[
                  { label: 'Mastercard', value: 'mastercard' },
                  { label: 'Visa', value: 'visa' },
                  { label: 'Amex', value: 'amex' },
                  { label: 'Elo', value: 'elo' }
                ]}
                value={brand}
                onChange={(val) => setBrand(val as any)}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase tracking-wider">Fatura Atual</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={currentInvoice}
                  onChange={e => setCurrentInvoice(e.target.value)}
                  required
                  className="w-full pl-6 pr-0 py-0 bg-transparent text-base font-bold text-white outline-none placeholder-gray-600"
                />
              </div>
            </div>
            <div className="p-2.5 bg-white/[0.03] rounded-lg border border-white/[0.05]">
              <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase tracking-wider">Limite Total</label>
              <div className="relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-xs">R$</span>
                <input
                  type="number"
                  step="0.01"
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                  required
                  className="w-full pl-6 pr-0 py-0 bg-transparent text-base font-bold text-white outline-none placeholder-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Fechamento</label>
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-1">
                <Dropdown
                  options={Array.from({ length: 31 }, (_, i) => ({
                    label: (i + 1).toString().padStart(2, '0'),
                    value: (i + 1).toString()
                  }))}
                  value={closingDay}
                  onChange={setClosingDay}
                  className="w-full"
                  minimal
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Vencimento</label>
              <div className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-1">
                <Dropdown
                  options={Array.from({ length: 31 }, (_, i) => ({
                    label: (i + 1).toString().padStart(2, '0'),
                    value: (i + 1).toString()
                  }))}
                  value={dueDay}
                  onChange={setDueDay}
                  className="w-full"
                  minimal
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</label>
              <button
                type="button"
                onClick={() => setStatus(status === 'active' ? 'blocked' : 'active')}
                className={`w-full py-2 rounded-lg border font-medium text-xs transition-all flex items-center justify-center gap-1 h-[34px] ${status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
              >
                {status === 'active' ? 'Ativo' : 'Bloq.'}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full h-10 rounded-lg font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-lg shadow-teal-500/20 transition-all active:scale-95 mt-2 text-sm">
            Salvar Alterações
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default Cards;
