CREATE TABLE IF NOT EXISTS public.migration_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rows_processed int DEFAULT 0,
  error text,
  payload jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.migration_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view migration runs"
  ON public.migration_runs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert migration runs"
  ON public.migration_runs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update migration runs"
  ON public.migration_runs FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages migration runs"
  ON public.migration_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_migration_runs_step ON public.migration_runs(step, started_at DESC);