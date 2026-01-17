import React, { useState } from 'react';
import { FloatingActionButton } from './FloatingActionButton';
import { Calculator } from './Calculator';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { Dropdown } from './Dropdown';
import { useFinance } from '../context/FinanceContext';
import { useUI } from '../context/UIContext';
import { TransactionType } from '../types';
import { useToast } from '../context/ToastContext';
import { BANKS } from '../constants';

export const FABContainer: React.FC = () => {
    const { addTransaction, accounts, cards, categories } = useFinance();
    const { setModalOpen } = useUI();
    const { toast } = useToast();
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    // Estados do formulário de despesa
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Alimentação',
        accountId: '',
        cardId: '',
        isPaid: true
    });

    // Estados do formulário de receita
    const [incomeForm, setIncomeForm] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Salário',
        accountId: '',
        isPaid: true
    });

    // Estados do formulário de transferência
    const [transferForm, setTransferForm] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        fromAccountId: '',
        toAccountId: ''
    });

    const handleDateChange = (type: 'expense' | 'income', date: string) => {
        const today = new Date().toISOString().split('T')[0];
        const isFuture = date > today;

        if (type === 'expense') {
            setExpenseForm(prev => ({ ...prev, date, isPaid: !isFuture }));
        } else {
            setIncomeForm(prev => ({ ...prev, date, isPaid: !isFuture }));
        }
    };

    const handleExpenseSubmit = async () => {
        if (!expenseForm.description || !expenseForm.amount) {
            toast.warning('Preencha todos os campos obrigatórios');
            return;
        }

        await addTransaction({
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount),
            date: expenseForm.date,
            type: TransactionType.EXPENSE,
            category: expenseForm.category,
            accountId: expenseForm.accountId || undefined,
            cardId: expenseForm.cardId || undefined,
            isPaid: expenseForm.isPaid
        });

        setExpenseForm({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Alimentação',
            accountId: '',
            cardId: '',
            isPaid: true
        });
        closeExpenseModal();
    };

    const handleIncomeSubmit = async () => {
        if (!incomeForm.description || !incomeForm.amount || !incomeForm.accountId) {
            toast.warning('Preencha todos os campos obrigatórios');
            return;
        }

        await addTransaction({
            description: incomeForm.description,
            amount: parseFloat(incomeForm.amount),
            date: incomeForm.date,
            type: TransactionType.INCOME,
            category: incomeForm.category,
            accountId: incomeForm.accountId,
            isPaid: incomeForm.isPaid
        });

        setIncomeForm({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Salário',
            accountId: '',
            isPaid: true
        });
        closeIncomeModal();
    };

    const handleTransferSubmit = async () => {
        if (!transferForm.description || !transferForm.amount || !transferForm.fromAccountId || !transferForm.toAccountId) {
            toast.warning('Preencha todos os campos obrigatórios');
            return;
        }

        if (transferForm.fromAccountId === transferForm.toAccountId) {
            toast.warning('As contas de origem e destino devem ser diferentes');
            return;
        }

        await addTransaction({
            description: transferForm.description,
            amount: parseFloat(transferForm.amount),
            date: transferForm.date,
            type: TransactionType.TRANSFER,
            category: 'Transferência',
            accountId: transferForm.fromAccountId,
            isPaid: true
        });

        setTransferForm({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            fromAccountId: '',
            toAccountId: ''
        });
        closeTransferModal();
    };

    // Helper functions to manage modal state
    const openCalculator = () => {
        setIsCalculatorOpen(true);
        setModalOpen(true);
    };

    const closeCalculator = () => {
        setIsCalculatorOpen(false);
        setModalOpen(false);
    };

    const openExpenseModal = () => {
        setIsExpenseModalOpen(true);
        setModalOpen(true);
    };

    const closeExpenseModal = () => {
        setIsExpenseModalOpen(false);
        setModalOpen(false);
    };

    const openIncomeModal = () => {
        setIsIncomeModalOpen(true);
        setModalOpen(true);
    };

    const closeIncomeModal = () => {
        setIsIncomeModalOpen(false);
        setModalOpen(false);
    };

    const openTransferModal = () => {
        setIsTransferModalOpen(true);
        setModalOpen(true);
    };

    const closeTransferModal = () => {
        setIsTransferModalOpen(false);
        setModalOpen(false);
    };

    return (
        <>
            <FloatingActionButton
                onCalculator={openCalculator}
                onNewExpense={openExpenseModal}
                onNewIncome={openIncomeModal}
                onNewTransfer={openTransferModal}
            />

            <Calculator isOpen={isCalculatorOpen} onClose={closeCalculator} />

            {/* Modal de Nova Despesa */}
            <Modal isOpen={isExpenseModalOpen} onClose={closeExpenseModal} title="Nova Despesa">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
                        <input
                            type="text"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Ex: Almoço no restaurante"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Data *</label>
                        <input
                            type="date"
                            value={expenseForm.date}
                            onChange={(e) => handleDateChange('expense', e.target.value)}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <Dropdown
                            options={categories.filter(c => c.type === 'expense').map(c => ({ label: c.name, value: c.name }))}
                            value={expenseForm.category}
                            onChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conta</label>
                        <Dropdown
                            options={accounts.map(a => {
                                const bank = BANKS.find(b => b.name === a.bankName);
                                return { label: a.name, value: a.id, logo: bank?.logo };
                            })}
                            value={expenseForm.accountId}
                            onChange={(value) => setExpenseForm({ ...expenseForm, accountId: value })}
                            placeholder="Selecione uma conta"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cartão (opcional)</label>
                        <Dropdown
                            options={cards.map(c => {
                                let logo = undefined;
                                if (c.linkedAccountId) {
                                    const linkedAccount = accounts.find(a => a.id === c.linkedAccountId);
                                    if (linkedAccount) {
                                        const bank = BANKS.find(b => b.name === linkedAccount.bankName);
                                        logo = bank?.logo;
                                    }
                                }
                                return { label: c.name, value: c.id, logo };
                            })}
                            value={expenseForm.cardId}
                            onChange={(value) => setExpenseForm({ ...expenseForm, cardId: value })}
                            placeholder="Selecione um cartão"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/[0.05] rounded-xl border border-white/[0.1]">
                        <input
                            type="checkbox"
                            id="expense-paid"
                            checked={expenseForm.isPaid}
                            onChange={(e) => setExpenseForm({ ...expenseForm, isPaid: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                        />
                        <label htmlFor="expense-paid" className="text-sm font-medium text-white cursor-pointer select-none">
                            Despesa já paga?
                        </label>
                    </div>

                    <button
                        onClick={handleExpenseSubmit}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Salvar Despesa
                    </button>
                </div>
            </Modal>

            {/* Modal de Nova Receita */}
            <Modal isOpen={isIncomeModalOpen} onClose={closeIncomeModal} title="Nova Receita">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
                        <input
                            type="text"
                            value={incomeForm.description}
                            onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Ex: Salário mensal"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={incomeForm.amount}
                            onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Data *</label>
                        <input
                            type="date"
                            value={incomeForm.date}
                            onChange={(e) => handleDateChange('income', e.target.value)}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <Dropdown
                            options={categories.filter(c => c.type === 'income').map(c => ({ label: c.name, value: c.name }))}
                            value={incomeForm.category}
                            onChange={(value) => setIncomeForm({ ...incomeForm, category: value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conta *</label>
                        <Dropdown
                            options={accounts.map(a => {
                                const bank = BANKS.find(b => b.name === a.bankName);
                                return { label: a.name, value: a.id, logo: bank?.logo };
                            })}
                            value={incomeForm.accountId}
                            onChange={(value) => setIncomeForm({ ...incomeForm, accountId: value })}
                            placeholder="Selecione uma conta"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/[0.05] rounded-xl border border-white/[0.1]">
                        <input
                            type="checkbox"
                            id="income-paid"
                            checked={incomeForm.isPaid}
                            onChange={(e) => setIncomeForm({ ...incomeForm, isPaid: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-600 text-teal-500 focus:ring-teal-500 bg-gray-700"
                        />
                        <label htmlFor="income-paid" className="text-sm font-medium text-white cursor-pointer select-none">
                            Receita já recebida?
                        </label>
                    </div>

                    <button
                        onClick={handleIncomeSubmit}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Salvar Receita
                    </button>
                </div>
            </Modal>

            {/* Modal de Nova Transferência */}
            <Modal isOpen={isTransferModalOpen} onClose={closeTransferModal} title="Nova Transferência">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
                        <input
                            type="text"
                            value={transferForm.description}
                            onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="Ex: Transferência entre contas"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Valor *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={transferForm.amount}
                            onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Data *</label>
                        <input
                            type="date"
                            value={transferForm.date}
                            onChange={(e) => setTransferForm({ ...transferForm, date: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conta de Origem *</label>
                        <Dropdown
                            options={accounts.map(a => {
                                const bank = BANKS.find(b => b.name === a.bankName);
                                return { label: a.name, value: a.id, logo: bank?.logo };
                            })}
                            value={transferForm.fromAccountId}
                            onChange={(value) => setTransferForm({ ...transferForm, fromAccountId: value })}
                            placeholder="Selecione a conta de origem"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conta de Destino *</label>
                        <Dropdown
                            options={accounts.map(a => {
                                const bank = BANKS.find(b => b.name === a.bankName);
                                return { label: a.name, value: a.id, logo: bank?.logo };
                            })}
                            value={transferForm.toAccountId}
                            onChange={(value) => setTransferForm({ ...transferForm, toAccountId: value })}
                            placeholder="Selecione a conta de destino"
                        />
                    </div>

                    <button
                        onClick={handleTransferSubmit}
                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Salvar Transferência
                    </button>
                </div>
            </Modal>
        </>
    );
};
