
-- CPA application intake
CREATE TYPE public.cpa_application_status AS ENUM ('submitted','in_review','approved','rejected','withdrawn');

CREATE TABLE public.cpa_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  state_of_licensure text NOT NULL,
  license_number text NOT NULL,
  years_experience int,
  qoe_background text,
  firm_affiliation text,
  side_work_permitted boolean,
  conflicts_disclosure text,
  linkedin_url text,
  referral_source text,
  status public.cpa_application_status NOT NULL DEFAULT 'submitted',
  reviewer_user_id uuid,
  reviewed_at timestamptz,
  decision_notes text,
  CONSTRAINT cpa_applications_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT cpa_applications_name_len CHECK (length(trim(full_name)) BETWEEN 1 AND 200),
  CONSTRAINT cpa_applications_license_len CHECK (length(trim(license_number)) BETWEEN 1 AND 100),
  CONSTRAINT cpa_applications_state_len CHECK (length(trim(state_of_licensure)) BETWEEN 2 AND 64)
);

CREATE INDEX cpa_applications_status_created_idx ON public.cpa_applications (status, created_at DESC);
CREATE INDEX cpa_applications_email_idx ON public.cpa_applications (lower(email));

ALTER TABLE public.cpa_applications ENABLE ROW LEVEL SECURITY;

-- Public can submit (form is anonymous)
CREATE POLICY "Anyone can submit cpa application"
  ON public.cpa_applications
  FOR INSERT
  TO public
  WITH CHECK (status = 'submitted' AND reviewer_user_id IS NULL AND reviewed_at IS NULL);

-- Admins can read all
CREATE POLICY "Admins can view cpa applications"
  ON public.cpa_applications
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update
CREATE POLICY "Admins can update cpa applications"
  ON public.cpa_applications
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role full access
CREATE POLICY "Service role full access cpa applications"
  ON public.cpa_applications
  FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- updated_at trigger
CREATE TRIGGER set_cpa_applications_updated_at
  BEFORE UPDATE ON public.cpa_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
