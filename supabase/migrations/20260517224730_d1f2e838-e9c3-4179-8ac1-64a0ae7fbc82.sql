
-- 1. CPA profiles table
CREATE TABLE public.cpa_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  application_id uuid REFERENCES public.cpa_applications(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  state_of_licensure text NOT NULL,
  license_number text NOT NULL,
  states_served text[] NOT NULL DEFAULT '{}',
  industries text[] NOT NULL DEFAULT '{}',
  bio text,
  years_experience integer,
  linkedin_url text,
  license_verified_at timestamptz,
  liability_covered boolean NOT NULL DEFAULT false,
  liability_expires_at date,
  background_check_status text NOT NULL DEFAULT 'pending',
  w9_on_file boolean NOT NULL DEFAULT false,
  max_concurrent_engagements integer NOT NULL DEFAULT 3,
  onboarding_completed_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cpa_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cpa profiles"
  ON public.cpa_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CPAs view own profile"
  ON public.cpa_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "CPAs update own profile"
  ON public.cpa_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Project members view assigned CPA profile"
  ON public.cpa_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cpa_claims cc
      WHERE cc.cpa_user_id = cpa_profiles.user_id
        AND has_project_access(auth.uid(), cc.project_id)
    )
  );

CREATE POLICY "Service role full access cpa profiles"
  ON public.cpa_profiles FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_cpa_profiles_updated_at
  BEFORE UPDATE ON public.cpa_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cpa_profiles_user_id ON public.cpa_profiles(user_id);
CREATE INDEX idx_cpa_profiles_active ON public.cpa_profiles(active);

-- 2. Onboarding documents
CREATE TABLE public.cpa_onboarding_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpa_user_id uuid NOT NULL,
  document_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_user_id uuid,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cpa_onboarding_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cpa onboarding docs"
  ON public.cpa_onboarding_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CPAs manage own onboarding docs"
  ON public.cpa_onboarding_documents FOR ALL TO authenticated
  USING (cpa_user_id = auth.uid())
  WITH CHECK (cpa_user_id = auth.uid());

CREATE POLICY "Service role full access cpa onboarding docs"
  ON public.cpa_onboarding_documents FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_cpa_onboarding_documents_updated_at
  BEFORE UPDATE ON public.cpa_onboarding_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_cpa_onboarding_docs_user_id ON public.cpa_onboarding_documents(cpa_user_id);

-- 3. Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cpa-onboarding', 'cpa-onboarding', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "CPAs read own onboarding files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cpa-onboarding'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "CPAs upload own onboarding files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'cpa-onboarding'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "CPAs update own onboarding files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'cpa-onboarding'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "CPAs delete own onboarding files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'cpa-onboarding'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins read all cpa onboarding files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'cpa-onboarding'
    AND has_role(auth.uid(), 'admin'::app_role)
  );
