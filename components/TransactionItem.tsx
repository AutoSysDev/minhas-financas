import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

interface TransactionItemProps {
    transaction: Transaction;
    onClick: () => void;
}

interface TransactionActionProps extends TransactionItemProps {
    onEdit?: (e: React.MouseEvent | React.TouchEvent) => void;
    onDuplicate?: (e: React.MouseEvent | React.TouchEvent) => void;
    onDelete?: (e: React.MouseEvent | React.TouchEvent) => void;
}

export const TransactionRow: React.FC<TransactionItemProps> = ({ transaction: t, onClick }) => {
    return (
        <tr
            className="hover:bg-white/[0.02] transition-colors group"
        >
            <td
                onClick={onClick}
                className="px-6 py-4 font-medium text-white cursor-pointer"
            >
                {t.description}
                {t.installmentNumber && t.installments && (
                    <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                        {t.installmentNumber}/{t.installments}
                    </span>
                )}
            </td>
            <td className="px-6 py-4 text-gray-300">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-gray-200">
                    {t.category}
                </span>
            </td>
            <td className="px-6 py-4 text-gray-400">{formatDate(t.date)}</td>
            <td className={`px-6 py-4 text-right font-semibold ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
            </td>
            <td className="px-6 py-4 text-center">
                {t.isPaid ? (
                    <Icon name="check_circle" className="text-green-500 text-lg" />
                ) : (
                    <Icon name="pending" className="text-gray-400 text-lg" />
                )}
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
                className="relative z-10 bg-[#0f1216] w-full h-full flex items-center justify-between p-3 transition-transform duration-200 ease-out active:scale-[0.98]"
                style={{ transform: `translateX(${translateX}px)` }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => { if (translateX === 0) onClick(); else setTranslateX(0); }}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full ${t.type === TransactionType.INCOME ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        <Icon name={t.type === TransactionType.INCOME ? 'trending_up' : 'shopping_cart'} className="text-xl" />
                    </div>
                    <div className="flex flex-col min-w-0 gap-0.5">
                        <p className="font-bold text-sm text-white truncate leading-tight">
                            {t.description}
                            {t.installmentNumber && t.installments && (
                                <span className="ml-1 font-normal text-xs opacity-60">({t.installmentNumber}/{t.installments})</span>
                            )}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 leading-tight">
                            <span className="truncate max-w-[80px]">{t.category}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>{formatDate(t.date)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-2 gap-1">
                    <p className={`font-extrabold text-sm ${t.type === TransactionType.INCOME ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(Math.abs(t.amount)).replace('R$', '')}
                    </p>
                    {t.isPaid && <Icon name="check_circle" className="text-green-500 text-base" />}
                </div>
            </div>
        </div>
    );
};
