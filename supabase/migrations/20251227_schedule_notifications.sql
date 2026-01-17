-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule Morning Notification at 8:00 AM
SELECT cron.schedule(
    'notify-morning',
    '0 8 * * *', -- Cron syntax for 08:00 every day
    $$
    SELECT
    net.http_post(
        url:='https://oxlxjakwoekbiownvmhv.supabase.co/functions/v1/notifications-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bHhqYWt3b2VrYmlvd252bWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5NzU2OSwiZXhwIjoyMDc5MTczNTY5fQ.s4_-xdYQ9UnEqj4W1qs6FgBaxBY-sFvvQMPwclmMcAI"}'
    ) AS request_id;
    $$
);

-- Schedule Evening Notification at 18:00 (6:00 PM)
SELECT cron.schedule(
    'notify-evening',
    '0 18 * * *', -- Cron syntax for 18:00 every day
    $$
    SELECT
    net.http_post(
        url:='https://oxlxjakwoekbiownvmhv.supabase.co/functions/v1/notifications-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bHhqYWt3b2VrYmlvd252bWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU5NzU2OSwiZXhwIjoyMDc5MTczNTY5fQ.s4_-xdYQ9UnEqj4W1qs6FgBaxBY-sFvvQMPwclmMcAI"}'
    ) AS request_id;
    $$
);
