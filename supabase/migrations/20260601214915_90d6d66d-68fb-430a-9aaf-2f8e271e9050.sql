DROP POLICY IF EXISTS "Users can view their own flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Admins can view all flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Users can create flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Users can update their own flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Users can delete their own flagged transactions" ON public.flagged_transactions;

CREATE POLICY "Project members can view flagged transactions"
  ON public.flagged_transactions FOR SELECT TO authenticated
  USING (has_project_access(project_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project members can create flagged transactions"
  ON public.flagged_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_project_access(project_id));

CREATE POLICY "Project members can update flagged transactions"
  ON public.flagged_transactions FOR UPDATE TO authenticated
  USING (has_project_access(project_id));

CREATE POLICY "Project members can delete flagged transactions"
  ON public.flagged_transactions FOR DELETE TO authenticated
  USING (has_project_access(project_id));