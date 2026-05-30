
-- 1. email_send_log table
CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  to_email text NOT NULL,
  event_type text NOT NULL,
  subject text,
  status text NOT NULL CHECK (status IN ('sent','failed','skipped')),
  error text,
  resend_id text,
  related_project_id uuid,
  related_user_id uuid,
  function_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX idx_email_send_log_created_at ON public.email_send_log (created_at DESC);
CREATE INDEX idx_email_send_log_to_email ON public.email_send_log (to_email);
CREATE INDEX idx_email_send_log_event_type ON public.email_send_log (event_type);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read email send log"
  ON public.email_send_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access email_send_log"
  ON public.email_send_log FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. Backfill Chris LeBlanc cpa_profiles row
INSERT INTO public.cpa_profiles (
  user_id, full_name, email, state_of_licensure, license_number, industries, active
)
VALUES (
  '3209cbbf-ca5a-434f-800a-419df42b8828',
  'Chris LeBlanc',
  'cpleblanc14@gmail.com',
  'PENDING',
  'PENDING',
  '{}'::text[],
  true
)
ON CONFLICT DO NOTHING;

-- 3. Auto-create stub cpa_profiles row when a user is granted the cpa role
CREATE OR REPLACE FUNCTION public.ensure_cpa_profile_on_role_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_email text;
  u_name text;
BEGIN
  IF NEW.role <> 'cpa'::app_role THEN
    RETURN NEW;
  END IF;

  SELECT email,
         COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
    INTO u_email, u_name
  FROM auth.users
  WHERE id = NEW.user_id;

  IF u_email IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.cpa_profiles (
    user_id, full_name, email, state_of_licensure, license_number, industries, active
  ) VALUES (
    NEW.user_id, u_name, u_email, 'PENDING', 'PENDING', '{}'::text[], true
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_cpa_profile ON public.user_roles;
CREATE TRIGGER trg_ensure_cpa_profile
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_cpa_profile_on_role_grant();
