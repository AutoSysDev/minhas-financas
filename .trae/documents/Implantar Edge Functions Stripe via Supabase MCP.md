## Objetivo
Implantar e configurar as Edge Functions de assinatura (Stripe) diretamente no Supabase via MCP, criar as tabelas necessárias (subscriptions, profiles, app_settings), e validar que as chamadas do app funcionam sem alterar arquivos locais.

## Passos de Integração (MCP)
### Descoberta do Projeto
- Listar organizações e projetos para identificar o projeto “Minhas Finanças”.
- Obter detalhes do projeto alvo (URL, status) para uso nas próximas operações.

### Banco de Dados
- Aplicar migração via MCP (DDL) para:
  - Criar `subscriptions` com índices e RLS.
  - Criar `profiles` com RLS.
  - Criar `app_settings` para guardar IDs de Product/Prices e valores.

### Funções (Edge Functions)
- Deploy via MCP das funções:
  - `create-checkout-session`: cria sessão de checkout usando Stripe, CORS habilitado.
  - `create-portal-session`: abre Customer Portal, CORS habilitado.
  - `get-stripe-prices`: retorna preços/IDs de app_settings/env, CORS habilitado.
  - `setup-stripe-plans`: cria Product "Monely Premium" e Prices mensal/anual, salva em `app_settings`.
  - `webhook-stripe`: atualiza `subscriptions`/`profiles` conforme eventos do Stripe.
- Todas as funções serão enviadas ao Supabase via MCP, sem modificar arquivos locais.

### Validação
- Listar Edge Functions para confirmar publicação.
- Verificar tabelas e RLS com consultas rápidas.
- Conferir logs das funções após uma chamada de teste, garantindo ausência de `net::ERR_FAILED`.

### Observações de Segurança
- As chaves/segredos do Stripe devem estar configuradas no ambiente do projeto no Supabase (MCP não altera segredos). Validaremos via execução e logs.
- Políticas RLS limitam acesso a dados do próprio usuário.

## Resultado Esperado
- Edge Functions implantadas e acessíveis em `functions/v1/*`.
- Tabelas criadas e funcionando com RLS.
- App consegue abrir o Stripe Checkout/Portal e refletir status Premium sem erro de rede.

## Próximo
Após sua confirmação, executarei os passos acima com MCP (list/DDL/deploy/list/logs), sem tocar em `index.ts` local.