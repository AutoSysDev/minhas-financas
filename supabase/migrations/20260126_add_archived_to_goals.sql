-- Add archived column to goals table
ALTER TABLE public.goals
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Update existing records to have archived = false (redundant due to default, but good for clarity)
UPDATE public.goals SET archived = FALSE WHERE archived IS NULL;
