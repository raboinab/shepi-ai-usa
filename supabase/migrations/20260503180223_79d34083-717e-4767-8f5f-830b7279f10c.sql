-- AI-generated narrative content per project + slide
CREATE TABLE public.project_narratives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  slide_key TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_hash TEXT,
  model TEXT,
  generated_by UUID,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  edited_by UUID,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, slide_key)
);

CREATE INDEX idx_project_narratives_project ON public.project_narratives(project_id);

ALTER TABLE public.project_narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with project access can view narratives"
  ON public.project_narratives FOR SELECT
  USING (public.has_project_access(project_id));

CREATE POLICY "Users with project access can insert narratives"
  ON public.project_narratives FOR INSERT
  WITH CHECK (public.has_project_access(project_id));

CREATE POLICY "Users with project access can update narratives"
  ON public.project_narratives FOR UPDATE
  USING (public.has_project_access(project_id));

CREATE POLICY "Users with project access can delete narratives"
  ON public.project_narratives FOR DELETE
  USING (public.has_project_access(project_id));

CREATE TRIGGER update_project_narratives_updated_at
  BEFORE UPDATE ON public.project_narratives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();