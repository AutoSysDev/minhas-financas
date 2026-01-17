## Verificação Inicial

* Conferir carregamento de estáticos no DevTools (Network): `index.html`, `/index.tsx`, `/index.css`, chunks do Vite.

* Confirmar porta/URL de servidor: Vite configura `server.port=3000` (vite.config.ts:1–24) e preview em 4173; ajustar uso para evitar abrir em 3001.

* Checar Console por erros de inicialização (especialmente relacionados a Supabase).

## Diagnóstico Estrutural

* Estrutura de montagem:

  * `index.html` possui `<div id="root"></div>` e carrega `/index.tsx` (index.html:77–83).

  * `index.tsx` cria o root e renderiza `<App />` (index.tsx:1–15).

* Identificar ponto de falha: `services/supabase.ts` lança erro se envs faltam (services/supabase.ts:11–14), abortando renderização global.

* Verificar `AuthContext` e outros Contexts que dependem do `supabase` logo no mount (context/AuthContext.tsx:19–35).

## Testes de Visualização

* Responsividade: checar páginas `Dashboard`, `Transactions`, `Settings` em breakpoints (sm/md/lg) e browsers principais.

* Elementos e CSS: confirmar classes Tailwind estão aplicadas (`index.html` injeta Tailwind CDN), verificar fontes/ícones.

## Implementação de Correções (propostas)

1. Robustez de Supabase:

* `services/supabase.ts`:

  * Remover `throw` em caso de envs ausentes; substituir por `console.warn`.

  * Exportar `supabase` somente quando variáveis existirem; caso contrário, exportar um stub leve ou `null`.

* Ajustes nos Contexts (`AuthContext`, `FinanceContext`, `NotificationContext`):

  * Antes de chamar `supabase.*`, validar que o cliente está disponível; se não, exibir estado offline (mensagem/placeholder) e evitar efeitos.

1. Error Boundary:

* Criar componente `ErrorBoundary` (baseado em recomendação oficial do React) e envolver `<App />` em `index.tsx` para capturar erros de renderização e mostrar fallback amigável.

1. Alinhamento de Porta/Preview:

* Padronizar execução:

  * `npm run dev` em 3000 (vite.config.ts)

  * `npm run preview` em 4173 (Vite padrão)

* Evitar abrir em 3001 para não exibir página em branco.

1. CSS/Fonts/Ícones:

* Confirmar que `/index.css` existe e está sendo servido; ajustar import se necessário.

* Checar Tailwind CDN e pré‑connects; manter darkMode/classe coerente no body.

## Validação Final

* Testes de regressão visual (sm/md/lg), verificar componentes principais.

* Navegação completa (HashRouter, rotas protegidas) e fluxo de login.

* Confirmar ausência de erros no Console e recursos carregados (Network).

* Documentar alterações realizadas: arquivos, razões, resultados e como configurar envs (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

