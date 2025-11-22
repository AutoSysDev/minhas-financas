import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Budget, Card, Goal, Transaction, TransactionType, Category } from '../types';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { generateId } from '../utils/helpers';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  cards: Card[];
  budgets: Budget[];
  goals: Goal[];
  categories: Category[];

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
  resetData: () => void;
  loading: boolean;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: accs } = await supabase.from('accounts').select('*');
      const { data: trans } = await supabase.from('transactions').select('*');
      const { data: crds } = await supabase.from('cards').select('*');
      const { data: bdgts } = await supabase.from('budgets').select('*');
      const { data: gls } = await supabase.from('goals').select('*');

      if (accs) {
        setAccounts(accs.map((a: any) => ({
          id: a.id,
          name: a.name,
          bankName: a.bank_name,
          type: a.type,
          balance: a.balance,
          color: a.color,
          logoText: a.logo_text,
          accountNumber: a.account_number,
          icon: a.icon,
          defaultCardId: a.default_card_id
        })));
      }

      if (trans) {
        setTransactions(trans.map((t: any) => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount),
          date: t.date,
          type: t.type,
          category: t.category,
          cardId: t.card_id,
          accountId: t.account_id,
          isPaid: t.is_paid,
          installments: t.installments,
          installmentNumber: t.installment_number,
          originalTransactionId: t.original_transaction_id
        })));
      }

      if (crds) {
        setCards(crds.map((c: any) => ({
          id: c.id,
          name: c.name,
          lastDigits: c.last_digits,
          brand: c.brand,
          limit: c.limit_amount,
          currentInvoice: c.current_invoice,
          closingDay: c.closing_day,
          dueDay: c.due_day,
          status: c.status,
          imageUrl: c.image_url,
          color: c.color,
          accountId: c.account_id
        })));
      }

      if (bdgts) {
        setBudgets(bdgts.map((b: any) => ({
          id: b.id,
          category: b.category,
          spent: b.spent,
          limit: b.limit_amount,
          period: b.period,
          color: b.color
        })));
      }

      if (gls) {
        setGoals(gls.map((g: any) => ({
          id: g.id,
          name: g.name,
          currentAmount: g.current_amount,
          targetAmount: g.target_amount,
          deadline: g.deadline,
          icon: g.icon,
          colorClass: g.color_class,
          textClass: g.text_class
        })));
      }

      const { data: cats } = await supabase.from('categories').select('*');
      if (cats) {
        setCategories(cats.map((c: any) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          type: c.type,
          isDefault: c.is_default
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Create default goals if user has no goals
  useEffect(() => {
    const createDefaultGoals = async () => {
      if (!user || loading || goals.length > 0) return;

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
        await addGoal(goal);
      }
    };

    // Wait a bit to ensure data is loaded
    const timer = setTimeout(() => {
      createDefaultGoals();
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, loading, goals.length]);

  const addTransaction = async (newTransaction: Omit<Transaction, 'id'>) => {
    if (!user) {
      alert('Usuário não autenticado!');
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
      alert(`Erro ao salvar transação: ${error.message}`);
      return;
    }

    // Update Account Balance logic
    if (newTransaction.accountId) {
      const acc = accounts.find(a => a.id === newTransaction.accountId);
      if (acc) {
        let newBalance = acc.balance;
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

    fetchData();
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!user) return;

    const oldTransaction = transactions.find(t => t.id === id);
    if (!oldTransaction) return;

    // 1. Reverter o impacto da transação antiga no saldo
    if (oldTransaction.accountId) {
      const acc = accounts.find(a => a.id === oldTransaction.accountId);
      if (acc) {
        let reversedBalance = acc.balance;
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

    if (newTransaction.accountId) {
      // Recarregar a conta para pegar o saldo atualizado (após a reversão)
      // Como não podemos fazer await fetchData() no meio de forma síncrona confiavelmente para pegar o estado,
      // vamos fazer uma query direta ou usar o saldo calculado anteriormente.
      // Melhor: Fazer uma query direta para garantir consistência.
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

    fetchData();
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    const { data: t } = await supabase.from('transactions').select('*').eq('id', id).single();

    if (t) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (!error) {
        if (t.account_id) {
          const acc = accounts.find(a => a.id === t.account_id);
          if (acc) {
            const newBalance = t.type === 'INCOME' ? acc.balance - t.amount : acc.balance + t.amount;
            await supabase.from('accounts').update({ balance: newBalance }).eq('id', t.account_id);
          }
        }
        if (t.card_id && t.type === 'EXPENSE') {
          const card = cards.find(c => c.id === t.card_id);
          if (card) {
            await supabase.from('cards').update({ current_invoice: card.currentInvoice - t.amount }).eq('id', t.card_id);
          }
        }
        fetchData();
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
    const { error } = await supabase.from('accounts').insert(dbAccount);
    if (!error) fetchData();
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
    if (!error) fetchData();
  };

  const deleteAccount = async (id: string) => {
    if (!user) return;
    // Primeiro, deletar todas as transações associadas
    await supabase.from('transactions').delete().eq('account_id', id);
    // Depois, deletar a conta
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (!error) fetchData();
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
    if (!error) fetchData();
  };

  const addCard = async (newCard: Omit<Card, 'id' | 'currentInvoice'>) => {
    if (!user) return;
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
      account_id: newCard.accountId
    };
    const { error } = await supabase.from('cards').insert(dbCard);
    if (!error) fetchData();
  }

  const updateCard = async (id: string, data: Partial<Card>) => {
    if (!user) return;
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

    const { error } = await supabase.from('cards').update(dbData).eq('id', id);
    if (!error) fetchData();
  };

  const deleteCard = async (id: string) => {
    if (!user) return;
    // Delete transactions associated with the card first
    await supabase.from('transactions').delete().eq('card_id', id);

    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (!error) fetchData();
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
    if (!error) fetchData();
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
    if (!error) fetchData();
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (!error) fetchData();
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
    if (!error) fetchData();
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!user) return;
    const dbData: any = {};
    if (data.name !== undefined) dbData.name = data.name;
    if (data.icon !== undefined) dbData.icon = data.icon;
    if (data.color !== undefined) dbData.color = data.color;
    if (data.type !== undefined) dbData.type = data.type;

    const { error } = await supabase.from('categories').update(dbData).eq('id', id);
    if (!error) fetchData();
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) fetchData();
  };

  const resetData = () => {
    // Optional: Clear DB? Or just local state?
    // For now, just reload
    window.location.reload();
  };

  return (
    <FinanceContext.Provider value={{
      accounts, transactions, cards, budgets, goals, categories,
      addTransaction, updateTransaction, deleteTransaction, addAccount, updateAccount, deleteAccount, addGoal, updateGoal, deleteGoal, addCard, updateCard, deleteCard, addBudget, addCategory, updateCategory, deleteCategory, resetData, loading
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
