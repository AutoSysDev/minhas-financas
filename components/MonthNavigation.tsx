import React, { useState } from 'react';
import { Icon } from './Icon';
import { MonthYearPicker } from './MonthYearPicker';
import { useTheme } from '../context/ThemeContext';

interface MonthNavigationProps {
    currentDate: Date;
    onMonthChange: (date: Date) => void;
    className?: string;
}

export const MonthNavigation: React.FC<MonthNavigationProps> = ({ currentDate, onMonthChange, className = '' }) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const { theme } = useTheme();

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        onMonthChange(newDate);
    };

    return (
        <>
            <div className={`flex items-center justify-between backdrop-blur-md border p-1 rounded-xl shadow-sm transition-all ${theme === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-white/[0.02] border-white/[0.05]'
                } ${className}`}>
                <button
                    onClick={() => navigateMonth(-1)}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                >
                    <Icon name="chevron_left" />
                </button>

                <button
                    onClick={() => setIsPickerOpen(true)}
                    className={`flex flex-col items-center px-4 py-1 rounded-lg transition-colors cursor-pointer ${theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/5'}`}
                >
                    <span className={`text-sm font-bold capitalize leading-none transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                    </span>
                    <span className={`text-[10px] font-medium leading-none mt-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>
                        {currentDate.getFullYear()}
                    </span>
                </button>

                <button
                    onClick={() => navigateMonth(1)}
                    className={`p-2 rounded-lg transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/10 text-gray-400 hover:text-white'}`}
                >
                    <Icon name="chevron_right" />
                </button>
            </div>

            {isPickerOpen && (
                <MonthYearPicker
                    currentDate={currentDate}
                    onSelect={(date) => {
                        onMonthChange(date);
                        setIsPickerOpen(false);
                    }}
                    onClose={() => setIsPickerOpen(false)}
                />
            )}
        </>
    );
};
