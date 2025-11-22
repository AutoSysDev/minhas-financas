import React, { useState } from 'react';
import { Icon } from './Icon';

interface FloatingActionButtonProps {
    onNewExpense: () => void;
    onNewIncome: () => void;
    onNewTransfer: () => void;
    onCalculator: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
    onNewExpense,
    onNewIncome,
    onNewTransfer,
    onCalculator
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        {
            label: 'Calculadora',
            icon: 'calculate',
            onClick: () => {
                onCalculator();
                setIsOpen(false);
            },
            bgColor: 'bg-purple-600',
            hoverColor: 'hover:bg-purple-700',
            textColor: 'text-white'
        },
        {
            label: 'Nova Despesa',
            icon: 'arrow_upward',
            onClick: () => {
                onNewExpense();
                setIsOpen(false);
            },
            bgColor: 'bg-red-600',
            hoverColor: 'hover:bg-red-700',
            textColor: 'text-white'
        },
        {
            label: 'Nova Receita',
            icon: 'arrow_downward',
            onClick: () => {
                onNewIncome();
                setIsOpen(false);
            },
            bgColor: 'bg-green-600',
            hoverColor: 'hover:bg-green-700',
            textColor: 'text-white'
        },
        {
            label: 'Nova Transferência',
            icon: 'swap_horiz',
            onClick: () => {
                onNewTransfer();
                setIsOpen(false);
            },
            bgColor: 'bg-blue-600',
            hoverColor: 'hover:bg-blue-700',
            textColor: 'text-white'
        }
    ];

    return (
        <>
            {/* Overlay para fechar o menu ao clicar fora */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Container do FAB */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                {/* Dropdown de ações */}
                <div
                    className={`flex flex-col gap-2 transition-all duration-300 ease-out ${isOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-4 pointer-events-none'
                        }`}
                >
                    {actions.map((action, index) => (
                        <button
                            key={action.label}
                            onClick={action.onClick}
                            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg transition-all duration-200 bg-gray-800 border border-teal-500 text-white hover:bg-gray-700 backdrop-blur-md active:scale-95`}
                            style={{
                                transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
                            }}
                            aria-label={action.label}
                        >
                            <Icon name={action.icon} className="text-xl" />
                            <span className="font-bold text-sm whitespace-nowrap">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Botão principal */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`size-16 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-[0_0_30px_-5px_rgba(45,212,191,0.5)] hover:shadow-[0_0_40px_-5px_rgba(45,212,191,0.7)] hover:scale-110 transition-all duration-300 flex items-center justify-center group active:scale-95 ${isOpen ? 'rotate-45' : 'rotate-0'
                        }`}
                    aria-label={isOpen ? 'Fechar menu de ações' : 'Abrir menu de ações'}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                >
                    <Icon name="add" className="text-3xl" />
                </button>
            </div>
        </>
    );
};
