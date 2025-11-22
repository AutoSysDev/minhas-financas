import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/helpers';
import { Card } from '../types';

const Cards: React.FC = () => {
  const { cards, addCard, updateCard, deleteCard } = useFinance();
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const limitPercentage = Math.min((card.currentInvoice / card.limit) * 100, 100);
          const isBlocked = card.status === 'blocked';
          const accentColor = card.color === '#000000' ? '#374151' : card.color;

          return (
            <div
              key={card.id}
              className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05] flex flex-col overflow-hidden transition-all hover:bg-white/[0.04] hover:border-teal-500/30 duration-200 group"
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }}></div>
              <div className="p-5 flex flex-col h-full relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="size-12 bg-white/[0.05] rounded-lg flex items-center justify-center">
                    <Icon name="credit_card" className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-bold text-white truncate pr-6" title={card.name}>{card.name}</h3>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingCard(card);
                        }}
                        className="absolute top-5 right-5 p-1 text-gray-400 hover:text-teal-400 hover:bg-white/[0.05] rounded transition-colors"
                        title="Editar Cartão"
                      >
                        <Icon name="edit" className="text-lg" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">Final **** {card.lastDigits}</p>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-0.5">Fatura Atual</p>
                    <div className="flex items-baseline justify-between">
                      <p className={`text-xl font-bold ${isBlocked ? 'text-gray-500' : 'text-white'}`}>
                        {formatCurrency(card.currentInvoice)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="w-full rounded-full bg-white/[0.05] h-1.5">
                      <div className={`h-1.5 rounded-full transition-all duration-500 bg-teal-500`} style={{ width: `${limitPercentage}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-400">
                      <span>Usado: {limitPercentage.toFixed(0)}%</span>
                      <span>Limite: {formatCurrency(card.limit)}</span>
                    </div>
                  </div>

                  <Link
                    to={`/invoice?cardId=${card.id}`}
                    className="flex items-center justify-center w-full h-9 rounded-lg border border-teal-500/30 text-teal-400 hover:bg-teal-500/10 hover:text-teal-300 transition-colors text-sm font-medium mt-2 gap-2"
                  >
                    <span className="text-xs">Ver Fatura Detalhada</span>
                    <Icon name="chevron_right" className="text-base" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => setIsNewCardModalOpen(true)}
          className="border-2 border-dashed border-white/[0.05] rounded-xl p-6 flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all group h-full min-h-[240px]"
        >
          <div className="size-12 rounded-full bg-white/[0.05] flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
            <Icon name="add" className="text-2xl" />
          </div>
          <span className="font-medium text-sm">Adicionar novo cartão</span>
        </button>
      </div>

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

const NewCardModal: React.FC<{ onClose: () => void; onSave: (c: any) => void }> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [lastDigits, setLastDigits] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('1');
  const [dueDay, setDueDay] = useState('10');
  const [color, setColor] = useState('#820ad1');
  const [brand, setBrand] = useState('mastercard');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      lastDigits,
      limit: parseFloat(limit),
      closingDay: parseInt(closingDay),
      dueDay: parseInt(dueDay),
      color,
      brand,
      status: 'active',
      imageUrl: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Novo Cartão de Crédito">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Apelido do Cartão</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank Platinum" required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Últimos 4 dígitos</label>
            <input type="text" maxLength={4} value={lastDigits} onChange={e => setLastDigits(e.target.value)} placeholder="1234" required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Bandeira</label>
            <div className="relative">
              <Dropdown
                options={[
                  { label: 'Mastercard', value: 'mastercard' },
                  { label: 'Visa', value: 'visa' },
                  { label: 'Amex', value: 'amex' },
                  { label: 'Elo', value: 'elo' }
                ]}
                value={brand}
                onChange={setBrand}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Limite Total</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input type="number" step="0.01" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0,00" required className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-xl font-bold text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Dia Fechamento</label>
            <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Dia Vencimento</label>
            <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3">Cor do Cartão</label>
          <div className="flex flex-wrap gap-3">
            {['#820ad1', '#ff7a00', '#000000', '#137fec', '#ef4444', '#16a34a'].map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className={`size-10 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }}>
                {color === c && <Icon name="check" className="text-white text-sm font-bold" />}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full h-12 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all active:scale-95 mt-4">
          Criar Cartão
        </button>
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
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Excluir Cartão"
        >
          <Icon name="delete" className="text-xl" />
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Apelido do Cartão</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Últimos 4 dígitos</label>
            <input type="text" maxLength={4} value={lastDigits} onChange={e => setLastDigits(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Bandeira</label>
            <div className="relative">
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
        </div>

        {/* Campo Extra: Fatura Atual */}
        <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.05]">
          <label className="block text-sm font-bold text-gray-300 mb-2">Valor da Fatura Atual</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input type="number" step="0.01" value={currentInvoice} onChange={e => setCurrentInvoice(e.target.value)} required className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-xl font-bold text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
          <p className="text-xs text-gray-500 mt-2">Ajuste manual do valor da fatura.</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Limite Total</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input type="number" step="0.01" value={limit} onChange={e => setLimit(e.target.value)} required className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-xl font-bold text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Dia Fechamento</label>
            <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Dia Vencimento</label>
            <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3">Status</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStatus('active')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-white/[0.05] text-gray-500'}`}>Ativo</button>
            <button type="button" onClick={() => setStatus('blocked')} className={`flex-1 py-2 rounded-lg font-medium text-sm transition-colors ${status === 'blocked' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-white/[0.05] text-gray-500'}`}>Bloqueado</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3">Cor do Cartão</label>
          <div className="flex flex-wrap gap-3">
            {['#820ad1', '#ff7a00', '#000000', '#137fec', '#ef4444', '#16a34a'].map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className={`size-10 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }}>
                {color === c && <Icon name="check" className="text-white text-sm font-bold" />}
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full h-12 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all active:scale-95 mt-4">
          Salvar Alterações
        </button>
      </form>
    </Modal>
  );
};

export default Cards;
