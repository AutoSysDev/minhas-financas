-- Habilitar a extensão pg_cron se ainda não estiver habilitada
create extension if not exists pg_cron;

-- Agendar a execução da função notifications-scheduler para rodar todos os dias às 09:00 AM UTC
-- Nota: A função deve ser invocada via requisição HTTP para a Edge Function.
-- Como o pg_cron roda dentro do banco, usamos pg_net ou chamamos uma function interna se fosse PL/pgSQL.
-- Para Edge Functions, o método recomendado no Supabase é usar o agendamento via UI ou HTTP request via pg_net.

-- Opção 1: Usando pg_net (Recomendado se a extensão estiver disponível)
create extension if not exists pg_net;

select
  cron.schedule(
    'send-daily-notifications',
    '0 9 * * *', -- Todos os dias as 9:00 UTC
    $$
    select
      net.http_post(
          url:='https://oxlxjakwoekbiownvmhv.supabase.co/functions/v1/notifications-scheduler',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bHhqYWt3b2VrYmlvd252bWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5NzU2OSwiZXhwIjoyMDc5MTczNTY5fQ.s4_-xdYQ9UnEqj4W1qs6FgBaxBY-sFvvQMPwclmMcAI"}'::jsonb,
          body:='{}'::jsonb
      ) as request_id;
    $$
  );

-- Opção 2 (Mais comum para Edge Functions gerenciadas pelo Supabase):
-- O Supabase não recomenda usar pg_cron para chamar Edge Functions diretamente se você não tiver pg_net configurado.
-- A maneira "Serverless" pura seria usar um serviço externo (como GitHub Actions ou o próprio agendador do Supabase se disponível em Beta).
-- Mas vou deixar o SQL acima como referência para o usuário rodar no SQL Editor caso tenha pg_net.

-- Alternativa segura: Criar apenas uma nota para o usuário configurar no Dashboard.
