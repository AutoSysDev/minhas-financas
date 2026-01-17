-- Migration to add quantity and current_price to investments
-- Also ensures ticker exists if previous migration failed/was skipped

ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS ticker TEXT,
ADD COLUMN IF NOT EXISTS quantity NUMERIC(15, 8) DEFAULT 0, -- Supports fractional shares like crypto
ADD COLUMN IF NOT EXISTS current_price NUMERIC(15, 2),
ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;

-- Re-create index just in case
CREATE INDEX IF NOT EXISTS idx_investments_ticker ON public.investments(ticker);

-- Grant permissions again to be safe
GRANT ALL ON public.investments TO postgres;
GRANT ALL ON public.investments TO service_role;
