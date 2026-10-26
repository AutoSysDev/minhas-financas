import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { Dropdown } from './Dropdown';
import { useTheme } from '../context/ThemeContext';

export interface RecurrenceData {
    isActive: boolean;
    initialInstallment: number;
    count: number;
    periodicity: 'monthly' | 'weekly' | 'yearly';
}

interface RecurrenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: RecurrenceData) => void;
    initialData?: RecurrenceData;
}

export const RecurrenceModal: React.FC<RecurrenceModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData
}) => {
    const { theme } = useTheme();
    const [initialInstallment, setInitialInstallment] = useState(1);
    const [count, setCount] = useState(2);
    const [periodicity, setPeriodicity] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

    useEffect(() => {
        if (initialData) {
            setInitialInstallment(initialData.initialInstallment);
            setCount(initialData.count);
            setPeriodicity(initialData.periodicity);
        }
    }, [initialData]);

    const handleSave = () => {
        onSave({
            isActive: true,
            initialInstallment,
            count,
            periodicity
        });
        onClose();
    };

    const increment = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, max?: number) => {
        setter(prev => (max && prev >= max ? prev : prev + 1));
    };

    const decrement = (setter: React.Dispatch<React.SetStateAction<number>>, value: number, min: number = 1) => {
        setter(prev => (prev > min ? prev - 1 : prev));
    };

    if (!isOpen) return null;

    // Overlay styles to match standard Modal but customized for this specific look if needed
    // Using standard fixed overlay
    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className={`w-full max-w-sm rounded-3xl shadow-2xl transform transition-all scale-100 ${theme === 'light' ? 'bg-white' : 'bg-[#1c1c1e] border border-white/10'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between p-5 border-b ${theme === 'light' ? 'border-gray-100' : 'border-white/[0.05]'}`}>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-400' : 'hover:bg-white/10 text-gray-400'}`}>
                        <Icon name="close" className="text-xl" />
                    </button>
                    <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Configurar Repetição</h3>
                    <button
                        onClick={handleSave}
                        className="px-4 py-1.5 rounded-full bg-teal-500 text-white text-sm font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-600 transition-colors"
                    >
                        Concluir
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Parcela Inicial */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icon name="event_repeat" className={`text-xl ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Parcela inicial</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => decrement(setInitialInstallment, initialInstallment)} className={`p-1 rounded hover:bg-white/10 ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>
                                <Icon name="expand_more" className="text-xl rotate-90" /> {/* Using rotate for left arrow look or just chevron */}
                            </button>
                            <span className={`w-8 text-center font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{initialInstallment}</span>
                            <button onClick={() => increment(setInitialInstallment, initialInstallment)} className={`p-1 rounded hover:bg-white/10 ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>
                                <Icon name="expand_less" className="text-xl rotate-90" />
                            </button>
                        </div>
                    </div>

                    {/* Quantidade */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icon name="filter_none" className={`text-xl ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`} /> {/* Using filter_none as copy icon */}
                            <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Quantidade</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => decrement(setCount, count, 2)} className={`p-1 rounded hover:bg-white/10 ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>
                                <Icon name="expand_more" className="text-xl rotate-90" />
                            </button>
                            <span className={`w-8 text-center font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{count}</span>
                            <button onClick={() => increment(setCount, count, 60)} className={`p-1 rounded hover:bg-white/10 ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>
                                <Icon name="expand_less" className="text-xl rotate-90" />
                            </button>
                        </div>
                    </div>

                    {/* Periodicidade */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Icon name="update" className={`text-xl ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`} />
                            <span className={`font-medium ${theme === 'light' ? 'text-slate-700' : 'text-gray-200'}`}>Periodicidade</span>
                        </div>
                        <div className="w-32">
                            <Dropdown
                                options={[
                                    { label: 'Mensal', value: 'monthly' },
                                    { label: 'Semanal', value: 'weekly' },
                                    { label: 'Anual', value: 'yearly' }
                                ]}
                                value={periodicity}
                                onChange={(val) => setPeriodicity(val as any)}
                                minimal={true}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};
