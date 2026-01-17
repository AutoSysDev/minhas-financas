import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { Account } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatDate } from '../utils/helpers';

interface BankImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
}

interface TempTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'INCOME' | 'EXPENSE';
}

type Step = 'upload' | 'preview';
type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

export const BankImportModal: React.FC<BankImportModalProps> = ({ isOpen, onClose, accounts }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);

    const [transactions, setTransactions] = useState<TempTransaction[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<FilterType>('ALL');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleParse = async () => {
        if (!file || !user) return;
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:5000/parse', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setTransactions(data.transactions);
                setSelectedIds(new Set(data.transactions.map((t: TempTransaction) => t.id)));
                setStep('preview');
            } else {
                toast.error(data.error || 'Erro ao processar arquivo.');
            }
        } catch (error) {
            console.error('Parse error:', error);
            toast.error('Erro de conexão com o servidor de automação.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleFinalImport = async () => {
        if (!user || selectedIds.size === 0) return;
        setIsProcessing(true);

        const transactionsToSave = transactions.filter(t => selectedIds.has(t.id));

        try {
            const response = await fetch('http://localhost:5000/save-imported', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transactions: transactionsToSave,
                    user_id: user.id,
                    account_id: selectedAccountId || null
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Importação realizada com sucesso!');
                queryClient.invalidateQueries({ queryKey: ['transactions'] });
                queryClient.invalidateQueries({ queryKey: ['finance'] });
                onClose();
            } else {
                toast.error(data.error || 'Erro ao salvar transações.');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Erro ao salvar transações no servidor.');
        } finally {
            setIsProcessing(false);
        }
    };

    const filteredTransactions = useMemo(() => {
        if (filter === 'ALL') return transactions;
        return transactions.filter(t => t.type === filter);
    }, [transactions, filter]);

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredTransactions.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredTransactions.map(t => t.id)));
        }
    };

    const toggleRow = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const renderUploadStep = () => (
        <div className="space-y-6">
            <p className="text-sm text-gray-400">
                Suporta arquivos <strong>PDF, OFX e XLSX</strong>. As transações serão extraídas para revisão.
            </p>

            {/* Seleção de Conta */}
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Conta de Destino (Opcional)</label>
                <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3 text-white outline-none focus:border-teal-500/50 transition-colors"
                >
                    <option value="">Nenhuma (Apenas importar)</option>
                    {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                            {acc.bankName} - {acc.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Upload de Arquivo */}
            <div
                className="border-2 border-dashed border-white/[0.1] rounded-2xl p-8 flex flex-col items-center justify-center gap-4 hover:border-teal-500/30 hover:bg-teal-500/5 transition-all cursor-pointer relative"
                onClick={() => document.getElementById('bank-file-input')?.click()}
            >
                <input
                    type="file"
                    id="bank-file-input"
                    className="hidden"
                    accept=".pdf,.ofx,.xlsx,.xls"
                    onChange={handleFileChange}
                />

                <div className="size-14 rounded-full bg-white/[0.05] flex items-center justify-center text-teal-400">
                    <Icon name={file ? "check_circle" : "cloud_upload"} className="text-3xl" />
                </div>

                <div className="text-center">
                    <p className="text-white font-medium">
                        {file ? file.name : "Clique para selecionar o arquivo"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : "PDF, OFX ou Excel"}
                    </p>
                </div>
            </div>

            <button
                onClick={handleParse}
                disabled={!file || isProcessing}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${!file || isProcessing
                    ? 'bg-white/[0.05] text-gray-500 cursor-not-allowed'
                    : 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20 active:scale-[0.98]'
                    }`}
            >
                {isProcessing ? (
                    <>
                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processando arquivo...</span>
                    </>
                ) : (
                    <>
                        <Icon name="visibility" />
                        <span>Visualizar Transações</span>
                    </>
                )}
            </button>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="flex flex-col h-[70vh]">
            {/* Filtros e Controles */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2 text-sm sticky top-0 bg-[#0f1216] z-10 py-2">
                <div className="flex bg-white/[0.05] p-1 rounded-lg">
                    <button
                        onClick={() => setFilter('ALL')}
                        className={`px-3 py-1 rounded-md transition-all ${filter === 'ALL' ? 'bg-teal-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilter('INCOME')}
                        className={`px-3 py-1 rounded-md transition-all ${filter === 'INCOME' ? 'bg-green-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Entradas
                    </button>
                    <button
                        onClick={() => setFilter('EXPENSE')}
                        className={`px-3 py-1 rounded-md transition-all ${filter === 'EXPENSE' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        Saídas
                    </button>
                </div>

                <div className="text-xs text-gray-400">
                    {selectedIds.size} de {transactions.length} selecionadas
                </div>
            </div>

            {/* Tabela de Revisão */}
            <div className="flex-1 overflow-auto border border-white/[0.05] rounded-xl">
                <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-white/[0.02] sticky top-0">
                        <tr>
                            <th className="p-3 border-b border-white/[0.05] w-10">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.size > 0 && selectedIds.size === filteredTransactions.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-white/10 bg-white/5 text-teal-500 focus:ring-teal-500/50"
                                />
                            </th>
                            <th className="p-3 border-b border-white/[0.05] text-xs font-bold text-gray-500 uppercase">Data</th>
                            <th className="p-3 border-b border-white/[0.05] text-xs font-bold text-gray-500 uppercase">Descrição</th>
                            <th className="p-3 border-b border-white/[0.05] text-xs font-bold text-gray-500 uppercase text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map((tx) => (
                            <tr
                                key={tx.id}
                                className={`hover:bg-white/[0.02] cursor-pointer group ${!selectedIds.has(tx.id) ? 'opacity-50' : ''}`}
                                onClick={() => toggleRow(tx.id)}
                            >
                                <td className="p-3 border-b border-white/[0.05]">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(tx.id)}
                                        onChange={() => { }} // Handle by row click
                                        className="rounded border-white/10 bg-white/5 text-teal-500 focus:ring-teal-500/50"
                                    />
                                </td>
                                <td className="p-3 border-b border-white/[0.05] text-gray-400 whitespace-nowrap">
                                    {formatDate(tx.date)}
                                </td>
                                <td className="p-3 border-b border-white/[0.05] text-white">
                                    <div className="flex flex-col">
                                        <span
                                            className={`${expandedId === tx.id ? '' : 'truncate max-w-[200px]'} cursor-help hover:text-teal-400 transition-colors`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedId(expandedId === tx.id ? null : tx.id);
                                            }}
                                            title={tx.description}
                                        >
                                            {tx.description}
                                        </span>
                                        <span className="text-[10px] text-gray-500">{tx.category}</span>
                                    </div>
                                </td>
                                <td className={`p-3 border-b border-white/[0.05] text-right font-medium ${tx.type === 'INCOME' ? 'text-green-400' : 'text-red-400'}`}>
                                    {formatCurrency(Math.abs(tx.amount))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Botões de Ação */}
            <div className="mt-6 flex gap-3">
                <button
                    onClick={() => setStep('upload')}
                    className="flex-1 py-4 bg-white/[0.05] text-gray-400 rounded-xl font-bold hover:bg-white/[0.1] transition-all"
                >
                    Voltar
                </button>
                <button
                    onClick={handleFinalImport}
                    disabled={selectedIds.size === 0 || isProcessing}
                    className={`flex-[2] py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${selectedIds.size === 0 || isProcessing
                        ? 'bg-white/[0.05] text-gray-500 cursor-not-allowed'
                        : 'bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20 active:scale-[0.98]'
                        }`}
                >
                    {isProcessing ? (
                        <>
                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Importando...</span>
                        </>
                    ) : (
                        <>
                            <Icon name="check_circle" />
                            <span>Importar {selectedIds.size} Transações</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'upload' ? "Extrair Transações do Extrato" : "Revisar Transações"}
            maxWidth={step === 'preview' ? 'max-w-4xl' : 'max-w-md'}
        >
            {step === 'upload' ? renderUploadStep() : renderPreviewStep()}
        </Modal>
    );
};
