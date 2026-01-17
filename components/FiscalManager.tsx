import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { nuvemFiscalService } from '../services/nuvemFiscalService';
import { FiscalNote, Transaction } from '../types';
import { formatCurrency } from '../utils/helpers';

interface FiscalManagerProps {
    transaction: Transaction;
}

export const FiscalManager: React.FC<FiscalManagerProps> = ({ transaction }) => {
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
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 mt-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-bold flex items-center gap-2">
                    <Icon name="description" className="text-teal-400" />
                    Nota Fiscal Eletrônica (NF-e)
                </h4>
                {fiscalNote && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${fiscalNote.status === 'authorized' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            fiscalNote.status === 'rejected' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                        {fiscalNote.status}
                    </span>
                )}
            </div>

            {!fiscalNote ? (
                <div className="flex flex-col gap-3">
                    <p className="text-sm text-gray-400">Esta transação ainda não possui nota fiscal emitida.</p>
                    <button
                        onClick={handleIssueNFe}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-all"
                    >
                        {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Icon name="send" />}
                        Emitir NF-e
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500 text-xs">Número / Série</p>
                            <p className="text-white font-medium">{fiscalNote.nfe_number || '---'} / {fiscalNote.nfe_series || '---'}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs">ID Nuvem Fiscal</p>
                            <p className="text-white font-medium truncate" title={fiscalNote.nuvem_fiscal_id}>{fiscalNote.nuvem_fiscal_id || '---'}</p>
                        </div>
                    </div>

                    {fiscalNote.error_message && (
                        <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                            {fiscalNote.error_message}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                        {fiscalNote.status === 'authorized' && (
                            <>
                                <a
                                    href={fiscalNote.pdf_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg text-xs font-semibold transition-all"
                                >
                                    <Icon name="picture_as_pdf" />
                                    Visualizar PDF
                                </a>
                                <a
                                    href={fiscalNote.xml_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg text-xs font-semibold transition-all"
                                >
                                    <Icon name="code" />
                                    Download XML
                                </a>
                            </>
                        )}

                        {(fiscalNote.status === 'processing' || fiscalNote.status === 'pending') && (
                            <button
                                onClick={handleSyncStatus}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-lg text-xs font-semibold transition-all"
                            >
                                <Icon name="sync" className={loading ? 'animate-spin' : ''} />
                                Atualizar Status
                            </button>
                        )}

                        {fiscalNote.status === 'rejected' && (
                            <button
                                onClick={handleIssueNFe}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 rounded-lg text-xs font-semibold transition-all"
                            >
                                <Icon name="refresh" />
                                Tentar Novamente
                            </button>
                        )}
                    </div>
                </div>
            )}

            {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
    );
};
