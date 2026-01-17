# Guia de Migração: React Context para TanStack Query

Este guia detalha como migrar o gerenciamento de estado do Monely Finance para usar **TanStack Query (v5)**. O objetivo é substituir o fetch manual dentro do `FinanceContext` por hooks dedicados, melhorando performance e cache.

## 1. Por que mudamos?

*   **Antes (FinanceContext):** Todo o estado (transações, contas, etc.) era carregado de uma vez em um único `Promise.all`. Qualquer atualização (ex: nova transação) exigia recarregar tudo ou gerenciar atualizações manuais complexas no array local. Isso causava re-renders em toda a aplicação.
*   **Agora (TanStack Query):**
    *   **Cache Automático:** Dados são cacheados e só recarregados quando necessário (stale-while-revalidate).
    *   **Invalidation Inteligente:** Ao criar uma transação, apenas invalidamos a chave `['transactions']`, e o React Query atualiza o dado em background.
    *   **Loading/Error States:** Cada hook fornece `isLoading` e `isError` nativamente.

## 2. Como usar os novos Hooks

### Buscando Transações (Leitura)

Substitua o uso de `useFinance()` para ler dados:

**Antes:**
```tsx
import { useFinance } from '../context/FinanceContext';

const MyComponent = () => {
  const { transactions, loading } = useFinance();

  if (loading) return <Spinner />;
  return <div>{transactions.map(t => ...)}</div>;
}
```

**Depois:**
```tsx
import { useTransactions } from '../hooks/useTransactions';

const MyComponent = () => {
  const { data: transactions, isLoading, isError } = useTransactions();

  if (isLoading) return <Spinner />;
  if (isError) return <p>Erro ao carregar</p>;
  
  return <div>{transactions?.map(t => ...)}</div>;
}
```

### Criando Transações (Escrita)

**Antes:**
```tsx
const { addTransaction } = useFinance();
await addTransaction(novosDados);
```

**Depois:**
```tsx
import { useCreateTransaction } from '../hooks/useTransactions';

const MyComponent = () => {
  const createTransaction = useCreateTransaction();

  const handleSave = () => {
    createTransaction.mutate(novosDados, {
      onSuccess: () => {
        toast.success('Transação criada!');
        closeModal();
      },
      onError: (error) => {
        toast.error('Erro: ' + error.message);
      }
    });
  };

  return (
    <button disabled={createTransaction.isPending}>
      {createTransaction.isPending ? 'Salvando...' : 'Salvar'}
    </button>
  );
}
```

## 3. Próximos Passos para Refatoração Completa

Para concluir a migração, devemos seguir este padrão para as outras entidades:

1.  **Accounts (Contas):**
    *   Criar `services/accountService.ts`
    *   Criar `hooks/useAccounts.ts` (useAccounts, useCreateAccount, etc.)
    *   Chave de query: `['accounts']`

2.  **Budgets, Goals, Cards:**
    *   Seguir o mesmo padrão.

3.  **Limpeza do Contexto:**
    *   Após migrar todos os hooks, o `FinanceContext` pode ser removido ou mantido apenas para estados puramente de UI (filtros globais, visibilidade de saldo), sem conter os dados do banco.
