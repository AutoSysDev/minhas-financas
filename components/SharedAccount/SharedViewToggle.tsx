import React from 'react';
import { useSharedAccount } from '../../context/SharedAccountContext';
import { Icon } from '../Icon';

export const SharedViewToggle: React.FC = () => {
    const { isSharedViewActive, toggleSharedView, sharedAccount } = useSharedAccount();

    if (!sharedAccount) return null;

    return (
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] p-1.5 rounded-2xl backdrop-blur-md">
            <button
                onClick={() => isSharedViewActive && toggleSharedView()}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isSharedViewActive
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
            >
                <Icon name="person" className="text-xs" />
                Individual
            </button>

            <button
                onClick={() => !isSharedViewActive && toggleSharedView()}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isSharedViewActive
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
            >
                <Icon name="groups" className="text-xs" />
                Conjunto
            </button>
        </div>
    );
};
