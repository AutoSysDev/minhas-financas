import React, { useState } from 'react';
import { FloatingActionButton } from './FloatingActionButton';
import { Calculator } from './Calculator';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { Dropdown } from './Dropdown';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types';

export const FABContainer: React.FC = () => {
    const { addTransaction, accounts, cards } = useFinance();
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
        cardId: ''
    });

    // Estados do formulário de receita
    const [incomeForm, setIncomeForm] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Salário',
        accountId: ''
    });

    // Estados do formulário de transferência
    const [transferForm, setTransferForm] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        fromAccountId: '',
        toAccountId: ''
    });

    const handleExpenseSubmit = async () => {
        if (!expenseForm.description || !expenseForm.amount) {
            alert('Preencha todos os campos obrigatórios');
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
            isPaid: true
        });

        setExpenseForm({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Alimentação',
            accountId: '',
            cardId: ''
        });
        setIsExpenseModalOpen(false);
    };

    const handleIncomeSubmit = async () => {
        if (!incomeForm.description || !incomeForm.amount || !incomeForm.accountId) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        await addTransaction({
            description: incomeForm.description,
            amount: parseFloat(incomeForm.amount),
            date: incomeForm.date,
            type: TransactionType.INCOME,
            category: incomeForm.category,
            accountId: incomeForm.accountId,
            isPaid: true
        });

        setIncomeForm({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Salário',
            accountId: ''
        });
        setIsIncomeModalOpen(false);
    };

    const handleTransferSubmit = async () => {
        if (!transferForm.description || !transferForm.amount || !transferForm.fromAccountId || !transferForm.toAccountId) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        if (transferForm.fromAccountId === transferForm.toAccountId) {
            alert('As contas de origem e destino devem ser diferentes');
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
        setIsTransferModalOpen(false);
    };

    return (
        <>
            <FloatingActionButton
                onCalculator={() => setIsCalculatorOpen(true)}
                onNewExpense={() => setIsExpenseModalOpen(true)}
                onNewIncome={() => setIsIncomeModalOpen(true)}
                onNewTransfer={() => setIsTransferModalOpen(true)}
            />

            <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} />

            {/* Modal de Nova Despesa */}
            <Modal isOpen={isExpenseModalOpen} onClose={() => setIsExpenseModalOpen(false)} title="Nova Despesa">
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
                            onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <Dropdown
                            options={[
                                { label: 'Alimentação', value: 'Alimentação' },
                                { label: 'Transporte', value: 'Transporte' },
                                { label: 'Saúde', value: 'Saúde' },
                                { label: 'Educação', value: 'Educação' },
                                { label: 'Lazer', value: 'Lazer' },
                                { label: 'Outros', value: 'Outros' }
                            ]}
                            value={expenseForm.category}
                            onChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conta</label>
                        <Dropdown
                            options={accounts.map(a => ({ label: a.name, value: a.id }))}
                            value={expenseForm.accountId}
                            onChange={(value) => setExpenseForm({ ...expenseForm, accountId: value })}
                            placeholder="Selecione uma conta"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Cartão (opcional)</label>
                        <Dropdown
                            options={cards.map(c => ({ label: c.name, value: c.id }))}
                            value={expenseForm.cardId}
                            onChange={(value) => setExpenseForm({ ...expenseForm, cardId: value })}
                            placeholder="Selecione um cartão"
                        />
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
            <Modal isOpen={isIncomeModalOpen} onClose={() => setIsIncomeModalOpen(false)} title="Nova Receita">
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
                            onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                            className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Categoria</label>
                        <Dropdown
                            options={[
                                { label: 'Salário', value: 'Salário' },
                                { label: 'Freelance', value: 'Freelance' },
                                { label: 'Investimentos', value: 'Investimentos' },
                                { label: 'Outros', value: 'Outros' }
                            ]}
                            value={incomeForm.category}
                            onChange={(value) => setIncomeForm({ ...incomeForm, category: value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conta *</label>
                        <Dropdown
                            options={accounts.map(a => ({ label: a.name, value: a.id }))}
                            value={incomeForm.accountId}
                            onChange={(value) => setIncomeForm({ ...incomeForm, accountId: value })}
                            placeholder="Selecione uma conta"
                        />
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
            <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Nova Transferência">
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
                            options={accounts.map(a => ({ label: a.name, value: a.id }))}
                            value={transferForm.fromAccountId}
                            onChange={(value) => setTransferForm({ ...transferForm, fromAccountId: value })}
                            placeholder="Selecione a conta de origem"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Conta de Destino *</label>
                        <Dropdown
                            options={accounts.map(a => ({ label: a.name, value: a.id }))}
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
