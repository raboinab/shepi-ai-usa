GRANT SELECT, INSERT, UPDATE, DELETE ON public.unified_connections TO authenticated;
GRANT ALL ON public.unified_connections TO service_role;

CREATE POLICY "Users can view unified_connections for accessible projects"
  ON public.unified_connections
  FOR SELECT
  TO authenticated
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Project owners can insert unified_connections"
  ON public.unified_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = unified_connections.project_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update unified_connections"
  ON public.unified_connections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = unified_connections.project_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = unified_connections.project_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can delete unified_connections"
  ON public.unified_connections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = unified_connections.project_id
        AND p.user_id = auth.uid()
    )
  );