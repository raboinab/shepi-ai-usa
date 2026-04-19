ALTER TABLE public.observations ADD COLUMN IF NOT EXISTS supporting_accounts text[];
ALTER TABLE public.business_profiles ADD COLUMN IF NOT EXISTS business_model text;
ALTER TABLE public.tensions ADD COLUMN IF NOT EXISTS gap_percent numeric;
ALTER TABLE public.hypotheses ADD COLUMN IF NOT EXISTS alternative_explanations text[];
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS accounts_involved text[];
ALTER TABLE public.claim_ledger ADD COLUMN IF NOT EXISTS adjustment_title text;