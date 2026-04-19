
-- canonical_transactions: add 14 missing columns
ALTER TABLE public.canonical_transactions
  ADD COLUMN IF NOT EXISTS job_id UUID,
  ADD COLUMN IF NOT EXISTS source_processed_data_id UUID,
  ADD COLUMN IF NOT EXISTS source_document_id UUID,
  ADD COLUMN IF NOT EXISTS source_record_id TEXT,
  ADD COLUMN IF NOT EXISTS fallback_hash TEXT,
  ADD COLUMN IF NOT EXISTS posting_period TEXT,
  ADD COLUMN IF NOT EXISTS amount_abs NUMERIC,
  ADD COLUMN IF NOT EXISTS amount_signed NUMERIC,
  ADD COLUMN IF NOT EXISTS payee TEXT,
  ADD COLUMN IF NOT EXISTS txn_type TEXT,
  ADD COLUMN IF NOT EXISTS split_account TEXT,
  ADD COLUMN IF NOT EXISTS check_number TEXT,
  ADD COLUMN IF NOT EXISTS is_year_end BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB DEFAULT '{}'::jsonb;

-- detector_runs: add missing columns
ALTER TABLE public.detector_runs
  ADD COLUMN IF NOT EXISTS skipped_reason TEXT,
  ADD COLUMN IF NOT EXISTS debug_json JSONB DEFAULT '{}'::jsonb;

-- proposal_evidence: add missing column
ALTER TABLE public.proposal_evidence
  ADD COLUMN IF NOT EXISTS fallback_hash TEXT;

-- adjustment_proposals: add missing column
ALTER TABLE public.adjustment_proposals
  ADD COLUMN IF NOT EXISTS ai_prompt_version TEXT;

-- analysis_jobs: add missing columns
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add indexes for new canonical_transactions columns
CREATE INDEX IF NOT EXISTS idx_ct_job ON public.canonical_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_ct_project_date ON public.canonical_transactions(project_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_ct_project_account ON public.canonical_transactions(project_id, account_name);
CREATE INDEX IF NOT EXISTS idx_ct_project_vendor ON public.canonical_transactions(project_id, vendor);
