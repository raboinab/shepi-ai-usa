-- Add flag_category column to flagged_transactions table
ALTER TABLE public.flagged_transactions 
ADD COLUMN IF NOT EXISTS flag_category TEXT NOT NULL DEFAULT 'adjustment_candidate';

-- Add check constraint for valid categories
ALTER TABLE public.flagged_transactions 
ADD CONSTRAINT flagged_transactions_flag_category_check 
CHECK (flag_category IN ('adjustment_candidate', 'bookkeeping_gap'));

-- Create index for filtering by category
CREATE INDEX IF NOT EXISTS idx_flagged_transactions_category 
ON public.flagged_transactions(flag_category);