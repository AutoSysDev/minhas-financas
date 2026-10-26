# Plano de Integração de Inteligência Artificial - Monely Finance

Este documento detalha as oportunidades de implementação de recursos de IA utilizando a API da OpenAI para transformar o Monely Finance em um assistente financeiro inteligente.

## 1. Categorização e Limpeza Automática de Transações (Prioridade Alta)
Automatiza o preenchimento de detalhes da transação a partir de uma descrição simples.

*   **Problema:** O usuário precisa digitar descrições completas e selecionar categorias manualmente para cada gasto.
*   **Solução:**
    *   **Input:** Descrição "suja" (ex: "UBER *TRIP 123 SAO PAULO").
    *   **Processamento IA:** Analisa o texto e o contexto.
    *   **Output:**
        *   **Nome Limpo:** "Uber"
        *   **Categoria:** "Transporte" (selecionada da lista de categorias do usuário)
        *   **Tags:** ["viagem", "app"]
*   **Implementação:** Botão "Mágica" no formulário de transação ou processamento no `onBlur` do campo de descrição.

## 2. Digitalização de Recibos e Faturas (OCR Inteligente)
Permite a entrada de dados através de fotos de cupons fiscais.

*   **Problema:** Digitar item por item de uma compra de supermercado é trabalhoso.
*   **Solução:**
    *   **Input:** Foto do cupom fiscal (GPT-4 Vision).
    *   **Processamento IA:** Extrai texto da imagem e estrutura os dados.
    *   **Output:** Lista de itens JSON pronta para o módulo de Supermercado ou criação de múltiplas transações.

## 3. "CFO" Pessoal e Insights Financeiros
Fornece análise qualitativa sobre os dados financeiros, indo além dos gráficos.

*   **Problema:** Gráficos mostram "o que" aconteceu, mas não "por que" ou "o que fazer".
*   **Solução:**
    *   **Input:** Resumo JSON das transações do mês e metas.
    *   **Processamento IA:** Análise de padrões de gastos e anomalias.
    *   **Output:** Texto natural com conselhos (ex: "Você gastou 20% a mais em Restaurantes este mês. Se reduzir 2 jantares, baterá sua meta.").

## 4. Chatbot de Consulta Natural (Natural Language to Query)
Permite consultas complexas sem necessidade de filtros de UI complicados.

*   **Problema:** Encontrar informações específicas requer navegar por vários filtros e telas.
*   **Solução:**
    *   **Input:** Pergunta em linguagem natural (ex: "Quanto gastei com iFood em 2023?").
    *   **Processamento IA:** Traduz a pergunta para filtros de banco de dados ou operações em arrays.
    *   **Output:** Valor exato ou lista de transações filtrada.

---

## Roadmap de Implementação

### Fase 1: Categorização (Atual)
- [ ] Criação do `OpenAIService`.
- [ ] Integração no formulário de Nova Transação (`FABContainer`).

### Fase 2: Insights
- [ ] Componente de "Dica do Dia" no Dashboard.
- [ ] Geração de resumo mensal.

### Fase 3: Visão Computacional
- [ ] Upload de imagens no módulo de Transações.
