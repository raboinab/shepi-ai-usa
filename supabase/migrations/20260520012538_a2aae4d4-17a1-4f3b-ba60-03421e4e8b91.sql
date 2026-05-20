
-- Canonical doc requirement keys (loose text, not enum, for flexibility)
CREATE TABLE public.project_document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  requirement_key text NOT NULL,
  label text NOT NULL,
  tier text NOT NULL DEFAULT 'required' CHECK (tier IN ('required','recommended','optional')),
  is_custom boolean NOT NULL DEFAULT false,
  requested_by_user_id uuid,
  notes text,
  marked_na boolean NOT NULL DEFAULT false,
  marked_na_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, requirement_key)
);
CREATE INDEX idx_pdr_project ON public.project_document_requirements(project_id);

ALTER TABLE public.project_document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members read requirements"
  ON public.project_document_requirements FOR SELECT
  TO authenticated USING (has_project_access(project_id));

CREATE POLICY "Project members write requirements"
  ON public.project_document_requirements FOR INSERT
  TO authenticated WITH CHECK (has_project_access(project_id));

CREATE POLICY "Project members update requirements"
  ON public.project_document_requirements FOR UPDATE
  TO authenticated USING (has_project_access(project_id));

CREATE POLICY "Project members delete requirements"
  ON public.project_document_requirements FOR DELETE
  TO authenticated USING (has_project_access(project_id));

CREATE POLICY "Service role full access pdr"
  ON public.project_document_requirements FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Per-requirement CPA reviews
CREATE TABLE public.project_document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id uuid NOT NULL REFERENCES public.project_document_requirements(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  document_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text,
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pdrev_project ON public.project_document_reviews(project_id);
CREATE INDEX idx_pdrev_req ON public.project_document_reviews(requirement_id);

ALTER TABLE public.project_document_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members read reviews"
  ON public.project_document_reviews FOR SELECT
  TO authenticated USING (has_project_access(project_id));

CREATE POLICY "CPA insert reviews"
  ON public.project_document_reviews FOR INSERT
  TO authenticated WITH CHECK (
    has_project_access(project_id)
    AND (has_role(auth.uid(), 'cpa'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
    AND reviewed_by_user_id = auth.uid()
  );

CREATE POLICY "CPA update own reviews"
  ON public.project_document_reviews FOR UPDATE
  TO authenticated USING (reviewed_by_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access pdrev"
  ON public.project_document_reviews FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Nudge log
CREATE TABLE public.cpa_nudges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid,
  project_id uuid NOT NULL,
  sent_by_user_id uuid,
  sent_by_system boolean NOT NULL DEFAULT false,
  missing_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  email_id text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_nudges_project ON public.cpa_nudges(project_id);
CREATE INDEX idx_nudges_created ON public.cpa_nudges(created_at);

ALTER TABLE public.cpa_nudges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members read nudges"
  ON public.cpa_nudges FOR SELECT
  TO authenticated USING (has_project_access(project_id));

CREATE POLICY "Service role full access nudges"
  ON public.cpa_nudges FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- updated_at trigger
CREATE TRIGGER trg_pdr_updated BEFORE UPDATE ON public.project_document_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_pdrev_updated BEFORE UPDATE ON public.project_document_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed standard required + recommended items when a DFY project is created or upgraded
CREATE OR REPLACE FUNCTION public.seed_dfy_document_requirements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.service_tier = 'done_for_you'
     AND (TG_OP = 'INSERT' OR OLD.service_tier IS DISTINCT FROM NEW.service_tier) THEN
    INSERT INTO public.project_document_requirements (project_id, requirement_key, label, tier)
    VALUES
      (NEW.id, 'chart_of_accounts', 'Chart of Accounts', 'required'),
      (NEW.id, 'trial_balance', 'Trial Balance (monthly, all periods)', 'required'),
      (NEW.id, 'general_ledger', 'General Ledger (full detail)', 'required'),
      (NEW.id, 'bank_statement', 'Bank Statements (all accounts, all periods)', 'required'),
      (NEW.id, 'tax_return', 'Federal Tax Returns (last 3 years)', 'recommended'),
      (NEW.id, 'accounts_receivable', 'AR Aging Report', 'recommended'),
      (NEW.id, 'accounts_payable', 'AP Aging Report', 'recommended'),
      (NEW.id, 'payroll', 'Payroll Reports / Summary', 'recommended'),
      (NEW.id, 'credit_card', 'Credit Card Statements', 'recommended'),
      (NEW.id, 'cim', 'CIM / Offering Memo (if available)', 'optional')
    ON CONFLICT (project_id, requirement_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seed_dfy_requirements
  AFTER INSERT OR UPDATE OF service_tier ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.seed_dfy_document_requirements();

-- Backfill for existing DFY projects
INSERT INTO public.project_document_requirements (project_id, requirement_key, label, tier)
SELECT p.id, x.key, x.label, x.tier
FROM public.projects p
CROSS JOIN (VALUES
  ('chart_of_accounts','Chart of Accounts','required'),
  ('trial_balance','Trial Balance (monthly, all periods)','required'),
  ('general_ledger','General Ledger (full detail)','required'),
  ('bank_statement','Bank Statements (all accounts, all periods)','required'),
  ('tax_return','Federal Tax Returns (last 3 years)','recommended'),
  ('accounts_receivable','AR Aging Report','recommended'),
  ('accounts_payable','AP Aging Report','recommended'),
  ('payroll','Payroll Reports / Summary','recommended'),
  ('credit_card','Credit Card Statements','recommended'),
  ('cim','CIM / Offering Memo (if available)','optional')
) AS x(key, label, tier)
WHERE p.service_tier = 'done_for_you'
ON CONFLICT (project_id, requirement_key) DO NOTHING;
