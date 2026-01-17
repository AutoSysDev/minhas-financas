import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { Modal } from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { useGoalTransactions, useCreateGoalTransaction } from '../hooks/useFinanceQueries';
import { formatCurrency } from '../utils/helpers';
import { GOAL_ICONS } from '../constants';
import { Goal, TransactionType } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Goals: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useFinance();
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-20 md:pb-0 relative">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl md:text-3xl font-black leading-tight tracking-[-0.033em]">Metas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Acompanhe seus sonhos financeiros.</p>
        </div>
        <button
          onClick={() => setIsNewGoalModalOpen(true)}
          className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-teal-500 text-white text-sm font-medium leading-normal gap-2 hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
        >
          <Icon name="add_circle" />
          <span className="truncate hidden md:inline">Nova Meta</span>
          <span className="md:hidden">Nova</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-white/[0.05] flex items-center justify-center mb-6">
            <Icon name="savings" className="text-4xl text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Nenhuma meta encontrada</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">Defina objetivos financeiros para realizar seus sonhos. Acompanhe seu progresso e mantenha o foco.</p>
          <button
            onClick={() => setIsNewGoalModalOpen(true)}
            className="px-6 py-3 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition-all shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
          >
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(goal => {
            const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
            return (
              <div
                key={goal.id}
                onClick={() => setSelectedGoal(goal)}
                className="bg-white/[0.02] backdrop-blur-md rounded-xl shadow-sm border border-white/[0.05] p-5 flex flex-col gap-4 transition-all hover:bg-white/[0.04] hover:border-teal-500/30 duration-200 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white text-2xl`}>
                    <Icon name={goal.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-bold text-white truncate group-hover:text-teal-400 transition-colors">{goal.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Previsão: {goal.deadline}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <p className="text-2xl font-bold text-white">
                      <PrivateValue>{formatCurrency(goal.currentAmount)}</PrivateValue>
                    </p>
                    <p className="text-xs text-gray-400">
                      de <PrivateValue>{formatCurrency(goal.targetAmount)}</PrivateValue>
                    </p>
                  </div>
                  <div className="w-full rounded-full bg-white/[0.05] h-2">
                    <div className={`h-2 rounded-full bg-teal-500 transition-all duration-700 shadow-[0_0_10px_rgba(45,212,191,0.5)]`} style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isNewGoalModalOpen && (
        <NewGoalModal onClose={() => setIsNewGoalModalOpen(false)} onSave={addGoal} />
      )}

      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
          onUpdate={updateGoal}
          onDelete={deleteGoal}
        />
      )}
    </div>
  );
};

