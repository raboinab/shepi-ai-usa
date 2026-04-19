
-- ============================================================================
-- 1. verification_attempts — Audit trail for adjustment verifications
-- ============================================================================
CREATE TABLE public.verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  job_id UUID,
  proposal_id UUID REFERENCES public.adjustment_proposals(id),
  adjustment_description TEXT NOT NULL,
  proposed_amount NUMERIC(18,2) NOT NULL,
  adjustment_class TEXT,
  period TEXT,
  account_hints TEXT[],
  schema_hints JSONB,
  status TEXT NOT NULL CHECK (
    status IN ('verified', 'partial_match', 'not_found', 'overridden')
  ),
  verified_amount NUMERIC(18,2) NOT NULL,
  variance_amount NUMERIC(18,2) NOT NULL,
  matching_txn_count INTEGER NOT NULL DEFAULT 0,
  diagnostic_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_data_version JSONB DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  contradictions JSONB DEFAULT '[]'::jsonb,
  data_gaps JSONB DEFAULT '[]'::jsonb,
  verified_by_user_id UUID NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_verification_attempts_project ON public.verification_attempts(project_id);
CREATE INDEX idx_verification_attempts_user ON public.verification_attempts(verified_by_user_id);
CREATE INDEX idx_verification_attempts_status ON public.verification_attempts(status);
CREATE INDEX idx_verification_attempts_proposal ON public.verification_attempts(proposal_id);

ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to verification_attempts"
ON public.verification_attempts FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own verification attempts"
ON public.verification_attempts FOR SELECT
USING (verified_by_user_id = auth.uid());

-- ============================================================================
-- 2. verification_transaction_snapshots — Immutable evidence snapshots
-- ============================================================================
CREATE TABLE public.verification_transaction_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_attempt_id UUID NOT NULL REFERENCES public.verification_attempts(id) ON DELETE CASCADE,
  transaction_id UUID,
  source_document_id UUID,
  source_type TEXT,
  txn_date DATE,
  description TEXT,
  account_name TEXT,
  account_number TEXT,
  counterparty TEXT,
  amount_signed NUMERIC(18,2),
  amount_abs NUMERIC(18,2),
  raw_transaction JSONB NOT NULL,
  matched_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vts_verification ON public.verification_transaction_snapshots(verification_attempt_id);
CREATE INDEX idx_vts_transaction ON public.verification_transaction_snapshots(transaction_id);

ALTER TABLE public.verification_transaction_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to snapshots"
ON public.verification_transaction_snapshots FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view snapshots for own verifications"
ON public.verification_transaction_snapshots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.verification_attempts va
    WHERE va.id = verification_attempt_id AND va.verified_by_user_id = auth.uid()
  )
);

-- ============================================================================
-- 3. Missing composite indexes on existing tables
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON public.analysis_jobs(project_id, status);
CREATE INDEX IF NOT EXISTS idx_ap_project_status ON public.adjustment_proposals(project_id, status);
