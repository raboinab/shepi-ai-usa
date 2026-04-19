ALTER TABLE public.adjustment_proofs 
  ADD COLUMN IF NOT EXISTS verification_type text NOT NULL DEFAULT 'manual_proof',
  ADD COLUMN IF NOT EXISTS traceability_data jsonb NOT NULL DEFAULT '{}'::jsonb;