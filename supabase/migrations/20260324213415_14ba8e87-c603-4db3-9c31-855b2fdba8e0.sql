
-- ============================================================
-- QoE v2 Reasoning Engine: 7 new tables + 4 columns
-- ============================================================

-- 1. observations
CREATE TABLE public.observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  category text,
  source text,
  statement text,
  value numeric,
  unit text,
  period text,
  confidence_basis text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access observations" ON public.observations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own observations" ON public.observations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.analysis_jobs aj WHERE aj.id = observations.job_id AND aj.user_id = auth.uid()));
CREATE INDEX idx_observations_job_id ON public.observations(job_id);
CREATE INDEX idx_observations_project_id ON public.observations(project_id);

-- 2. tensions
CREATE TABLE public.tensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text,
  direction text,
  magnitude numeric,
  severity text,
  statement text,
  expected_value numeric,
  actual_value numeric,
  benchmark_source text,
  accounts_implicated text[] DEFAULT '{}'::text[],
  observation_ids uuid[] DEFAULT '{}'::uuid[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access tensions" ON public.tensions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own tensions" ON public.tensions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.analysis_jobs aj WHERE aj.id = tensions.job_id AND aj.user_id = auth.uid()));
CREATE INDEX idx_tensions_job_id ON public.tensions(job_id);
CREATE INDEX idx_tensions_project_id ON public.tensions(project_id);
CREATE INDEX idx_tensions_severity ON public.tensions(severity);

-- 3. hypotheses
CREATE TABLE public.hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text,
  severity text,
  hypothesis_claim text,
  estimated_ebitda_impact numeric,
  falsification_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolution_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  owned_accounts text[] DEFAULT '{}'::text[],
  tension_ids uuid[] DEFAULT '{}'::uuid[],
  status text NOT NULL DEFAULT 'proposed',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hypotheses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access hypotheses" ON public.hypotheses FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own hypotheses" ON public.hypotheses FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.analysis_jobs aj WHERE aj.id = hypotheses.job_id AND aj.user_id = auth.uid()));
CREATE INDEX idx_hypotheses_job_id ON public.hypotheses(job_id);
CREATE INDEX idx_hypotheses_project_id ON public.hypotheses(project_id);

-- 4. findings
CREATE TABLE public.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  hypothesis_id uuid REFERENCES public.hypotheses(id),
  resolver_type text,
  computed_amount numeric,
  period_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  evidence_strength text NOT NULL DEFAULT 'moderate',
  hypothesis_outcome text,
  narrative text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access findings" ON public.findings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own findings" ON public.findings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.analysis_jobs aj WHERE aj.id = findings.job_id AND aj.user_id = auth.uid()));
CREATE INDEX idx_findings_job_id ON public.findings(job_id);
CREATE INDEX idx_findings_project_id ON public.findings(project_id);

-- 5. claim_ledger
CREATE TABLE public.claim_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  observation_id uuid REFERENCES public.observations(id),
  tension_id uuid REFERENCES public.tensions(id),
  hypothesis_id uuid REFERENCES public.hypotheses(id),
  finding_id uuid REFERENCES public.findings(id),
  adjustment_id uuid REFERENCES public.adjustment_proposals(id),
  observation_statement text,
  tension_statement text,
  hypothesis_claim text,
  finding_narrative text,
  tension_magnitude numeric,
  hypothesis_estimated_impact numeric,
  finding_computed_amount numeric,
  adjustment_proposed_amount numeric,
  chain_complete boolean NOT NULL DEFAULT false,
  dropped_at text,
  drop_reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.claim_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access claim_ledger" ON public.claim_ledger FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own claim_ledger" ON public.claim_ledger FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.analysis_jobs aj WHERE aj.id = claim_ledger.job_id AND aj.user_id = auth.uid()));
CREATE INDEX idx_claim_ledger_job_id ON public.claim_ledger(job_id);
CREATE INDEX idx_claim_ledger_project_id ON public.claim_ledger(project_id);
CREATE INDEX idx_claim_ledger_adjustment ON public.claim_ledger(adjustment_id);
CREATE INDEX idx_claim_ledger_chain_complete ON public.claim_ledger(chain_complete);

-- 6. business_profiles
CREATE TABLE public.business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL UNIQUE REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  revenue_model jsonb NOT NULL DEFAULT '{}'::jsonb,
  cost_structure jsonb NOT NULL DEFAULT '{}'::jsonb,
  operations_footprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  capital_structure jsonb NOT NULL DEFAULT '{}'::jsonb,
  industry_classification text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access business_profiles" ON public.business_profiles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own business_profiles" ON public.business_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.analysis_jobs aj WHERE aj.id = business_profiles.job_id AND aj.user_id = auth.uid()));
CREATE INDEX idx_business_profiles_job_id ON public.business_profiles(job_id);
CREATE INDEX idx_business_profiles_project_id ON public.business_profiles(project_id);

-- 7. entity_nodes
CREATE TABLE public.entity_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  entity_type text,
  canonical_name text,
  aliases text[] DEFAULT '{}'::text[],
  roles text[] DEFAULT '{}'::text[],
  linked_accounts jsonb NOT NULL DEFAULT '[]'::jsonb,
  transaction_volume numeric,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.entity_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access entity_nodes" ON public.entity_nodes FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Users can view own entity_nodes" ON public.entity_nodes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.analysis_jobs aj WHERE aj.id = entity_nodes.job_id AND aj.user_id = auth.uid()));
CREATE INDEX idx_entity_nodes_job_id ON public.entity_nodes(job_id);
CREATE INDEX idx_entity_nodes_project_id ON public.entity_nodes(project_id);

-- 8. Add 4 columns to adjustment_proposals
ALTER TABLE public.adjustment_proposals
  ADD COLUMN hypothesis_id uuid REFERENCES public.hypotheses(id),
  ADD COLUMN finding_id uuid REFERENCES public.findings(id),
  ADD COLUMN rejection_category text,
  ADD COLUMN rejection_reason text;
