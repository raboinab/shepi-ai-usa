DROP POLICY IF EXISTS "Users can view shares for their projects or shares with them" ON public.project_shares;

CREATE POLICY "Users can view shares for their projects or shares with them"
ON public.project_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_shares.project_id
      AND projects.user_id = auth.uid()
  )
  OR shared_with_user_id = auth.uid()
  OR shared_with_email = (auth.jwt() ->> 'email')
);