## Diagnóstico Inicial
- Conexão: cliente Supabase inicializado em `services/supabase.ts:3-9` via `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Health‑check atual: `pages/Login.tsx:22-41` mede sessão e um `select` simples; não mede latência.
- Resumo: dados vêm de `context/FinanceContext.tsx:59-165` com `select('*')` em várias tabelas sem filtro por usuário.
- Cálculos: `pages/Dashboard.tsx:49-168` usam helpers em `utils/helpers.ts` que esperam `Transaction.type` como `'INCOME'/'EXPENSE'`.
- Logout: ações em `components/Layout.tsx:93-96` e `pages/Settings.tsx:713-729`; implementação base em `context/AuthContext.tsx:78-86`.

## Problemas Identificados
- Credenciais/Disponibilidade: dependência de `VITE_*` sem visibilidade de latência; falhas aparecem como "parcial" na tela de login.
- Queries da tela de Resumo: sem `eq('user_id', user.id)`; podem retornar vazio sob RLS ou carregar dados de outros usuários se políticas permitirem leitura ampla.
- Tipagem de transações: se registros antigos estiverem em minúsculas (`income/expense`), os cálculos retornam zero.
- Logout inconsistente: uso de `window.location.href` em `Settings` com `HashRouter`; contexto financeiro não é limpo explicitamente após `signOut`.

## Correções Propostas
### Conexão e Latência
- Adicionar `checkDbHealth()` em `services/supabase.ts` que:
  - Verifica presença de `SUPABASE_URL`/`ANON_KEY` e cliente criado.
  - Executa `select` leve em `profiles` para medir latência (`performance.now()`), retornando `{status, latencyMs, error}`.
- Reutilizar `checkDbHealth()` em `pages/Login.tsx` para exibir latência e motivo de falha (no‑env/fail/partial).

### Tela de Resumo (queries e mapeamento)
- Em `context/FinanceContext.tsx`:
  - Aplicar filtros por usuário: `.eq('user_id', user.id)` em `accounts`, `transactions`, `cards`, `budgets`, `goals`, `investments`, `categories`.
  - Ordenar listas quando útil (`transactions.date`, `cards.name`) para previsibilidade.
  - Mapear `Transaction.type` para enum: `String(t.type).toUpperCase()` antes de atribuir, garantindo compatibilidade com `utils/helpers.ts`.
  - Robustez: tratar erros por coleção, preenchendo com `[]` e registrando via `logError('fetchData', error)`; manter `loading` consistente.

### Fluxo de Logout
- Unificar navegação usando `navigate('/login')` (evitar `window.location.href`) em `pages/Settings.tsx:713-719`.
- Limpar estado financeiro após `signOut`:
  - Em `components/Layout.tsx`, além de `signOut()`, chamar `useFinance().resetData()` antes do `navigate('/login')`.
  - Replicar limpeza no botão de segurança em `Settings`.
- Pós‑signout defensivo: após `supabase.auth.signOut()`, validar com `supabase.auth.getSession()`; se sessão persistir, exibir toast e tentar novamente.

### Tratamento de Erros
- Padronizar logs com `logError(context, err)` em `FinanceContext.fetchData`, `recalculateBalances`, e nos pontos de logout.
- Feedback ao usuário com `toast.error(...)` em falhas de carregamento ou encerramento de sessão.

## Verificação/Tests
- Conexão: na tela de Login, verificar `status=ok` e `latencyMs` razoável (<300ms). Simular ausência de ENV para `no-env`.
- Resumo: criar 2 transações (INCOME/EXPENSE, pagas) e confirmar:
  - `Saldo Atual` e gráficos refletem valores; `transactions` filtradas pelo usuário.
  - Dados vazios exibem mensagem "Sem transações" em `Dashboard`.
- Logout: acionar em Sidebar e em Configurações; confirmar:
  - `useAuth().user` torna‑se `null` e rota redireciona para `#/login`.
  - Estado financeiro é resetado (`accounts/transactions` vazios) ao reentrar.

## Arquivos a Alterar
- `services/supabase.ts` (novo helper saúde/latência).
- `pages/Login.tsx` (usar helper e mostrar latência/motivo).
- `context/FinanceContext.tsx` (filtros `user_id`, mapeamento `type` e tratamento por coleção).
- `components/Layout.tsx` (reset de dados no logout).
- `pages/Settings.tsx` (navegação consistente e reset após logout).

## Resultado Esperado
- Conexão validada com latência visível e melhor diagnóstico.
- Resumo carregando corretamente, apenas com dados do usuário e cálculos alinhados.
- Logout funcional em todos os pontos, tokens invalidados, estado limpo e redirecionamento confiável.

Confirma estas alterações para eu implementar e testar em desenvolvimento?