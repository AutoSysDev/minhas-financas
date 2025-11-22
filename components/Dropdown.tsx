import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

export interface Option {
    label: string;
    value: string;
    icon?: string;
}

interface DropdownProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    icon?: string; // Icon for the trigger button (left side)
}

export const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder,
    className = '',
    label,
    icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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
            {label && <label className="block text-xs font-bold text-gray-400 mb-1">{label}</label>}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isOpen
                        ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white/[0.08]'
                        : 'border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.08]'
                    }`}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {icon && <Icon name={icon} className="text-gray-400" />}
                    <span className={`text-sm font-medium truncate ${selectedOption ? 'text-white' : 'text-gray-500'}`}>
                        {selectedOption ? selectedOption.label : placeholder || 'Selecione'}
                    </span>
                </div>
                <Icon
                    name="expand_more"
                    className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 overflow-hidden bg-[#1a1d21] border border-white/[0.1] rounded-xl shadow-2xl animate-fade-in max-h-60 overflow-y-auto ring-1 ring-white/5">
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
                                    : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                                }`}
                        >
                            {option.icon && <Icon name={option.icon} className={`mr-2 text-lg ${option.value === value ? 'text-white' : 'text-gray-400'}`} />}
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
