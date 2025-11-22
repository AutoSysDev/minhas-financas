-- Tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Tabela de configurações de notificações
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bill_reminder_enabled BOOLEAN DEFAULT TRUE,
  bill_reminder_days INTEGER DEFAULT 2,
  budget_alert_enabled BOOLEAN DEFAULT TRUE,
  budget_alert_threshold INTEGER DEFAULT 90,
  weekly_summary_enabled BOOLEAN DEFAULT FALSE,
  weekly_summary_day INTEGER DEFAULT 0,
  savings_tips_enabled BOOLEAN DEFAULT FALSE,
  savings_tips_frequency TEXT DEFAULT 'weekly',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Política RLS para notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Política RLS para notification_settings
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification settings"
  ON notification_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
  ON notification_settings FOR UPDATE
  USING (auth.uid() = user_id);
