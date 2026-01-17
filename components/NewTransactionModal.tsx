import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';
import { Transaction, TransactionType, Card, Account } from '../types';
import { formatCurrency } from '../utils/helpers';
import { BANKS } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface NewTransactionModalProps {
    onClose: () => void;
    onSave: (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => void;
    cards: Card[];
    accounts: Account[];
    initialData?: Partial<Transaction & { transactionId?: string; receiver?: string }> | null;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ onClose, onSave, cards, accounts, initialData }) => {
    const { theme } = useTheme();
    const [tab, setTab] = useState<'expense' | 'income' | 'credit'>('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Alimentação');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSourceId, setSelectedSourceId] = useState('');
    const [isPaid, setIsPaid] = useState(true);

    // Parcelamento (apenas para cartão)
    const [isInstallment, setIsInstallment] = useState(false);
    const [installments, setInstallments] = useState('2');

    // Detalhes extras
    const [transactionId, setTransactionId] = useState('');
    const [receiverName, setReceiverName] = useState('');

    // Recorrência
    const [recurrenceType, setRecurrenceType] = useState<'single' | 'fixed' | 'installments'>('single');
    const [recurrenceMonths, setRecurrenceMonths] = useState('12');

    useEffect(() => {
        if (initialData) {
            if (initialData.amount) setAmount(initialData.amount.toString());

            // Prioritize receiver for description if available, otherwise use generic description
            const descToUse = initialData.receiver || initialData.description || '';
            setDescription(descToUse);

            if (initialData.receiver) setReceiverName(initialData.receiver);
            if (initialData.transactionId) setTransactionId(initialData.transactionId);
            if (initialData.date) setDate(initialData.date);
            if (initialData.category) setCategory(initialData.category);
            if (initialData.isPaid !== undefined) setIsPaid(initialData.isPaid);

            if (initialData.type === TransactionType.INCOME) setTab('income');
            else if (initialData.cardId) setTab('credit');
            else setTab('expense');
        }
    }, [initialData]);

    // Seleção automática de conta/cartão ao mudar de aba
    useEffect(() => {
        if (tab === 'income' || tab === 'expense') {
            if (accounts.length > 0 && !accounts.find(a => a.id === selectedSourceId)) setSelectedSourceId(accounts[0].id);
        } else if (tab === 'credit') {
            if (cards.length > 0 && !cards.find(c => c.id === selectedSourceId)) setSelectedSourceId(cards[0].id);
        }
    }, [tab, accounts, cards, selectedSourceId]);

    const handleDateChange = (newDate: string) => {
        setDate(newDate);
        const today = new Date().toISOString().split('T')[0];
        const isFuture = newDate > today;
        if (tab !== 'credit') {
            setIsPaid(!isFuture);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Concatenar detalhes extras na descrição se houverem, já que não temos campos no DB para isso
        let finalDescription = description;
        if (transactionId && !finalDescription.includes(transactionId)) {
            finalDescription += ` (ID: ${transactionId.substring(0, 8)}...)`;
        }

        const newTransaction: Omit<Transaction, 'id'> = {
            description: finalDescription,
            amount: parseFloat(amount),
            date: date,
            type: tab === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
            category,
            isPaid: tab === 'credit' ? false : isPaid, // Crédito não é pago imediatamente
            accountId: (tab === 'expense' || tab === 'income') ? selectedSourceId : undefined,
            cardId: tab === 'credit' ? selectedSourceId : undefined,
            installments: (tab === 'credit' && isInstallment) ? parseInt(installments) : 1
        };

        if (recurrenceType !== 'single' && !transactionId) {
            const transactions: Omit<Transaction, 'id'>[] = [];
            const count = recurrenceType === 'fixed' ? 24 : parseInt(recurrenceMonths);
            const baseDate = new Date(date);

            for (let i = 0; i < count; i++) {
                const newDate = new Date(baseDate);
                newDate.setMonth(baseDate.getMonth() + i);

                transactions.push({
                    ...newTransaction,
                    date: newDate.toISOString().split('T')[0],
                    description: recurrenceType === 'fixed'
                        ? finalDescription
                        : `${finalDescription} (${i + 1}/${count})`
                });
            }
            onSave(transactions);
        } else {
            onSave(newTransaction);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={initialData && initialData.transactionId ? 'Editar Transação' : 'Nova Transação'}
            maxWidth="max-w-sm"
        >
            {initialData && !initialData.transactionId && (
                <div className="mb-4">
                    <div className="bg-blue-500/20 text-blue-200 text-[10px] p-2 rounded-lg flex items-center gap-2">
                        <Icon name="auto_awesome" className="text-sm" />
                        <div>
                            <p>Dados extraídos.</p>
                            {receiverName && <p className="font-bold text-[10px]">Beneficiário: {receiverName}</p>}
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Seletor de Tipo (Tabs) */}
                <div className={`flex p-1 rounded-xl transition-all ${theme === 'light' ? 'bg-gray-100' : 'bg-white/[0.05]'}`}>
                    <button
                        type="button"
                        onClick={() => setTab('expense')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === 'expense' ? (theme === 'light' ? 'bg-white text-red-500 shadow-sm ring-1 ring-black/5' : 'bg-white/[0.1] text-red-400 shadow-sm') : 'text-gray-500 hover:text-gray-400'}`}
                    >
                        <Icon name="trending_down" className="text-base" /> Despesa
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('income')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === 'income' ? (theme === 'light' ? 'bg-white text-green-500 shadow-sm ring-1 ring-black/5' : 'bg-white/[0.1] text-green-400 shadow-sm') : 'text-gray-500 hover:text-gray-400'}`}
                    >
                        <Icon name="trending_up" className="text-base" /> Receita
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('credit')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === 'credit' ? (theme === 'light' ? 'bg-white text-purple-500 shadow-sm ring-1 ring-black/5' : 'bg-white/[0.1] text-purple-400 shadow-sm') : 'text-gray-500 hover:text-gray-400'}`}
                    >
                        <Icon name="credit_card" className="text-base" /> Cartão
                    </button>
                </div>

                {/* Valor */}
                <div>
                    <div className="relative">
                        <span className={`absolute left-0 top-1/2 -translate-y-1/2 font-medium text-sm pl-3 ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>R$</span>
                        <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="0,00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className={`w-full pl-8 pr-3 py-2 bg-transparent border-b-2 focus:border-teal-500 text-2xl font-black placeholder:text-gray-400 outline-none transition-colors text-center ${theme === 'light' ? 'border-gray-200 text-slate-900' : 'border-white/[0.1] text-white'}`}
                        />
                    </div>
                </div>

                {/* Descrição e Detalhes */}
                <div className={`space-y-3 p-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-white/[0.03] border-white/[0.05]'}`}>
                    <div>
                        <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Descrição / Beneficiário</label>
                        <input type="text" required placeholder="Ex: Almoço, Salário" value={description} onChange={e => setDescription(e.target.value)} className={`w-full px-3 py-2 rounded-lg border text-sm focus:ring-1 focus:ring-teal-500/50 outline-none placeholder-gray-400 transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-slate-900' : 'bg-white/[0.05] border-white/[0.1] text-white'}`} />
                    </div>

                    {!transactionId && tab !== 'credit' && (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <div>
                                <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Tipo de Repetição</label>
                                <Dropdown
                                    options={[
                                        { label: 'Única', value: 'single' },
                                        { label: 'Fixo Mensal', value: 'fixed' },
                                        { label: 'Parcelado', value: 'installments' }
                                    ]}
                                    value={recurrenceType}
                                    onChange={(val) => setRecurrenceType(val as any)}
                                    className="w-full"
                                />
                            </div>
                            {recurrenceType === 'installments' && (
                                <div className="animate-fade-in">
                                    <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Nº de Meses</label>
                                    <div className="flex items-center gap-2 h-[42px]">
                                        <input
                                            type="number"
                                            min="2"
                                            max="60"
                                            value={recurrenceMonths}
                                            onChange={(e) => setRecurrenceMonths(e.target.value)}
                                            className={`flex-1 px-3 py-2.5 rounded-lg border text-sm outline-none focus:border-teal-500 transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-slate-900' : 'bg-white/[0.05] border-white/[0.1] text-white'}`}
                                        />
                                        <span className={`text-[10px] font-bold uppercase ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>Meses</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {(initialData || transactionId) && (
                        <div>
                            <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>ID Transação (Opcional)</label>
                            <input type="text" placeholder="ID Transação (Opcional)" value={transactionId} onChange={e => setTransactionId(e.target.value)} className={`w-full px-3 py-1.5 rounded-lg border text-xs focus:ring-1 focus:ring-teal-500 outline-none font-mono transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-slate-500' : 'bg-white/[0.05] border-white/[0.1] text-gray-400'}`} />
                        </div>
                    )}
                </div>

                {/* Grid Categoria e Data */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={`block text-xs font-bold mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Categoria</label>
                        <Dropdown
                            options={[
                                { label: 'Alimentação', value: 'Alimentação' },
                                { label: 'Transporte', value: 'Transporte' },
                                { label: 'Lazer', value: 'Lazer' },
                                { label: 'Moradia', value: 'Moradia' },
                                { label: 'Saúde', value: 'Saúde' },
                                { label: 'Transferência', value: 'Transferência' },
                                { label: 'Outros', value: 'Outros' },
                                { label: 'Salário', value: 'Salário' }
                            ]}
                            value={category}
                            onChange={setCategory}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-bold mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Data</label>
                        <input type="date" value={date} onChange={e => handleDateChange(e.target.value)} className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:ring-1 focus:ring-teal-500 outline-none transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-slate-900' : 'bg-white/[0.05] border-white/[0.1] text-white'}`} />
                    </div>
                </div>

                {/* Seleção de Conta ou Cartão */}
                <div>
                    <label className={`block text-xs font-bold mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                        {tab === 'income' ? 'Conta de Destino' : (tab === 'credit' ? 'Selecione o Cartão' : 'Conta de Saída')}
                    </label>
                    <div className="relative">
                        <Dropdown
                            options={
                                (tab === 'income' || tab === 'expense')
                                    ? (accounts.length > 0 ? accounts.map(acc => {
                                        const bank = BANKS.find(b => b.name === acc.bankName);
                                        return {
                                            label: `${acc.name} (${formatCurrency(acc.balance)})`,
                                            value: acc.id,
                                            logo: bank?.logo
                                        };
                                    }) : [{ label: 'Nenhuma conta cadastrada', value: '' }])
                                    : (cards.length > 0 ? cards.map(card => {
                                        let logo = undefined;
                                        if (card.linkedAccountId) {
                                            const linkedAccount = accounts.find(a => a.id === card.linkedAccountId);
                                            if (linkedAccount) {
                                                const bank = BANKS.find(b => b.name === linkedAccount.bankName);
                                                logo = bank?.logo;
                                            }
                                        }
                                        return {
                                            label: `${card.name} (Final ${card.lastDigits})`,
                                            value: card.id,
                                            logo
                                        };
                                    }) : [{ label: 'Nenhum cartão cadastrado', value: '' }])
                            }
                            value={selectedSourceId}
                            onChange={setSelectedSourceId}
                            placeholder={tab === 'credit' ? 'Selecione o Cartão' : (tab === 'income' ? 'Conta de Destino' : 'Conta de Saída')}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Checkbox de Pago (Apenas se não for crédito) */}
                {tab !== 'credit' && (
                    <div className="flex items-center gap-3 px-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isPaid ? 'bg-teal-500 border-teal-500' : 'border-gray-400'}`} onClick={() => setIsPaid(!isPaid)}>
                                {isPaid && <Icon name="check" className="text-white text-xs" />}
                            </div>
                            <span className={`text-xs font-medium transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>{tab === 'income' ? 'Recebido' : 'Pago'}</span>
                        </label>
                    </div>
                )}

                {/* Parcelamento (Só aparece se for Cartão) */}
                {tab === 'credit' && (
                    <div className="flex items-center gap-3 px-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isInstallment ? 'bg-teal-500 border-teal-500' : 'border-gray-400'}`} onClick={() => setIsInstallment(!isInstallment)}>
                                {isInstallment && <Icon name="check" className="text-white text-xs" />}
                            </div>
                            <span className="text-xs font-medium text-gray-300">Parcelado</span>
                        </label>
                        {isInstallment && (
                            <div className="flex-1 flex items-center gap-2 animate-fade-in">
                                <input type="number" min="2" max="36" value={installments} onChange={(e) => setInstallments(e.target.value)} className="w-16 px-2 py-1 rounded bg-white/[0.05] border border-white/[0.1] text-sm text-center outline-none text-white" />
                                <span className="text-[10px] text-gray-500">x {formatCurrency(amount ? parseFloat(amount) / parseInt(installments) : 0)}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="py-2.5 rounded-lg font-bold text-sm text-gray-300 bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
                    >
                        Cancelar
                    </button>
                    <button type="submit" className={`py-2.5 rounded-lg font-bold text-sm text-white shadow-sm hover:shadow-md transition-all active:scale-95 ${tab === 'expense' ? 'bg-red-600' : tab === 'credit' ? 'bg-purple-600' : 'bg-green-600'}`}>Salvar</button>
                </div>
            </form>
        </Modal>
    );
};
