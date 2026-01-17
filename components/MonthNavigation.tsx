import React, { useState } from 'react';
import { Icon } from './Icon';
import { MonthYearPicker } from './MonthYearPicker';

interface MonthNavigationProps {
    currentDate: Date;
    onMonthChange: (date: Date) => void;
    className?: string;
}

export const MonthNavigation: React.FC<MonthNavigationProps> = ({ currentDate, onMonthChange, className = '' }) => {
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const navigateMonth = (direction: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        onMonthChange(newDate);
    };

    return (
        <>
            <div className={`flex items-center justify-between bg-white/[0.02] backdrop-blur-md border border-white/[0.05] p-1 rounded-xl shadow-sm w-full md:max-w-md mx-auto ${className}`}>
                <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                    <Icon name="chevron_left" />
                </button>

                <button
                    onClick={() => setIsPickerOpen(true)}
                    className="flex flex-col items-center px-4 py-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                    <span className="text-sm font-bold text-white capitalize leading-none">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium leading-none mt-1">
                        {currentDate.getFullYear()}
                    </span>
                </button>

                <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
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
