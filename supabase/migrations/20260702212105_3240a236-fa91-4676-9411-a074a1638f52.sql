DROP POLICY IF EXISTS "Project members view assigned CPA profile" ON public.cpa_profiles;

CREATE POLICY "Project owner views assigned CPA profile"
  ON public.cpa_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.cpa_claims cc
      JOIN public.projects p ON p.id = cc.project_id
      WHERE cc.cpa_user_id = cpa_profiles.user_id
        AND cc.status = 'accepted'
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "CPAs can view done_for_you projects" ON public.projects;

CREATE POLICY "CPAs view claimed done_for_you projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    service_tier = 'done_for_you'
    AND has_role(auth.uid(), 'cpa'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.cpa_claims cc
      WHERE cc.project_id = projects.id
        AND cc.cpa_user_id = auth.uid()
        AND cc.status = 'accepted'
    )
  );

REVOKE EXECUTE ON FUNCTION public.get_user_engagement_stats() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.duplicate_project(uuid, text) FROM anon;