import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { Dropdown } from '../components/Dropdown';
import { Modal } from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { Account, TransactionType } from '../types';
import { formatCurrency, formatDate, getTransactionDate, getAccountCumulativeBalance } from '../utils/helpers';
import { BANKS } from '../constants';
import { MonthNavigation } from '../components/MonthNavigation';
import { DateInput } from '../components/DateInput';
import { useTheme } from '../context/ThemeContext';

const Accounts: React.FC = () => {
  const { accounts, addAccount, transactions, recalculateBalances, loading } = useFinance();
  const { theme } = useTheme();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-fade-in relative pb-20 md:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className={`text-2xl md:text-4xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Minhas Contas</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => recalculateBalances()}
            className={`flex min-w-[40px] md:min-w-[40px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 md:h-11 px-4 transition-all border ${theme === 'light'
              ? 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
              : 'bg-white/[0.05] border-white/[0.1] text-gray-300 hover:bg-white/[0.1] hover:text-white'
              }`}
            title="Recalcular Saldos"
          >
            <Icon name="sync" className={loading ? "animate-spin" : ""} />
            <span className="hidden md:inline">Recalcular</span>
          </button>
          <button
            onClick={() => setIsNewAccountModalOpen(true)}
            className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 md:h-11 px-4 bg-teal-500 text-white text-base font-medium leading-normal gap-2 hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
          >
            <Icon name="account_balance" />
            <span className="truncate hidden md:inline">Nova Conta</span>
            <span className="md:hidden">Nova</span>
          </button>
        </div>
      </div>

      {/* Grid de Contas Otimizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6">
        {accounts.map((account) => (
          <div
            key={account.id}
            onClick={() => handleAccountClick(account)}
            className={`backdrop-blur-md rounded-xl shadow-sm border cursor-pointer transition-all group relative overflow-hidden p-5 ${theme === 'light'
              ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-teal-500/30 shadow-sm'
              : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04] hover:border-teal-500/30'
              }`}
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: account.color }}></div>
            <div className="flex items-center justify-between gap-3 pl-2">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="size-10 md:size-12 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-lg shadow-sm overflow-hidden relative"
                  style={{ backgroundColor: account.color }}
                >
                  {(() => {
                    const bank = BANKS.find(b => b.name === account.bankName);
                    if (bank?.logo) {
                      return <img src={bank.logo} alt={account.bankName} className="w-full h-full object-cover" />;
                    }
                    return account.icon ? <Icon name={account.icon} className="text-2xl" /> : account.logoText;
                  })()}
                </div>
                <div className="min-w-0">
                  <h3 className={`text-base font-bold transition-colors truncate ${theme === 'light' ? 'text-slate-900 group-hover:text-teal-600' : 'text-white group-hover:text-teal-400'}`}>
                    {account.name}
                  </h3>
                  <p className={`text-xs uppercase tracking-wide truncate transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                    {account.bankName}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className={`text-base md:text-lg font-black whitespace-nowrap transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  <PrivateValue>
                    {formatCurrency(getAccountCumulativeBalance(transactions, account.id, new Date().getFullYear(), new Date().getMonth()))}
                  </PrivateValue>
                </p>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setIsNewAccountModalOpen(true)}
          className={`hidden md:flex border-2 border-dashed rounded-xl p-4 flex-col items-center justify-center gap-2 transition-all group min-h-[100px] ${theme === 'light'
            ? 'bg-white border-gray-200 text-slate-400 hover:text-teal-600 hover:border-teal-500/30 hover:bg-teal-50/50'
            : 'border-white/[0.05] text-gray-400 hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/5'
            }`}
        >
          <div className={`size-10 rounded-full flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-gray-100 group-hover:bg-teal-500/10' : 'bg-white/[0.05] group-hover:bg-teal-500/20'}`}>
            <Icon name="add" className="text-xl" />
          </div>
          <span className="font-medium text-sm">Adicionar nova conta</span>
        </button>
      </div>

      {isNewAccountModalOpen && (
        <NewAccountModal onClose={() => setIsNewAccountModalOpen(false)} onSave={addAccount} />
      )}

      {selectedAccount && (
        <AccountDetailModal account={selectedAccount} onClose={() => setSelectedAccount(null)} allTransactions={transactions} />
      )}
    </div>
  );
};

const NewAccountModal: React.FC<{ onClose: () => void; onSave: (a: any) => void }> = ({ onClose, onSave }) => {
  const { theme } = useTheme();
  const [color, setColor] = useState(BANKS[0].color);
  const [name, setName] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(BANKS[0].id);
  const [balance, setBalance] = useState('');
  const [initialBalanceDate, setInitialBalanceDate] = useState(new Date().toISOString().split('T')[0]);

  const handleBankChange = (bankId: string) => {
    setSelectedBankId(bankId);
    const bank = BANKS.find(b => b.id === bankId);
    if (bank) {
      setColor(bank.color);
      // Auto-fill name if empty
      if (!name) setName(bank.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bank = BANKS.find(b => b.id === selectedBankId);
    onSave({
      name,
      bankName: bank?.name || 'Outro',
      balance: parseFloat(balance),
      type: 'checking',
      color,
      icon: bank?.icon,
      logoText: name.substring(0, 2).toUpperCase(),
      initialBalanceDate
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Conta Bancária">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Instituição</label>
          <div className="relative">
            <Dropdown
              options={BANKS.map(bank => ({ label: bank.name, value: bank.id, logo: bank.logo }))}
              value={selectedBankId}
              onChange={handleBankChange}
              className="w-full"
            />
          </div>
        </div>
        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Nome da Conta</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Conta Principal"
            required
            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent ${theme === 'light'
              ? 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400'
              : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-500'
              }`}
          />
        </div>
        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Saldo Inicial</label>
          <div className="relative">
            <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-medium transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>R$</span>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder="0,00"
              required
              className={`w-full pl-12 pr-4 py-3 rounded-xl border text-xl font-bold transition-all outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent ${theme === 'light'
                ? 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400'
                : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-500'
                }`}
            />
          </div>
        </div>
        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Data do Saldo Inicial</label>
          <DateInput
            value={initialBalanceDate}
            onChange={setInitialBalanceDate}
            required
            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent ${theme === 'light'
              ? 'bg-gray-50 border-gray-200 text-slate-900'
              : 'bg-white/[0.05] border-white/[0.1] text-white'
              }`}
          />
          <p className={`text-[10px] mt-1 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Este saldo será registrado nesta data no seu extrato.</p>
        </div>
        <div>
          <label className={`block text-sm font-bold mb-3 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Cor (Automática)</label>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full border-2 border-white transition-all flex items-center justify-center shadow-sm" style={{ backgroundColor: color }}>
              <Icon name="check" className="text-white text-sm font-bold" />
            </div>
            <span className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Cor definida pelo banco selecionado</span>
          </div>
        </div>
        <button type="submit" className="w-full h-12 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all active:scale-95 mt-4">
          Criar Conta
        </button>
      </form>
    </Modal>
  );
};

const AccountDetailModal: React.FC<{ account: Account; onClose: () => void; allTransactions: any[] }> = ({ account, onClose, allTransactions }) => {
  const { updateAccount, deleteAccount, cards, accounts } = useFinance();
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  const selectedMonth = currentDate.getMonth();
  const selectedYear = currentDate.getFullYear();
  const isCurrentMonth = selectedMonth === new Date().getMonth() && selectedYear === new Date().getFullYear();

  // Edit form state
  const [editName, setEditName] = useState(account.name);
  const [editBalance, setEditBalance] = useState(account.balance.toString());
  const [editAccountNumber, setEditAccountNumber] = useState(account.accountNumber || '');
  const [editDefaultCardId, setEditDefaultCardId] = useState(account.defaultCardId || '');
  const [editBankId, setEditBankId] = useState(() => {
    const bank = BANKS.find(b => b.name === account.bankName);
    return bank?.id || BANKS[0].id;
  });

  const filteredTransactions = allTransactions.filter(t => {
    if (t.accountId !== account.id) return false;

    const tDate = getTransactionDate(t.date);
    if (tDate.getMonth() !== selectedMonth || tDate.getFullYear() !== selectedYear) return false;

    if (typeFilter === 'income' && t.type !== TransactionType.INCOME && t.type !== TransactionType.TRANSFER) return false;
    if (typeFilter === 'expense' && t.type !== TransactionType.EXPENSE) return false;
    return true;
  });

  // Calculate Historical Balance for this account using the centralized helper
  const historicalBalance = getAccountCumulativeBalance(allTransactions, account.id, selectedYear, selectedMonth);

  const handleSave = async () => {
    const selectedBank = BANKS.find(b => b.id === editBankId);
    if (!selectedBank) return;

    await updateAccount(account.id, {
      name: editName,
      balance: parseFloat(editBalance),
      bankName: selectedBank.name,
      color: selectedBank.color,
      icon: selectedBank.icon,
      accountNumber: editAccountNumber,
      defaultCardId: editDefaultCardId || undefined
    });
    setIsEditMode(false);
    onClose();
  };

  const handleDelete = async () => {
    if (confirm(`Tem certeza que deseja excluir a conta "${account.name}"? Todas as transações associadas também serão excluídas.`)) {
      await deleteAccount(account.id);
      onClose();
    }
  };

  const handleBankChange = (val: string) => {
    setEditBankId(val);
  };

  const selectedBank = BANKS.find(b => b.id === editBankId) || BANKS[0];

  const { theme } = useTheme();

  // Render edit mode as full-screen modal
  if (isEditMode) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <div className={`backdrop-blur-xl border rounded-2xl shadow-2xl w-full max-w-sm flex flex-col my-4 max-h-[calc(100vh-120px)] overflow-hidden animate-scale-up ring-1 transition-all ${theme === 'light'
          ? 'bg-white border-gray-200 ring-black/5'
          : 'bg-[#0f1216]/90 border-white/[0.08] ring-white/5'
          }`}>

          {/* Header */}
          <div className={`px-4 py-3 border-b flex justify-between items-center shrink-0 transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <h2 className={`text-base font-bold flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <Icon name="edit" className="text-teal-400 text-lg" />
              Editar Conta
            </h2>
            <button onClick={() => setIsEditMode(false)} className={`transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-400 hover:text-white'}`}>
              <Icon name="close" className="text-lg" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-4 space-y-4 overflow-y-auto">

            {/* Bank Selector */}
            <div>
              <label className={`block text-xs font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Banco</label>
              <div className="relative">
                <Dropdown
                  options={BANKS.map(bank => ({ label: bank.name, value: bank.id, logo: bank.logo }))}
                  value={editBankId}
                  onChange={handleBankChange}
                  className="w-full"
                />
              </div>
              {/* Preview */}
              <div className={`mt-3 flex items-center gap-3 p-3 rounded-lg border transition-all ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/[0.05]'}`}>
                <div
                  className="size-12 rounded-lg flex items-center justify-center text-white shadow-sm overflow-hidden relative"
                  style={{ backgroundColor: selectedBank.color }}
                >
                  {selectedBank.logo ? (
                    <img src={selectedBank.logo} alt={selectedBank.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon name={selectedBank.icon} className="text-2xl" />
                  )}
                </div>
                <div>
                  <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Preview</p>
                  <p className={`font-semibold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedBank.name}</p>
                </div>
              </div>
            </div>

            {/* Balance (Large, centered) */}
            <div>
              <label className={`block text-xs font-bold mb-2 text-center transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Saldo Atual</label>
              <div className="relative">
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 font-medium text-sm pl-3 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>R$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={editBalance}
                  onChange={e => setEditBalance(e.target.value)}
                  className={`w-full pl-8 pr-3 py-2 bg-transparent border-b-2 text-2xl font-black transition-all outline-none text-center ${theme === 'light'
                    ? 'border-gray-200 focus:border-teal-500 text-slate-900 placeholder:text-slate-300'
                    : 'border-white/[0.1] focus:border-teal-500 text-white placeholder:text-gray-600'
                    }`}
                />
              </div>
            </div>

            {/* Account Details */}
            <div className={`space-y-3 p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/[0.05]'}`}>
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Nome da Conta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta Corrente"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-1 focus:ring-teal-500/50 ${theme === 'light'
                    ? 'bg-white border-gray-200 text-slate-900 placeholder:text-slate-300'
                    : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-600'
                    }`}
                />
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Número da Conta (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: 12345-6"
                  value={editAccountNumber}
                  onChange={e => setEditAccountNumber(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-1 focus:ring-teal-500/50 ${theme === 'light'
                    ? 'bg-white border-gray-200 text-slate-900 placeholder:text-slate-300'
                    : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-600'
                    }`}
                />
              </div>
            </div>

            {/* Default Card Selector */}
            {cards.length > 0 && (
              <div>
                <label className={`block text-xs font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Cartão Padrão (Opcional)</label>
                <div className="relative">
                  <Dropdown
                    options={[
                      { label: 'Nenhum', value: '' },
                      ...cards.map(card => {
                        let logo = undefined;
                        if (card.linkedAccountId) {
                          const linkedAccount = accounts.find(a => a.id === card.linkedAccountId);
                          if (linkedAccount) {
                            const bank = BANKS.find(b => b.name === linkedAccount.bankName);
                            logo = bank?.logo;
                          }
                        }
                        return { label: `${card.name} •••• ${card.lastDigits}`, value: card.id, logo };
                      })
                    ]}
                    value={editDefaultCardId}
                    onChange={setEditDefaultCardId}
                    className="w-full"
                  />
                </div>
                <p className={`text-[10px] mt-1 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>
                  Vincule um cartão de crédito a esta conta
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${theme === 'light' ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl font-medium bg-teal-500 text-white hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_-5px_rgba(45,212,191,0.3)]"
              >
                <Icon name="check" className="text-lg" />
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    );
  }

  // Normal view mode
  return (
    <Modal isOpen={true} onClose={onClose} hideHeader noPadding maxWidth="max-w-2xl">
      <div className="flex flex-col h-full">
        {/* Header Ultra Compacto */}
        <div className="relative text-white p-4 shrink-0 flex flex-col gap-2 transition-colors" style={{ backgroundColor: account.color }}>
          <button onClick={onClose} className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors z-10">
            <Icon name="close" className="text-base" />
          </button>

          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-lg font-bold shadow-inner shrink-0 overflow-hidden relative">
              {(() => {
                const bank = BANKS.find(b => b.name === account.bankName);
                if (bank?.logo) {
                  return <img src={bank.logo} alt={account.bankName} className="w-full h-full object-cover" />;
                }
                return account.icon ? <Icon name={account.icon} /> : account.logoText;
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="opacity-80 text-[10px] font-bold uppercase tracking-wide">{account.bankName}</p>
              <h2 className="text-lg font-black truncate leading-tight">{account.name}</h2>
            </div>
          </div>

          <div className="bg-black/10 rounded-lg p-2 flex items-center justify-between backdrop-blur-sm mt-1">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold opacity-80 uppercase">Saldo em {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</p>
              <p className="text-xl font-black whitespace-nowrap leading-none"><PrivateValue>{formatCurrency(historicalBalance)}</PrivateValue></p>
            </div>
            <div className="scale-75 origin-right">
              <MonthNavigation currentDate={currentDate} onMonthChange={setCurrentDate} />
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-hidden p-3 flex flex-col min-h-0 transition-colors ${theme === 'light' ? 'bg-white' : 'bg-[#0f1216]'}`}>
          {/* Controls */}
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className={`font-bold text-sm flex items-center gap-1 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              <Icon name="receipt_long" className="text-teal-400 text-base" /> Extrato
            </h3>
            <div className={`flex rounded-lg p-0.5 border transition-all ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-white/[0.05] border-white/[0.05]'}`}>
              <button onClick={() => setTypeFilter('all')} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${typeFilter === 'all' ? (theme === 'light' ? 'bg-white text-teal-600 shadow-sm' : 'bg-white/[0.1] text-white shadow-sm') : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>Tudo</button>
              <button onClick={() => setTypeFilter('income')} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${typeFilter === 'income' ? 'bg-green-500/20 text-green-600 shadow-sm' : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>Entradas</button>
              <button onClick={() => setTypeFilter('expense')} className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${typeFilter === 'expense' ? 'bg-red-500/20 text-red-600 shadow-sm' : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>Saídas</button>
            </div>
          </div>

          {/* List */}
          <div className={`rounded-xl shadow-sm border overflow-y-auto flex-1 transition-all ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-white/[0.02] border-white/[0.05]'}`}>
            <div className={`divide-y transition-colors ${theme === 'light' ? 'divide-gray-100' : 'divide-white/[0.05]'}`}>
              {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                <div key={t.id} className={`p-2.5 flex items-center justify-between transition-colors ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.02]'}`}>
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`flex size-8 items-center justify-center rounded-full shrink-0 ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      <Icon name={t.type === TransactionType.INCOME ? 'arrow_downward' : 'arrow_upward'} className="text-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-semibold text-xs truncate transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.description}</p>
                      <p className={`text-[10px] truncate transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>{formatDate(t.date)} • {t.category}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-xs whitespace-nowrap ml-2 ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                    <PrivateValue>
                      {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </PrivateValue>
                  </p>
                </div>
              )) : (
                <div className={`p-6 text-center text-xs transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>
                  <p>Sem movimentações.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`p-3 border-t flex justify-between gap-2 shrink-0 transition-colors ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-[#0f1216] border-white/[0.05]'}`}>
          <button
            onClick={handleDelete}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${theme === 'light' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
          >
            <Icon name="delete" className="text-sm" />
            Excluir
          </button>
          <button
            onClick={() => setIsEditMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${theme === 'light' ? 'bg-gray-100 text-slate-600 hover:bg-gray-200' : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'}`}
          >
            <Icon name="edit" className="text-sm" />
            Editar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Accounts;
