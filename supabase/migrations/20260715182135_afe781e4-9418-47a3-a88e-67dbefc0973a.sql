
ALTER TABLE public.gl_reconcile_accounts
  ADD COLUMN IF NOT EXISTS tb_balance numeric,
  ADD COLUMN IF NOT EXISTS variance numeric,
  ADD COLUMN IF NOT EXISTS variance_pct numeric,
  ADD COLUMN IF NOT EXISTS reconciled boolean,
  ADD COLUMN IF NOT EXISTS reason_code text;

CREATE INDEX IF NOT EXISTS gl_reconcile_accounts_project_reason_idx
  ON public.gl_reconcile_accounts (project_id, reason_code);
