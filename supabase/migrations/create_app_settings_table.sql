-- Tabela de configurações da aplicação (Stripe)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  stripe_product_id TEXT,
  stripe_price_monthly_id TEXT,
  stripe_price_yearly_id TEXT,
  currency TEXT DEFAULT 'BRL',
  amount_monthly INTEGER, -- em centavos
  amount_yearly INTEGER,  -- em centavos
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Qualquer usuário pode ler configurações públicas
CREATE POLICY "Public can read app settings" ON app_settings FOR SELECT USING (true);

