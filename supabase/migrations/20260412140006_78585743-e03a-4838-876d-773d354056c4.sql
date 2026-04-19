
-- 1. Add service_tier to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS service_tier text NOT NULL DEFAULT 'diy';

-- 2. Create cpa_claims table
CREATE TABLE public.cpa_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cpa_user_id uuid NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'in_progress',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

ALTER TABLE public.cpa_claims ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
CREATE POLICY "CPAs can view cpa_claims"
ON public.cpa_claims FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'cpa'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "CPAs can insert cpa_claims"
ON public.cpa_claims FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'cpa'::app_role)
  AND cpa_user_id = auth.uid()
);

CREATE POLICY "CPAs can update own cpa_claims"
ON public.cpa_claims FOR UPDATE TO authenticated
USING (
  (cpa_user_id = auth.uid() AND has_role(auth.uid(), 'cpa'::app_role))
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete cpa_claims"
ON public.cpa_claims FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access cpa_claims"
ON public.cpa_claims FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 4. Trigger: auto-create project_shares on claim
CREATE OR REPLACE FUNCTION public.auto_share_on_cpa_claim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpa_email text;
BEGIN
  SELECT email INTO cpa_email FROM auth.users WHERE id = NEW.cpa_user_id;

  INSERT INTO public.project_shares (project_id, shared_with_user_id, shared_with_email, role, created_by)
  VALUES (NEW.project_id, NEW.cpa_user_id, COALESCE(cpa_email, ''), 'editor', NEW.cpa_user_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_share_on_cpa_claim
AFTER INSERT ON public.cpa_claims
FOR EACH ROW
EXECUTE FUNCTION public.auto_share_on_cpa_claim();

-- 5. Updated_at trigger
CREATE TRIGGER update_cpa_claims_updated_at
BEFORE UPDATE ON public.cpa_claims
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
