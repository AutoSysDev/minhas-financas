# Plano de Melhoria: Lógica do Patrimônio Total

Este documento detalha o plano para ajustar a lógica do card "Patrimônio Total" no Dashboard, conforme solicitado. O objetivo é tornar o valor dinâmico em relação ao mês selecionado e preparar o sistema para a futura integração com a seção de Investimentos.

## 1. Análise da Situação Atual

*   **Cálculo Atual:** O sistema soma o saldo atual (`balance`) de todas as contas cadastradas na tabela `accounts`.
    *   `const totalPatrimony = accounts.reduce((acc, curr) => acc + curr.balance, 0);`
*   **Comportamento:** O valor é estático. Ele mostra o saldo de "hoje", independentemente do mês que o usuário está visualizando no navegador de datas.
*   **Limitação:** Não permite ver a evolução histórica do patrimônio e não considera investimentos externos às contas bancárias.

## 2. Objetivo

Alterar a lógica para que o "Patrimônio Total" represente:
1.  **O Saldo do Mês Atual:** O saldo acumulado de todas as contas até o final do mês selecionado pelo usuário.
2.  **Investimentos:** A soma dos valores investidos (funcionalidade futura).

## 3. Lógica Proposta

A nova fórmula será:

$$
\text{Patrimônio Total} = \text{Saldo Acumulado das Contas (até o mês)} + \text{Saldo de Investimentos}
$$

### Detalhamento Técnico

#### A. Saldo das Contas (Dinâmico)
Em vez de usar `account.balance` diretamente, utilizaremos a função auxiliar já existente `getTotalMonthlyBalance`.

*   **Função:** `getTotalMonthlyBalance(transactions, accounts, selectedYear, selectedMonth)`
*   **Como funciona:** Ela percorre todas as transações de todas as contas desde o início até o último dia do mês selecionado.
*   **Resultado:** O usuário verá quanto dinheiro tinha disponível no final daquele mês específico.

#### B. Investimentos (Preparação para Futuro)
Como a seção de investimentos ainda será implementada, criaremos uma estrutura para facilitar essa integração.

*   **Ação Imediata:** Definir uma variável ou função placeholder que, por enquanto, retorna `0` (ou soma contas do tipo 'investment' se já existirem e forem migradas).
*   **Futuro:** Quando a tabela `investments` for criada, criaremos uma função `getTotalInvestments(year, month)` que buscará o saldo histórico dos ativos.

## 4. Plano de Execução (Passo a Passo)

Não faremos alterações no código agora, mas este é o roteiro para quando for autorizado:

1.  **No arquivo `Dashboard.tsx`:**
    *   Localizar a constante `totalPatrimony`.
    *   Alterar sua definição para usar `monthlyBalanceDisplay` (que já calcula o saldo do mês selecionado) como base.
    *   Adicionar uma variável `totalInvestments` (inicialmente `0`).
    *   Somar os dois valores.

    ```typescript
    // Exemplo da nova lógica (Conceitual)
    const accountBalanceAtMonth = getTotalMonthlyBalance(transactions, accounts, selectedYear, selectedMonth);
    const investmentsBalance = 0; // Futuramente virá de um hook useInvestments()
    
    const totalPatrimony = accountBalanceAtMonth + investmentsBalance;
    ```

2.  **Interface do Usuário:**
    *   Atualizar o subtítulo do card de "Soma de todas as contas" para **"Saldo + Investimentos"** para refletir a nova composição do valor.

3.  **Verificação:**
    *   Navegar para meses anteriores e verificar se o "Patrimônio Total" muda de acordo com as transações daquele período.

## 5. Considerações

*   **Contas de Investimento Atuais:** Se o usuário já usa contas do tipo "Investimento" na aba de Contas, elas já serão somadas automaticamente na parte de "Saldo das Contas". Quando a nova seção de Investimentos for criada, precisaremos decidir se migramos essas contas ou se mantemos separadas.
