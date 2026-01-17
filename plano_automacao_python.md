# Plano de Automação com Python para Monely Finance

Este documento detalha oportunidades de automação utilizando Python para enriquecer o ecossistema do **Monely Finance**. O Python, com sua vasta gama de bibliotecas para dados, finanças e IA, pode atuar como um "motor de inteligência" para o aplicativo.

## 1. Sincronização de Investimentos (Real-time)
Atualmente, o módulo de investimentos (previsto em `types.ts` e `plano_patrimonio.md`) parece depender de atualização manual.
*   **A Automação:** Script para atualizar cotações de Ações, FIIs e Criptomoedas automaticamente.
*   **Bibliotecas:** `yfinance` (Yahoo Finance), `requests` (para APIs como HG Brasil ou CoinGecko).
*   **Funcionalidade:**
    1.  Ler a carteira de investimentos do Supabase.
    2.  Buscar preço atual de cada ticker (ex: `PETR4.SA`, `HGLG11.SA`, `BTC-USD`).
    3.  Atualizar o campo `currentAmount` ou criar um histórico de valorização.
*   **Valor para o usuário:** Patrimônio sempre atualizado sem esforço manual.

## 2. Importação Bancária Inteligente (OFX/PDF)
A entrada manual de transações é a maior barreira de uso.
*   **A Automação:** Script para processar extratos bancários exportados (OFX) ou PDFs simples.
*   **Bibliotecas:** `ofxparse` (padrão OFX), `pdfplumber` ou `tabula-py` (leitura de tabelas em PDF), `pandas`.
*   **Funcionalidade:**
    1.  Usuário faz upload do extrato (via interface ou pasta monitorada).
    2.  Script lê o arquivo, identifica data, descrição e valor.
    3.  **Auto-Categorização:** Usa palavras-chave ("Uber" -> Transportes, "Spotify" -> Assinaturas) para preencher a categoria.
    4.  Insere na tabela `transactions` do Supabase evitando duplicatas.

## 3. Relatórios Mensais Avançados (PDF)
O Dashboard oferece "insights" rápidos, mas um relatório consolidado é útil para arquivamento e análise profunda.
*   **A Automação:** Geração de PDF elegante com gráficos de evolução patrimonial e gastos.
*   **Bibliotecas:** `matplotlib` ou `seaborn` (gráficos), `reportlab` ou `fpdf` (geração de PDF).
*   **Funcionalidade:**
    1.  No dia 1 de cada mês, o script roda.
    2.  Busca dados do mês anterior.
    3.  Gera gráficos: "Pizza de Gastos por Categoria", "Linha do Tempo de Receitas vs Despesas".
    4.  Salva o PDF no Supabase Storage e/ou envia por email.

## 4. Previsão de Gastos (Forecasting Simples)
Ajudar o usuário a saber se o dinheiro vai dar até o fim do mês baseando-se no histórico.
*   **A Automação:** Previsão de fluxo de caixa.
*   **Bibliotecas:** `scikit-learn` (Regressão Linear simples) ou `prophet`.
*   **Funcionalidade:**
    1.  Analisa os últimos 6 meses de gastos.
    2.  Identifica padrões (contas fixas vs variáveis).
    3.  Estima quanto será gasto nas categorias variáveis (mercado, lazer) para o mês corrente.
    4.  Alerta se a previsão ultrapassar o orçamento definido.

## Arquitetura Sugerida

Como o Python não roda nativamente no Supabase Edge Functions (que usa Deno/JS), sugerimos duas abordagens:

1.  **Scripts Locais (Admin Tools):** Você roda na sua máquina (`python sync_investments.py`) quando quiser atualizar ou importar dados. É simples, custo zero e seguro.
2.  **Micro-serviço (Cloud):** Um pequeno container (Docker) ou função Lambda/Cloud Run que executa esses scripts agendados (CRON) ou acionados via Webhook do Supabase.

---
**Próximos Passos:**
Escolha qual dessas automações traz mais valor imediato para implementarmos primeiro. A **Sincronização de Investimentos** e a **Importação de OFX** costumam ser as mais impactantes.
