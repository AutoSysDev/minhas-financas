import { supabase } from './supabase';
import { Account, Card, Budget, Goal, Category, Investment, GoalTransaction } from '../types';

export const financeService = {
    async getGoalTransactions(goalId: string): Promise<GoalTransaction[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('goal_transactions')
            .select('*')
            .eq('goal_id', goalId)
            .order('date', { ascending: false });

        if (error) {
            // If table doesn't exist, return empty array to avoid crash
            if (error.code === '42P01') return [];
            throw error;
        }

        return (data || []).map(t => ({
            id: t.id,
            goalId: t.goal_id,
            amount: Number(t.amount || 0),
            type: t.type,
            date: t.date,
            description: t.description,
            relatedTransactionId: t.related_transaction_id
        }));
    },

    async createGoalTransaction(transaction: Omit<GoalTransaction, 'id'>) {
        const { error } = await supabase.from('goal_transactions').insert({
            goal_id: transaction.goalId,
            amount: transaction.amount,
            type: transaction.type,
            date: transaction.date,
            description: transaction.description,
            related_transaction_id: transaction.relatedTransactionId
        });
        if (error) throw error;
    },

    async getAccounts(userId: string, isShared: boolean = false): Promise<Account[]> {
        if (!userId || !supabase) return [];
        let query = supabase.from('accounts').select('*');
        if (!isShared) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(a => ({
            id: a.id,
            name: a.name,
            bankName: a.bank_name,
            type: a.type,
            balance: Number(a.balance || 0),
            color: a.color,
            logoText: a.logo_text,
            accountNumber: a.account_number,
            icon: a.icon,
            defaultCardId: a.default_card_id
        }));
    },

    async getCards(userId: string, isShared: boolean = false): Promise<Card[]> {
        if (!userId || !supabase) return [];
        let query = supabase.from('cards').select('*');
        if (!isShared) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(c => ({
            id: c.id,
            name: c.name,
            lastDigits: c.last_digits,
            brand: c.brand,
            limit: Number(c.limit_amount || 0),
            currentInvoice: Number(c.current_invoice || 0),
            closingDay: c.closing_day,
            dueDay: c.due_day,
            status: c.status,
            imageUrl: c.image_url,
            color: c.color,
            accountId: c.account_id,
            linkedAccountId: c.linked_account_id
        }));
    },

    async getBudgets(userId: string, isShared: boolean = false): Promise<Budget[]> {
        if (!userId || !supabase) return [];
        let query = supabase.from('budgets').select('*');
        if (!isShared) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(b => ({
            id: b.id,
            category: b.category,
            spent: Number(b.spent || 0),
            limit: Number(b.limit_amount || 0),
            period: b.period,
            color: b.color
        }));
    },

    async getGoals(userId: string, isShared: boolean = false): Promise<Goal[]> {
        if (!userId || !supabase) return [];
        let query = supabase.from('goals').select('*');
        if (!isShared) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(g => ({
            id: g.id,
            name: g.name,
            currentAmount: Number(g.current_amount || 0),
            targetAmount: Number(g.target_amount || 0),
            deadline: g.deadline,
            icon: g.icon,
            colorClass: g.color_class,
            textClass: g.text_class
        }));
    },

    async getInvestments(userId: string, isShared: boolean = false): Promise<Investment[]> {
        if (!userId || !supabase) return [];
        let query = supabase.from('investments').select('*');
        if (!isShared) query = query.eq('user_id', userId);

        const { data, error } = await query;
        if (error) throw error;

        return (data || []).map(i => ({
            id: i.id,
            name: i.name,
            type: i.type,
            amount: Number(i.amount || 0),
            initialAmount: Number(i.initial_amount || 0),
            date: i.date,
            accountId: i.account_id,
            yieldRate: i.yield_rate,
            yieldType: i.yield_type,
            duration: i.duration,
            durationUnit: i.duration_unit,
            taxType: i.tax_type,
            maturityDate: i.maturity_date,
            projectedGrossYield: i.projected_gross_yield,
            projectedTaxAmount: i.projected_tax_amount,
            projectedNetTotal: i.projected_net_total,
            projectedNetYield: i.projected_net_yield
        }));
    },

    async getCategories(userId: string, isShared: boolean = false): Promise<Category[]> {
        if (!userId || !supabase) return [];
        let query = supabase.from('categories').select('*');

        if (!isShared) {
            // Fetch user's categories OR global categories (user_id is null)
            query = query.or(`user_id.eq.${userId},user_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Dedup categories by name/type preference: User overrides Global?
        // Actually, if we want to show both, we just map. 
        // But usually we want to merge. 
        // However, the request is just to make defaults available.
        // Let's just return all found. The UI can handle display.
        // If a user has a custom category with same name as default, they might see duplicate.
        // We can filter duplicates here if needed.

        const categories = (data || []).map(c => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            color: c.color,
            type: c.type,
            isDefault: c.is_default
        }));

        // Optional: Dedup logic if desired (e.g. if user has same name as global, prefer user's?)
        // For now, return all as requested "Deixe padrão para todos"
        return categories;
    },

    // --- MUTATIONS ---

    // ACCOUNTS
    async createAccount(userId: string, account: Omit<Account, 'id' | 'balance'> & { balance: number }) {
        const { data, error } = await supabase.from('accounts').insert({
            user_id: userId,
            name: account.name,
            bank_name: account.bankName,
            type: account.type,
            balance: account.balance,
            color: account.color,
            logo_text: account.bankName.substring(0, 2).toUpperCase(),
            account_number: account.accountNumber,
            icon: account.icon
        }).select().single();

        if (error) throw error;

        // Criar transação de saldo inicial se necessário
        if (data && account.balance > 0) {
            await supabase.from('transactions').insert({
                user_id: userId,
                description: 'Saldo Inicial',
                amount: account.balance,
                date: new Date().toISOString().split('T')[0],
                type: 'INCOME',
                category: 'Saldo Inicial',
                account_id: data.id,
                is_paid: true
            });
        }
        return data;
    },

    async updateAccount(id: string, updates: Partial<Account>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.accountNumber !== undefined) dbUpdates.account_number = updates.accountNumber;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.defaultCardId !== undefined) dbUpdates.default_card_id = updates.defaultCardId;

        const { error } = await supabase.from('accounts').update(dbUpdates).eq('id', id);
        if (error) throw error;
    },

    async deleteAccount(id: string) {
        // Deletar transações primeiro devido a constraints (embora muitas vezes gerenciado via Cascade no BD)
        await supabase.from('transactions').delete().eq('account_id', id);
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (error) throw error;
    },

    // GOALS
    async createGoal(userId: string, goal: Omit<Goal, 'id'>) {
        const { error } = await supabase.from('goals').insert({
            user_id: userId,
            name: goal.name,
            current_amount: goal.currentAmount,
            target_amount: goal.targetAmount,
            deadline: goal.deadline,
            icon: goal.icon,
            color_class: goal.colorClass,
            text_class: goal.textClass
        });
        if (error) throw error;
    },

    async updateGoal(id: string, updates: Partial<Goal>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.currentAmount !== undefined) dbUpdates.current_amount = updates.currentAmount;
        if (updates.targetAmount !== undefined) dbUpdates.target_amount = updates.targetAmount;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.colorClass !== undefined) dbUpdates.color_class = updates.colorClass;
        if (updates.textClass !== undefined) dbUpdates.text_class = updates.textClass;

        const { error } = await supabase.from('goals').update(dbUpdates).eq('id', id);
        if (error) throw error;
    },

    async deleteGoal(id: string) {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
    },

    // CARDS
    async createCard(userId: string, card: Omit<Card, 'id' | 'currentInvoice'>) {
        const { data, error } = await supabase.from('cards').insert({
            user_id: userId,
            name: card.name,
            last_digits: card.lastDigits,
            brand: card.brand,
            limit_amount: card.limit,
            current_invoice: 0,
            closing_day: card.closingDay,
            due_day: card.dueDay,
            status: card.status,
            image_url: card.imageUrl,
            color: card.color,
            account_id: card.accountId,
            linked_account_id: card.linkedAccountId
        }).select().single();

        if (error) throw error;

        // Auto-set as default if linked to account with no default card
        if (data && card.linkedAccountId) {
            const { data: acc } = await supabase.from('accounts').select('default_card_id').eq('id', card.linkedAccountId).single();
            if (acc && !acc.default_card_id) {
                await supabase.from('accounts').update({ default_card_id: data.id }).eq('id', card.linkedAccountId);
            }
        }
        return data;
    },

    async updateCard(id: string, updates: Partial<Card>) {
        const dbUpdates: any = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.lastDigits !== undefined) dbUpdates.last_digits = updates.lastDigits;
        if (updates.limit !== undefined) dbUpdates.limit_amount = updates.limit;
        if (updates.currentInvoice !== undefined) dbUpdates.current_invoice = updates.currentInvoice;
        if (updates.closingDay !== undefined) dbUpdates.closing_day = updates.closingDay;
        if (updates.dueDay !== undefined) dbUpdates.due_day = updates.dueDay;
        if (updates.color !== undefined) dbUpdates.color = updates.color;
        if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
        if (updates.linkedAccountId !== undefined) dbUpdates.linked_account_id = updates.linkedAccountId;

        const { error } = await supabase.from('cards').update(dbUpdates).eq('id', id);
        if (error) throw error;
    },

    async deleteCard(id: string) {
        await supabase.from('transactions').delete().eq('card_id', id);
        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (error) throw error;
    },

    // BUDGETS
    async createBudget(userId: string, budget: Omit<Budget, 'id' | 'spent'>) {
        const { error } = await supabase.from('budgets').insert({
            user_id: userId,
            category: budget.category,
            spent: 0,
            limit_amount: budget.limit,
            period: budget.period,
            color: budget.color
        });
        if (error) throw error;
    },

    async deleteBudget(id: string) {
        const { error } = await supabase.from('budgets').delete().eq('id', id);
        if (error) throw error;
    },

    // INVESTMENTS
    async createInvestment(userId: string, investment: Omit<Investment, 'id'>) {
        const { error } = await supabase.from('investments').insert({
            user_id: userId,
            name: investment.name,
            type: investment.type,
            amount: investment.amount,
            initial_amount: investment.initialAmount,
            date: investment.date,
            account_id: investment.accountId
        });
        if (error) throw error;
    }
};
