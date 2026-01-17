import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingList } from '../../types';
import { Icon } from '../Icon';

interface ShoppingListCardProps {
    list: ShoppingList;
}

const ShoppingListCard: React.FC<ShoppingListCardProps> = ({ list }) => {
    const navigate = useNavigate();

    const progress = list.itemCount ? Math.round((list.checkedCount || 0) / list.itemCount * 100) : 0;
    const isCompleted = list.status === 'completed';

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <div
            onClick={() => navigate(`/supermarket/${list.id}`)}
            className="bg-white/[0.02] backdrop-blur-md border border-white/[0.05] rounded-2xl p-5 shadow-sm hover:bg-white/[0.04] hover:border-teal-500/30 transition-all cursor-pointer group flex flex-col justify-between"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isCompleted ? 'bg-green-500/10 text-green-400' : 'bg-teal-500/10 text-teal-400'}`}>
                            <Icon name={isCompleted ? 'check_circle' : 'shopping_cart'} className="text-xl" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors truncate text-sm md:text-base leading-tight">
                                {list.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase font-black tracking-wider mt-0.5">
                                <Icon name="calendar_today" className="text-[10px]" />
                                <span>{formatDate(list.created_at)}</span>
                                {list.shared_account_id && (
                                    <div className="flex items-center gap-1 text-teal-400/60 lowercase font-medium">
                                        <span>•</span>
                                        <Icon name="groups" className="text-[10px]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {isCompleted && (
                        <div className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border border-green-500/20">
                            OK
                        </div>
                    )}
                </div>

                <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-end mb-1">
                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                            {list.checkedCount} / {list.itemCount} itens
                        </div>
                        <div className={`text-xs font-black ${isCompleted ? 'text-green-400' : 'text-teal-400'}`}>
                            {progress}%
                        </div>
                    </div>

                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-700 ease-out ${isCompleted ? 'bg-green-500' : 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 group-hover:text-teal-400/50 transition-colors">
                <span>Ver Detalhes</span>
                <Icon name="chevron_right" className="text-xs group-hover:translate-x-1 transition-transform" />
            </div>
        </div>
    );
};

export default ShoppingListCard;
