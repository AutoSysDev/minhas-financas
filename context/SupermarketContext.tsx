import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSharedAccount } from './SharedAccountContext';
import { useFinance } from './FinanceContext';
import { ShoppingList, ShoppingListItem, TransactionType } from '../types';

interface SupermarketContextType {
    lists: ShoppingList[];
    currentList: ShoppingList | null;
    items: ShoppingListItem[];
    loading: boolean;
    isShoppingMode: boolean;

    fetchLists: () => Promise<void>;
    fetchListDetails: (id: string) => Promise<void>;
    createList: (name: string, shared?: boolean) => Promise<string | null>;
    deleteList: (id: string) => Promise<void>;
    updateListStatus: (id: string, status: 'open' | 'completed') => Promise<void>;

    addItem: (listId: string, item: Omit<ShoppingListItem, 'id' | 'shopping_list_id' | 'is_checked'>) => Promise<void>;
    updateItem: (itemId: string, data: Partial<ShoppingListItem>) => Promise<void>;
    toggleItem: (itemId: string) => Promise<void>;
    deleteItem: (itemId: string) => Promise<void>;

    toggleShoppingMode: () => void;
    completeList: (listId: string, accountId: string, cardId?: string) => Promise<void>;
}

const SupermarketContext = createContext<SupermarketContextType | undefined>(undefined);

