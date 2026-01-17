# Melhorias Visuais do Light Mode - Plano Abrangente

Este plano visa corrigir problemas de legibilidade no Light Mode, onde textos brancos desaparecem e o contraste é insuficiente. As alterações focarão em substituir cores fixas (`text-white`, `bg-white/[0.05]`) por classes dinâmicas que suportam temas claro e escuro.

## Arquivos Alvo

### 1. Componentes Globais (Alta Prioridade)
Estes componentes afetam toda a aplicação.
*   **`components/Modal.tsx`**:
    *   Alterar fundo do modal para `bg-white` no light mode.
    *   Corrigir títulos e botões de fechar para serem escuros.
    *   Ajustar bordas para cinza claro (`border-gray-200`).
*   **`components/Dropdown.tsx`**:
    *   Ajustar fundo do menu e do botão gatilho para branco/cinza claro.
    *   Tornar textos das opções legíveis (`text-gray-700`).
    *   Melhorar contraste das bordas e sombras.

### 2. Páginas Principais
*   **`pages/Cards.tsx`**:
    *   Corrigir título H1 "Meus Cartões".
    *   Ajustar formulários de "Novo Cartão" e "Editar Cartão" (inputs invisíveis no branco).
    *   Manter identidade visual dos cartões (dark), mas ajustar o container da página.
*   **`pages/Budgets.tsx`**:
    *   Corrigir título H1 e textos de resumo.
    *   Alterar cards de orçamento para fundo branco com sombra suave.
    *   Ajustar inputs do modal de novo orçamento.
*   **`pages/Settings.tsx`**:
    *   Corrigir título H1 e navegação lateral (tabs).
    *   Refazer inputs de formulário (Perfil, Categorias) para terem fundo e borda visíveis no light mode.
    *   Ajustar listas de itens (Categorias, Membros) para contraste adequado.

## Estratégia de Implementação
1.  **Modais e Dropdowns**: Correção imediata para que qualquer interação no sistema seja legível.
2.  **Páginas (Cards, Budgets, Settings)**: Aplicação sistemática de `text-gray-900`, `bg-white`, e `border-gray-200` para o light mode, mantendo as classes atuais com o prefixo `dark:`.

Isso resolverá a questão das "palavras em branco" e dará uma aparência profissional e polida ao Light Mode.
