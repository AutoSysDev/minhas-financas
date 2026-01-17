import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeService } from '../services/financeService';
import { useAuth } from '../context/AuthContext';
import { useSharedAccount } from '../context/SharedAccountContext';
import { Account, Card, Budget, Goal, Investment, GoalTransaction } from '../types';

export const financeKeys = {
    all: ['finance'] as const,
    accounts: (userId: string, isShared: boolean) => [...financeKeys.all, 'accounts', { userId, isShared }] as const,
    cards: (userId: string, isShared: boolean) => [...financeKeys.all, 'cards', { userId, isShared }] as const,
    budgets: (userId: string, isShared: boolean) => [...financeKeys.all, 'budgets', { userId, isShared }] as const,
    goals: (userId: string, isShared: boolean) => [...financeKeys.all, 'goals', { userId, isShared }] as const,
    goalTransactions: (goalId: string) => [...financeKeys.all, 'goalTransactions', { goalId }] as const,
    investments: (userId: string, isShared: boolean) => [...financeKeys.all, 'investments', { userId, isShared }] as const,
    categories: (userId: string, isShared: boolean) => [...financeKeys.all, 'categories', { userId, isShared }] as const,
};

/**
 * Helper para invalidar todas as queries financeiras
 */
export function useInvalidateFinance() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: financeKeys.all });
}

export function useGoalTransactions(goalId: string) {
    return useQuery({
        queryKey: financeKeys.goalTransactions(goalId),
        queryFn: () => financeService.getGoalTransactions(goalId),
        enabled: !!goalId,
    });
}

export function useAccounts() {
    const { user } = useAuth();
    const { isSharedViewActive } = useSharedAccount();
    const userId = user?.id || '';

    return useQuery({
        queryKey: financeKeys.accounts(userId, isSharedViewActive),
        queryFn: () => financeService.getAccounts(userId, isSharedViewActive),
        enabled: !!userId,
    });
}

export function useCards() {
    const { user } = useAuth();
    const { isSharedViewActive } = useSharedAccount();
    const userId = user?.id || '';

    return useQuery({
        queryKey: financeKeys.cards(userId, isSharedViewActive),
        queryFn: () => financeService.getCards(userId, isSharedViewActive),
        enabled: !!userId,
    });
}

export function useBudgets() {
    const { user } = useAuth();
    const { isSharedViewActive } = useSharedAccount();
    const userId = user?.id || '';

    return useQuery({
        queryKey: financeKeys.budgets(userId, isSharedViewActive),
        queryFn: () => financeService.getBudgets(userId, isSharedViewActive),
        enabled: !!userId,
    });
}

export function useGoals() {
    const { user } = useAuth();
    const { isSharedViewActive } = useSharedAccount();
    const userId = user?.id || '';

    return useQuery({
        queryKey: financeKeys.goals(userId, isSharedViewActive),
        queryFn: () => financeService.getGoals(userId, isSharedViewActive),
        enabled: !!userId,
    });
}

export function useInvestments() {
    const { user } = useAuth();
    const { isSharedViewActive } = useSharedAccount();
    const userId = user?.id || '';

    return useQuery({
        queryKey: financeKeys.investments(userId, isSharedViewActive),
        queryFn: () => financeService.getInvestments(userId, isSharedViewActive),
        enabled: !!userId,
    });
}

export function useCategories() {
    const { user } = useAuth();
    const { isSharedViewActive } = useSharedAccount();
    const userId = user?.id || '';

    return useQuery({
        queryKey: financeKeys.categories(userId, isSharedViewActive),
        queryFn: () => financeService.getCategories(userId, isSharedViewActive),
        enabled: !!userId,
    });
}

// --- MUTATIONS ---

export function useCreateAccount() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (account: Omit<Account, 'id' | 'balance'> & { balance: number }) =>
            financeService.createAccount(user?.id || '', account),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}

export function useUpdateAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Account> }) =>
            financeService.updateAccount(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
    });
}

export function useDeleteAccount() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeService.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}

export function useCreateGoal() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (goal: Omit<Goal, 'id'>) => financeService.createGoal(user?.id || '', goal),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'goals'] }),
    });
}

export function useUpdateGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Goal> }) =>
            financeService.updateGoal(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'goals'] }),
    });
}

export function useDeleteGoal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeService.deleteGoal(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'goals'] }),
    });
}

export function useCreateGoalTransaction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (transaction: Omit<GoalTransaction, 'id'>) =>
            financeService.createGoalTransaction(transaction),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: financeKeys.goalTransactions(variables.goalId) });
        },
    });
}

export function useCreateCard() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (card: Omit<Card, 'id' | 'currentInvoice'>) =>
            financeService.createCard(user?.id || '', card),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}

export function useUpdateCard() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Card> }) =>
            financeService.updateCard(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: financeKeys.all }),
    });
}

export function useDeleteCard() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeService.deleteCard(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: financeKeys.all });
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
        },
    });
}

export function useCreateBudget() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (budget: Omit<Budget, 'id' | 'spent'>) =>
            financeService.createBudget(user?.id || '', budget),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
    });
}

export function useDeleteBudget() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => financeService.deleteBudget(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'budgets'] }),
    });
}

export function useCreateInvestment() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: (investment: Omit<Investment, 'id'>) =>
            financeService.createInvestment(user?.id || '', investment),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['finance', 'investments'] }),
    });
}
