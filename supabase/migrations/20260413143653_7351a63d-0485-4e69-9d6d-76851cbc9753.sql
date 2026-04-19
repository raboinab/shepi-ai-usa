CREATE TABLE public.dfy_provider_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreement_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

ALTER TABLE public.dfy_provider_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own acceptance"
  ON public.dfy_provider_agreements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own acceptance"
  ON public.dfy_provider_agreements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);