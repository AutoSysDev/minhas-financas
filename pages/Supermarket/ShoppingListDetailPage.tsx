import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupermarket } from '../../context/SupermarketContext';
import { useFinance } from '../../context/FinanceContext';
import ShoppingListItemRow from '../../components/Supermarket/ShoppingListItemRow';
import AddItemModal from '../../components/Supermarket/AddItemModal';
import { Icon } from '../../components/Icon';
import { Dropdown } from '../../components/Dropdown';
import { BANKS } from '../../constants';

const ShoppingListDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        currentList,
        items,
        loading,
        isShoppingMode,
        fetchListDetails,
        toggleShoppingMode,
        completeList,
        deleteList
    } = useSupermarket();

    const { accounts, cards } = useFinance();

    const [isAddItemOpen, setIsAddItemOpen] = useState(false);
    const [isFinishing, setIsFinishing] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [selectedCardId, setSelectedCardId] = useState('');

    useEffect(() => {
        if (id) {
            fetchListDetails(id);
        }
    }, [id]);

    useEffect(() => {
        if (accounts.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accounts[0].id);
        }
    }, [accounts]);

    const handleDelete = async () => {
        if (window.confirm('Deseja excluir esta lista?')) {
            await deleteList(id!);
            navigate('/supermarket');
        }
    };

    const handleFinishPurchase = async () => {
        if (!selectedAccountId) return;
        await completeList(id!, selectedAccountId, selectedCardId || undefined);
        setIsFinishing(false);
        navigate('/supermarket');
    };

    const checkedCount = items.filter(it => it.is_checked).length;
    const totalItems = items.length;
    const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

    const totalValue = items.reduce((acc, it) => {
        if (!it.is_checked) return acc;
        return acc + ((it.actual_price || it.estimated_price || 0) * (it.quantity || 1));
    }, 0);

    if (loading && !currentList) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
        );
    }

    if (!currentList) return null;

    return (
        <div className={`flex flex-col h-full animate-fade-in transition-colors duration-500 ${isShoppingMode ? 'bg-black/40 backdrop-blur-3xl' : ''}`}>
            {/* Top Header */}
            <div className="pb-6">
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate('/supermarket')}
                        className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl text-gray-400 hover:text-white transition-all active:scale-90 flex items-center justify-center"
                    >
                        <Icon name="arrow_back" className="text-xl" />
                    </button>

                    <div className="flex items-center gap-3">
                        {!isShoppingMode && currentList.status === 'open' && (
                            <button
                                onClick={handleDelete}
                                className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-white/5 text-gray-600 hover:text-red-400 rounded-2xl transition-all active:scale-90"
                            >
                                <Icon name="delete" className="text-xl" />
                            </button>
                        )}

                        {currentList.status === 'open' && (
                            <button
                                onClick={toggleShoppingMode}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${isShoppingMode
                                    ? 'bg-red-500 text-white shadow-red-500/20'
                                    : 'bg-teal-500 text-white shadow-teal-500/20'
                                    }`}
                            >
                                <Icon name={isShoppingMode ? 'close' : 'play_arrow'} className="text-lg" />
                                {isShoppingMode ? 'Sair do Modo Compra' : 'Começar Compras'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-8 px-1">
                    <div className="flex items-center gap-3 text-teal-400/50 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                        <Icon name="list_alt" className="text-xs" />
                        <span>Detalhes da Lista</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{currentList.name}</h1>
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-sm font-medium">
                            {checkedCount} de {totalItems} itens <span className="opacity-30">•</span> {progress}% completo
                        </p>
                        {isShoppingMode && (
                            <div className="px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                                <p className="text-teal-400 font-black text-sm">
                                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar - Modern Style */}
                <div className="w-full h-2.5 bg-white/[0.05] rounded-full overflow-hidden mb-10 p-[2px]">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(20,184,166,0.3)] ${isShoppingMode ? 'bg-teal-400' : 'bg-teal-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Items List */}
                <div className="space-y-4 pb-48">
                    {items.map(item => (
                        <ShoppingListItemRow
                            key={item.id}
                            item={item}
                            isShoppingMode={isShoppingMode}
                        />
                    ))}

                    {items.length === 0 && (
                        <div className="text-center py-20 bg-white/[0.01] border border-dashed border-white/[0.05] rounded-[32px] animate-pulse">
                            <Icon name="production_quantity_limits" className="mx-auto text-5xl text-gray-800 mb-6" />
                            <p className="text-gray-600 font-medium text-sm">Sua lista está vazia no momento.</p>
                            {!isShoppingMode && (
                                <button
                                    onClick={() => setIsAddItemOpen(true)}
                                    className="mt-6 text-teal-400 text-xs font-black uppercase tracking-widest hover:text-teal-300 transition-colors"
                                >
                                    Adicionar Primeiro Item
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Controls */}
            {!isShoppingMode && currentList.status === 'open' ? (
                <div className="fixed bottom-24 right-6 left-6 flex justify-end">
                    <button
                        onClick={() => setIsAddItemOpen(true)}
                        className="p-5 bg-teal-500 text-white rounded-[24px] shadow-2xl shadow-teal-500/30 active:scale-95 transition-all flex items-center gap-4 hover:bg-teal-400"
                    >
                        <Icon name="add" className="text-2xl font-bold" />
                        <span className="font-black text-sm uppercase tracking-widest">Novo Item</span>
                    </button>
                </div>
            ) : isShoppingMode && (
                <div className="fixed bottom-0 left-0 right-0 p-8 bg-[#0f1216]/90 backdrop-blur-3xl border-t border-white/5 safe-bottom z-50">
                    <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
                        <div className="flex-1">
                            <span className="text-[10px] uppercase font-black text-gray-500 block mb-1 tracking-[0.2em]">Total no Carrinho</span>
                            <span className="text-2xl md:text-3xl font-black text-white">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <button
                            onClick={() => setIsFinishing(true)}
                            disabled={checkedCount === 0}
                            className={`px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${checkedCount > 0
                                ? 'bg-teal-500 text-white shadow-xl shadow-teal-500/20 hover:scale-105 active:scale-95'
                                : 'bg-white/5 text-gray-600 cursor-not-allowed opacity-50'
                                }`}
                        >
                            <Icon name="check_circle" className="text-xl" />
                            Finalizar Compra
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AddItemModal
                listId={id!}
                isOpen={isAddItemOpen}
                onClose={() => setIsAddItemOpen(false)}
            />

            {/* Finalize Purchase Modal */}
            {isFinishing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                    <div className="bg-[#121820] w-full max-w-sm rounded-[40px] p-10 border border-white/10 shadow-2xl animate-scale-up">
                        <div className="text-center mb-10">
                            <div className="w-24 h-24 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/20">
                                <Icon name="task_alt" className="text-teal-400 text-5xl" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">Quase lá!</h2>
                            <p className="text-gray-500 text-sm font-medium">Informe os detalhes do pagamento para registrar no seu financeiro.</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                    <Icon name="account_balance_wallet" className="text-xs" /> Conta de Pagamento
                                </label>
                                <Dropdown
                                    options={accounts.map(acc => {
                                        const bank = BANKS.find(b => b.name === acc.bankName);
                                        return { label: acc.name, value: acc.id, logo: bank?.logo };
                                    })}
                                    value={selectedAccountId}
                                    onChange={setSelectedAccountId}
                                    placeholder="Selecione uma conta"
                                    className="z-[120]"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                                    <Icon name="credit_card" className="text-xs" /> Cartão (Opcional)
                                </label>
                                <Dropdown
                                    options={[
                                        { label: 'Nenhum (Débito/Dinheiro)', value: '' },
                                        ...cards.map(card => {
                                            let logo = undefined;
                                            if (card.linkedAccountId) {
                                                const linkedAccount = accounts.find(a => a.id === card.linkedAccountId);
                                                if (linkedAccount) {
                                                    const bank = BANKS.find(b => b.name === linkedAccount.bankName);
                                                    logo = bank?.logo;
                                                }
                                            }
                                            return { label: `${card.name} (final ${card.lastDigits})`, value: card.id, logo };
                                        })
                                    ]}
                                    value={selectedCardId}
                                    onChange={setSelectedCardId}
                                    placeholder="Selecione um cartão"
                                    className="z-[110]"
                                />
                            </div>

                            <div className="pt-6 flex flex-col gap-4">
                                <button
                                    onClick={handleFinishPurchase}
                                    className="w-full py-5 bg-teal-500 hover:bg-teal-400 text-white font-black rounded-2xl shadow-2xl shadow-teal-500/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest"
                                >
                                    Confirmar Gastos
                                </button>
                                <button
                                    onClick={() => setIsFinishing(false)}
                                    className="w-full py-2 text-gray-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors"
                                >
                                    Revisar Itens
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShoppingListDetailPage;
