import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { PrivateValue } from '../components/PrivateValue';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/helpers';
import { Modal } from '../components/Modal';
import { Investment } from '../types';

const Investments: React.FC = () => {
    const { investments, addInvestment, updateInvestment, deleteInvestment } = useFinance();
    const { theme } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

    const handleOpenModal = (investment: Investment | null = null) => {
        setSelectedInvestment(investment);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        if (selectedInvestment) {
            await updateInvestment(selectedInvestment.id, data);
        } else {
            await addInvestment(data);
        }
        setIsModalOpen(false);
    };

    const totalInvested = investments.reduce((acc, inv) => acc + Number(inv.amount), 0);

    return (
        <div className="flex flex-col gap-6 md:gap-8 animate-fade-in pb-20 md:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl md:text-4xl font-black leading-tight tracking-[-0.033em] transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Investimentos</h1>
                    <p className={`text-sm mt-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Gerencie seu portfólio de ativos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            try {
                                await fetch('http://localhost:5000/sync', { method: 'POST' });
                                alert('Sincronização iniciada! Os valores serão atualizados em breve.');
                            } catch (e) {
                                alert('Erro ao conectar com o serviço de automação. Verifique se o start_app.bat está rodando.');
                            }
                        }}
                        className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 md:h-11 px-4 bg-indigo-500 text-white text-base font-medium leading-normal gap-2 hover:bg-indigo-600 transition-colors shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)]"
                        title="Sincronizar Cotações"
                    >
                        <Icon name="sync" />
                        <span className="truncate hidden md:inline">Sincronizar</span>
                    </button>
                    <button
                        onClick={() => handleOpenModal(null)}
                        className="flex min-w-[40px] md:min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 md:h-11 px-4 bg-teal-500 text-white text-base font-medium leading-normal gap-2 hover:bg-teal-600 transition-colors shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]"
                    >
                        <Icon name="add" />
                        <span className="truncate hidden md:inline">Novo Ativo</span>
                    </button>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`backdrop-blur-md rounded-xl p-5 border transition-all ${theme === 'light'
                    ? 'bg-blue-50/50 border-blue-100 shadow-sm'
                    : 'bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-white/10'
                    }`}>
                    <p className={`text-sm font-medium mb-1 transition-colors ${theme === 'light' ? 'text-blue-600' : 'text-blue-200'}`}>Total Investido</p>
                    <h2 className={`text-3xl font-black transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(totalInvested)}</PrivateValue></h2>
                </div>
            </div>

            {/* Lista */}
            <div className={`backdrop-blur-md rounded-xl border overflow-hidden transition-all ${theme === 'light'
                ? 'bg-white border-gray-200 shadow-sm'
                : 'bg-white/[0.02] border-white/[0.05]'
                }`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className={`font-medium border-b transition-colors ${theme === 'light'
                            ? 'bg-gray-50 text-slate-500 border-gray-200'
                            : 'bg-white/[0.05] text-gray-400 border-white/[0.05]'
                            }`}>
                            <tr>
                                <th className="px-6 py-4">Nome</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4 text-right">Cotação Atual</th>
                                <th className="px-6 py-4 text-right">Valor Atual</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y transition-colors ${theme === 'light' ? 'divide-gray-100' : 'divide-white/[0.05]'}`}>
                            {investments.length > 0 ? investments.map((inv) => (
                                <tr key={inv.id} className={`transition-colors ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.02]'}`}>
                                    <td
                                        onClick={() => handleOpenModal(inv)}
                                        className={`px-6 py-4 font-bold cursor-pointer hover:text-teal-500 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
                                    >
                                        {inv.name}
                                    </td>
                                    <td className={`px-6 py-4 capitalize transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>{inv.type.replace('_', ' ')}</td>
                                    <td className={`px-6 py-4 transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                                    <td className={`px-6 py-4 text-right text-sm transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
                                        <PrivateValue>
                                            {inv.currentPrice ? formatCurrency(inv.currentPrice) : '-'}
                                        </PrivateValue>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-teal-500"><PrivateValue>{formatCurrency(inv.amount)}</PrivateValue></td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => deleteInvestment(inv.id)}
                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Icon name="delete" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className={`px-6 py-12 text-center transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>
                                        Nenhum investimento cadastrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <NewInvestmentModal
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={selectedInvestment}
                />
            )}
        </div>
    );
};

const NewInvestmentModal: React.FC<{ onClose: () => void; onSave: (i: any) => void; initialData?: Investment | null }> = ({ onClose, onSave, initialData }) => {
    const { accounts } = useFinance();
    const { theme } = useTheme();
    // Basic Fields
    const [name, setName] = useState(initialData?.name || '');
    const [ticker, setTicker] = useState(initialData?.ticker || '');
    const [searchResults, setSearchResults] = useState<any[]>([]); // New state for search
    const [quantity, setQuantity] = useState(initialData?.quantity?.toString() || '');
    const [type, setType] = useState(initialData?.type || 'renda_fixa');
    const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
    const [accountId, setAccountId] = useState(initialData?.accountId || '');
    const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);

    // Simulation Mode
    const [isSimulation, setIsSimulation] = useState(false);

    // Simulation Fields
    const [yieldRate, setYieldRate] = useState(initialData?.yieldRate?.toString() || '');
    const [yieldType, setYieldType] = useState<'yearly' | 'monthly'>(initialData?.yieldType || 'yearly');
    const [duration, setDuration] = useState(initialData?.duration?.toString() || '');
    const [durationUnit, setDurationUnit] = useState<'months' | 'years'>(initialData?.durationUnit || 'months');
    const [taxType, setTaxType] = useState<'regressive' | 'exempt'>(initialData?.taxType || 'regressive');
    const [maturityDate, setMaturityDate] = useState(initialData?.maturityDate || '');

    // Derived Calculations
    const [calculatedResults, setCalculatedResults] = useState<{
        grossYield: number;
        taxAmount: number;
        netTotal: number;
        netYield: number;
    } | null>(null);

    // Effect to calculate results
    React.useEffect(() => {
        if (!amount || !yieldRate || !duration) {
            setCalculatedResults(null);
            return;
        }

        const P = parseFloat(amount);
        const rate = parseFloat(yieldRate);
        const time = parseFloat(duration);

        if (isNaN(P) || isNaN(rate) || isNaN(time)) return;

        // Convert rate to monthly decimal
        let monthlyRate = 0;
        if (yieldType === 'monthly') {
            monthlyRate = rate / 100;
        } else {
            // (1 + yearlyRate)^(1/12) - 1
            monthlyRate = Math.pow(1 + rate / 100, 1 / 12) - 1;
        }

        // Convert duration to months
        const months = durationUnit === 'years' ? time * 12 : time;

        // Compound Interest Formula: FV = P * (1 + r)^n
        const grossTotal = P * Math.pow(1 + monthlyRate, months);
        const grossYield = grossTotal - P;

        // Tax Calculation
        let taxRate = 0;
        if (taxType === 'regressive') {
            const days = months * 30; // Approximation
            if (days <= 180) taxRate = 0.225;
            else if (days <= 360) taxRate = 0.20;
            else if (days <= 720) taxRate = 0.175;
            else taxRate = 0.15;
        }

        const taxAmount = grossYield * taxRate;
        const netTotal = grossTotal - taxAmount;
        const netYield = netTotal - P;

        setCalculatedResults({
            grossYield,
            taxAmount,
            netTotal,
            netYield
        });

    }, [amount, yieldRate, yieldType, duration, durationUnit, taxType]);

    // Effect to handle Maturity Date
    React.useEffect(() => {
        if (date && duration) {
            const months = durationUnit === 'years' ? parseFloat(duration) * 12 : parseFloat(duration);
            if (!isNaN(months)) {
                const d = new Date(date);
                d.setMonth(d.getMonth() + months);
                setMaturityDate(d.toISOString().split('T')[0]);
            }
        }
    }, [date, duration, durationUnit]);

    // Reverse effect: Update duration if maturity date changes (optional, but requested logic implies consistency)
    // For simplicity, we stick to Duration -> Maturity Date as primary flow to avoid loops,
    // but user requested "Se o prazo for alterado, atualizar esta data" (Done above).
    // "Se preenchida, calcular automaticamente o prazo" -> Implementation below
    const handleMaturityDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newMaturity = e.target.value;
        setMaturityDate(newMaturity);

        if (date && newMaturity) {
            const start = new Date(date);
            const end = new Date(newMaturity);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffMonths = Math.round(diffDays / 30); // Approximation

            setDuration(diffMonths.toString());
            setDurationUnit('months');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isSimulation) return; // Don't save in simulation mode

        const payload: any = {
            name,
            ticker,
            quantity: quantity ? parseFloat(quantity) : 0,
            type,
            amount: parseFloat(amount),
            accountId: accountId || null,
            date,
            // Save projection data
            yieldRate: yieldRate ? parseFloat(yieldRate) : null,
            yieldType,
            duration: duration ? parseFloat(duration) : null,
            durationUnit,
            taxType,
            maturityDate: maturityDate || null,
            projectedGrossYield: calculatedResults?.grossYield,
            projectedTaxAmount: calculatedResults?.taxAmount,
            projectedNetTotal: calculatedResults?.netTotal,
            projectedNetYield: calculatedResults?.netYield
        };

        // Only set initialAmount for new investments
        if (!initialData) {
            payload.initialAmount = parseFloat(amount);
        }

        onSave(payload);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={initialData ? "Detalhes do Investimento" : "Novo Investimento"}>
            <div className="space-y-5">
                {/* Simulation Toggle - Only show for new investments */}
                {!initialData && (
                    <div className={`flex p-1 rounded-xl border transition-all ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-white/[0.05] border-white/[0.1]'}`}>
                        <button
                            type="button"
                            onClick={() => setIsSimulation(true)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isSimulation
                                ? 'bg-teal-500 text-white shadow-sm'
                                : (theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-white')
                                }`}
                        >
                            Simulação
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsSimulation(false)}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isSimulation
                                ? 'bg-teal-500 text-white shadow-sm'
                                : (theme === 'light' ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-white')
                                }`}
                        >
                            Investimento Real
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Nome do Ativo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: CDB Nubank"
                            required={!isSimulation}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50'
                                }`}
                        />
                    </div>
                    <div className="relative">
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Buscar Ativo (Ticker)</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={ticker}
                                onChange={e => {
                                    const val = e.target.value.toUpperCase();
                                    setTicker(val);
                                    if (val.length > 2) {
                                        fetch(`http://localhost:5000/search?q=${val}`)
                                            .then(res => res.json())
                                            .then(data => {
                                                setSearchResults(data.results || []);
                                            })
                                            .catch(() => setSearchResults([]));
                                    } else {
                                        setSearchResults([]);
                                    }
                                }}
                                placeholder="Digite para buscar (ex: PETR4, BTC)"
                                className={`w-full px-4 py-3 rounded-xl border outline-none transition-all uppercase ${theme === 'light'
                                    ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                    : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50'
                                    }`}
                            />
                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className={`absolute z-50 left-0 right-0 mt-1 rounded-xl shadow-xl max-h-60 overflow-y-auto border backdrop-blur-xl transition-all ${theme === 'light'
                                    ? 'bg-white border-gray-200'
                                    : 'bg-[#1a1d21] border-white/[0.1]'
                                    }`}>
                                    {searchResults.map((res: any, idx: number) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                setTicker(res.ticker);
                                                setName(res.name);
                                                setSearchResults([]);
                                            }}
                                            className={`px-4 py-3 cursor-pointer flex justify-between items-center border-b last:border-0 transition-colors ${theme === 'light'
                                                ? 'hover:bg-gray-50 border-gray-100'
                                                : 'hover:bg-white/[0.05] border-white/[0.05]'
                                                }`}
                                        >
                                            <div>
                                                <p className={`font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{res.ticker}</p>
                                                <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{res.name}</p>
                                            </div>
                                            {res.price && (
                                                <div className="text-right">
                                                    <p className="font-bold text-teal-500"><PrivateValue>{formatCurrency(res.price)}</PrivateValue></p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Quantidade (Cotas/Moedas)</label>
                        <input
                            type="number"
                            step="0.00000001"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            placeholder="Ex: 100"
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50'
                                }`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Tipo</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50 [&>option]:bg-[#1a1d21]'
                                }`}
                        >
                            <option value="renda_fixa">Renda Fixa</option>
                            <option value="acoes">Ações</option>
                            <option value="fiis">FIIs</option>
                            <option value="cripto">Criptomoedas</option>
                            <option value="outros">Outros</option>
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Conta de Origem</label>
                        <select
                            value={accountId}
                            onChange={e => setAccountId(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50 [&>option]:bg-[#1a1d21]'
                                }`}
                        >
                            <option value="">Selecionar conta (Opcional)</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Valor Investido</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0,00"
                            required
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50'
                                }`}
                        />
                    </div>

                    {/* Simulador Block */}
                    {isSimulation && (
                        <div className={`p-4 rounded-xl border space-y-4 transition-all ${theme === 'light'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white/[0.02] border-white/[0.05]'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon name="calculate" className="text-teal-500" />
                                <h3 className={`text-sm font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                    Simulador de Rendimento
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 md:col-span-1">
                                    <label className={`block text-xs font-bold mb-1.5 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Rendimento (%)</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={yieldRate}
                                            onChange={e => setYieldRate(e.target.value)}
                                            placeholder="12"
                                            className={`w-full px-3 py-2.5 rounded-l-xl border border-r-0 outline-none min-w-0 transition-all ${theme === 'light'
                                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50'
                                                }`}
                                        />
                                        <select
                                            value={yieldType}
                                            onChange={e => setYieldType(e.target.value as any)}
                                            className={`px-2 py-2.5 rounded-r-xl border text-xs font-bold outline-none cursor-pointer transition-all ${theme === 'light'
                                                ? 'bg-gray-100 border-gray-200 text-slate-700 hover:bg-gray-200'
                                                : 'bg-white/[0.1] border-white/[0.1] text-white hover:bg-white/[0.15] [&>option]:bg-[#1a1d21]'
                                                }`}
                                        >
                                            <option value="yearly">% a.a</option>
                                            <option value="monthly">% a.m</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className={`block text-xs font-bold mb-1.5 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Prazo</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            value={duration}
                                            onChange={e => setDuration(e.target.value)}
                                            placeholder="12"
                                            className={`w-full px-3 py-2.5 rounded-l-xl border border-r-0 outline-none min-w-0 transition-all ${theme === 'light'
                                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50'
                                                }`}
                                        />
                                        <select
                                            value={durationUnit}
                                            onChange={e => setDurationUnit(e.target.value as any)}
                                            className={`px-2 py-2.5 rounded-r-xl border text-xs font-bold outline-none cursor-pointer transition-all ${theme === 'light'
                                                ? 'bg-gray-100 border-gray-200 text-slate-700 hover:bg-gray-200'
                                                : 'bg-white/[0.1] border-white/[0.1] text-white hover:bg-white/[0.15] [&>option]:bg-[#1a1d21]'
                                                }`}
                                        >
                                            <option value="months">Meses</option>
                                            <option value="years">Anos</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <label className={`block text-xs font-bold mb-1.5 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Tributação</label>
                                    <select
                                        value={taxType}
                                        onChange={e => setTaxType(e.target.value as any)}
                                        className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                            ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                            : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50 [&>option]:bg-[#1a1d21]'
                                            }`}
                                    >
                                        <option value="regressive">Regressiva (IR Padrão)</option>
                                        <option value="exempt">Isento (LCI/LCA/CRI/CRA)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Data da Aplicação</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50 [&::-webkit-calendar-picker-indicator]:invert'
                                }`}
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-bold mb-2 transition-colors ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>Data de Vencimento</label>
                        <input
                            type="date"
                            value={maturityDate}
                            onChange={handleMaturityDateChange}
                            className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${theme === 'light'
                                ? 'bg-white border-gray-200 text-slate-900 focus:ring-2 focus:ring-teal-500/20'
                                : 'bg-white/[0.05] border-white/[0.1] text-white focus:ring-2 focus:ring-teal-500/50 [&::-webkit-calendar-picker-indicator]:invert'
                                }`}
                        />
                    </div>

                    {/* Resumo Automático */}
                    {isSimulation && calculatedResults && (
                        <div className={`rounded-xl p-4 border space-y-3 transition-all ${theme === 'light'
                            ? 'bg-teal-50/50 border-teal-100'
                            : 'bg-gradient-to-br from-teal-500/10 to-blue-600/10 border-teal-500/20'
                            }`}>
                            <h4 className="text-sm font-black text-teal-500 uppercase tracking-wider flex items-center gap-2">
                                <Icon name="insights" /> Resumo do Investimento
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Valor Investido</p>
                                    <p className={`font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(parseFloat(amount))}</PrivateValue></p>
                                </div>
                                <div>
                                    <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Rendimento Bruto</p>
                                    <p className="text-green-500 font-bold">+<PrivateValue>{formatCurrency(calculatedResults.grossYield)}</PrivateValue></p>
                                </div>
                                <div>
                                    <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Imposto Estimado ({taxType === 'exempt' ? '0%' : 'IR'})</p>
                                    <p className="text-red-500 font-bold">-<PrivateValue>{formatCurrency(calculatedResults.taxAmount)}</PrivateValue></p>
                                </div>
                                <div>
                                    <p className={`text-xs transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>Prazo Estimado</p>
                                    <p className={`font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{duration} {durationUnit === 'years' ? 'Anos' : 'Meses'}</p>
                                </div>
                            </div>
                            <div className={`pt-2 border-t mt-2 transition-colors ${theme === 'light' ? 'border-teal-100' : 'border-teal-500/20'}`}>
                                <div className="flex justify-between items-end">
                                    <p className={`text-sm font-medium transition-colors ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>Valor Final Estimado</p>
                                    <p className={`text-2xl font-black transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}><PrivateValue>{formatCurrency(calculatedResults.netTotal)}</PrivateValue></p>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className={`w-full h-12 rounded-xl font-bold text-white shadow-sm mt-4 transition-all
                            ${isSimulation
                                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                : 'bg-teal-500 hover:bg-teal-600 shadow-[0_0_20px_-5px_rgba(45,212,191,0.3)]'}`}
                        disabled={isSimulation}
                    >
                        {isSimulation ? 'Modo Simulação (Apenas Visualização)' : (initialData ? 'Salvar Alterações' : 'Salvar Investimento')}
                    </button>
                </form>
            </div>
        </Modal>
    );
};

export default Investments;
