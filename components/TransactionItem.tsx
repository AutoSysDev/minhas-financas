import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

interface TransactionItemProps {
    transaction: Transaction;
    onClick: () => void;
}

interface TransactionActionProps extends TransactionItemProps {
    onEdit?: (e: React.MouseEvent | React.TouchEvent) => void;
    onDuplicate?: (e: React.MouseEvent | React.TouchEvent) => void;
    onDelete?: (e: React.MouseEvent | React.TouchEvent) => void;
    selected?: boolean;
    onToggleSelect?: () => void;
}

export const TransactionRow: React.FC<TransactionActionProps> = ({ transaction: t, onClick, onEdit, onDuplicate, onDelete, selected, onToggleSelect }) => {
    const { categories, updateTransaction } = useFinance();
    const { theme } = useTheme();
    const categoryObj = categories.find(c => c.name === t.category);
    const icon = categoryObj?.icon || 'category';

    const handleStatusToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await updateTransaction(t.id, { isPaid: !t.isPaid });
        } catch (error) {
            console.error("Failed to update status", error);
        }
    };

    return (
        <tr
            className={`transition-colors group ${selected ? (theme === 'light' ? 'bg-teal-50' : 'bg-teal-500/10') : (theme === 'light' ? 'hover:bg-gray-50' : 'hover:bg-white/[0.02]')}`}
        >
            <td className="pl-4 pr-1 py-4 w-8">
                {onToggleSelect && (
                    <input type="checkbox" checked={!!selected} onChange={onToggleSelect} onClick={(e) => e.stopPropagation()} className="size-4 accent-teal-500 cursor-pointer" aria-label={`Selecionar ${t.description}`} />
                )}
            </td>
            <td
                onClick={onClick}
                className={`px-2 py-4 font-medium cursor-pointer ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
            >
                {t.description}
                {t.installmentNumber && t.installments && (
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${theme === 'light' ? 'bg-gray-100 text-slate-500' : 'bg-white/10 text-gray-300'}`}>
                        {t.installmentNumber}/{t.installments}
                    </span>
                )}
            </td>
            <td className={`px-6 py-4 ${theme === 'light' ? 'text-slate-500' : 'text-gray-300'}`}>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${theme === 'light' ? 'bg-gray-100 text-slate-700' : 'bg-white/10 text-gray-200'}`}>
                    <Icon name={icon} className="text-sm" />
                    {t.category}
                </span>
            </td>
            <td className={`px-6 py-4 ${theme === 'light' ? 'text-slate-400' : 'text-gray-400'}`}>{formatDate(t.date)}</td>
            <td className={`px-6 py-4 text-right font-semibold ${t.type === TransactionType.INCOME ? (theme === 'light' ? 'text-emerald-600' : 'text-green-400') : (theme === 'light' ? 'text-red-600' : 'text-red-400')}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
            </td>
            <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {onEdit && (
                        <button onClick={onEdit} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-blue-50 text-blue-600' : 'hover:bg-blue-500/10 text-blue-400'}`} title="Editar">
                            <Icon name="edit" className="text-lg" />
                        </button>
                    )}
                    {onDuplicate && (
                        <button onClick={onDuplicate} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-slate-500' : 'hover:bg-white/10 text-gray-300'}`} title="Duplicar">
                            <Icon name="content_copy" className="text-lg" />
                        </button>
                    )}
                    {onDelete && (
                        <button onClick={onDelete} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-red-50 text-red-600' : 'hover:bg-red-500/10 text-red-400'}`} title="Excluir">
                            <Icon name="delete" className="text-lg" />
                        </button>
                    )}
                    <button
                        onClick={handleStatusToggle}
                        className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100 active:bg-gray-200' : 'hover:bg-white/10 active:bg-white/20'}`}
                        title={t.isPaid ? "Marcar como pendente" : "Marcar como pago"}
                    >
                        {t.isPaid ? (
                            <Icon name="check_circle" className={`${theme === 'light' ? 'text-emerald-500' : 'text-green-500'} text-lg`} />
                        ) : (
                            <Icon name="pending" className={`${theme === 'light' ? 'text-slate-300' : 'text-gray-400'} text-lg`} />
                        )}
                    </button>
                </div>
            </td>
        </tr>
    );
};

