# Atualização Crucial do Banco de Dados

Para que as cotações apareçam corretamente e o cálculo seja feito, precisamos adicionar os campos de `quantidade` e `preço atual`.

## Passo 1 (Manual)
1.  Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/oxlxjakwoekbiownvmhv/sql/new).
2.  Copie TODO o código SQL abaixo:

```sql
-- Adicionar campos de Quantidade e Preço Atual
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS ticker TEXT,
ADD COLUMN IF NOT EXISTS quantity NUMERIC(15, 8) DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_price NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;

-- Recriar índice
CREATE INDEX IF NOT EXISTS idx_investments_ticker ON public.investments(ticker);

-- Garantir permissões
GRANT ALL ON public.investments TO postgres;
GRANT ALL ON public.investments TO service_role;
```
3.  Cole e clique em **RUN**.

## Passo 2 (Como usar)
1.  No site, edite seu investimento.
2.  Agora aparecerá um campo **Quantidade**. Preencha-o (Ex: 100 cotas).
3.  Preencha o **Ticker** (Ex: MXRF11).
4.  O sistema atualizará o valor total (`Amount`) automaticamente baseado em `Quantidade` * `Cotação` quando o script rodar.

Dica: Você pode forçar a atualização agora rodando no terminal:
```powershell
python c:\monelyfinance\python\sync_investments.py
```
