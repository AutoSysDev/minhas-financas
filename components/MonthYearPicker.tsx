import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from './Icon';
import { useUI } from '../context/UIContext';
import { useTheme } from '../context/ThemeContext';

interface MonthYearPickerProps {
    currentDate: Date;
    onSelect: (date: Date) => void;
    onClose: () => void;
}

export const MonthYearPicker: React.FC<MonthYearPickerProps> = ({ currentDate, onSelect, onClose }) => {
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const pickerRef = useRef<HTMLDivElement>(null);
    const { setModalOpen } = useUI();
    const { theme } = useTheme();

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    useEffect(() => {
        // Notify UIContext that modal is open
        setModalOpen(true);

        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            setModalOpen(false);
        };
    }, [onClose, setModalOpen]);

    const handleMonthSelect = (monthIndex: number) => {
        const newDate = new Date(selectedYear, monthIndex, 1);
        onSelect(newDate);
        onClose();
    };

    const isCurrentMonth = (monthIndex: number) => {
        return currentDate.getMonth() === monthIndex && currentDate.getFullYear() === selectedYear;
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div
                ref={pickerRef}
                className={`relative w-[90vw] max-w-sm mx-auto p-6 backdrop-blur-xl border rounded-2xl shadow-2xl animate-scale-up ring-1 transition-all ${theme === 'light'
                    ? 'bg-white border-gray-200 ring-black/5'
                    : 'bg-[#0f1216]/90 border-white/[0.08] ring-white/5'
                    }`}
                style={{
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {/* Year Selector */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setSelectedYear(selectedYear - 1)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/[0.05]'}`}
                    >
                        <Icon name="chevron_left" className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'} />
                    </button>
                    <h3 className={`text-xl font-bold transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedYear}</h3>
                    <button
                        onClick={() => setSelectedYear(selectedYear + 1)}
                        className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-white/[0.05]'}`}
                    >
                        <Icon name="chevron_right" className={theme === 'light' ? 'text-slate-600' : 'text-gray-300'} />
                    </button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => (
                        <button
                            key={month}
                            onClick={() => handleMonthSelect(index)}
                            className={`
                p-3 rounded-xl text-sm font-semibold transition-all
                ${isCurrentMonth(index)
                                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                                    : (theme === 'light'
                                        ? 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                                        : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]')
                                }
              `}
                        >
                            {month.substring(0, 3)}
                        </button>
                    ))}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`mt-6 w-full py-3 rounded-xl font-semibold transition-colors ${theme === 'light'
                        ? 'bg-gray-100 text-slate-600 hover:bg-gray-200'
                        : 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.1]'
                        }`}
                >
                    Fechar
                </button>
            </div>
        </div>,
        document.body
    );
};
