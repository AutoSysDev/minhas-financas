import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Account, Budget, Card, Goal, Transaction, TransactionType, Category, Investment } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { useSharedAccount } from './SharedAccountContext';
import { useTransactions } from '../hooks/useTransactions';
import { useAccounts, useCards, useBudgets, useGoals, useCategories, useInvestments } from '../hooks/useFinanceQueries';
import { useQueryClient } from '@tanstack/react-query';
import { generateId } from '../utils/helpers';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  budgets: Budget[];
  goals: Goal[];
  categories: Category[];
  investments: Investment[];

  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, t: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addAccount: (a: Omit<Account, 'id' | 'balance'> & { balance: number }) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addGoal: (g: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addCard: (c: Omit<Card, 'id' | 'currentInvoice'>) => Promise<void>;
  updateCard: (id: string, data: Partial<Card>) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addBudget: (b: Omit<Budget, 'id' | 'spent'>) => Promise<void>;
  addCategory: (c: Omit<Category, 'id' | 'isDefault'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addInvestment: (i: Omit<Investment, 'id'>) => Promise<void>;
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  linkCardToAccount: (cardId: string, accountId: string | null) => Promise<void>;
  setDefaultCard: (accountId: string, cardId: string | null) => Promise<void>;
  resetData: () => void;
  recalculateBalances: (silent?: boolean, minDelay?: number) => Promise<void>;
  deleteAllUserData: () => Promise<void>;
  restoreDefaultCategories: () => Promise<void>;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries using React Query
  const { data: accountsRaw, isLoading: accLoading } = useAccounts();
  const { data: transactionsRaw, isLoading: transLoading } = useTransactions();
  const { data: cardsRaw, isLoading: cardsLoading } = useCards();
  const { data: budgetsRaw, isLoading: budgetsLoading } = useBudgets();
  const { data: goalsRaw, isLoading: goalsLoading } = useGoals();
  const { data: categoriesRaw, isLoading: catsLoading } = useCategories();
  const { data: investmentsRaw, isLoading: invsLoading } = useInvestments();

  const accounts = accountsRaw || [];
  const transactions = transactionsRaw || [];
  const cards = cardsRaw || [];
  const budgets = budgetsRaw || [];
  const goals = goalsRaw || [];
  const categories = categoriesRaw || [];
  const investments = investmentsRaw || [];

  const loading = authLoading || accLoading || transLoading || cardsLoading || budgetsLoading || goalsLoading || catsLoading || invsLoading;

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['finance'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  useEffect(() => {
    if (user && !loading && goals.length === 0) {
      // Create default goals if user has no goals
      const createDefaultGoals = async () => {
        const defaultGoals = [
          {
            name: 'Fundo de Emergência',
            currentAmount: 0,
            targetAmount: 10000,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0],
            icon: 'emergency',
            colorClass: 'bg-red-500',
            textClass: 'text-red-500'
          },
          {
            name: 'Viagem dos Sonhos',
            currentAmount: 0,
            targetAmount: 15000,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 18)).toISOString().split('T')[0],
            icon: 'flight',
            colorClass: 'bg-blue-500',
            textClass: 'text-blue-500'
          },
          {
            name: 'Carro Novo',
            currentAmount: 0,
            targetAmount: 50000,
            deadline: new Date(new Date().setMonth(new Date().getMonth() + 36)).toISOString().split('T')[0],
            icon: 'directions_car',
            colorClass: 'bg-green-500',
            textClass: 'text-green-500'
          }
        ];

        for (const goal of defaultGoals) {
          const dbGoal = {
            user_id: user.id,
            name: goal.name,
            current_amount: goal.currentAmount,
            target_amount: goal.targetAmount,
            deadline: goal.deadline,
            icon: goal.icon,
            color_class: goal.colorClass,
            text_class: goal.textClass
          };
          await supabase.from('goals').insert(dbGoal);
        }
        queryClient.invalidateQueries({ queryKey: ['finance', 'goals'] });
      };

      createDefaultGoals();
    }
  }, [user, loading, goals.length]);

  // Migration Effect: Update legacy category icons to new 'cat_' library
  useEffect(() => {
    if (categories.length > 0 && user) {
      const LEGACY_TO_NEW_MAP: Record<string, string> = {
        // Food & Drink
        'restaurant': 'cat_food',
        'fastfood': 'cat_food',
        'restaurant_menu': 'cat_food',
        'lunch_dining': 'cat_food',
        'dinner_dining': 'cat_food',
        'local_dining': 'cat_food',
        'local_cafe': 'cat_coffee',
        'coffee': 'cat_coffee',
        'local_bar': 'cat_leisure',
        'liquor': 'cat_leisure',

        // Transport
        'directions_car': 'cat_car',
        'commute': 'cat_car',
        'directions_bus': 'cat_car',
        'train': 'cat_car',
        'subway': 'cat_car',
        'local_taxi': 'cat_car',
        'directions_bike': 'cat_leisure',

        // Health
        'local_hospital': 'cat_health',
        'health_and_safety': 'cat_health',
        'medical_services': 'cat_health',
        'healing': 'cat_health',
        'medication': 'cat_health',
        'local_pharmacy': 'cat_health',

        // Education
        'school': 'cat_education',
        'menu_book': 'cat_books', // or cat_education
        'auto_stories': 'cat_education',
        'import_contacts': 'cat_education',

        // Leisure
        'sports_esports': 'cat_leisure',
        'local_activity': 'cat_leisure',
        'sports_soccer': 'cat_leisure',
        'pool': 'cat_leisure',
        'fitness_center': 'cat_gym',
        'gym': 'cat_gym',
        'movie': 'cat_movie',
        'theaters': 'cat_movie',
        'music_note': 'cat_music',
        'headphones': 'cat_music',
        'music_off': 'cat_music',

        // Home
        'home': 'cat_home',
        'house': 'cat_home',
        'apartment': 'cat_home',
        'cottage': 'cat_home',
        'real_estate_agent': 'cat_home',

        // Shopping
        'checkroom': 'cat_clothing',
        'shopping_cart': 'cat_shopping',
        'shopping_bag': 'cat_shopping',
        'local_mall': 'cat_shopping',
        'store': 'cat_shopping',
        'local_grocery_store': 'cat_grocery',
        'shopping_basket': 'cat_grocery',
        'grocery_store': 'cat_grocery',

        // Travel
        'flight': 'cat_travel',
        'flight_takeoff': 'cat_travel',
        'airport_shuttle': 'cat_travel',
        'luggage': 'cat_travel',
        'explore': 'cat_travel',

        // Pets
        'pets': 'cat_pets',

        // Work
        'work': 'cat_work',
        'business_center': 'cat_work',
        'badge': 'cat_work',

        // Financial
        'trending_up': 'cat_invest',
        'show_chart': 'cat_invest',
        'savings': 'cat_savings',
        'account_balance': 'cat_savings',
        'account_balance_wallet': 'cat_savings',
        'attach_money': 'cat_salary',
        'money': 'cat_salary',
        'payments': 'cat_bill',
        'receipt_long': 'cat_bill',
        'credit_card': 'cat_bill',

        // Others
        'category': 'cat_others',
        'more_horiz': 'cat_others',
        'help': 'cat_others',
        'info': 'cat_others',
        'book': 'cat_books',
        'library_books': 'cat_books'
      };

      const categoriesToUpdate = categories.filter(c => LEGACY_TO_NEW_MAP[c.icon]);

      if (categoriesToUpdate.length > 0) {
        console.log(`Migrating ${categoriesToUpdate.length} categories to new icon library...`);
        const updatePromises = categoriesToUpdate.map(c =>
          supabase.from('categories').update({ icon: LEGACY_TO_NEW_MAP[c.icon] }).eq('id', c.id)
        );

        Promise.all(updatePromises).then(() => {
          console.log('Migrated category icons to new library');
          // toast.success('Ícones das categorias atualizados para a nova versão!');
          invalidateAll();
        });
      }
    }
  }, [categories, user]);

  const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    if (!user) {
      toast.error('Usuário não autenticado!');
      return;
    }

    const newTransactions: any[] = [];

    // Lógica de Parcelamento
    if (newTransaction.installments && newTransaction.installments > 1) {
      const installmentValue = newTransaction.amount / newTransaction.installments;
      const baseDate = new Date(newTransaction.date);

      for (let i = 0; i < newTransaction.installments; i++) {
        const nextDate = new Date(baseDate);
        nextDate.setMonth(baseDate.getMonth() + i);

        const description = `${newTransaction.description} (${i + 1}/${newTransaction.installments})`;

        newTransactions.push({
          ...newTransaction,
          user_id: user.id,
          description,
          amount: parseFloat(installmentValue.toFixed(2)),
          date: nextDate.toISOString().split('T')[0],
          installment_number: i + 1,
          original_transaction_id: i === 0 ? null : undefined
        });
      }
    } else {
      newTransactions.push({ ...newTransaction, user_id: user.id });
    }

    const dbTransactions = newTransactions.map(t => ({
      user_id: user.id,
      description: t.description,
      amount: t.amount,
      date: t.date,
      type: t.type,
      category: t.category,
      card_id: t.cardId || null,
      account_id: t.accountId || null,
      is_paid: t.isPaid,
      installments: t.installments,
      installment_number: t.installmentNumber,
      original_transaction_id: t.originalTransactionId
    }));

    const { error } = await supabase.from('transactions').insert(dbTransactions);
    if (error) {
      console.error('Error adding transaction:', error);
      toast.error(`Erro ao salvar transação: ${error.message}`);
      return;
    }

    // Update Account Balance logic
    // ONLY if it is PAID and NOT a credit card transaction
    if (newTransaction.accountId && newTransaction.isPaid && !newTransaction.cardId) {
      // Fetch fresh balance
      const { data: accData } = await supabase.from('accounts').select('balance').eq('id', newTransaction.accountId).single();

      if (accData) {
        let newBalance = accData.balance;
        if (newTransaction.type === TransactionType.EXPENSE) {
          newBalance -= newTransaction.amount;
        } else if (newTransaction.type === TransactionType.INCOME) {
          newBalance += newTransaction.amount;
        }
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', newTransaction.accountId);
      }
    }

    // Update Card Invoice
    if (newTransaction.cardId && newTransaction.type === TransactionType.EXPENSE) {
      const card = cards.find(c => c.id === newTransaction.cardId);
      if (card) {
        const newInvoice = card.currentInvoice + newTransaction.amount;
        await supabase.from('cards').update({ current_invoice: newInvoice }).eq('id', newTransaction.cardId);
      }
    }

    invalidateAll();
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!user) return;

    const oldTransaction = transactions.find(t => t.id === id);
    if (!oldTransaction) return;

    // 1. Reverter o impacto da transação antiga no saldo
    // 1. Reverter o impacto da transação antiga no saldo
    // SOMENTE se ela estava PAGA e NÃO era cartão de crédito
    if (oldTransaction.accountId && oldTransaction.isPaid && !oldTransaction.cardId) {
      // Fetch fresh balance
      const { data: accData } = await supabase.from('accounts').select('balance').eq('id', oldTransaction.accountId).single();

      if (accData) {
        let reversedBalance = accData.balance;
        if (oldTransaction.type === TransactionType.EXPENSE) {
          reversedBalance += oldTransaction.amount;
        } else if (oldTransaction.type === TransactionType.INCOME) {
          reversedBalance -= oldTransaction.amount;
        }
        await supabase.from('accounts').update({ balance: reversedBalance }).eq('id', oldTransaction.accountId);
      }
    }

    // 2. Atualizar a transação no banco
    const dbData: any = {};
    if (data.description !== undefined) dbData.description = data.description;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.date !== undefined) dbData.date = data.date;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.category !== undefined) dbData.category = data.category;
    if (data.isPaid !== undefined) dbData.is_paid = data.isPaid;
    if (data.accountId !== undefined) dbData.account_id = data.accountId;
    if (data.cardId !== undefined) dbData.card_id = data.cardId;

    const { error } = await supabase.from('transactions').update(dbData).eq('id', id);

    if (error) {
      console.error('Error updating transaction:', error);
      return;
    }

    // 3. Aplicar o impacto da nova transação (ou dados atualizados) no saldo
    // Precisamos mesclar os dados antigos com os novos para ter o objeto completo
    const newTransaction = { ...oldTransaction, ...data };

    if (newTransaction.accountId && newTransaction.isPaid && !newTransaction.cardId) {
      // Recarregar a conta para pegar o saldo atualizado (após a reversão)
      const { data: accData } = await supabase.from('accounts').select('balance').eq('id', newTransaction.accountId).single();

      if (accData) {
        let newBalance = accData.balance;
        if (newTransaction.type === TransactionType.EXPENSE) {
          newBalance -= newTransaction.amount;
        } else if (newTransaction.type === TransactionType.INCOME) {
          newBalance += newTransaction.amount;
        }
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', newTransaction.accountId);
      }
    }

    invalidateAll();
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    const { data: t } = await supabase.from('transactions').select('*').eq('id', id).single();

    if (t) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) {
        if (t.account_id && t.is_paid && !t.card_id) {
          // Fetch fresh balance
          const { data: accData } = await supabase.from('accounts').select('balance').eq('id', t.account_id).single();

          if (accData) {
            const newBalance = t.type === 'INCOME' ? accData.balance - t.amount : accData.balance + t.amount;
            await supabase.from('accounts').update({ balance: newBalance }).eq('id', t.account_id);
          }
        }
        if (t.card_id && t.type === 'EXPENSE') {
          const card = cards.find(c => c.id === t.card_id);
          if (card) {
            await supabase.from('cards').update({ current_invoice: card.currentInvoice - t.amount }).eq('id', t.card_id);
          }
        }
        invalidateAll();
      }
    }
  };

  const addAccount = async (newAccount: Omit<Account, 'id' | 'balance'> & { balance: number }) => {
    if (!user) return;
    const dbAccount = {
      user_id: user.id,
      name: newAccount.name,
      bank_name: newAccount.bankName,
      type: newAccount.type,
      balance: newAccount.balance,
      color: newAccount.color,
      logo_text: newAccount.bankName.substring(0, 2).toUpperCase(),
      account_number: newAccount.accountNumber,
      icon: newAccount.icon
    };
    const { data: createdAccount, error } = await supabase.from('accounts').insert(dbAccount).select().single();

    if (!error && createdAccount && newAccount.balance > 0) {
      // Criar transação de Saldo Inicial
      const initialTransaction = {
        user_id: user.id,
        description: 'Saldo Inicial',
        amount: newAccount.balance,
        date: new Date().toISOString().split('T')[0],
        type: TransactionType.INCOME,
        category: 'Saldo Inicial',
        account_id: createdAccount.id,
        is_paid: true
      };
      await supabase.from('transactions').insert(initialTransaction);
    }

    if (!error) invalidateAll();
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    if (!user) return;
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.bankName !== undefined) dbData.bank_name = data.bankName;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.balance !== undefined) dbData.balance = data.balance;
    if (data.color !== undefined) dbData.color = data.color;
    if (data.accountNumber !== undefined) dbData.account_number = data.accountNumber;
    if (data.icon !== undefined) dbData.icon = data.icon;
    if (data.defaultCardId !== undefined) dbData.default_card_id = data.defaultCardId;

    const { error } = await supabase.from('accounts').update(dbData).eq('id', id);
    if (!error) invalidateAll();
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    // Primeiro, deletar todas as transações associadas
    await supabase.from('transactions').delete().eq('account_id', id);
    // Depois, deletar a conta
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) invalidateAll();
  };

  const addGoal = async (newGoal: Omit<Goal, 'id'>) => {
    if (!user) return;
    const dbGoal = {
      user_id: user.id,
      name: newGoal.name,
      current_amount: newGoal.currentAmount,
      target_amount: newGoal.targetAmount,
      deadline: newGoal.deadline,
      icon: newGoal.icon,
      color_class: newGoal.colorClass,
      text_class: newGoal.textClass
    };
    const { error } = await supabase.from('goals').insert(dbGoal);
    if (!error) invalidateAll();
  };

  const addCard = async (newCard: Omit<Card, 'id' | 'currentInvoice'>) => {
    if (!user) return;

    // Insert card with linkedAccountId
    const dbCard = {
      user_id: user.id,
      name: newCard.name,
      last_digits: newCard.lastDigits,
      brand: newCard.brand,
      limit_amount: newCard.limit,
      current_invoice: 0,
      closing_day: newCard.closingDay,
      due_day: newCard.dueDay,
      status: newCard.status,
      image_url: newCard.imageUrl,
      color: newCard.color,
      account_id: newCard.accountId,
      linked_account_id: newCard.linkedAccountId
    };

    const { data: insertedCard, error } = await supabase.from('cards').insert(dbCard).select().single();

    if (!error && insertedCard && newCard.linkedAccountId) {
      // If card is linked to an account, check if account needs a default card
      const account = accounts.find(a => a.id === newCard.linkedAccountId);
      if (account && !account.defaultCardId) {
        // Auto-set as default if account has no default card
        await supabase.from('accounts').update({ default_card_id: insertedCard.id }).eq('id', newCard.linkedAccountId);
      }
    }

    if (!error) invalidateAll();
  }

  const updateCard = async (id: string, data: Partial<Card>) => {
    if (!user) return;

    const oldCard = cards.find(c => c.id === id);
    const dbData: any = {};

    if (data.name !== undefined) dbData.name = data.name;
    if (data.lastDigits !== undefined) dbData.last_digits = data.lastDigits;
    if (data.limit !== undefined) dbData.limit_amount = data.limit;
    if (data.currentInvoice !== undefined) dbData.current_invoice = data.currentInvoice;
    if (data.closingDay !== undefined) dbData.closing_day = data.closingDay;
    if (data.dueDay !== undefined) dbData.due_day = data.dueDay;
    if (data.color !== undefined) dbData.color = data.color;
    if (data.brand !== undefined) dbData.brand = data.brand;
    if (data.status !== undefined) dbData.status = data.status;
    if (data.imageUrl !== undefined) dbData.image_url = data.imageUrl;
    if (data.linkedAccountId !== undefined) dbData.linked_account_id = data.linkedAccountId;

    // Handle unlinking: if card was default and is being unlinked, clear account's defaultCardId
    if (oldCard && data.linkedAccountId === null && oldCard.linkedAccountId) {
      const account = accounts.find(a => a.id === oldCard.linkedAccountId);
      if (account && account.defaultCardId === id) {
        await supabase.from('accounts').update({ default_card_id: null }).eq('id', oldCard.linkedAccountId);
      }
    }

    // Handle linking: if card is being linked to a new account, auto-set as default if needed
    if (data.linkedAccountId && data.linkedAccountId !== oldCard?.linkedAccountId) {
      const account = accounts.find(a => a.id === data.linkedAccountId);
      if (account && !account.defaultCardId) {
        await supabase.from('accounts').update({ default_card_id: id }).eq('id', data.linkedAccountId);
      }
    }

    const { error } = await supabase.from('cards').update(dbData).eq('id', id);
    if (!error) invalidateAll();
  };

  const deleteCard = async (id: string) => {
    if (!user) return;
    // Delete transactions associated with the card first
    await supabase.from('transactions').delete().eq('card_id', id);

    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (!error) invalidateAll();
  };

  const addBudget = async (newBudget: Omit<Budget, 'id' | 'spent'>) => {
    if (!user) return;
    const dbBudget = {
      user_id: user.id,
      category: newBudget.category,
      spent: 0,
      limit_amount: newBudget.limit,
      period: newBudget.period,
      color: newBudget.color
    };
    const { error } = await supabase.from('budgets').insert(dbBudget);
    if (!error) invalidateAll();
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (!error) invalidateAll();
  };

  const updateGoal = async (id: string, data: Partial<Goal>) => {
    if (!user) return;
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.currentAmount !== undefined) dbData.current_amount = data.currentAmount;
    if (data.targetAmount !== undefined) dbData.target_amount = data.targetAmount;
    if (data.deadline !== undefined) dbData.deadline = data.deadline;
    if (data.icon !== undefined) dbData.icon = data.icon;
    if (data.colorClass !== undefined) dbData.color_class = data.colorClass;
    if (data.textClass !== undefined) dbData.text_class = data.textClass;

    const { error } = await supabase.from('goals').update(dbData).eq('id', id);
    if (!error) invalidateAll();
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;

    try {
      // 1. Tentar excluir transações vinculadas (se a tabela existir)
      // Ignoramos erro aqui caso a tabela não exista, mas logamos se for outro erro
      const { error: transError } = await supabase.from('goal_transactions').delete().eq('goal_id', id);
      if (transError && transError.code !== '42P01') { // 42P01 é undefined_table
        console.warn('Erro ao limpar transações da meta (pode ser ignorado se a tabela não existir):', transError);
      }

      // 2. Excluir a meta
      const { error } = await supabase.from('goals').delete().eq('id', id);

      if (error) {
        console.error('Error deleting goal:', error);
        toast.error(`Erro ao excluir meta: ${error.message}`);
        throw error;
      }

      toast.success('Meta excluída com sucesso!');
      invalidateAll();
    } catch (err) {
      console.error('Falha na exclusão da meta:', err);
      // Toast já exibido acima para erros do supabase
    }
  };

  const addCategory = async (newCategory: Omit<Category, 'id' | 'isDefault'>) => {
    if (!user) return;
    const dbCategory = {
      user_id: user.id,
      name: newCategory.name,
      icon: newCategory.icon,
      color: newCategory.color,
      type: newCategory.type,
      is_default: false
    };
    const { error } = await supabase.from('categories').insert(dbCategory);
    if (!error) invalidateAll();
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!user) return;
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.icon !== undefined) dbData.icon = data.icon;
    if (data.color !== undefined) dbData.color = data.color;
    if (data.type !== undefined) dbData.type = data.type;

    const { error } = await supabase.from('categories').update(dbData).eq('id', id);
    if (!error) invalidateAll();
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) invalidateAll();
  };

  const restoreDefaultCategories = async () => {
    if (!user) return;
    const defaults: Array<Omit<Category, 'id' | 'isDefault'>> = [
      { name: 'Alimentação', icon: 'cat_food', color: '#f59e0b', type: 'expense' },
      { name: 'Transporte', icon: 'cat_car', color: '#3b82f6', type: 'expense' },
      { name: 'Saúde', icon: 'cat_health', color: '#ef4444', type: 'expense' },
      { name: 'Educação', icon: 'cat_education', color: '#8b5cf6', type: 'expense' },
      { name: 'Lazer', icon: 'cat_leisure', color: '#ec4899', type: 'expense' },
      { name: 'Moradia', icon: 'cat_home', color: '#10b981', type: 'expense' },
      { name: 'Vestuário', icon: 'cat_clothing', color: '#6366f1', type: 'expense' },
      { name: 'Compras', icon: 'cat_shopping', color: '#ff7a00', type: 'expense' },
      { name: 'Supermercado', icon: 'cat_grocery', color: '#22c55e', type: 'expense' },
      { name: 'Viagem', icon: 'cat_travel', color: '#0ea5e9', type: 'expense' },
      { name: 'Pets', icon: 'cat_pets', color: '#f97316', type: 'expense' },
      { name: 'Academia', icon: 'cat_gym', color: '#22c55e', type: 'expense' },
      { name: 'Café', icon: 'cat_coffee', color: '#a16207', type: 'expense' },
      { name: 'Cinema', icon: 'cat_movie', color: '#334155', type: 'expense' },
      { name: 'Música', icon: 'cat_music', color: '#64748b', type: 'expense' },
      { name: 'Livros', icon: 'cat_books', color: '#6b7280', type: 'expense' },
      { name: 'Pagamentos', icon: 'cat_bill', color: '#14b8a6', type: 'expense' },
      { name: 'Trabalho', icon: 'cat_work', color: '#374151', type: 'expense' },
      { name: 'Investimentos', icon: 'cat_invest', color: '#0ea5e9', type: 'income' },
      { name: 'Poupança', icon: 'cat_savings', color: '#22c55e', type: 'income' },
      { name: 'Salário', icon: 'cat_salary', color: '#16a34a', type: 'income' },
      { name: 'Freelance', icon: 'cat_freelance', color: '#3b82f6', type: 'income' },
      { name: 'Outros', icon: 'cat_others', color: '#6b7280', type: 'expense' }
    ];

    // Filter defaults to identify missing ones and also update existing ones if needed
    const existingMap = new Map(categories.map(c => [`${c.type}:${c.name}`.toLowerCase(), c]));

    // Categories to insert (missing)
    const toInsert = defaults.filter(d => !existingMap.has(`${d.type}:${d.name}`.toLowerCase())).map(d => ({
      user_id: user.id,
      name: d.name,
      icon: d.icon,
      color: d.color,
      type: d.type,
      is_default: true
    }));

    // Categories to update (existing but might have old icon/color)
    // We only update if they are default categories (is_default: true) OR if we want to enforce defaults on user categories with same name
    // Let's only update if the icon/color is DIFFERENT
    const updates = defaults.filter(d => {
      const key = `${d.type}:${d.name}`.toLowerCase();
      const existing = existingMap.get(key);
      if (!existing) return false;
      // Check if icon or color matches default
      return existing.icon !== d.icon || existing.color !== d.color;
    });

    // Perform inserts
    if (toInsert.length > 0) {
      const { error } = await supabase.from('categories').insert(toInsert);
      if (error) {
        console.error('Error restoring categories:', error);
        toast.error('Erro ao restaurar categorias padrão');
        return;
      }
    }

    // Perform updates
    if (updates.length > 0) {
      const updatePromises = updates.map(d => {
        const key = `${d.type}:${d.name}`.toLowerCase();
        const existing = existingMap.get(key);
        if (!existing) return Promise.resolve(); // Should not happen
        return supabase.from('categories').update({
          icon: d.icon,
          color: d.color,
          // We can also ensure is_default is set to true if it wasn't
          is_default: true
        }).eq('id', existing.id);
      });

      await Promise.all(updatePromises);
    }

    if (toInsert.length > 0 || updates.length > 0) {
      toast.success('Categorias padrão restauradas e atualizadas');
      invalidateAll();
    } else {
      toast.info('Todas as categorias padrão já estão atualizadas');
    }
  };



  const addInvestment = async (newInvestment: Omit<Investment, 'id'>) => {
    if (!user) return;
    const dbInvestment = {
      user_id: user.id,
      name: newInvestment.name,
      type: newInvestment.type,
      amount: newInvestment.amount,
      initial_amount: newInvestment.initialAmount,
      quantity: newInvestment.quantity || 0,
      date: newInvestment.date,
      account_id: newInvestment.accountId,
      ticker: newInvestment.ticker,
      // Projection Fields
      yield_rate: newInvestment.yieldRate,
      yield_type: newInvestment.yieldType,
      duration: newInvestment.duration,
      duration_unit: newInvestment.durationUnit,
      tax_type: newInvestment.taxType,
      maturity_date: newInvestment.maturityDate,
      projected_gross_yield: newInvestment.projectedGrossYield,
      projected_tax_amount: newInvestment.projectedTaxAmount,
      projected_net_total: newInvestment.projectedNetTotal,
      projected_net_yield: newInvestment.projectedNetYield
    };
    const { error } = await supabase.from('investments').insert(dbInvestment);
    if (error) {
      console.error('Error adding investment:', error);
      toast.error(`Erro ao adicionar investimento: ${error.message}`);
    } else {
      invalidateAll();
      toast.success('Investimento adicionado com sucesso!');
    }
  };

  const updateInvestment = async (id: string, data: Partial<Investment>) => {
    if (!user) return;
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.type !== undefined) dbData.type = data.type;
    if (data.amount !== undefined) dbData.amount = data.amount;
    if (data.initialAmount !== undefined) dbData.initial_amount = data.initialAmount;
    if (data.quantity !== undefined) dbData.quantity = data.quantity;
    if (data.date !== undefined) dbData.date = data.date;
    if (data.accountId !== undefined) dbData.account_id = data.accountId;
    if (data.ticker !== undefined) dbData.ticker = data.ticker;

    // Projection Fields
    if (data.yieldRate !== undefined) dbData.yield_rate = data.yieldRate;
    if (data.yieldType !== undefined) dbData.yield_type = data.yieldType;
    if (data.duration !== undefined) dbData.duration = data.duration;
    if (data.durationUnit !== undefined) dbData.duration_unit = data.durationUnit;
    if (data.taxType !== undefined) dbData.tax_type = data.taxType;
    if (data.maturityDate !== undefined) dbData.maturity_date = data.maturityDate;
    if (data.projectedGrossYield !== undefined) dbData.projected_gross_yield = data.projectedGrossYield;
    if (data.projectedTaxAmount !== undefined) dbData.projected_tax_amount = data.projectedTaxAmount;
    if (data.projectedNetTotal !== undefined) dbData.projected_net_total = data.projectedNetTotal;
    if (data.projectedNetYield !== undefined) dbData.projected_net_yield = data.projectedNetYield;

    const { error } = await supabase.from('investments').update(dbData).eq('id', id);
    if (error) {
      console.error('Error updating investment:', error);
      toast.error(`Erro ao atualizar investimento: ${error.message}`);
    } else {
      invalidateAll();
      toast.success('Investimento atualizado com sucesso!');
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (error) {
      console.error('Error deleting investment:', error);
      toast.error(`Erro ao excluir investimento: ${error.message}`);
    } else {
      invalidateAll();
      toast.success('Investimento excluído com sucesso!');
    }
  };

  const resetData = () => {
    queryClient.clear();
  };

  const recalculateBalances = async (silent: boolean = false) => {
    if (!user) return;
    console.log('FinanceContext: Recalculating balances...');

    try {
      const { data: allAccounts, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accError) throw accError;
      if (!allAccounts) return;

      const { data: allTransactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_paid', true);

      if (transError) throw transError;
      if (!allTransactions) return;

      for (const acc of allAccounts) {
        let calculatedBalance = 0;
        const accTrans = allTransactions.filter((t: any) => t.account_id === acc.id && !t.card_id);

        accTrans.forEach((t: any) => {
          if (t.type === 'INCOME') {
            calculatedBalance += Number(t.amount);
          } else if (t.type === 'EXPENSE') {
            calculatedBalance -= Number(t.amount);
          }
        });

        await supabase.from('accounts').update({ balance: calculatedBalance }).eq('id', acc.id);
      }

      await invalidateAll();
      if (!silent) toast.success('Saldos recalculados!');
      console.log('FinanceContext: Recalculation finished');
    } catch (error) {
      console.error('Error recalculating balances:', error);
      if (!silent) toast.error('Erro ao recalcular saldos.');
    }
  };

  // Link card to account (and auto-set as default if account has none)
  const linkCardToAccount = async (cardId: string, accountId: string | null) => {
    if (!user) return;
    await updateCard(cardId, { linkedAccountId: accountId });
  };

  // Set default card for an account
  const setDefaultCard = async (accountId: string, cardId: string | null) => {
    if (!user) return;

    // Validate that card is linked to account (if not null)
    if (cardId) {
      const card = cards.find(c => c.id === cardId);
      if (!card || card.linkedAccountId !== accountId) {
        toast.error('O cartão deve estar vinculado à conta para ser definido como padrão.');
        return;
      }
    }

    await updateAccount(accountId, { defaultCardId: cardId });
  };

  const deleteAllUserData = async () => {
    if (!user) {
      toast.error('Usuário não autenticado!');
      return;
    }

    try {
      // 1. Excluir transações
      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);
      if (transactionsError) throw transactionsError;

      // 2. Excluir cartões
      const { error: cardsError } = await supabase
        .from('cards')
        .delete()
        .eq('user_id', user.id);
      if (cardsError) throw cardsError;

      // 3. Excluir contas
      const { error: accountsError } = await supabase
        .from('accounts')
        .delete()
        .eq('user_id', user.id);
      if (accountsError) throw accountsError;

      // 4. Excluir orçamentos
      const { error: budgetsError } = await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id);
      if (budgetsError) throw budgetsError;

      // 5. Excluir metas
      // Primeiro excluir transações das metas (caso sem CASCADE)
      const { data: userGoals } = await supabase.from('goals').select('id').eq('user_id', user.id);
      if (userGoals && userGoals.length > 0) {
        const goalIds = userGoals.map(g => g.id);
        await supabase.from('goal_transactions').delete().in('goal_id', goalIds);
      }

      const { error: goalsError } = await supabase
        .from('goals')
        .delete()
        .eq('user_id', user.id);
      if (goalsError) throw goalsError;

      // 6. Excluir investimentos
      const { error: investmentsError } = await supabase
        .from('investments')
        .delete()
        .eq('user_id', user.id);
      if (investmentsError) throw investmentsError;

      // 7. Excluir categorias personalizadas (se houver)
      const { error: categoriesError } = await supabase
        .from('categories')
        .delete()
        .eq('user_id', user.id)
        .eq('is_default', false); // Apenas categorias não padrão
      if (categoriesError) throw categoriesError;

      // 8. Desautenticar o usuário
      await supabase.auth.signOut();
      resetData();
      toast.success('Todos os seus dados foram excluídos e você foi desconectado.');
    } catch (error: any) {
      console.error('Erro ao excluir dados do usuário:', error);
      toast.error(`Erro ao excluir dados: ${error.message}`);
    }
  };

  return (
    <FinanceContext.Provider value={{
      accounts, transactions, cards, budgets, goals, categories, investments,
      addTransaction, updateTransaction, deleteTransaction, addAccount, updateAccount, deleteAccount, addGoal, updateGoal, deleteGoal, addCard, updateCard, deleteCard, addBudget, deleteBudget, addCategory, updateCategory, deleteCategory, addInvestment, updateInvestment, deleteInvestment, linkCardToAccount, setDefaultCard, resetData, recalculateBalances, deleteAllUserData, restoreDefaultCategories, loading
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
