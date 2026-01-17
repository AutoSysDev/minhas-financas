import React, { useState } from 'react';
import { ShoppingListItem } from '../../types';
import { useSupermarket } from '../../context/SupermarketContext';
import { Icon } from '../Icon';

interface ShoppingListItemRowProps {
    item: ShoppingListItem;
    isShoppingMode: boolean;
}

const ShoppingListItemRow: React.FC<ShoppingListItemRowProps> = ({ item, isShoppingMode }) => {
    const { toggleItem, updateItem, deleteItem } = useSupermarket();
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [tempPrice, setTempPrice] = useState(item.actual_price?.toString() || item.estimated_price?.toString() || '');

    const handlePriceSave = () => {
        updateItem(item.id, { actual_price: parseFloat(tempPrice) || 0 });
        setIsEditingPrice(false);
    };

    const handleQtyChange = (delta: number) => {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        updateItem(item.id, { quantity: newQty });
    };

    return (
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${item.is_checked
            ? 'bg-teal-500/5 border-teal-500/20 opacity-60'
            : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            }`}>
            <div className="flex items-center gap-4">
                {/* Custom Checkbox */}
                <button
                    onClick={() => toggleItem(item.id)}
                    className={`shrink-0 size-8 rounded-xl flex items-center justify-center transition-all duration-300 ${item.is_checked
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                        : 'bg-white/[0.05] border border-white/10 text-transparent hover:border-teal-500/50'
                        }`}
                >
                    <Icon name="check" className={`text-lg font-black ${item.is_checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'} transition-all`} />
                </button>

                {/* Info Container */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-bold truncate text-sm md:text-base ${item.is_checked ? 'line-through text-gray-500' : 'text-white'}`}>
                            {item.name}
                        </h4>

                        {!isShoppingMode && (
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 bg-white/[0.03] rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/5 transition-all"
                                title="Excluir item"
                            >
                                <Icon name="delete" className="text-xs" />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {item.category && (
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">
                                <Icon name="label" className="text-[10px] text-teal-400/50" />
                                {item.category}
                            </span>
                        )}

                        <div className="flex items-center gap-1">
                            {!isShoppingMode ? (
                                <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-lg px-2 py-0.5">
                                    <button onClick={() => handleQtyChange(-1)} className="text-gray-600 hover:text-white transition-colors"><Icon name="remove" className="text-xs" /></button>
                                    <span className="text-[11px] text-gray-300 font-black">{item.quantity} <span className="text-gray-600 font-medium lowercase">{item.unit || 'un'}</span></span>
                                    <button onClick={() => handleQtyChange(1)} className="text-gray-600 hover:text-teal-400 transition-colors"><Icon name="add" className="text-xs" /></button>
                                </div>
                            ) : (
                                <span className="text-[11px] text-gray-400 font-black px-2 py-0.5 bg-white/5 rounded-lg border border-white/5">
                                    {item.quantity} <span className="text-gray-600 font-medium lowercase">{item.unit || 'un'}</span>
                                </span>
                            )}
                        </div>

                        {/* Price Input / Display */}
                        <div className="flex items-center gap-2">
                            {isEditingPrice ? (
                                <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-lg px-2 py-0.5 animate-scale-up">
                                    <span className="text-[10px] font-black text-teal-400">R$</span>
                                    <input
                                        autoFocus
                                        type="number"
                                        step="0.01"
                                        className="w-16 bg-transparent border-none p-0 text-xs text-white font-bold focus:ring-0 outline-none"
                                        value={tempPrice}
                                        onChange={(e) => setTempPrice(e.target.value)}
                                        onBlur={handlePriceSave}
                                        onKeyDown={(e) => e.key === 'Enter' && handlePriceSave()}
                                    />
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsEditingPrice(true)}
                                    className="flex items-center gap-2 px-2.5 py-1 bg-white/[0.04] border border-white/[0.05] rounded-lg hover:border-teal-500/30 transition-all group/price"
                                >
                                    <span className="text-[10px] font-black text-gray-600 group-hover/price:text-teal-400/50 transition-colors">R$</span>
                                    <span className={`text-[11px] font-black ${item.is_checked ? 'text-teal-400' : 'text-teal-500'}`}>
                                        {item.actual_price ? item.actual_price.toFixed(2) : (item.estimated_price?.toFixed(2) || '0,00')}
                                    </span>
                                    {isShoppingMode && <Icon name="edit" className="text-[10px] text-gray-700 group-hover/price:text-teal-400/50" />}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoppingListItemRow;
