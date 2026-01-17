import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate, getTransactionDate } from '../utils/helpers';
import { Card, TransactionType } from '../types';

const Cards: React.FC = () => {
  const { cards, transactions, categories, addCard, updateCard, deleteCard } = useFinance();
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const toggleCard = (cardId: string) => {
    if (expandedCardId === cardId) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(cardId);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative pb-20 md:pb-0 min-h-[80vh]">
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-20">
        <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">Meus Cartões</h1>
        <div className="flex items-center gap-2 sm:gap-3">
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

      <div
        className="relative w-full max-w-md mx-auto mt-8 perspective-1000"
        style={{ height: Math.max(300, cards.length * 60 + 220) }}
      >
        <AnimatePresence>
          {cards.map((card, index) => {
            const isExpanded = expandedCardId === card.id;
            const isBlocked = card.status === 'blocked';
            const accentColor = card.color === '#000000' ? '#374151' : card.color;
            const limitPercentage = Math.min((card.currentInvoice / card.limit) * 100, 100);

            // Calculate position in stack
            // If expanded: y = 0, zIndex = 50
            // If not expanded:
            //   If something else is expanded: move way down or fade out?
            //   Usually in wallet, they bunch up at bottom or hide.
            //   Let's make them fade out/move down if not selected.

            const isAnyExpanded = expandedCardId !== null;

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
                layoutId={card.id}
                initial={false}
                animate={{
                  top: isExpanded ? 0 : (isAnyExpanded ? 1000 : index * 60),
                  scale: isExpanded ? 1 : (isAnyExpanded ? 0.9 : 1 - index * 0.02),
                  zIndex: isExpanded ? 50 : index,
                  opacity: isAnyExpanded && !isExpanded ? 0 : 1
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onClick={() => toggleCard(card.id)}
                className={`
                  absolute w-full left-0 cursor-pointer
                  bg-[#1c1c1e] rounded-2xl shadow-2xl border border-white/[0.05] overflow-hidden
                  ${isExpanded ? 'h-auto min-h-[300px]' : 'h-[220px] hover:brightness-110'}
                `}
                style={{
                  transformOrigin: 'top center',
                  boxShadow: '0 -4px 20px rgba(0,0,0,0.4)'
                }}
              >
                {/* Colored Strip */}
                <div className="h-2 w-full" style={{ backgroundColor: accentColor }}></div>

                <div className="p-6 flex flex-col h-full relative bg-gradient-to-b from-white/[0.05] to-transparent">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-12 bg-white/[0.1] rounded-xl flex items-center justify-center shadow-inner">
                      <Icon name="credit_card" className="text-white/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-white truncate pr-6 drop-shadow-md" title={card.name}>{card.name}</h3>
                        {isExpanded && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCard(card);
                            }}
                            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
                          >
                            <Icon name="edit" className="text-lg" />
                          </motion.button>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 font-mono tracking-wider">**** **** **** {card.lastDigits}</p>
                    </div>
                  </div>

                  {/* Content - Only fully visible when expanded or top of stack (conceptually) */}
                  <div className={`mt-auto space-y-4 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-80'}`}>
                    <div>
                      <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Fatura Atual</p>
                      <div className="flex items-baseline justify-between">
                        <p className={`text-2xl font-bold ${isBlocked ? 'text-gray-500' : 'text-white'}`}>
                          <PrivateValue>{formatCurrency(card.currentInvoice)}</PrivateValue>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full rounded-full bg-black/30 h-2 overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${limitPercentage}%` }}
                          transition={{ delay: 0.2, duration: 1 }}
                          className={`h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400`}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                        <span>{limitPercentage.toFixed(0)}% utilizado</span>
                        <span><PrivateValue>{formatCurrency(card.limit)}</PrivateValue></span>
                      </div>
                    </div>

                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-6 pt-6 border-t border-white/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Fatura de {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</h4>
                          <Link to={`/invoice?cardId=${card.id}`} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
                            Ver histórico <Icon name="arrow_forward" className="text-sm" />
                          </Link>
                        </div>

                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                          {cardTransactions.length > 0 ? (
                            cardTransactions.map(t => {
                              const category = categories.find(c => c.name === t.category);
                              const iconName = category?.icon || 'category';
                              const iconColor = category?.color || '#9ca3af';

                              return (
                                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors border border-white/[0.02]">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="size-10 rounded-full flex items-center justify-center text-white shadow-lg"
                                      style={{ backgroundColor: `${iconColor}20`, color: iconColor }}
                                    >
                                      <Icon name={iconName} className="text-lg" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-white">{t.description}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-400">{formatDate(t.date)}</p>
                                        {t.installments && t.installments > 1 && (
                                          <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                                            {t.installmentNumber}/{t.installments}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className={`text-sm font-bold whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-white'}`}>
                                    <PrivateValue>{t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}</PrivateValue>
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8">
                              <div className="size-12 rounded-full bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                                <Icon name="receipt_long" className="text-gray-500 text-xl" />
                              </div>
                              <p className="text-sm text-gray-400">Nenhuma transação nesta fatura.</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                          <span className="text-sm text-gray-400">Total deste mês</span>
                          <span className="text-lg font-bold text-white">
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
            className="w-full h-[240px] border-2 border-dashed border-white/[0.1] rounded-2xl flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all group"
          >
            <div className="size-16 rounded-full bg-white/[0.05] flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
              <Icon name="add" className="text-3xl" />
            </div>
            <span className="font-bold text-base">Adicionar seu primeiro cartão</span>
          </button>
        )}
      </div>

      {/* Overlay to close when clicking outside */}
      {expandedCardId && (
        <div
          className="fixed inset-0 z-10"
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
    </div>
  );
};

// Helper component for form rows - defined outside to prevent recreation
const FormRow: React.FC<{ icon: string; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/[0.05]">
    <div className="flex items-center gap-3 text-gray-400 shrink-0">
      <Icon name={icon} className="text-xl" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    <div className="flex-1 flex justify-end min-w-0 ml-4">
      {children}
    </div>
  </div>
);

const NewCardModal: React.FC<{ onClose: () => void; onSave: (c: any) => void }> = ({ onClose, onSave }) => {
  const { accounts } = useFinance();
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
          className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-full transition-colors"
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
                className="w-full max-w-[180px] bg-transparent text-right text-white placeholder-gray-600 outline-none text-sm"
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
            <div className="flex items-center gap-1 text-white">
              <span className="text-gray-500 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                value={limit}
                onChange={e => setLimit(e.target.value)}
                placeholder="0,00"
                className="bg-transparent text-right outline-none w-28 placeholder-gray-600 font-medium"
              />
            </div>
          </FormRow>

          {/* Fatura Atual */}
          <FormRow icon="receipt" label="Fatura Atual">
            <div className="flex items-center gap-1 text-white">
              <span className="text-gray-500 text-sm">R$</span>
              <input
                type="number"
                step="0.01"
                value={currentInvoice}
                onChange={e => setCurrentInvoice(e.target.value)}
                placeholder="0,00"
                className="bg-transparent text-right outline-none w-28 placeholder-gray-600 font-medium"
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
                  ...accounts.map(a => ({ label: a.name, value: a.id }))
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
            <div className="relative flex items-center">
              <select
                value={closingDay}
                onChange={e => setClosingDay(e.target.value)}
                className="bg-transparent text-white outline-none text-right cursor-pointer appearance-none pr-6 py-1 z-10 w-20 font-medium"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d} className="bg-[#0f1216] text-white">{d.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <Icon name="arrow_drop_down" className="text-gray-400 absolute right-0 pointer-events-none text-lg" />
            </div>
          </FormRow>

          {/* Dia Vencimento */}
          <FormRow icon="event" label="Dia do Vencimento">
            <div className="relative flex items-center">
              <select
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="bg-transparent text-white outline-none text-right cursor-pointer appearance-none pr-6 py-1 z-10 w-20 font-medium"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d} className="bg-[#0f1216] text-white">{d.toString().padStart(2, '0')}</option>
                ))}
              </select>
              <Icon name="arrow_drop_down" className="text-gray-400 absolute right-0 pointer-events-none text-lg" />
            </div>
          </FormRow>

          {/* Importação de Pagamentos */}
          <div className="mt-8">
            <p className="text-xs text-gray-500 mb-3 px-1 uppercase tracking-wider font-bold">Últimos 4 dígitos</p>
            <div className="border border-white/[0.1] rounded-xl p-4 bg-white/[0.02]">
              <input
                type="text"
                maxLength={4}
                value={lastDigits}
                onChange={e => setLastDigits(e.target.value)}
                placeholder="1234"
                className="w-full bg-transparent text-sm text-white placeholder-gray-600 outline-none"
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
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider text-center">Fechamento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={closingDay}
                onChange={e => setClosingDay(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-white text-center focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider text-center">Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="w-full px-2 py-2 rounded-lg border border-white/[0.1] bg-white/[0.05] text-white text-center focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500 text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider text-center">Status</label>
              <button
                type="button"
                onClick={() => setStatus(status === 'active' ? 'blocked' : 'active')}
                className={`w-full py-2 rounded-lg border font-medium text-sm transition-all flex items-center justify-center gap-1 ${status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
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
