# Plano de Implementação: Melhorias Gerais

Este plano cobre a implementação das melhorias identificadas na revisão de código, focando em integridade de dados e novas funcionalidades.

## 1. Banco de Dados (Supabase)

### A. Tabela `investments`
Criar tabela para armazenar os investimentos.
*   Campos: `id`, `user_id`, `name`, `type` (renda_fixa, acoes, fiis, cripto, etc), `amount` (valor atual), `initial_amount` (valor investido), `date` (data da aplicação).

### B. Tabela `recurrences` (Opcional/Futuro)
*   Por enquanto, manteremos a lógica de recorrência no frontend para não complicar a migração, mas focaremos na **Lógica de Saldo**.

## 2. Lógica de Negócio (Frontend/Context)

### A. Refatoração do Saldo (`FinanceContext.tsx`)
*   **Novo Comportamento:** Ao criar uma conta (`addAccount`), criar automaticamente uma transação do tipo `INCOME` com categoria "Saldo Inicial".
*   **Recálculo:** A função `recalculateBalances` passará a confiar puramente na soma das transações.
*   **Migração:** Criar um script (ou botão de admin) para gerar transações de "Saldo Inicial" para contas existentes baseando-se na diferença entre o saldo atual e a soma das transações.

### B. Contexto de Investimentos
*   Adicionar `investments` e funções (`addInvestment`, `updateInvestment`, `deleteInvestment`) ao `FinanceContext`.

## 3. Interface (UI)

### A. Dashboard
*   Substituir o placeholder de investimentos pelo valor real vindo do contexto.

### B. Nova Página: Investimentos
*   Criar uma visualização básica para listar e adicionar investimentos.

## 4. Arquivos Afetados

*   `types.ts`: Adicionar interface `Investment`.
*   `FinanceContext.tsx`: Adicionar lógica de investimentos e ajustar `addAccount`.
*   `Dashboard.tsx`: Consumir dados reais.
*   `utils/helpers.ts`: Helpers para totalizar investimentos.

## Ordem de Execução

1.  **SQL**: Criar tabela `investments`.
2.  **Types**: Atualizar interfaces.
3.  **Context**: Implementar lógica de saldo e investimentos.
4.  **UI**: Atualizar Dashboard e criar página de Investimentos.
