-- Tabela para armazenar tokens de notificação Push (FCM)
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('android', 'ios', 'web')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, token)
);

-- Habilitar RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Users can view their own push tokens"
ON public.user_push_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push tokens"
ON public.user_push_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push tokens"
ON public.user_push_tokens FOR DELETE
USING (auth.uid() = user_id);
