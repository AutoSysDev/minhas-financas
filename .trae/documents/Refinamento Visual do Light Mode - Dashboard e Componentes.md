# Refinamento Visual do Light Mode (Dashboard)

## Objetivo
Melhorar a legibilidade e contraste do Dashboard no Light Mode, substituindo cores fixas de modo escuro por variantes dinâmicas e aplicando fundos sólidos (branco) em cards para criar profundidade sobre o fundo off-white.

## Arquivos Afetados
1.  `c:\monelyfinance\pages\Dashboard.tsx`
2.  `c:\monelyfinance\components\FloatingActionButton.tsx`

## Detalhes da Implementação

### 1. Dashboard (`Dashboard.tsx`)
*   **Header:**
    *   Título: `text-white` -> `text-gray-900 dark:text-white`.
    *   Subtítulo: Reforçar contraste.
*   **Card "Minhas Contas" (Patrimônio):**
    *   Manter gradiente. Ajustar sombra para `shadow-lg` consistente.
*   **Cards de Contas:**
    *   Container: `bg-white/[0.02]` -> `bg-white dark:bg-white/[0.02]`.
    *   Borda: `border-gray-200 dark:border-white/[0.05]`.
    *   Texto: `text-gray-900 dark:text-white`.
*   **Card "Nova Conta":**
    *   Container: `bg-white dark:bg-white/[0.01]`.
    *   Borda: `border-gray-300 dark:border-white/[0.05]`.
    *   Texto/Ícone: `text-gray-400` -> `text-gray-500 dark:text-gray-400` e hover mais escuro.
*   **Cards de Resumo (Saldo Atual, Receitas, Despesas):**
    *   Container: `bg-white dark:bg-white/[0.02]`.
    *   Sombra: `shadow-md dark:shadow-lg`.
    *   Valores: `text-gray-900 dark:text-white`.
    *   Rótulos: `text-gray-500 dark:text-gray-400`.
*   **Card "Saldo Previsto":**
    *   Container: `bg-indigo-50 dark:bg-indigo-900/20`.
    *   Texto Título: `text-indigo-900 dark:text-indigo-200`.
    *   Valor: `text-indigo-950 dark:text-white`.
*   **Gráficos e Atalhos:**
    *   Container: `bg-white dark:bg-white/[0.02]`.
    *   Títulos: `text-gray-900 dark:text-white`.
    *   Botões de atalho: Ajustar fundos e bordas para visibilidade no branco.

### 2. Floating Action Button (`FloatingActionButton.tsx`)
*   **Menu de Ações:**
    *   Botões: `bg-white dark:bg-[#121820]`.
    *   Texto: `text-gray-700 dark:text-white`.
    *   Borda: `border-gray-200 dark:border-white/10`.
    *   Sombra: Reforçada para destacar sobre o conteúdo.
