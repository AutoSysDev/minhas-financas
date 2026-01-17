import React, { useState } from 'react';
import { useSharedAccount } from '../../context/SharedAccountContext';
import { Icon } from '../../components/Icon';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const { inviteUser, loading } = useSharedAccount();

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            await inviteUser(email);
            setEmail('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <Icon name="close" className="text-2xl" />
                </button>

                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Convidar Membro
                </h2>

                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Convide alguém para compartilhar a visualização das finanças com você.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            E-mail
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="exemplo@email.com"
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 mr-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Enviando...' : 'Enviar Convite'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/[0.05]">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 group hover:border-blue-500/30 transition-all cursor-pointer"
                        onClick={() => {
                            onClose();
                            window.location.hash = '/settings?tab=shared';
                        }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                                <Icon name="mail" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">Ver Solicitações</p>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Convites que você recebeu</p>
                            </div>
                        </div>
                        <Icon name="chevron_right" className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>
        </div>
    );
};
