
CREATE TABLE public.gl_reconcile_accounts (
  project_id uuid NOT NULL,
  run_id uuid NOT NULL,
  account_key text NOT NULL,
  account_number text,
  account_name text,
  classification text,
  snapshot_balance numeric,
  snapshot_period date,
  activity_net numeric NOT NULL DEFAULT 0,
  txn_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, run_id, account_key)
);

GRANT SELECT ON public.gl_reconcile_accounts TO authenticated;
GRANT ALL ON public.gl_reconcile_accounts TO service_role;

ALTER TABLE public.gl_reconcile_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view GL reconcile scratch"
ON public.gl_reconcile_accounts
FOR SELECT
TO authenticated
USING (public.has_project_access(auth.uid(), project_id));

CREATE INDEX gl_reconcile_accounts_project_run_idx
  ON public.gl_reconcile_accounts (project_id, run_id);
