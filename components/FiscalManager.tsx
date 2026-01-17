import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { nuvemFiscalService } from '../services/nuvemFiscalService';
import { FiscalNote, Transaction } from '../types';
import { formatCurrency } from '../utils/helpers';
import { useTheme } from '../context/ThemeContext';

interface FiscalManagerProps {
    transaction: Transaction;
}

export const FiscalManager: React.FC<FiscalManagerProps> = ({ transaction }) => {
    const { theme } = useTheme();
    const [fiscalNote, setFiscalNote] = useState<FiscalNote | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadFiscalNote();
    }, [transaction.id]);

    const loadFiscalNote = async () => {
        try {
            const note = await nuvemFiscalService.getLocalFiscalNote(transaction.id);
            setFiscalNote(note);

            // Se estiver processando, tenta sincronizar
            if (note && note.status === 'processing') {
                const updated = await nuvemFiscalService.syncNFeStatus(note);
                setFiscalNote(updated);
            }
        } catch (err: any) {
            console.error('Erro ao carregar nota fiscal:', err);
        }
    };

    const handleIssueNFe = async () => {
        setLoading(true);
        setError(null);
        try {
            const note = await nuvemFiscalService.issueNFe(transaction, {});
            setFiscalNote(note);
        } catch (err: any) {
            setError(err.message || 'Erro ao emitir nota fiscal');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncStatus = async () => {
        if (!fiscalNote) return;
        setLoading(true);
        try {
            const updated = await nuvemFiscalService.syncNFeStatus(fiscalNote);
            setFiscalNote(updated);
        } catch (err: any) {
            setError('Erro ao sincronizar status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`border rounded-xl p-4 mt-4 transition-all ${theme === 'light'
            ? 'bg-gray-50 border-gray-100'
            : 'bg-white/[0.02] border-white/[0.05]'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <h4 className={`font-bold flex items-center gap-2 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    <Icon name="description" className="text-teal-400" />
                    Nota Fiscal Eletrônica (NF-e)
                </h4>
                {fiscalNote && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase transition-colors ${fiscalNote.status === 'authorized'
                        ? (theme === 'light' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-green-500/20 text-green-400 border border-green-500/30')
                        : fiscalNote.status === 'rejected'
                            ? (theme === 'light' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-red-500/20 text-red-400 border border-red-500/30')
                            : (theme === 'light' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30')
                        }`}>
                        {fiscalNote.status}
                    </span>
                )}
            </div>

            {!fiscalNote ? (
                <div className="flex flex-col gap-3">
                    <p className={`text-sm transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Esta transação ainda não possui nota fiscal emitida.</p>
                    <button
                        onClick={handleIssueNFe}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-all shadow-lg shadow-teal-500/20"
                    >
                        {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="send" />}
                        Emitir NF-e
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>Número / Série</p>
                            <p className={`font-medium transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{fiscalNote.nfe_number || '---'} / {fiscalNote.nfe_series || '---'}</p>
                        </div>
                        <div>
                            <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>ID Nuvem Fiscal</p>
                            <p className={`font-medium truncate transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} title={fiscalNote.nuvem_fiscal_id}>{fiscalNote.nuvem_fiscal_id || '---'}</p>
                        </div>
                    </div>
                    {fiscalNote.status === 'authorized' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => fiscalNote.pdf_url && window.open(fiscalNote.pdf_url)}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'light'
                                    ? 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                    : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
                                    }`}
                            >
                                <Icon name="picture_as_pdf" />
                                Ver PDF
                            </button>
                            <button
                                onClick={() => fiscalNote.xml_url && window.open(fiscalNote.xml_url)}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${theme === 'light'
                                    ? 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                    : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
                                    }`}
                            >
                                <Icon name="code" />
                                Ver XML
                            </button>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
                </div>
            )}
        </div>
    );
};
