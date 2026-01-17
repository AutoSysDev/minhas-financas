-- Make user_id nullable to support global categories
ALTER TABLE public.categories ALTER COLUMN user_id DROP NOT NULL;

-- Create unique index for global categories to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_global_categories ON public.categories (name, type) WHERE user_id IS NULL;

-- Insert default categories
INSERT INTO public.categories (name, icon, color, type, is_default, user_id)
VALUES
  ('Alimentação', 'cat_food', '#f59e0b', 'expense', true, NULL),
  ('Transporte', 'cat_car', '#3b82f6', 'expense', true, NULL),
  ('Saúde', 'cat_health', '#ef4444', 'expense', true, NULL),
  ('Educação', 'cat_education', '#8b5cf6', 'expense', true, NULL),
  ('Lazer', 'cat_leisure', '#ec4899', 'expense', true, NULL),
  ('Moradia', 'cat_home', '#10b981', 'expense', true, NULL),
  ('Vestuário', 'cat_clothing', '#6366f1', 'expense', true, NULL),
  ('Compras', 'cat_shopping', '#ff7a00', 'expense', true, NULL),
  ('Supermercado', 'cat_grocery', '#22c55e', 'expense', true, NULL),
  ('Viagem', 'cat_travel', '#0ea5e9', 'expense', true, NULL),
  ('Pets', 'cat_pets', '#f97316', 'expense', true, NULL),
  ('Academia', 'cat_gym', '#22c55e', 'expense', true, NULL),
  ('Café', 'cat_coffee', '#a16207', 'expense', true, NULL),
  ('Cinema', 'cat_movie', '#334155', 'expense', true, NULL),
  ('Música', 'cat_music', '#64748b', 'expense', true, NULL),
  ('Livros', 'cat_books', '#6b7280', 'expense', true, NULL),
  ('Pagamentos', 'cat_bill', '#14b8a6', 'expense', true, NULL),
  ('Trabalho', 'cat_work', '#374151', 'expense', true, NULL),
  ('Outros', 'cat_others', '#6b7280', 'expense', true, NULL),
  ('Investimentos', 'cat_invest', '#0ea5e9', 'income', true, NULL),
  ('Poupança', 'cat_savings', '#22c55e', 'income', true, NULL),
  ('Salário', 'cat_salary', '#16a34a', 'income', true, NULL),
  ('Freelance', 'cat_freelance', '#3b82f6', 'income', true, NULL)
ON CONFLICT (name, type) WHERE user_id IS NULL DO NOTHING;
