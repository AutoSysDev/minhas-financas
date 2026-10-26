import React, { useState } from 'react';
import { FloatingActionButton } from './FloatingActionButton';
import { Calculator } from './Calculator';
import { useFinance } from '../context/FinanceContext';
import { useUI } from '../context/UIContext';
import { useToast } from '../context/ToastContext';
import { NewTransactionModal } from './NewTransactionModal';
import { Transaction } from '../types';

export const FABContainer: React.FC = () => {
    const { addTransaction, accounts, cards } = useFinance();
    const { setModalOpen } = useUI();
    const { toast } = useToast();
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
    
    // Estado para controlar qual aba do modal de nova transação deve abrir
    const [newTransactionTab, setNewTransactionTab] = useState<'expense' | 'income' | 'transfer' | null>(null);

    const handleSaveTransaction = async (transaction: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => {
        try {
            if (Array.isArray(transaction)) {
                for (const t of transaction) {
                    await addTransaction(t);
                }
            } else {
                await addTransaction(transaction);
            }
            
            setNewTransactionTab(null);
            setModalOpen(false);
            toast.success('Transação salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar transação');
        }
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
        setNewTransactionTab('expense');
        setModalOpen(true);
    };

    const openIncomeModal = () => {
        setNewTransactionTab('income');
        setModalOpen(true);
    };

    const openTransferModal = () => {
        setNewTransactionTab('transfer');
        setModalOpen(true);
    };

    const closeNewTransactionModal = () => {
        setNewTransactionTab(null);
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

            {newTransactionTab && (
                <NewTransactionModal
                    onClose={closeNewTransactionModal}
                    onSave={handleSaveTransaction}
                    cards={cards}
                    accounts={accounts}
                    initialTab={newTransactionTab}
                />
            )}
        </>
    );
};