export const TransactionCard: React.FC<TransactionActionProps> = ({ transaction: t, onClick, onEdit, onDuplicate, onDelete }) => {
    const [translateX, setTranslateX] = useState(0);
    const startX = useRef<number | null>(null);
    const isDragging = useRef(false);
    const SWIPE_THRESHOLD = -80;
    const MAX_SWIPE = -210;
    const { categories } = useFinance();
    const { theme } = useTheme();
    const categoryObj = categories.find(c => c.name === t.category);
    const icon = categoryObj?.icon || 'category';

    const onTouchStart = (e: React.TouchEvent) => {
        startX.current = e.targetTouches[0].clientX;
        isDragging.current = true;
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging.current || startX.current === null) return;
        const currentX = e.targetTouches[0].clientX;
        const diff = currentX - startX.current;

        if (diff < 0 && diff > (MAX_SWIPE - 20)) {
            setTranslateX(diff);
        } else if (diff > 0 && translateX < 0) {
            setTranslateX(Math.min(0, translateX + diff));
        }
    };

    const onTouchEnd = () => {
        isDragging.current = false;
        startX.current = null;
        if (translateX < SWIPE_THRESHOLD) {
            setTranslateX(MAX_SWIPE);
        } else {
            setTranslateX(0);
        }
    };

    return (
        <div className="relative overflow-hidden select-none h-[76px]">
            <div className="absolute inset-y-0 right-0 w-[210px] flex z-0">
                <button onClick={onEdit} className="flex-1 bg-blue-600 text-white flex items-center justify-center active:bg-blue-700">
                    <Icon name="edit" />
                </button>
                <button onClick={onDuplicate} className="flex-1 bg-gray-600 text-white flex items-center justify-center active:bg-gray-700">
                    <Icon name="content_copy" />
                </button>
                <button onClick={onDelete} className="flex-1 bg-red-600 text-white flex items-center justify-center active:bg-red-700">
                    <Icon name="delete" />
                </button>
            </div>

            <div
                className={`relative z-10 w-full h-full flex items-center justify-between p-3 transition-transform duration-200 ease-out active:scale-[0.98] ${theme === 'light' ? 'bg-white border-b border-gray-100' : 'bg-[#0f1216]'}`}
                style={{ transform: `translateX(${translateX}px)` }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => { if (translateX === 0) onClick(); else setTranslateX(0); }}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${t.type === TransactionType.INCOME ? (theme === 'light' ? 'bg-emerald-50 text-emerald-600' : 'bg-green-500/10 text-green-400') : (theme === 'light' ? 'bg-red-50 text-red-600' : 'bg-red-500/10 text-red-400')}`}>
                        <Icon name={t.type === TransactionType.INCOME ? 'trending_up' : 'shopping_cart'} className="text-xl" />
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                        <p className={`font-bold text-sm truncate leading-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {t.description}
                            {t.installmentNumber && t.installments && (
                                <span className="ml-1 font-normal text-xs opacity-60">({t.installmentNumber}/{t.installments})</span>
                            )}
                        </p>
                        <div className={`flex items-center gap-2 text-[11px] leading-tight ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>
                            <div className="flex items-center gap-1 max-w-[100px]">
                                <Icon name={icon} className="text-xs" />
                                <span className="truncate">{t.category}</span>
                            </div>
                            <span className={`w-1 h-1 rounded-full ${theme === 'light' ? 'bg-slate-300' : 'bg-gray-600'}`}></span>
                            <span>{formatDate(t.date)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-2 gap-1">
                    <p className={`font-extrabold text-sm ${t.type === TransactionType.INCOME ? (theme === 'light' ? 'text-emerald-600' : 'text-green-400') : (theme === 'light' ? 'text-red-600' : 'text-red-400')}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(Math.abs(t.amount)).replace('R$', '')}
                    </p>
                    {t.isPaid && <Icon name="check_circle" className={`${theme === 'light' ? 'text-emerald-500' : 'text-green-500'} text-base`} />}
                </div>
            </div>
        </div>
    );
};
