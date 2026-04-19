
CREATE TABLE public.upload_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  project_id uuid,
  context text NOT NULL,
  file_name text,
  file_size bigint,
  file_type text,
  stage text NOT NULL,
  error_code text,
  error_message text,
  error_details jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.upload_errors ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own error log (so we capture failures even if RLS elsewhere blocks them)
CREATE POLICY "Users can insert their own upload errors"
ON public.upload_errors FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own; admins can view all
CREATE POLICY "Users can view their own upload errors"
ON public.upload_errors FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE INDEX idx_upload_errors_project ON public.upload_errors(project_id, created_at DESC);
CREATE INDEX idx_upload_errors_user ON public.upload_errors(user_id, created_at DESC);
