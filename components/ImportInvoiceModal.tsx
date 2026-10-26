import React, { useState } from 'react';
import { Modal } from './Modal';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { Icon } from './Icon';
import { useToast } from '../context/ToastContext';
import { Dropdown } from './Dropdown';
import { useTheme } from '../context/ThemeContext';

interface ImportInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ImportInvoiceModal: React.FC<ImportInvoiceModalProps> = ({ isOpen, onClose }) => {
    const { cards, accounts, recalculateBalances } = useFinance();
    const { user } = useAuth();
    const { toast } = useToast();
    const { theme } = useTheme();

    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Generate last 12 months + next 12 months for selection
    const months = [];
    const today = new Date();
    for (let i = -12; i <= 12; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const value = d.toISOString().slice(0, 7);
        const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        months.push({ label: label.charAt(0).toUpperCase() + label.slice(1), value });
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleImport = async () => {
        if (!selectedCardId || !selectedAccountId || !file || !user) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('user_id', user.id);
        formData.append('account_id', selectedAccountId);
        formData.append('card_id', selectedCardId);
        formData.append('reference_date', selectedMonth);

        try {
            const response = await fetch('http://localhost:5000/import', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || 'Importação realizada com sucesso!');
                await recalculateBalances();
                onClose();
                setFile(null);
            } else {
                toast.error(data.error || 'Erro na importação.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao conectar com o servidor de importação.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Importar Fatura"
            headerActions={
                <button
                    onClick={handleImport}
                    disabled={isUploading}
                    className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold rounded-full transition-colors disabled:opacity-50"
                >
                    {isUploading ? 'Importando...' : 'Importar'}
                </button>
            }
        >
            <div className="flex flex-col gap-4">
                <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Cartão</label>
                    <Dropdown
                        options={cards.map(c => ({ label: `${c.name} (**** ${c.lastDigits})`, value: c.id }))}
                        value={selectedCardId}
                        onChange={setSelectedCardId}
                        placeholder="Selecione o cartão"
                    />
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Mês de Referência</label>
                    <div className={`relative w-full border rounded-xl transition-all ${theme === 'light'
                        ? 'bg-white border-gray-200 text-slate-900 hover:bg-gray-50'
                        : 'bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1]'
                        }`}>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full bg-transparent p-2.5 text-sm outline-none appearance-none cursor-pointer"
                        >
                            {months.map(m => (
                                <option key={m.value} value={m.value} className="text-black">{m.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <Icon name="expand_more" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Conta Bancária (Pagamento)</label>
                    <Dropdown
                        options={accounts.map(a => ({ label: a.name, value: a.id }))}
                        value={selectedAccountId}
                        onChange={setSelectedAccountId}
                        placeholder="Selecione a conta"
                    />
                </div>

                <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative group ${theme === 'light'
                    ? 'border-gray-300 hover:bg-gray-50'
                    : 'border-white/10 hover:bg-white/5'
                    }`}>
                    <input
                        type="file"
                        accept=".pdf,.ofx,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Icon name="upload_file" className={`text-4xl mb-2 transition-colors ${theme === 'light' ? 'text-gray-400 group-hover:text-teal-500' : 'text-gray-500 group-hover:text-teal-400'}`} />
                    <p className={`text-sm font-medium transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>{file ? file.name : 'Clique ou arraste o arquivo aqui'}</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, OFX ou XLSX</p>
                </div>
            </div>
        </Modal>
    );
};
