CREATE TABLE public.ai_edit_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  summary JSONB NOT NULL DEFAULT '[]'::jsonb,
  before_wizard_data JSONB NOT NULL,
  after_wizard_data JSONB NOT NULL,
  reverted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_edit_snapshots_project ON public.ai_edit_snapshots(project_id, created_at DESC);

GRANT SELECT, UPDATE ON public.ai_edit_snapshots TO authenticated;
GRANT ALL ON public.ai_edit_snapshots TO service_role;

ALTER TABLE public.ai_edit_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with project access can view snapshots"
  ON public.ai_edit_snapshots FOR SELECT
  TO authenticated
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Users with project access can revert snapshots"
  ON public.ai_edit_snapshots FOR UPDATE
  TO authenticated
  USING (public.has_project_access(auth.uid(), project_id))
  WITH CHECK (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Service role manages snapshots"
  ON public.ai_edit_snapshots FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);