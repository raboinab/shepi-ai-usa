-- Extend cpa_claims with engagement state
ALTER TABLE public.cpa_claims
  ALTER COLUMN status SET DEFAULT 'proposed',
  ADD COLUMN IF NOT EXISTS accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_summary text,
  ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
  ADD COLUMN IF NOT EXISTS withdrawn_reason text;

-- New table: cpa_adjustment_reviews
CREATE TABLE IF NOT EXISTS public.cpa_adjustment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES public.cpa_claims(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES public.adjustment_proposals(id) ON DELETE CASCADE,
  cpa_user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('confirmed','modified','rejected')),
  cpa_note text,
  modified_amount numeric,
  modified_period_values jsonb,
  reviewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (claim_id, proposal_id)
);

CREATE INDEX IF NOT EXISTS idx_cpa_adj_reviews_project ON public.cpa_adjustment_reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_cpa_adj_reviews_claim ON public.cpa_adjustment_reviews(claim_id);

ALTER TABLE public.cpa_adjustment_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access cpa adjustment reviews"
  ON public.cpa_adjustment_reviews FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins manage cpa adjustment reviews"
  ON public.cpa_adjustment_reviews FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CPA can read own reviews"
  ON public.cpa_adjustment_reviews FOR SELECT
  TO authenticated
  USING (cpa_user_id = auth.uid());

CREATE POLICY "CPA can insert own reviews on own claim"
  ON public.cpa_adjustment_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    cpa_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.cpa_claims cc
      WHERE cc.id = claim_id AND cc.cpa_user_id = auth.uid()
    )
  );

CREATE POLICY "CPA can update own reviews"
  ON public.cpa_adjustment_reviews FOR UPDATE
  TO authenticated
  USING (cpa_user_id = auth.uid())
  WITH CHECK (cpa_user_id = auth.uid());

CREATE POLICY "Project members can view cpa reviews"
  ON public.cpa_adjustment_reviews FOR SELECT
  TO authenticated
  USING (has_project_access(auth.uid(), project_id));

CREATE TRIGGER trg_cpa_adj_reviews_updated_at
  BEFORE UPDATE ON public.cpa_adjustment_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();