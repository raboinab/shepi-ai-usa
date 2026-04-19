
-- ============================================
-- 1. analysis_jobs
-- ============================================
CREATE TABLE public.analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  job_type text NOT NULL DEFAULT 'full_discovery',
  status text NOT NULL DEFAULT 'queued',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress_percent integer NOT NULL DEFAULT 0,
  detector_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis jobs"
  ON public.analysis_jobs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis jobs"
  ON public.analysis_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis jobs"
  ON public.analysis_jobs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages analysis jobs"
  ON public.analysis_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.analysis_jobs;

-- ============================================
-- 2. canonical_transactions
-- ============================================
CREATE TABLE public.canonical_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_txn_id text,
  txn_date date,
  description text,
  vendor text,
  amount numeric,
  account_number text,
  account_name text,
  memo text,
  raw_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.canonical_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own canonical transactions"
  ON public.canonical_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages canonical transactions"
  ON public.canonical_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 3. detector_runs
-- ============================================
CREATE TABLE public.detector_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  detector_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  candidates_found integer NOT NULL DEFAULT 0,
  proposals_created integer NOT NULL DEFAULT 0,
  error_message text,
  execution_ms integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.detector_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own detector runs"
  ON public.detector_runs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages detector runs"
  ON public.detector_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 4. adjustment_proposals
-- ============================================
CREATE TABLE public.adjustment_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  master_proposal_id uuid REFERENCES public.adjustment_proposals(id),
  detector_type text NOT NULL,
  detector_run_id uuid REFERENCES public.detector_runs(id),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  block text NOT NULL DEFAULT 'DD',
  adjustment_class text NOT NULL DEFAULT 'nonrecurring',
  intent text NOT NULL DEFAULT 'remove_expense',
  template_id text,
  linked_account_number text,
  linked_account_name text,
  proposed_amount numeric,
  proposed_period_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  allocation_mode text NOT NULL DEFAULT 'monthly',
  period_range jsonb,
  evidence_strength text NOT NULL DEFAULT 'moderate',
  review_priority text NOT NULL DEFAULT 'normal',
  internal_score integer NOT NULL DEFAULT 50,
  support_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_rationale text,
  ai_key_signals text[] NOT NULL DEFAULT '{}'::text[],
  ai_warnings text[] NOT NULL DEFAULT '{}'::text[],
  ai_model text,
  status text NOT NULL DEFAULT 'new',
  reviewer_user_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  edited_amount numeric,
  edited_period_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.adjustment_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own adjustment proposals"
  ON public.adjustment_proposals FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own adjustment proposals"
  ON public.adjustment_proposals FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages adjustment proposals"
  ON public.adjustment_proposals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.adjustment_proposals;

-- ============================================
-- 5. proposal_evidence
-- ============================================
CREATE TABLE public.proposal_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.adjustment_proposals(id) ON DELETE CASCADE,
  canonical_txn_id uuid REFERENCES public.canonical_transactions(id),
  source_type text NOT NULL,
  source_txn_id text,
  txn_date date,
  description text,
  vendor text,
  amount numeric,
  account_number text,
  account_name text,
  match_quality text NOT NULL DEFAULT 'moderate',
  reason text,
  raw_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proposal_evidence ENABLE ROW LEVEL SECURITY;

-- Need user_id for RLS - join through proposal
CREATE POLICY "Users can view evidence for their proposals"
  ON public.proposal_evidence FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.adjustment_proposals ap
    WHERE ap.id = proposal_id AND ap.user_id = auth.uid()
  ));

CREATE POLICY "Service role manages proposal evidence"
  ON public.proposal_evidence FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes for common queries
CREATE INDEX idx_analysis_jobs_project ON public.analysis_jobs(project_id);
CREATE INDEX idx_canonical_txns_project ON public.canonical_transactions(project_id);
CREATE INDEX idx_adjustment_proposals_project ON public.adjustment_proposals(project_id);
CREATE INDEX idx_adjustment_proposals_job ON public.adjustment_proposals(job_id);
CREATE INDEX idx_proposal_evidence_proposal ON public.proposal_evidence(proposal_id);
CREATE INDEX idx_detector_runs_job ON public.detector_runs(job_id);
