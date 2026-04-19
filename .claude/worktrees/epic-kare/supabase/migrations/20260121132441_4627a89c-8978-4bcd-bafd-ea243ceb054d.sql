-- Create flagged_transactions table for AI Adjustment Discovery
CREATE TABLE public.flagged_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  account_name text NOT NULL,
  flag_type text NOT NULL,
  flag_reason text NOT NULL,
  confidence_score numeric NOT NULL DEFAULT 0.5,
  suggested_adjustment_type text,
  suggested_adjustment_amount numeric,
  status text NOT NULL DEFAULT 'pending',
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  source_data jsonb DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Unique constraint for upsert deduplication
  CONSTRAINT flagged_transactions_unique UNIQUE (project_id, transaction_date, description, amount)
);

-- Add updated_at trigger
CREATE TRIGGER update_flagged_transactions_updated_at
  BEFORE UPDATE ON public.flagged_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.flagged_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own flagged transactions"
  ON public.flagged_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create flagged transactions"
  ON public.flagged_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flagged transactions"
  ON public.flagged_transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flagged transactions"
  ON public.flagged_transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all flagged transactions"
  ON public.flagged_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));