-- 1. Remover a restrição antiga (caso exista e esteja bloqueando ou sem cascade)
ALTER TABLE public.goal_transactions
DROP CONSTRAINT IF EXISTS goal_transactions_goal_id_fkey;

-- 2. Adicionar a restrição correta com ON DELETE CASCADE
-- Isso garante que quando uma meta for excluída, todas as suas transações sumam junto automaticamente.
ALTER TABLE public.goal_transactions
ADD CONSTRAINT goal_transactions_goal_id_fkey
FOREIGN KEY (goal_id)
REFERENCES public.goals(id)
ON DELETE CASCADE;

-- 3. Habilitar RLS (Segurança) na tabela, caso ainda não esteja
ALTER TABLE public.goal_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de acesso (caso não existam) para permitir que o usuário gerencie as transações
-- Política para VER transações (SELECT)
CREATE POLICY "Users can view transactions of their own goals"
ON public.goal_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.goals
    WHERE goals.id = goal_transactions.goal_id
    AND goals.user_id = auth.uid()
  )
);

-- Política para CRIAR transações (INSERT)
CREATE POLICY "Users can insert transactions to their own goals"
ON public.goal_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.goals
    WHERE goals.id = goal_transactions.goal_id
    AND goals.user_id = auth.uid()
  )
);

-- Política para EXCLUIR transações (DELETE)
-- Importante para permitir a limpeza manual se necessário
CREATE POLICY "Users can delete transactions of their own goals"
ON public.goal_transactions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.goals
    WHERE goals.id = goal_transactions.goal_id
    AND goals.user_id = auth.uid()
  )
);
