import React, { useState } from 'react';
import { useSupermarket } from '../../context/SupermarketContext';
import { useSharedAccount } from '../../context/SharedAccountContext';
import ShoppingListCard from '../../components/Supermarket/ShoppingListCard';
import { Icon } from '../../components/Icon';

const ShoppingListsPage: React.FC = () => {
    const { lists, loading, createList } = useSupermarket();
    const { isSharedViewActive, sharedAccount } = useSharedAccount();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');

    const filteredLists = lists.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeLists = filteredLists.filter(l => l.status === 'open');
    const completedLists = filteredLists.filter(l => l.status === 'completed');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        const id = await createList(newListName, isSharedViewActive);
        if (id) {
            setIsCreating(false);
            setNewListName('');
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="pb-6">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em] mb-2 flex items-center gap-3">
                            Supermercado
                            <Icon name="shopping_basket" className="text-teal-400" />
                        </h1>
                        <p className="text-gray-400 text-sm">Organize suas compras e controle seus gastos de forma inteligente.</p>
                    </div>

                    <button
                        onClick={() => setIsCreating(true)}
                        className="size-12 md:size-14 bg-teal-500 hover:bg-teal-400 text-white rounded-2xl shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                        <Icon name="add" className="text-2xl font-bold" />
                    </button>
                </div>

                {/* Info Shared Account */}
                {isSharedViewActive && sharedAccount && (
                    <div className="bg-teal-500/10 border border-teal-500/20 rounded-2xl p-4 mb-8 flex items-center gap-4 animate-scale-up">
                        <div className="size-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                            <Icon name="groups" className="text-teal-400 text-xl" />
                        </div>
                        <div className="text-sm flex-1">
                            <span className="text-white font-bold block mb-0.5">Modo Compartilhado: {sharedAccount.name}</span>
                            <p className="text-teal-100/40 text-xs">As listas criadas aqui serão visíveis e gerenciáveis por todos os membros.</p>
                        </div>
                    </div>
                )}

                {/* Search Bar - Modern Style */}
                <div className="relative mb-10 group">
                    <div className="absolute inset-x-0 inset-y-0 bg-teal-500/5 blur-xl group-focus-within:bg-teal-500/10 transition-all rounded-3xl -z-10"></div>
                    <Icon name="search" className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-teal-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por nome da lista..."
                        className="w-full bg-white/[0.03] border border-white/[0.05] focus:border-teal-500/30 rounded-2xl py-5 pl-14 pr-6 text-white text-sm focus:ring-0 outline-none transition-all placeholder:text-gray-600"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Lists Sections */}
                <div className="space-y-10 pb-24">
                    {/* Active Lists */}
                    <section>
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-teal-500"></span>
                                Listas Ativas
                            </h3>
                            <span className="bg-teal-500/10 text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-500/20">
                                {activeLists.length} {activeLists.length === 1 ? 'LISTA' : 'LISTAS'}
                            </span>
                        </div>

                        {activeLists.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {activeLists.map(list => (
                                    <ShoppingListCard key={list.id} list={list} />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white/[0.02] border border-dashed border-white/[0.05] rounded-3xl p-16 flex flex-col items-center text-center animate-pulse">
                                <div className="size-20 bg-white/[0.03] rounded-full flex items-center justify-center mb-6">
                                    <Icon name="shopping_basket" className="text-4xl text-gray-700" />
                                </div>
                                <h4 className="text-white font-bold mb-2 text-lg">Nenhuma lista ativa</h4>
                                <p className="text-gray-500 text-sm max-w-[240px] mb-8">Crie uma nova lista para organizar suas compras e acompanhar seu orçamento.</p>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-white px-8 py-3 rounded-xl text-sm font-black transition-all border border-teal-500/20"
                                >
                                    Criar minha primeira lista
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Completed Lists */}
                    {completedLists.length > 0 && (
                        <section>
                            <div className="flex items-center justify-between mb-5 px-1">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.15em] flex items-center gap-2">
                                    <span className="size-1.5 rounded-full bg-gray-700"></span>
                                    Histórico de Compras
                                </h3>
                                <span className="bg-white/5 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5">
                                    {completedLists.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                                {completedLists.map(list => (
                                    <ShoppingListCard key={list.id} list={list} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Create List Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#121820] w-full max-w-sm rounded-[32px] p-8 border border-white/10 shadow-2xl animate-scale-up">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="size-14 rounded-2xl bg-teal-500/20 flex items-center justify-center">
                                <Icon name="post_add" className="text-3xl text-teal-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white leading-tight">Nova Lista</h2>
                                <p className="text-gray-500 text-xs">Dê um nome para sua nova jornada de compras.</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Nome da Lista</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Ex: Rancho do Mês, Mercado..."
                                    className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl py-5 px-6 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                                    value={newListName}
                                    onChange={e => setNewListName(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 py-5 text-gray-500 hover:text-white font-black text-xs uppercase tracking-widest transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newListName.trim()}
                                    className="flex-[2] py-5 bg-teal-500 hover:bg-teal-400 disabled:bg-gray-800 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-teal-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                >
                                    Criar Lista
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShoppingListsPage;
