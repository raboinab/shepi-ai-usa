
-- 1. Create single-param has_project_access overload (includes admin check)
CREATE OR REPLACE FUNCTION public.has_project_access(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_id = _project_id
      AND (shared_with_user_id = auth.uid()
           OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 2. Direct project_id tables: analysis_jobs
DROP POLICY IF EXISTS "Users can view their own analysis jobs" ON public.analysis_jobs;
CREATE POLICY "Users can view project analysis jobs"
  ON public.analysis_jobs FOR SELECT TO authenticated
  USING (has_project_access(project_id));

-- 3. adjustment_proposals
DROP POLICY IF EXISTS "Users can view their own adjustment proposals" ON public.adjustment_proposals;
CREATE POLICY "Users can view project adjustment proposals"
  ON public.adjustment_proposals FOR SELECT TO authenticated
  USING (has_project_access(project_id));

-- 4. detector_runs
DROP POLICY IF EXISTS "Users can view their own detector runs" ON public.detector_runs;
CREATE POLICY "Users can view project detector runs"
  ON public.detector_runs FOR SELECT TO authenticated
  USING (has_project_access(project_id));

-- 5. adjustment_proofs
DROP POLICY IF EXISTS "Users can view their own adjustment proofs" ON public.adjustment_proofs;
CREATE POLICY "Users can view project adjustment proofs"
  ON public.adjustment_proofs FOR SELECT TO authenticated
  USING (has_project_access(project_id));

-- 6. verification_attempts
DROP POLICY IF EXISTS "Users can view own verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can view project verification attempts"
  ON public.verification_attempts FOR SELECT TO authenticated
  USING (has_project_access(project_id));

-- 7. canonical_transactions
DROP POLICY IF EXISTS "Users can view their own canonical transactions" ON public.canonical_transactions;
CREATE POLICY "Users can view project canonical transactions"
  ON public.canonical_transactions FOR SELECT TO authenticated
  USING (has_project_access(project_id));

-- 8. Job-linked tables: observations
DROP POLICY IF EXISTS "Users can view own observations" ON public.observations;
CREATE POLICY "Users can view project observations"
  ON public.observations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.analysis_jobs aj
    WHERE aj.id = observations.job_id
      AND has_project_access(aj.project_id)
  ));

-- 9. tensions
DROP POLICY IF EXISTS "Users can view own tensions" ON public.tensions;
CREATE POLICY "Users can view project tensions"
  ON public.tensions FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.analysis_jobs aj
    WHERE aj.id = tensions.job_id
      AND has_project_access(aj.project_id)
  ));

-- 10. hypotheses
DROP POLICY IF EXISTS "Users can view own hypotheses" ON public.hypotheses;
CREATE POLICY "Users can view project hypotheses"
  ON public.hypotheses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.analysis_jobs aj
    WHERE aj.id = hypotheses.job_id
      AND has_project_access(aj.project_id)
  ));

-- 11. findings
DROP POLICY IF EXISTS "Users can view own findings" ON public.findings;
CREATE POLICY "Users can view project findings"
  ON public.findings FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.analysis_jobs aj
    WHERE aj.id = findings.job_id
      AND has_project_access(aj.project_id)
  ));

-- 12. claim_ledger
DROP POLICY IF EXISTS "Users can view own claim_ledger" ON public.claim_ledger;
CREATE POLICY "Users can view project claim_ledger"
  ON public.claim_ledger FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.analysis_jobs aj
    WHERE aj.id = claim_ledger.job_id
      AND has_project_access(aj.project_id)
  ));

-- 13. business_profiles
DROP POLICY IF EXISTS "Users can view own business_profiles" ON public.business_profiles;
CREATE POLICY "Users can view project business_profiles"
  ON public.business_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.analysis_jobs aj
    WHERE aj.id = business_profiles.job_id
      AND has_project_access(aj.project_id)
  ));

-- 14. entity_nodes
DROP POLICY IF EXISTS "Users can view own entity_nodes" ON public.entity_nodes;
CREATE POLICY "Users can view project entity_nodes"
  ON public.entity_nodes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.analysis_jobs aj
    WHERE aj.id = entity_nodes.job_id
      AND has_project_access(aj.project_id)
  ));

-- 15. proposal_evidence
DROP POLICY IF EXISTS "Users can view evidence for their proposals" ON public.proposal_evidence;
CREATE POLICY "Users can view project proposal evidence"
  ON public.proposal_evidence FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.adjustment_proposals ap
    WHERE ap.id = proposal_evidence.proposal_id
      AND has_project_access(ap.project_id)
  ));