const NewGoalModal: React.FC<{ onClose: () => void; onSave: (g: any) => void }> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIconId, setSelectedIconId] = useState(GOAL_ICONS[0].id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline,
      icon: GOAL_ICONS.find(i => i.id === selectedIconId)?.icon || 'savings',
      colorClass: 'bg-teal-500',
      textClass: 'text-teal-400'
    });
    onClose();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Nova Meta Financeira">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Nome do Objetivo</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem, Carro Novo" required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Valor Alvo</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0,00" required className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-xl font-bold text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Já guardado (Opcional)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input type="number" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0,00" className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Previsão / Data Alvo</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-3">Ícone</label>
          <div className="grid grid-cols-6 gap-2">
            {GOAL_ICONS.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedIconId(item.id)}
                className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 h-16 ${selectedIconId === item.id ? 'bg-teal-500 text-white border-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-white/[0.05] text-gray-400 border-transparent hover:bg-white/[0.1]'}`}
                title={item.name}
              >
                <Icon name={item.icon} />
                <span className="text-[8px] uppercase font-bold truncate w-full text-center">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
        <button type="submit" className="w-full h-12 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all active:scale-95 mt-4">
          Criar Meta
        </button>
      </form>
    </Modal>
  );
};

const GoalDetailModal: React.FC<{ goal: Goal; onClose: () => void; onUpdate: (id: string, data: Partial<Goal>) => void; onDelete: (id: string) => void }> = ({ goal, onClose, onUpdate, onDelete }) => {
  const { accounts, addTransaction } = useFinance();
  const { data: transactions, isLoading: isLoadingHistory } = useGoalTransactions(goal.id);
  const createTransactionMutation = useCreateGoalTransaction();

  const [isEditing, setIsEditing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState<'deposit' | 'withdraw'>('deposit');
  const [useAccountBalance, setUseAccountBalance] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const [name, setName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString());
  const [currentAmount, setCurrentAmount] = useState(goal.currentAmount.toString());
  const [deadline, setDeadline] = useState(goal.deadline);
  const [selectedIconId, setSelectedIconId] = useState(GOAL_ICONS.find(i => i.icon === goal.icon)?.id || GOAL_ICONS[0].id);

  useEffect(() => {
    if (goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [goal.currentAmount, goal.targetAmount]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(goal.id, {
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      deadline,
      icon: GOAL_ICONS.find(i => i.id === selectedIconId)?.icon || 'savings'
    });
    setIsEditing(false);
    onClose();
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || isNaN(amount)) return;

    if (useAccountBalance && !selectedAccountId) {
      alert('Por favor, selecione uma conta.');
      return;
    }

    const newAmount = depositType === 'deposit'
      ? goal.currentAmount + amount
      : Math.max(0, goal.currentAmount - amount);

    // 1. Update Goal
    onUpdate(goal.id, { currentAmount: newAmount });

    // 2. Create Goal Transaction Record
    createTransactionMutation.mutate({
      goalId: goal.id,
      amount: amount,
      type: depositType,
      date: new Date().toISOString(),
      description: depositType === 'deposit' ? 'Depósito' : 'Resgate',
      relatedTransactionId: useAccountBalance ? 'pending' : undefined // We don't have the ID yet, but we mark it
    });

    // 3. Create Account Transaction (if linked)
    if (useAccountBalance && selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      if (account) {
        await addTransaction({
          description: depositType === 'deposit' ? `Depósito na meta: ${goal.name}` : `Resgate da meta: ${goal.name}`,
          amount: amount,
          type: depositType === 'deposit' ? TransactionType.EXPENSE : TransactionType.INCOME,
          category: depositType === 'deposit' ? 'Investimentos' : 'Outras Receitas', // Could be better categorized
          date: new Date().toISOString().split('T')[0],
          accountId: selectedAccountId,
          isPaid: true
        });
      }
    }

    setIsDepositing(false);
    setDepositAmount('');
    setUseAccountBalance(false);
    setSelectedAccountId('');
    // Don't close modal to show updated status/history
    // onClose(); 
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta meta?')) {
      await onDelete(goal.id);
      onClose();
    }
  };

  if (isDepositing) {
    return (
      <Modal isOpen={true} onClose={() => setIsDepositing(false)} title={depositType === 'deposit' ? "Adicionar Saldo" : "Resgatar Valor"}>
        <form onSubmit={handleDeposit} className="space-y-6">
          <div className="flex flex-col items-center justify-center py-2">
            <div className={`p-4 rounded-full ${depositType === 'deposit' ? 'bg-teal-500/10 text-teal-400' : 'bg-orange-500/10 text-orange-400'} mb-2`}>
              <Icon name={depositType === 'deposit' ? 'add' : 'remove'} className="text-3xl" />
            </div>
            <p className="text-gray-400 text-sm">
              {depositType === 'deposit'
                ? `Quanto você quer guardar para "${goal.name}"?`
                : `Quanto você vai retirar de "${goal.name}"?`}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                autoFocus
                placeholder="0,00"
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/[0.1] bg-white/[0.05] text-2xl font-bold text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-600"
              />
            </div>
          </div>

          {/* Account Linking Option */}
          <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.05]">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="useAccount"
                checked={useAccountBalance}
                onChange={e => setUseAccountBalance(e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-teal-500 focus:ring-teal-500/50"
              />
              <label htmlFor="useAccount" className="text-sm text-gray-300 cursor-pointer select-none">
                {depositType === 'deposit'
                  ? 'Descontar de uma conta bancária'
                  : 'Depositar em uma conta bancária'}
              </label>
            </div>

            {useAccountBalance && (
              <div className="animate-fade-in">
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  required={useAccountBalance}
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-black/20 text-white focus:ring-2 focus:ring-teal-500/50 outline-none [&>option]:bg-[#1a1d21]"
                >
                  <option value="">Selecione a conta...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} (<PrivateValue>{formatCurrency(acc.balance)}</PrivateValue>)</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsDepositing(false)} className="flex-1 h-12 rounded-xl font-bold text-gray-300 bg-white/[0.05] hover:bg-white/[0.1] transition-all">
              Cancelar
            </button>
            <button type="submit" className={`flex-1 h-12 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${depositType === 'deposit' ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}>
              Confirmar
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  if (isEditing) {
    return (
      <Modal isOpen={true} onClose={() => setIsEditing(false)} title="Editar Meta">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Nome do Objetivo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Valor Alvo</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
              <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} required className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-xl font-bold text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Já guardado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
              <input type="number" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} className="w-full pl-12 pr-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all placeholder-gray-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">Previsão / Data Alvo</label>
            <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.05] text-white focus:ring-2 focus:ring-teal-500/50 focus:border-transparent outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-3">Ícone</label>
            <div className="grid grid-cols-6 gap-2">
              {GOAL_ICONS.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedIconId(item.id)}
                  className={`p-2 rounded-lg border transition-all flex flex-col items-center justify-center gap-1 h-16 ${selectedIconId === item.id ? 'bg-teal-500 text-white border-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]' : 'bg-white/[0.05] text-gray-400 border-transparent hover:bg-white/[0.1]'}`}
                >
                  <Icon name={item.icon} />
                  <span className="text-[8px] uppercase font-bold truncate w-full text-center">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-12 rounded-xl font-bold text-gray-300 bg-white/[0.05] hover:bg-white/[0.1] transition-all">
              Cancelar
            </button>
            <button type="submit" className="flex-1 h-12 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all active:scale-95">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  const percentage = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;

  return (
    <Modal isOpen={true} onClose={onClose} title={goal.name}>
      <div className="relative space-y-6">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
            {/* Simple confetti simulation with CSS/SVG could go here, or just a celebration badge */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="bg-yellow-400 text-black font-black px-6 py-2 rounded-full shadow-[0_0_50px_rgba(250,204,21,0.5)] text-xl rotate-[-10deg]"
            >
              🎉 META ATINGIDA! 🎉
            </motion.div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-4">
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.05] text-white text-4xl mb-4 shadow-inner`}>
            <Icon name={goal.icon} />
          </div>
          <h2 className="text-2xl font-bold text-white text-center"><PrivateValue>{formatCurrency(goal.currentAmount)}</PrivateValue></h2>
          <p className="text-sm text-gray-400">de <PrivateValue>{formatCurrency(goal.targetAmount)}</PrivateValue></p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-300">Progresso</span>
            <span className={`transition-colors ${percentage >= 100 ? 'text-yellow-400 font-bold' : 'text-teal-400'}`}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full rounded-full bg-white/[0.05] h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${percentage >= 100 ? 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'bg-teal-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">Meta para: {goal.deadline}</p>
        </div>

        <div className="space-y-3 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setDepositType('deposit'); setIsDepositing(true); }}
              className="flex items-center justify-center gap-2 h-14 rounded-xl font-bold text-white bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)] transition-all active:scale-95"
            >
              <Icon name="add_circle" />
              Depositar
            </button>
            <button
              onClick={() => { setDepositType('withdraw'); setIsDepositing(true); }}
              className="flex items-center justify-center gap-2 h-14 rounded-xl font-bold text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all active:scale-95"
            >
              <Icon name="remove_circle" />
              Resgatar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-gray-400 bg-white/[0.05] hover:bg-white/[0.1] transition-all"
            >
              <Icon name="edit" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all"
            >
              <Icon name="delete" />
              Excluir
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="pt-6 border-t border-white/[0.05]">
          <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
            <Icon name="history" />
            Histórico de Transações
          </h3>

          <div className="space-y-3 md:max-h-60 md:overflow-y-auto md:pr-1 md:custom-scrollbar">
            {isLoadingHistory ? (
              <div className="text-center py-4 text-gray-500 text-xs">Carregando histórico...</div>
            ) : transactions && transactions.length > 0 ? (
              transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'deposit' ? 'bg-teal-500/20 text-teal-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      <Icon name={t.type === 'deposit' ? 'arrow_downward' : 'arrow_upward'} className="text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{t.description || (t.type === 'deposit' ? 'Depósito' : 'Resgate')}</p>
                      <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.type === 'deposit' ? 'text-teal-400' : 'text-orange-400'}`}>
                    <PrivateValue>{t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}</PrivateValue>
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-600 text-xs italic">
                Nenhuma transação registrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default Goals;
