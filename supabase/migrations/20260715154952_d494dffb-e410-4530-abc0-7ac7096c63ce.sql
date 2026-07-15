
ALTER TABLE public.gl_reconcile_accounts
  ADD COLUMN IF NOT EXISTS activity_abs numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS snapshot_sum numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beginning_empty boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_path text;
