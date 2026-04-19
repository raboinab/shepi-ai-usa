-- 1. detector_runs: rename columns to match spec
ALTER TABLE public.detector_runs RENAME COLUMN candidates_found TO candidate_count;
ALTER TABLE public.detector_runs RENAME COLUMN proposals_created TO proposal_count;

-- 2. adjustment_proposals: change ai_key_signals and ai_warnings from text[] to jsonb
ALTER TABLE public.adjustment_proposals 
  ALTER COLUMN ai_key_signals DROP DEFAULT,
  ALTER COLUMN ai_key_signals TYPE JSONB USING to_jsonb(ai_key_signals),
  ALTER COLUMN ai_key_signals SET DEFAULT '[]'::jsonb;

ALTER TABLE public.adjustment_proposals 
  ALTER COLUMN ai_warnings DROP DEFAULT,
  ALTER COLUMN ai_warnings TYPE JSONB USING to_jsonb(ai_warnings),
  ALTER COLUMN ai_warnings SET DEFAULT '[]'::jsonb;

-- 3. canonical_transactions: add FK from job_id to analysis_jobs
ALTER TABLE public.canonical_transactions 
  ADD CONSTRAINT canonical_transactions_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES public.analysis_jobs(id) ON DELETE CASCADE;