# Plano de Integração Stripe via Supabase Edge Functions

Este plano detalha as etapas para ativar e configurar o sistema de assinaturas solicitado, aproveitando a infraestrutura de Edge Functions já existente no projeto e ajustando os valores conforme seus requisitos.

## 1. Configuração do Ambiente e Credenciais

Como as ferramentas MCP locais não estão autenticadas, usaremos as Edge Functions do Supabase para gerenciar a integração, o que é mais seguro e robusto para produção.

*   [ ] **Obter Credenciais do Stripe**:
    *   Acesse o Dashboard do Stripe (modo Teste).
    *   Obtenha: `Publishable Key` e `Secret Key`.
*   [ ] **Configurar Segredos no Supabase**:
    *   Adicionar as seguintes chaves ao Vault do Supabase (via Dashboard ou CLI):
        *   `STRIPE_SECRET_KEY`: Sua chave secreta `sk_test_...`.
        *   `STRIPE_PUBLISHABLE_KEY`: Sua chave pública `pk_test_...`.
        *   `APP_URL`: URL da sua aplicação (ex: `http://localhost:5173` para dev ou sua URL Vercel).

## 2. Ajuste e Criação dos Planos (Backend)

O código atual define o preço mensal como R$ 14,99. Precisamos ajustar para **R$ 15,99** conforme solicitado.

*   [ ] **Atualizar `setup-stripe-plans/index.ts`**:
    *   Alterar valor padrão de `amountMonthly` de `1499` para `1599`.
    *   Manter a lógica que salva os IDs dos preços na tabela `app_settings`.
*   [ ] **Executar Setup Inicial**:
    *   Rodar a função `setup-stripe-plans` uma única vez (via cURL ou Postman) para criar o Produto "Monely Premium" e o Preço (R$ 15,99) no seu painel Stripe automaticamente.
    *   *Nota*: Isso garante que o ID do preço esteja sincronizado entre Stripe e seu Banco de Dados.

## 3. Implementação do Fluxo de Assinatura (Frontend)

O backend já suporta nativamente o período de teste de 3 dias (`trial_period_days: 3` já está implementado em `create-checkout-session`).

*   [ ] **Atualizar Componente de Planos (`PremiumPlans.tsx` ou similar)**:
    *   Conectar o botão "Assinar Agora" à função `create-checkout-session`.
    *   Passar o parâmetro `plan: 'monthly'` no corpo da requisição.
*   [ ] **Página de Retorno**:
    *   O código atual redireciona para `/#/settings?subscribe=success`.
    *   Criar/Ajustar um modal ou toast de sucesso nessa página para confirmar a assinatura ao usuário.

## 4. Webhooks e Gerenciamento de Status

Para que o sistema saiba que o pagamento foi confirmado:

*   [ ] **Configurar Endpoint no Stripe**:
    *   No Dashboard do Stripe > Developers > Webhooks, adicionar um endpoint apontando para: `https://<seu-projeto>.supabase.co/functions/v1/webhook-stripe`.
    *   Selecionar eventos: `checkout.session.completed`, `customer.subscription.updated`, `invoice.payment_succeeded`.
*   [ ] **Obter `STRIPE_WEBHOOK_SIGNING_SECRET`**:
    *   Copiar o segredo de assinatura (`whsec_...`) gerado pelo Stripe.
    *   Adicionar esse segredo às variáveis de ambiente do Supabase.

## 5. Testes e Validação

*   [ ] **Cenário de Sucesso**: Usar cartão `4242 4242 4242 4242` para assinar. Verificar se o status no banco muda para `premium`.
*   [ ] **Cenário de Trial**: Verificar se a cobrança é agendada para 3 dias depois.
*   [ ] **Cenário de Falha**: Usar cartões de teste de erro do Stripe (ex: cartão genérico de recusa).

## 6. Documentação Técnica

*   [ ] **Atualizar README**: Incluir seção "Configuração de Pagamentos" com os comandos para deploy das functions e lista de variáveis de ambiente necessárias.

---

**Deseja prosseguir com a implementação deste plano, começando pelo ajuste do preço para R$ 15,99 e deploy das funções?**
