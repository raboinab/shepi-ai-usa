-- Create user_credits table to track purchased but unassigned per-project credits
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits_remaining integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

-- Users can only read their own credits; only service role can write
CREATE POLICY "Users can view own credits"
  ON public.user_credits
  FOR SELECT
  USING (auth.uid() = user_id);

-- Add funded_by_credit flag to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS funded_by_credit boolean NOT NULL DEFAULT false;

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_user_credits_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_user_credits_updated_at();