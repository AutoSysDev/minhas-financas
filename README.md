# Monely Finance

Monely Finance é uma aplicação completa de gestão financeira pessoal desenvolvida para ajudar usuários a controlar suas finanças, rastrear despesas, definir orçamentos e alcançar metas financeiras. O sistema suporta contas compartilhadas, gestão de cartões de crédito, investimentos e listas de compras.

## 🚀 Funcionalidades Principais

*   **Dashboard Interativo**: Visão geral de saldo, despesas e receitas.
*   **Gestão de Transações**: Adição, edição e categorização de receitas e despesas.
*   **Contas e Cartões**: Gerenciamento de múltiplas contas bancárias e cartões de crédito.
*   **Orçamentos e Metas**: Definição de limites de gastos e objetivos de economia.
*   **Investimentos**: Acompanhamento de portfólio de investimentos.
*   **Contas Compartilhadas**: Funcionalidade para casais ou grupos gerenciarem finanças em conjunto.
*   **Lista de Compras (Supermercado)**: Criação e gestão de listas de compras com preços e totais.
*   **Relatórios e Estatísticas**: Gráficos detalhados para análise financeira.
*   **Planos Premium**: Integração com Stripe para assinaturas e funcionalidades exclusivas.
*   **Notificações**: Sistema de alertas e lembretes.
*   **Mobile App**: Suporte para Android via Capacitor.

## 🛠 Tech Stack

**Frontend:**
*   **React** (v18)
*   **Vite** (Build tool)
*   **TypeScript**
*   **Tailwind CSS** (Estilização)
*   **Recharts** (Gráficos)
*   **React Router DOM** (Roteamento)
*   **Lucide React** (Ícones)
*   **TanStack Query** (Gerenciamento de Estado Server-Side)

**Backend & Infraestrutura:**
*   **Supabase**:
    *   Authentication (Login, Cadastro)
    *   Database (PostgreSQL)
    *   Edge Functions (Lógica serverless, integração com Stripe)
    *   Storage (Upload de arquivos)
*   **Vercel**: Deploy do Frontend.

**Mobile:**
*   **Capacitor**: Bridge para desenvolvimento mobile híbrido (Android).

## 📂 Estrutura do Projeto

```
c:\monelyfinance\
├── assets/              # Imagens e recursos estáticos (logos bancos, etc.)
├── components/          # Componentes React reutilizáveis
│   ├── SharedAccount/   # Componentes específicos de contas compartilhadas
│   ├── Supermarket/     # Componentes de lista de compras
│   └── ...              # Componentes genéricos (Layout, Modal, Charts, etc.)
├── context/             # React Contexts (Auth, Finance, UI, etc.)
├── pages/               # Páginas da aplicação (Dashboard, Transactions, Settings, etc.)
├── services/            # Camada de serviços (Supabase, Storage, Notification)
├── supabase/            # Configurações do Supabase
│   ├── functions/       # Edge Functions (Stripe, Convites, etc.)
│   └── migrations/      # Scripts SQL de migração do banco de dados
├── hooks/               # Custom React Hooks
├── types/               # Definições de tipos TypeScript
└── ...
```

## ⚙️ Instalação e Configuração

### Pré-requisitos
*   Node.js (v18 ou superior)
*   NPM
*   Conta no Supabase
*   Conta no Stripe (para pagamentos)

### Passo a Passo

1.  **Clone o repositório** (se aplicável) ou navegue até a pasta do projeto.

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente (Frontend):**
    Crie um arquivo `.env` ou `.env.local` na raiz do projeto com as credenciais do seu projeto Supabase:
    ```env
    VITE_SUPABASE_URL=sua_url_do_supabase
    VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
    ```

4.  **Execute o projeto localmente:**
    ```bash
    npm run dev
    ```
    O servidor iniciará (geralmente em `http://localhost:5173`).

## 🗄️ Banco de Dados (Supabase)

O projeto utiliza o PostgreSQL hospedado no Supabase. As tabelas principais incluem:
*   `profiles`: Dados dos usuários.
*   `transactions`: Receitas e despesas.
*   `accounts`: Contas bancárias.
*   `credit_cards`: Cartões de crédito.
*   `goals`: Metas financeiras.
*   `budgets`: Orçamentos.
*   `shared_accounts`: Configurações de compartilhamento.
*   `shopping_lists` / `shopping_items`: Funcionalidades de supermercado.

As migrações SQL podem ser encontradas em `supabase/migrations/`.

## 💳 Configuração do Stripe (Pagamentos)

O sistema de assinaturas utiliza Supabase Edge Functions. Para configurar:

1.  **Obtenha as chaves do Stripe (Modo Teste ou Produção):**
    *   `Publishable Key` (`pk_test_...`)
    *   `Secret Key` (`sk_test_...`)
    *   `Webhook Signing Secret` (`whsec_...`) - Obtido após configurar o endpoint de webhook no painel do Stripe.

2.  **Configure os Segredos no Supabase:**
    Adicione as seguintes chaves ao Vault do seu projeto Supabase:
    *   `STRIPE_SECRET_KEY`: Sua chave secreta `sk_test_...`
    *   `STRIPE_PUBLISHABLE_KEY`: Sua chave pública `pk_test_...`
    *   `STRIPE_WEBHOOK_SIGNING_SECRET`: Segredo do webhook `whsec_...`
    *   `APP_URL`: URL da aplicação (ex: `http://localhost:5173` ou URL de produção).
    *   `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (Geralmente já configurados automaticamente nas Edge Functions).

3.  **Deploy das Edge Functions:**
    ```bash
    npx supabase functions deploy create-checkout-session
    npx supabase functions deploy create-portal-session
    npx supabase functions deploy setup-stripe-plans
    npx supabase functions deploy webhook-stripe
    npx supabase functions deploy get-stripe-prices
    ```

4.  **Configuração Inicial dos Planos:**
    Execute a função `setup-stripe-plans` uma única vez para criar o Produto e os Preços no Stripe:
    ```bash
    curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/setup-stripe-plans \
      -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
      -H "Content-Type: application/json" \
      -d '{}'
    ```
    *Isso criará o plano mensal (R$ 15,99) e anual automaticamente.*

5.  **Configuração de Webhook no Stripe:**
    Adicione um endpoint apontando para: `https://<PROJECT_REF>.supabase.co/functions/v1/webhook-stripe`.
    Eventos necessários:
    *   `checkout.session.completed`
    *   `customer.subscription.updated`
    *   `invoice.payment_succeeded`

## 📱 Build Mobile (Android)

Para gerar a versão Android utilizando Capacitor:

1.  **Build do projeto web:**
    ```bash
    npm run build
    ```

2.  **Sincronizar com a pasta nativa:**
    ```bash
    npx cap sync android
    ```

3.  **Abrir no Android Studio:**
    ```bash
    npx cap open android
    ```

## 🧪 Testes

O projeto utiliza Vitest para testes unitários.
```bash
npm run test
```
