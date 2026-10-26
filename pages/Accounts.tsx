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
import { AccountsSummary } from '../components/Accounts/AccountsSummary';
import { AccountCard } from '../components/Accounts/AccountCard';

const Accounts: React.FC = () => {
  const { accounts, addAccount, transactions, recalculateBalances, loading } = useFinance();
  const { theme } = useTheme();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in relative pb-20 md:pb-0">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className={`text-2xl md:text-4xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Minhas Contas</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => recalculateBalances()}
              className={`flex min-w-[40px] md:min-w-[40px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 md:h-12 px-4 transition-all border ${theme === 'light'
                ? 'bg-white border-gray-200 text-slate-600 hover:bg-gray-50'
                : 'bg-white/[0.05] border-white/[0.1] text-gray-300 hover:bg-white/[0.1] hover:text-white'
                }`}
              title="Recalcular Saldos"
            >
              <Icon name="sync" className={loading ? "animate-spin" : ""} />
              <span className="hidden md:inline ml-2 font-bold text-sm">Recalcular</span>
            </button>
            <button
              onClick={() => setIsNewAccountModalOpen(true)}
              className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-10 md:h-12 px-6 bg-teal-500 text-white text-sm font-bold leading-normal gap-2 hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
            >
              <Icon name="add_circle" />
              <span className="truncate hidden md:inline">Nova Conta</span>
            </button>
          </div>
        </div>

        {/* Dashboard de Resumo */}
        <AccountsSummary />
      </div>

      {/* Grid de Contas Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onClick={handleAccountClick}
          />
        ))}

        <button
          onClick={() => setIsNewAccountModalOpen(true)}
          className={`h-56 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all group ${theme === 'light'
            ? 'border-gray-300 text-gray-400 hover:border-teal-500 hover:bg-teal-50 hover:text-teal-600'
            : 'border-white/10 text-gray-500 hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-400'
            }`}
        >
          <div className={`size-16 rounded-full flex items-center justify-center transition-all ${theme === 'light' ? 'bg-gray-100 group-hover:bg-white group-hover:shadow-md' : 'bg-white/5 group-hover:bg-teal-500/20'}`}>
            <Icon name="add" className="text-3xl transition-transform group-hover:scale-110" />
          </div>
          <span className="font-bold text-lg">Adicionar Nova Conta</span>
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

const CATEGORIES = [
  { label: 'Conta Corrente', value: 'Corrente' },
  { label: 'Conta Poupança', value: 'Poupança' },
  { label: 'Investimento', value: 'Investimento' },
  { label: 'Cartão de Crédito', value: 'Cartão de Crédito' },
  { label: 'Outros', value: 'Outros' }
];

const NewAccountModal: React.FC<{ onClose: () => void; onSave: (a: any) => void }> = ({ onClose, onSave }) => {
  const { theme } = useTheme();
  const [color, setColor] = useState(BANKS[0].color);
  const [name, setName] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(BANKS[0].id);
  const [balance, setBalance] = useState('');
  const [initialBalanceDate, setInitialBalanceDate] = useState(new Date().toISOString().split('T')[0]);

  // New Fields
  const [category, setCategory] = useState('Corrente');
  const [isDefaultForDebit, setIsDefaultForDebit] = useState(false);
  const [showInSummary, setShowInSummary] = useState(true);
  const [ignoreInTotal, setIgnoreInTotal] = useState(false);
  const [overdraftLimit, setOverdraftLimit] = useState('');
  const [overdraftInterestRate, setOverdraftInterestRate] = useState('');
  const [notes, setNotes] = useState('');

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
      balance: parseFloat(balance || '0'),
      type: 'checking', // Keeping legacy type for compatibility
      color,
      icon: bank?.icon,
      logoText: name.substring(0, 2).toUpperCase(),
      initialBalanceDate,
      // New fields
      category,
      isDefaultForDebit,
      showInSummary,
      ignoreInTotal,
      overdraftLimit: overdraftLimit ? parseFloat(overdraftLimit) : undefined,
      overdraftInterestRate: overdraftInterestRate ? parseFloat(overdraftInterestRate) : undefined,
      notes
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Categoria</label>
            <Dropdown
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
              className="w-full"
            />
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Data do Saldo</label>
            <DateInput
              value={initialBalanceDate}
              onChange={setInitialBalanceDate}
              required
              className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent ${theme === 'light'
                ? 'bg-gray-50 border-gray-200 text-slate-900'
                : 'bg-white/[0.05] border-white/[0.1] text-white'
                }`}
            />
          </div>
        </div>

        {/* Toggles Section */}
        <div className={`p-4 rounded-xl border space-y-4 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.05] border-white/[0.1]'}`}>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>Conta Padrão</p>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Prioridade para débitos automáticos</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDefaultForDebit(!isDefaultForDebit)}
              className={`w-12 h-6 rounded-full p-1 transition-all ${isDefaultForDebit ? 'bg-teal-500' : 'bg-gray-400'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${isDefaultForDebit ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>Exibir no Resumo</p>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Mostrar na tela principal</p>
            </div>
            <button
              type="button"
              onClick={() => setShowInSummary(!showInSummary)}
              className={`w-12 h-6 rounded-full p-1 transition-all ${showInSummary ? 'bg-teal-500' : 'bg-gray-400'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${showInSummary ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-bold text-sm ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>Ignorar nos Totais</p>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Não somar ao saldo consolidado</p>
            </div>
            <button
              type="button"
              onClick={() => setIgnoreInTotal(!ignoreInTotal)}
              className={`w-12 h-6 rounded-full p-1 transition-all ${ignoreInTotal ? 'bg-teal-500' : 'bg-gray-400'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-all transform ${ignoreInTotal ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Cheque Especial - Conditional */}
        {category === 'Corrente' && (
          <div className={`p-4 rounded-xl border space-y-4 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.05] border-white/[0.1]'}`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
              <Icon name="account_balance_wallet" className="text-teal-500" />
              Cheque Especial
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Limite Disponível</label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={overdraftLimit}
                    onChange={e => setOverdraftLimit(e.target.value)}
                    placeholder="0,00"
                    className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm font-bold outline-none focus:ring-1 focus:ring-teal-500/50 ${theme === 'light'
                      ? 'bg-white border-gray-200 text-slate-900'
                      : 'bg-black/20 border-white/[0.1] text-white'
                      }`}
                  />
                </div>
              </div>
              <div>
                <label className={`block text-xs font-bold mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Taxa de Juros (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={overdraftInterestRate}
                  onChange={e => setOverdraftInterestRate(e.target.value)}
                  placeholder="0,00"
                  className={`w-full px-3 py-2 rounded-lg border text-sm font-bold outline-none focus:ring-1 focus:ring-teal-500/50 ${theme === 'light'
                    ? 'bg-white border-gray-200 text-slate-900'
                    : 'bg-black/20 border-white/[0.1] text-white'
                    }`}
                />
              </div>
            </div>
            {/* Visual Indicator Placeholder */}
            {overdraftLimit && (
              <div className="mt-2">
                {(() => {
                  const bal = parseFloat(balance || '0');
                  const limit = parseFloat(overdraftLimit || '0');
                  const used = bal < 0 ? Math.abs(bal) : 0;
                  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

                  return (
                    <>
                      <div className="flex justify-between text-[10px] mb-1 opacity-70">
                        <span>Uso do Limite</span>
                        <span>{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                        <div
                          className={`h-full transition-all duration-500 ${pct > 80 ? 'bg-red-500' : 'bg-teal-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {used > 0 && (
                        <p className="text-[10px] text-right mt-1 opacity-60">
                          {formatCurrency(used)} usados de {formatCurrency(limit)}
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>Observações</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Informações adicionais sobre esta conta..."
            rows={3}
            className={`w-full px-4 py-3 rounded-xl border transition-all outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent resize-none ${theme === 'light'
              ? 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400'
              : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-500'
              }`}
          />
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

  // New Fields State
  const [editCategory, setEditCategory] = useState(account.category || 'Corrente');
  const [editIsDefaultForDebit, setEditIsDefaultForDebit] = useState(account.isDefaultForDebit || false);
  const [editShowInSummary, setEditShowInSummary] = useState(account.showInSummary !== false);
  const [editIgnoreInTotal, setEditIgnoreInTotal] = useState(account.ignoreInTotal || false);
  const [editOverdraftLimit, setEditOverdraftLimit] = useState(account.overdraftLimit?.toString() || '');
  const [editOverdraftInterestRate, setEditOverdraftInterestRate] = useState(account.overdraftInterestRate?.toString() || '');
  const [editNotes, setEditNotes] = useState(account.notes || '');

  // Calculate Overdraft Usage (Derived)
  const currentBalanceValue = parseFloat(editBalance || '0'); // Use edit balance for preview, or historical? 
  // Ideally, overdraft usage is based on current actual balance.
  // For the indicator, let's use the current cumulative balance if available, or the edited balance if it's being changed.
  // But usually users edit the starting balance or current balance.
  // Let's use the historicalBalance calculated below for the "Current Status" but for the form indicator we might want to use the edit value.
  const overdraftUsage = currentBalanceValue < 0 ? Math.abs(currentBalanceValue) : 0;
  const overdraftLimitValue = parseFloat(editOverdraftLimit || '0');
  const overdraftPercentage = overdraftLimitValue > 0 ? (overdraftUsage / overdraftLimitValue) * 100 : 0;

  const filteredTransactions = allTransactions.filter(t => {
    if (t.accountId !== account.id) return false;

    const tDate = getTransactionDate(t.date);
    if (tDate.getMonth() !== selectedMonth || tDate.getFullYear() !== selectedYear) return false;

    if (typeFilter === 'income' && t.type !== TransactionType.INCOME && t.type !== TransactionType.TRANSFER) return false;
    if (typeFilter === 'expense' && t.type !== TransactionType.EXPENSE) return false;
    return true;
  });

  // Calculate Historical Balance for this account using the centralized helper
  const historicalBalance = getAccountCumulativeBalance(allTransactions, account, selectedYear, selectedMonth);

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
      defaultCardId: editDefaultCardId || undefined,
      // New Fields
      category: editCategory,
      isDefaultForDebit: editIsDefaultForDebit,
      showInSummary: editShowInSummary,
      ignoreInTotal: editIgnoreInTotal,
      overdraftLimit: editOverdraftLimit ? parseFloat(editOverdraftLimit) : 0,
      overdraftInterestRate: editOverdraftInterestRate ? parseFloat(editOverdraftInterestRate) : 0,
      overdraftUsed: overdraftUsage, // We might not want to save this if it's derived, but the interface has it.
      notes: editNotes
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
                <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Categoria</label>
                <Dropdown
                  options={CATEGORIES}
                  value={editCategory}
                  onChange={setEditCategory}
                  className="w-full"
                />
              </div>

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

            {/* Toggles Section */}
            <div className={`p-3 rounded-xl border space-y-3 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/[0.05]'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold text-[10px] uppercase ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>Conta Padrão</p>
                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Prioridade para débitos</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIsDefaultForDebit(!editIsDefaultForDebit)}
                  className={`w-10 h-5 rounded-full p-1 transition-all ${editIsDefaultForDebit ? 'bg-teal-500' : 'bg-gray-400'}`}
                >
                  <div className={`size-3 rounded-full bg-white transition-all transform ${editIsDefaultForDebit ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold text-[10px] uppercase ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>Exibir no Resumo</p>
                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Mostrar na tela principal</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditShowInSummary(!editShowInSummary)}
                  className={`w-10 h-5 rounded-full p-1 transition-all ${editShowInSummary ? 'bg-teal-500' : 'bg-gray-400'}`}
                >
                  <div className={`size-3 rounded-full bg-white transition-all transform ${editShowInSummary ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold text-[10px] uppercase ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>Ignorar nos Totais</p>
                  <p className={`text-[10px] ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>Não somar ao saldo total</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditIgnoreInTotal(!editIgnoreInTotal)}
                  className={`w-10 h-5 rounded-full p-1 transition-all ${editIgnoreInTotal ? 'bg-teal-500' : 'bg-gray-400'}`}
                >
                  <div className={`size-3 rounded-full bg-white transition-all transform ${editIgnoreInTotal ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Cheque Especial - Conditional */}
            {editCategory === 'Corrente' && (
              <div className={`p-3 rounded-xl border space-y-3 ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/[0.05]'}`}>
                <h3 className={`text-[10px] font-bold uppercase flex items-center gap-2 ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>
                  <Icon name="account_balance_wallet" className="text-teal-500 text-sm" />
                  Cheque Especial
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Limite</label>
                    <div className="relative">
                      <span className={`absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editOverdraftLimit}
                        onChange={e => setEditOverdraftLimit(e.target.value)}
                        placeholder="0,00"
                        className={`w-full pl-6 pr-2 py-1.5 rounded-lg border text-xs font-bold outline-none focus:ring-1 focus:ring-teal-500/50 ${theme === 'light'
                          ? 'bg-white border-gray-200 text-slate-900'
                          : 'bg-black/20 border-white/[0.1] text-white'
                          }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Juros (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editOverdraftInterestRate}
                      onChange={e => setEditOverdraftInterestRate(e.target.value)}
                      placeholder="0,00"
                      className={`w-full px-2 py-1.5 rounded-lg border text-xs font-bold outline-none focus:ring-1 focus:ring-teal-500/50 ${theme === 'light'
                        ? 'bg-white border-gray-200 text-slate-900'
                        : 'bg-black/20 border-white/[0.1] text-white'
                        }`}
                    />
                  </div>
                </div>

                {/* Visual Indicator */}
                {Number(editOverdraftLimit) > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] mb-1 opacity-70">
                      <span>Uso do Limite</span>
                      <span>{Math.round(overdraftPercentage)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
                      <div
                        className={`h-full ${overdraftPercentage > 80 ? 'bg-red-500' : 'bg-teal-500'} transition-all duration-500`}
                        style={{ width: `${Math.min(100, overdraftPercentage)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-right mt-1 opacity-60">
                      {formatCurrency(overdraftUsage)} usados de {formatCurrency(Number(editOverdraftLimit))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Observações</label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Informações adicionais..."
                rows={3}
                className={`w-full px-3 py-2 rounded-xl border text-sm transition-all outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent resize-none ${theme === 'light'
                  ? 'bg-gray-50 border-gray-200 text-slate-900 placeholder-slate-400'
                  : 'bg-white/[0.05] border-white/[0.1] text-white placeholder-gray-500'
                  }`}
              />
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
    <Modal isOpen={true} onClose={onClose} hideHeader noPadding maxWidth="max-w-xl">
      <div className="flex flex-col h-full max-h-[85vh]">
        {/* Header Ultra Compacto */}
        <div className="relative text-white p-5 shrink-0 flex flex-col gap-4 transition-colors rounded-t-2xl" style={{ backgroundColor: account.color }}>
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-md transition-colors z-10">
            <Icon name="close" className="text-sm" />
          </button>

          <div className="flex items-center gap-4">
            <div className="size-12 rounded-full bg-white p-2 flex items-center justify-center shadow-lg shrink-0 overflow-hidden relative">
              {(() => {
                const bank = BANKS.find(b => b.name === account.bankName);
                if (bank?.logo) {
                  return <img src={bank.logo} alt={account.bankName} className="w-full h-full object-contain" />;
                }
                return account.icon ? <Icon name={account.icon} className="text-gray-800 text-xl" /> : <span className="text-gray-800 font-bold">{account.logoText}</span>;
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="opacity-80 text-[10px] font-bold uppercase tracking-wide">{account.bankName}</p>
                {account.category && <span className="px-1.5 py-0.5 rounded bg-black/20 text-[9px] font-bold uppercase text-white/90 backdrop-blur-md">{account.category}</span>}
              </div>
              <h2 className="text-xl font-black truncate leading-tight flex items-center gap-2">
                {account.name}
                {account.isDefaultForDebit && <Icon name="check_circle" className="text-teal-300 text-sm" title="Conta Padrão" />}
                {account.ignoreInTotal && <Icon name="visibility_off" className="text-gray-300 text-sm" title="Ignorada nos Totais" />}
              </h2>
            </div>
          </div>

          {/* Overdraft Indicator (View Mode) */}
          {account.category === 'Corrente' && Number(account.overdraftLimit) > 0 && (
            <div className="bg-black/20 rounded-xl p-3 backdrop-blur-sm border border-white/10">
              <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider opacity-80 mb-1.5">
                <span>Cheque Especial</span>
                <span>
                  {(() => {
                    const limit = Number(account.overdraftLimit);
                    const balance = historicalBalance;
                    const used = balance < 0 ? Math.abs(balance) : 0;
                    const pct = limit > 0 ? (used / limit) * 100 : 0;
                    return Math.round(pct);
                  })()}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 mb-1">
                <div
                  className="h-full rounded-full bg-teal-400 transition-all"
                  style={{
                    width: `${(() => {
                      const limit = Number(account.overdraftLimit);
                      const balance = historicalBalance;
                      const used = balance < 0 ? Math.abs(balance) : 0;
                      return limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
                    })()}%`,
                    backgroundColor: (() => {
                      const limit = Number(account.overdraftLimit);
                      const balance = historicalBalance;
                      const used = balance < 0 ? Math.abs(balance) : 0;
                      const pct = limit > 0 ? (used / limit) * 100 : 0;
                      return pct > 80 ? '#f43f5e' : pct > 50 ? '#facc15' : '#2dd4bf';
                    })()
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] opacity-60 font-medium">
                <span>Uso: {formatCurrency(historicalBalance < 0 ? Math.abs(historicalBalance) : 0)}</span>
                <span>Lim: {formatCurrency(Number(account.overdraftLimit))}</span>
              </div>
            </div>
          )}

          <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between backdrop-blur-sm border border-white/10">
            <div className="flex flex-col">
              <p className="text-[10px] font-bold opacity-80 uppercase mb-1">Saldo em {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</p>
              <p className="text-2xl font-black whitespace-nowrap leading-none tracking-tight"><PrivateValue>{formatCurrency(historicalBalance)}</PrivateValue></p>
            </div>
            <div className="scale-90 origin-right">
              <MonthNavigation currentDate={currentDate} onMonthChange={setCurrentDate} />
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-hidden flex flex-col min-h-0 transition-colors ${theme === 'light' ? 'bg-white' : 'bg-[#0f1216]'}`}>
          {/* Controls */}
          <div className={`px-4 py-3 flex items-center justify-between shrink-0 border-b ${theme === 'light' ? 'border-gray-100' : 'border-white/[0.05]'}`}>
            <h3 className={`font-bold text-sm flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-500">
                <Icon name="receipt_long" className="text-sm" />
              </div>
              Extrato
            </h3>
            <div className={`flex rounded-lg p-1 border transition-all ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/[0.05]'}`}>
              <button onClick={() => setTypeFilter('all')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${typeFilter === 'all' ? (theme === 'light' ? 'bg-white text-teal-600 shadow-sm' : 'bg-white/[0.1] text-white shadow-sm') : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>Tudo</button>
              <button onClick={() => setTypeFilter('income')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${typeFilter === 'income' ? 'bg-green-500/20 text-green-600 shadow-sm' : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>Entradas</button>
              <button onClick={() => setTypeFilter('expense')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${typeFilter === 'expense' ? 'bg-red-500/20 text-red-600 shadow-sm' : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300')}`}>Saídas</button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 p-2">
            <div className="space-y-1">
              {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                <div key={t.id} className={`p-3 rounded-xl flex items-center justify-between transition-colors group ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.03]'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex size-10 items-center justify-center rounded-full shrink-0 ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      <Icon name={t.type === TransactionType.INCOME ? 'arrow_downward' : 'arrow_upward'} className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-sm truncate transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.description}</p>
                      <p className={`text-[11px] truncate transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>{formatDate(t.date)} • {t.category}</p>
                    </div>
                  </div>
                  <p className={`font-bold text-sm whitespace-nowrap ml-3 ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                    <PrivateValue>
                      {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                    </PrivateValue>
                  </p>
                </div>
              )) : (
                <div className={`flex flex-col items-center justify-center h-40 gap-3 text-center transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-600'}`}>
                  <div className={`p-4 rounded-full ${theme === 'light' ? 'bg-gray-50' : 'bg-white/[0.03]'}`}>
                    <Icon name="receipt_long" className="text-3xl opacity-50" />
                  </div>
                  <p className="text-sm font-medium">Sem movimentações neste período.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`p-4 border-t flex justify-between gap-3 shrink-0 transition-colors ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-[#0f1216] border-white/[0.05]'}`}>
          <button
            onClick={handleDelete}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${theme === 'light' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
          >
            <Icon name="delete" className="text-lg" />
            Excluir Conta
          </button>
          <button
            onClick={() => setIsEditMode(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-colors ${theme === 'light' ? 'bg-gray-100 text-slate-700 hover:bg-gray-200' : 'bg-white/[0.05] text-white hover:bg-white/[0.1]'}`}
          >
            <Icon name="edit" className="text-lg" />
            Editar Detalhes
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default Accounts;
