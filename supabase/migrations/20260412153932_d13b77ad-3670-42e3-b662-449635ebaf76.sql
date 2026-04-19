CREATE POLICY "CPAs can view done_for_you projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  service_tier = 'done_for_you'
  AND has_role(auth.uid(), 'cpa'::app_role)
);