export const SupermarketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { isSharedViewActive, sharedAccount } = useSharedAccount();
    const { addTransaction, categories } = useFinance();

    const [lists, setLists] = useState<ShoppingList[]>([]);
    const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isShoppingMode, setIsShoppingMode] = useState(false);

    const fetchLists = async () => {
        if (!user) return;
        setLoading(true);
        try {
            console.log('SupermarketContext: Fetching lists...');
            let query = supabase.from('shopping_lists').select('*');

            if (isSharedViewActive && sharedAccount) {
                query = query.eq('shared_account_id', sharedAccount.id);
            } else {
                query = query.eq('owner_user_id', user.id).is('shared_account_id', null);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                // Fetch all items for these lists in one go to count them efficiently
                const listIds = data.map(l => l.id);
                const { data: allItems, error: itemsError } = await supabase
                    .from('shopping_list_items')
                    .select('shopping_list_id, is_checked')
                    .in('shopping_list_id', listIds);

                if (itemsError) throw itemsError;

                const enrichedLists = data.map(list => {
                    const listItems = allItems?.filter(it => it.shopping_list_id === list.id) || [];
                    return {
                        ...list,
                        itemCount: listItems.length,
                        checkedCount: listItems.filter(it => it.is_checked).length
                    };
                });
                setLists(enrichedLists);
            } else {
                setLists([]);
            }
            console.log('SupermarketContext: Lists fetched successfully');
        } catch (error) {
            console.error('Error fetching lists:', error);
            toast.error('Erro ao carregar listas de compras');
        } finally {
            setLoading(false);
        }
    };

    const fetchListDetails = async (id: string) => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: list, error: listError } = await supabase.from('shopping_lists').select('*').eq('id', id).single();
            if (listError) throw listError;

            const { data: listItems, error: itemsError } = await supabase.from('shopping_list_items').select('*').eq('shopping_list_id', id).order('name');
            if (itemsError) throw itemsError;

            setCurrentList(list);
            setItems(listItems || []);
        } catch (error) {
            console.error('Error fetching list details:', error);
            toast.error('Erro ao carregar detalhes da lista');
        } finally {
            setLoading(false);
        }
    };

    const createList = async (name: string, shared: boolean = false): Promise<string | null> => {
        if (!user) return null;
        try {
            const { data, error } = await supabase.from('shopping_lists').insert({
                name,
                owner_user_id: user.id,
                shared_account_id: shared && sharedAccount ? sharedAccount.id : null,
                status: 'open'
            }).select().single();

            if (error) throw error;

            toast.success('Lista criada!');
            fetchLists();
            return data.id;
        } catch (error) {
            console.error('Error creating list:', error);
            toast.error('Erro ao criar lista');
            return null;
        }
    };

    const deleteList = async (id: string) => {
        try {
            const { error } = await supabase.from('shopping_lists').delete().eq('id', id);
            if (error) throw error;
            toast.success('Lista excluída');
            fetchLists();
        } catch (error) {
            console.error('Error deleting list:', error);
            toast.error('Erro ao excluir lista');
        }
    };

    const updateListStatus = async (id: string, status: 'open' | 'completed') => {
        try {
            const { error } = await supabase.from('shopping_lists').update({ status }).eq('id', id);
            if (error) throw error;
            fetchLists();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const addItem = async (listId: string, item: Omit<ShoppingListItem, 'id' | 'shopping_list_id' | 'is_checked'>) => {
        try {
            const { error } = await supabase.from('shopping_list_items').insert({
                shopping_list_id: listId,
                ...item,
                is_checked: false
            });
            if (error) throw error;
            fetchListDetails(listId);
        } catch (error) {
            console.error('Error adding item:', error);
            toast.error('Erro ao adicionar item');
        }
    };

    const updateItem = async (itemId: string, data: Partial<ShoppingListItem>) => {
        try {
            const { error } = await supabase.from('shopping_list_items').update(data).eq('id', itemId);
            if (error) throw error;

            // Update local state for immediate feedback
            setItems(prev => prev.map(it => it.id === itemId ? { ...it, ...data } : it));
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

    const toggleItem = async (itemId: string) => {
        const item = items.find(it => it.id === itemId);
        if (!item) return;

        await updateItem(itemId, { is_checked: !item.is_checked });
    };

    const deleteItem = async (itemId: string) => {
        try {
            const { error } = await supabase.from('shopping_list_items').delete().eq('id', itemId);
            if (error) throw error;
            setItems(prev => prev.filter(it => it.id !== itemId));
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const toggleShoppingMode = () => setIsShoppingMode(prev => !prev);

    const completeList = async (listId: string, accountId: string, cardId?: string) => {
        try {
            // 1. Calculate total
            const total = items.reduce((acc, item) => {
                if (!item.is_checked) return acc; // Only count checked items? Prompt: "Valor total = soma dos itens". Usually it's everything bought.
                const price = item.actual_price ?? item.estimated_price ?? 0;
                return acc + (price * (item.quantity || 1));
            }, 0);

            if (total <= 0) {
                toast.warning('Nenhum item com valor foi encontrado.');
                return;
            }

            // 2. Create transaction
            // Find "Supermercado" category or use "Alimentação" as fallback
            const supermarketCategory = categories.find(c => c.name === 'Supermercado' || c.name === 'Alimentação');

            await addTransaction({
                description: `Compra: ${currentList?.name || 'Supermercado'}`,
                amount: total,
                date: new Date().toISOString().split('T')[0],
                type: TransactionType.EXPENSE,
                category: supermarketCategory?.name || 'Supermercado',
                accountId,
                cardId,
                isPaid: true
            });

            // 3. Mark list as completed
            await supabase.from('shopping_lists').update({ status: 'completed' }).eq('id', listId);

            toast.success('Compra finalizada e transação gerada!');
            setIsShoppingMode(false);
            fetchLists();
        } catch (error) {
            console.error('Error completing list:', error);
            toast.error('Erro ao finalizar lista');
        }
    };

    useEffect(() => {
        if (user) {
            fetchLists();
        }
    }, [user, isSharedViewActive]);

    return (
        <SupermarketContext.Provider value={{
            lists,
            currentList,
            items,
            loading,
            isShoppingMode,
            fetchLists,
            fetchListDetails,
            createList,
            deleteList,
            updateListStatus,
            addItem,
            updateItem,
            toggleItem,
            deleteItem,
            toggleShoppingMode,
            completeList
        }}>
            {children}
        </SupermarketContext.Provider>
    );
};

export const useSupermarket = () => {
    const context = useContext(SupermarketContext);
    if (context === undefined) {
        throw new Error('useSupermarket must be used within a SupermarketProvider');
    }
    return context;
};
