CREATE POLICY "Project members can view cpa_claims"
ON public.cpa_claims
FOR SELECT
TO authenticated
USING (has_project_access(auth.uid(), project_id));