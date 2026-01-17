import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { useTheme } from '../context/ThemeContext';

export interface Option {
    label: string;
    value: string;
    icon?: string;
    logo?: string;
}

interface DropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    icon?: string; // Icon for the trigger button (left side)
    minimal?: boolean; // New prop for cleaner look
}

export const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder,
    className = '',
    label,
    icon,
    minimal = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {label && <label className={`block text-xs font-bold mb-1 transition-colors ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center transition-all ${minimal
                    ? `justify-end gap-1.5 bg-transparent border-none hover:text-teal-400 py-1 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`
                    : `justify-between px-3 py-2.5 border rounded-xl transition-all ${theme === 'light'
                        ? 'bg-white border-gray-200 hover:bg-gray-50 hover:border-teal-500/30 text-slate-900'
                        : 'bg-white/[0.05] border-white/[0.1] hover:bg-white/[0.1] hover:border-white/[0.2] text-white'
                    }`
                    } ${!minimal && isOpen ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white/[0.08]' : ''}`}
            >
                <div className={`flex items-center gap-2 overflow-hidden ${minimal ? 'flex-row' : ''}`}>
                    {selectedOption?.logo ? (
                        <img src={selectedOption.logo} alt="" className="size-5 rounded-full object-cover shadow-sm" />
                    ) : (
                        icon && !minimal && <Icon name={icon} className={theme === 'light' ? 'text-slate-400' : 'text-gray-400'} />
                    )}
                    <span className={`text-sm font-medium truncate ${selectedOption ? (theme === 'light' ? 'text-slate-900' : 'text-white') : 'text-gray-500'}`}>
                        {selectedOption ? selectedOption.label : placeholder || 'Selecione'}
                    </span>
                </div>
                <Icon
                    name="expand_more"
                    className={`transition-transform duration-300 flex-shrink-0 ${minimal ? 'text-[16px] text-gray-500' : 'text-lg text-gray-400'} ${isOpen ? 'rotate-180 text-teal-400' : ''}`}
                />
            </button>

            {isOpen && (
                <div className={`absolute z-50 mt-2 overflow-hidden border rounded-xl shadow-2xl animate-fade-in max-h-60 overflow-y-auto ring-1 transition-all ${minimal ? 'right-0 w-48' : 'w-full'
                    } ${theme === 'light'
                        ? 'bg-white border-gray-200 ring-black/5'
                        : 'bg-[#1a1d21] border-white/[0.1] ring-white/5'
                    }`}>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center px-4 py-3 text-sm text-left transition-colors ${option.value === value
                                ? 'bg-teal-500 text-white font-bold'
                                : theme === 'light'
                                    ? 'text-slate-600 hover:bg-gray-50 hover:text-teal-600'
                                    : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                                }`}
                        >
                            {option.logo ? (
                                <img src={option.logo} alt="" className="size-6 rounded-full object-cover mr-2" />
                            ) : (
                                option.icon && <Icon name={option.icon} className={`mr-2 text-lg ${option.value === value ? 'text-white' : (theme === 'light' ? 'text-slate-400' : 'text-gray-400')}`} />
                            )}
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
