import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { transactionService } from '../services/transactionService';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { useSharedAccount } from '../context/SharedAccountContext';

// Chaves de Query para cache
export const transactionKeys = {
  all: ['transactions'] as const,
  list: (userId: string, isShared: boolean, filters: any = {}) =>
    [...transactionKeys.all, { userId, isShared, ...filters }] as const,
};

/**
 * Hook para buscar transações (Versão legada/simples)
 */
export function useTransactions(filters: any = {}) {
  const { user } = useAuth();
  const { isSharedViewActive } = useSharedAccount();
  const userId = user?.id || '';

  return useQuery({
    queryKey: transactionKeys.list(userId, isSharedViewActive, filters),
    queryFn: () => transactionService.getTransactions(userId, isSharedViewActive, filters),
    enabled: !!userId,
  });
}

/**
 * Hook para buscar transações com Paginação/Infinite Scroll
 */
export function useInfiniteTransactions(filters: any = {}) {
  const { user } = useAuth();
  const { isSharedViewActive } = useSharedAccount();
  const userId = user?.id || '';
  const PAGE_SIZE = 25;

  return useInfiniteQuery({
    queryKey: transactionKeys.list(userId, isSharedViewActive, filters),
    queryFn: ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      return transactionService.getTransactions(userId, isSharedViewActive, {
        ...filters,
        from,
        to
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Se a última página veio cheia, provavelmente tem mais
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: !!userId,
  });
}

/**
 * Hook para obter resumo de transações (totais)
 */
export function useTransactionSummary(options: { startDate?: string; endDate?: string } = {}) {
  const { user } = useAuth();
  const userId = user?.id || '';

  return useQuery({
    queryKey: [...transactionKeys.all, 'summary', { userId, ...options }],
    queryFn: () => transactionService.getTransactionSummary(userId, options),
    enabled: !!userId,
  });
}

/**
 * Hook para criar transação
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id || '';

  return useMutation({
    mutationFn: (newTransaction: Omit<Transaction, 'id'>) =>
      transactionService.createTransaction(newTransaction, userId),
    onMutate: async (newTransaction) => {
      // Cancela queries em andamento para não sobrescrever o otimismo
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });

      // Snapshot do valor anterior (para rollback)
      const previousTransactions = queryClient.getQueryData(transactionKeys.all);

      // Otimisticamente atualiza o cache (Se for uma query simples)
      // Nota: Atualizar InfiniteQuery é complexo, então focamos na invalidação se falhar

      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      // Rollback em caso de erro
      if (context?.previousTransactions) {
        queryClient.setQueryData(transactionKeys.all, context.previousTransactions);
      }
    },
    onSettled: () => {
      // Sempre invalida para garantir sincronia com o servidor
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Hook para deletar transação
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });
      const previousTransactions = queryClient.getQueryData(transactionKeys.all);
      return { previousTransactions };
    },
    onError: (err, id, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(transactionKeys.all, context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

/**
 * Hook para atualizar transação
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Transaction> }) =>
      transactionService.updateTransaction(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: transactionKeys.all });
      const previousTransactions = queryClient.getQueryData(transactionKeys.all);
      return { previousTransactions };
    },
    onError: (err, { id, updates }, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(transactionKeys.all, context.previousTransactions);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
