import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { Dropdown } from './Dropdown';
import { Modal } from './Modal';
import { RecurrenceModal, RecurrenceData } from './RecurrenceModal';
import { Transaction, TransactionType, Card, Account } from '../types';
import { formatCurrency, getAccountCumulativeBalance } from '../utils/helpers';
import { isRepetitionTransaction, fixedTransactionLabel } from '../utils/fixedTransactions';
import { BANKS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { useFinance } from '../context/FinanceContext';

interface NewTransactionModalProps {
    onClose: () => void;
    onSave: (t: Omit<Transaction, 'id'> | Omit<Transaction, 'id'>[]) => void;
    cards: Card[];
    accounts: Account[];
    initialData?: Partial<Transaction & { transactionId?: string; receiver?: string }> | null;
    initialTab?: 'expense' | 'income' | 'credit' | 'transfer';
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({ onClose, onSave, cards, accounts, initialData, initialTab = 'expense' }) => {
    const { theme } = useTheme();
    const { categories, transactions } = useFinance();
    const [tab, setTab] = useState<'expense' | 'income' | 'credit' | 'transfer'>(initialTab);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSourceId, setSelectedSourceId] = useState('');
    const [selectedDestinationId, setSelectedDestinationId] = useState('');
    const [isPaid, setIsPaid] = useState(true);
    const [isFixed, setIsFixed] = useState(false);

    // Filter categories based on transaction type
    const categoryOptions = React.useMemo(() => {
        const typeToFilter = tab === 'income' ? 'income' : 'expense';
        if (!categories) return [];
        return categories
            .filter(c => c.type === typeToFilter)
            .map(c => ({
                label: c.name,
                value: c.name,
                icon: c.icon
            }));
    }, [categories, tab]);

    // Invoice Options for Credit Card
    const invoiceOptions = React.useMemo(() => {
        if (tab !== 'credit' || !selectedSourceId) return [];
        const card = cards.find(c => c.id === selectedSourceId);
        if (!card) return [];

        const options = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Generate options for Previous, Current, Next 10 months
        for (let i = -1; i < 12; i++) {
            // Logic to determine month/year
            const d = new Date(currentYear, currentMonth + i, 1);
            const monthName = d.toLocaleString('pt-BR', { month: 'long' });
            const year = d.getFullYear();
            const monthLabel = monthName.charAt(0).toUpperCase() + monthName.slice(1);

            // Calculate Due Date
            // Ensure valid day (e.g. Feb 30 -> Feb 28)
            const dueDay = Math.min(card.dueDay, new Date(year, d.getMonth() + 1, 0).getDate());
            const dueDate = new Date(year, d.getMonth(), dueDay);
            const pad = (n: number) => n < 10 ? '0' + n : n;
            const formattedDueDate = `${year}-${pad(d.getMonth() + 1)}-${pad(dueDay)}`;

            options.push({
                label: `${monthLabel}, ${year}`,
                value: formattedDueDate
            });
        }
        return options;
    }, [tab, selectedSourceId, cards]);

    // Update category when options change to ensure valid selection
    useEffect(() => {
        if (categoryOptions.length > 0) {
            const isValid = categoryOptions.some(opt => opt.value === category);
            if (!isValid) {
                setCategory(categoryOptions[0].value);
            }
        }
    }, [categoryOptions, category]);

    // Parcelamento (apenas para cartão)
    const [isInstallment, setIsInstallment] = useState(false);
    const [installments, setInstallments] = useState('2');

    const isRepetitionRow = Boolean(
        initialData &&
        isRepetitionTransaction({
            description: initialData.description,
            installments: initialData.installments,
            originalTransactionId: initialData.originalTransactionId
        })
    );
    const canBeFixed =
        !isRepetitionRow &&
        !isInstallment &&
        (tab === 'expense' ||
            tab === 'credit' ||
            tab === 'income' ||
            (tab === 'transfer' && Boolean(selectedDestinationId)));

    const fixedLabel = fixedTransactionLabel(
        tab === 'income'
            ? TransactionType.INCOME
            : tab === 'transfer'
                ? TransactionType.TRANSFER
                : TransactionType.EXPENSE
    );

    // Detalhes extras
    const [transactionId, setTransactionId] = useState('');
    const [receiverName, setReceiverName] = useState('');

    // Recorrência
    const [isRecurrenceModalOpen, setIsRecurrenceModalOpen] = useState(false);
    const [recurrenceData, setRecurrenceData] = useState<RecurrenceData>({
        isActive: false,
        initialInstallment: 1,
        count: 2,
        periodicity: 'monthly'
    });

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
            setIsFixed(Boolean(initialData.isFixed));

            if (initialData.type === TransactionType.INCOME) setTab('income');
            else if (initialData.cardId) setTab('credit');
            else setTab('expense');
        }
    }, [initialData]);

    useEffect(() => {
        if (!canBeFixed && isFixed) setIsFixed(false);
    }, [canBeFixed, isFixed]);

    // Seleção automática de conta/cartão ao mudar de aba
    useEffect(() => {
        if (tab === 'income' || tab === 'expense' || tab === 'transfer') {
            if (accounts.length > 0) {
                // Find default account for debit
                const defaultAccount = accounts.find(a => a.isDefaultForDebit);
                const primaryAccount = defaultAccount || accounts[0];

                if (!accounts.find(a => a.id === selectedSourceId)) {
                    setSelectedSourceId(primaryAccount.id);
                }

                if (tab === 'transfer' && !accounts.find(a => a.id === selectedDestinationId)) {
                    const secondaryAccount = accounts.find(a => a.id !== primaryAccount.id) || accounts[0];
                    setSelectedDestinationId(secondaryAccount.id);
                }
            }
        } else if (tab === 'credit') {
            const card = cards.find(c => c.id === selectedSourceId) || cards[0];
            if (cards.length > 0 && !cards.find(c => c.id === selectedSourceId)) setSelectedSourceId(cards[0].id);

            // Set default date to the appropriate invoice due date
            if (card) {
                const today = new Date();

                // Always default to current month as requested
                const targetMonthOffset = 0;

                // Calculate target date (Due Date)
                const targetDate = new Date(today.getFullYear(), today.getMonth() + targetMonthOffset, 1);
                const y = targetDate.getFullYear();
                const m = targetDate.getMonth();
                const d = Math.min(card.dueDay, new Date(y, m + 1, 0).getDate());
                const pad = (n: number) => n < 10 ? '0' + n : n;
                const finalDate = `${y}-${pad(m + 1)}-${pad(d)}`;

                setDate(finalDate);
            }
        }
    }, [tab, accounts, cards, selectedSourceId, selectedDestinationId]);

    const resetRecurrence = () => {
        setRecurrenceData({
            isActive: false,
            initialInstallment: 1,
            count: 2,
            periodicity: 'monthly'
        });
    };

    const handleFixedToggle = (checked: boolean) => {
        setIsFixed(checked);
        if (checked) resetRecurrence();
    };

    const handleRecurrenceSave = (data: RecurrenceData) => {
        setRecurrenceData(data);
        if (data.isActive) setIsFixed(false);
    };

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
            type: tab === 'income' ? TransactionType.INCOME : tab === 'transfer' ? TransactionType.TRANSFER : TransactionType.EXPENSE,
            category: tab === 'transfer' ? 'Transferência' : category,
            isPaid: tab === 'credit' ? false : isPaid,
            accountId: (tab === 'expense' || tab === 'income' || tab === 'transfer') ? selectedSourceId : undefined,
            cardId: tab === 'credit' ? selectedSourceId : undefined,
            destinationAccountId: tab === 'transfer' ? selectedDestinationId : undefined,
            installments: (tab === 'credit' && isInstallment) ? parseInt(installments) : 1,
            isFixed: isFixed && canBeFixed
        };

        if (recurrenceData.isActive && !transactionId) {
            const transactions: Omit<Transaction, 'id'>[] = [];

            // Logic correction based on user feedback:
            // If "Parcela inicial" (initialInstallment) > 1, the user likely considers "Quantidade" (count) 
            // as the TOTAL number of installments in the series, not "how many more to add".
            // Example: Initial=5, Count=12 => User expects 5/12, 6/12... 12/12.
            // So we should generate (Count - Initial + 1) transactions.

            let countToGenerate = recurrenceData.count;
            let totalInstallments = recurrenceData.initialInstallment + recurrenceData.count - 1;

            // If we are starting from a specific installment > 1, we assume the user input for "count" 
            // might be the Total Target Installments (e.g., "12x").
            // However, this is ambiguous. "Quantidade" usually means "Quantity to add".
            // But the user explicitly said "o parcelamento total vai durar 12 meses... estou no 5 mes".
            // This implies they set Quantity=12 to mean Total=12.

            // Heuristic: If initialInstallment > 1, we assume 'count' entered is the Total.
            // But we must ensure count >= initialInstallment.
            if (recurrenceData.initialInstallment > 1 && recurrenceData.count >= recurrenceData.initialInstallment) {
                totalInstallments = recurrenceData.count;
                countToGenerate = totalInstallments - recurrenceData.initialInstallment + 1;
            }

            const baseDate = new Date(date);

            for (let i = 0; i < countToGenerate; i++) {
                const newDate = new Date(baseDate);

                // Handle periodicity
                if (recurrenceData.periodicity === 'monthly') {
                    newDate.setMonth(baseDate.getMonth() + i);
                } else if (recurrenceData.periodicity === 'weekly') {
                    newDate.setDate(baseDate.getDate() + (i * 7));
                } else if (recurrenceData.periodicity === 'yearly') {
                    newDate.setFullYear(baseDate.getFullYear() + i);
                }

                const currentInstallment = recurrenceData.initialInstallment + i;

                // If standard mode (Initial=1), total is just count.
                // If offset mode (Initial > 1), total is explicitly what was entered as count (if heuristic met).
                // Or calculated as Initial + Count - 1 if heuristic not met.

                transactions.push({
                    ...newTransaction,
                    date: newDate.toISOString().split('T')[0],
                    description: `${finalDescription} (${currentInstallment}/${totalInstallments})`
                });
            }
            onSave(transactions);
        } else {
            onSave(newTransaction);
        }
    };

    return (
        <>
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
                        <button
                            type="button"
                            onClick={() => setTab('transfer')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${tab === 'transfer' ? (theme === 'light' ? 'bg-white text-blue-500 shadow-sm ring-1 ring-black/5' : 'bg-white/[0.1] text-blue-400 shadow-sm') : 'text-gray-500 hover:text-gray-400'}`}
                        >
                            <Icon name="swap_horiz" className="text-base" /> Transf.
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

                        {!transactionId && tab !== 'transfer' && !isFixed && !isInstallment && (
                            <div className="pt-1">
                                <label className={`block text-[10px] font-bold uppercase mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Repetição</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurrenceModalOpen(true)}
                                        className={`flex-1 px-3 py-2.5 rounded-lg border text-sm text-left flex items-center justify-between transition-all ${theme === 'light'
                                            ? 'bg-white border-gray-200 text-slate-900 hover:bg-gray-50'
                                            : 'bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1]'
                                            }`}
                                    >
                                        <span>
                                            {recurrenceData.isActive
                                                ? `${recurrenceData.count}x (${recurrenceData.periodicity === 'monthly' ? 'Mensal' : recurrenceData.periodicity === 'yearly' ? 'Anual' : 'Semanal'})`
                                                : 'Única'}
                                        </span>
                                        <Icon name="chevron_right" className={`text-lg ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`} />
                                    </button>
                                    {recurrenceData.isActive && (
                                        <button
                                            type="button"
                                            onClick={resetRecurrence}
                                            className={`px-2.5 py-2.5 rounded-lg border text-xs font-bold transition-colors ${theme === 'light'
                                                ? 'bg-white border-gray-200 text-slate-500 hover:bg-gray-50'
                                                : 'bg-white/[0.05] border-white/[0.1] text-gray-300 hover:bg-white/[0.1]'
                                                }`}
                                            title="Remover repetição"
                                        >
                                            Remover
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {canBeFixed && !recurrenceData.isActive && (
                            <div className={`pt-3 border-t transition-colors ${theme === 'light' ? 'border-gray-200' : 'border-white/[0.08]'}`}>
                                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isFixed}
                                        onChange={e => handleFixedToggle(e.target.checked)}
                                        className="mt-0.5 size-4 accent-teal-500 cursor-pointer"
                                    />
                                    <span>
                                        <span className={`block text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>{fixedLabel} (repete todo mês)</span>
                                        <span className={`block text-[10px] transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Aparece automaticamente todo mês. Para encerrar, edite ou exclua a {tab === 'transfer' ? 'transferência' : 'transação'}.</span>
                                    </span>
                                </label>
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
                                options={categoryOptions}
                                value={category}
                                onChange={setCategory}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className={`block text-xs font-bold mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                                {tab === 'credit' ? 'Fatura' : 'Data'}
                            </label>
                            {tab === 'credit' ? (
                                <Dropdown
                                    options={invoiceOptions}
                                    value={invoiceOptions.find(opt => opt.value === date)?.value || date}
                                    onChange={(val) => setDate(val)}
                                    className="w-full"
                                    placement="top"
                                    placeholder="Selecione a fatura"
                                />
                            ) : (
                                <input type="date" value={date} onChange={e => handleDateChange(e.target.value)} className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:ring-1 focus:ring-teal-500 outline-none transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-slate-900' : 'bg-white/[0.05] border-white/[0.1] text-white'}`} />
                            )}
                            {transactionId && isFixed && (
                                <p className={`mt-1 text-[10px] transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{fixedLabel}: mantenha o mesmo mês; ajuste apenas o dia.</p>
                            )}
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
                                            const currentBalance = getAccountCumulativeBalance(
                                                transactions,
                                                acc,
                                                new Date().getFullYear(),
                                                new Date().getMonth()
                                            );
                                            return {
                                                label: `${acc.name} (${formatCurrency(currentBalance)})`,
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

                    {/* Seleção de Conta de Destino (Apenas para Transferência) */}
                    {tab === 'transfer' && (
                        <div>
                            <label className={`block text-xs font-bold mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                                Conta de Destino
                            </label>
                            <div className="relative">
                                <Dropdown
                                    options={accounts.map(acc => {
                                        const bank = BANKS.find(b => b.name === acc.bankName);
                                        const currentBalance = getAccountCumulativeBalance(
                                            transactions,
                                            acc,
                                            new Date().getFullYear(),
                                            new Date().getMonth()
                                        );
                                        return {
                                            label: `${acc.name} (${formatCurrency(currentBalance)})`,
                                            value: acc.id,
                                            logo: bank?.logo
                                        };
                                    })}
                                    value={selectedDestinationId}
                                    onChange={setSelectedDestinationId}
                                    placeholder="Selecione a conta de destino"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}

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



                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onClose(); }}
                            className="py-2.5 rounded-lg font-bold text-sm text-gray-300 bg-white/[0.05] hover:bg-white/[0.1] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button type="submit" className={`py-2.5 rounded-lg font-bold text-sm text-white shadow-sm hover:shadow-md transition-all active:scale-95 ${tab === 'expense' ? 'bg-red-600' : tab === 'credit' ? 'bg-purple-600' : tab === 'transfer' ? 'bg-blue-600' : 'bg-green-600'}`}>Salvar</button>
                    </div>
                </form>
            </Modal>
            <RecurrenceModal
                isOpen={isRecurrenceModalOpen}
                onClose={() => setIsRecurrenceModalOpen(false)}
                onSave={handleRecurrenceSave}
                initialData={recurrenceData}
            />
        </>
    );
};
