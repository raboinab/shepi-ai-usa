
-- 1. admin_notes table for manual outreach tracking
CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all admin notes"
  ON public.admin_notes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create admin notes"
  ON public.admin_notes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Admins can delete admin notes"
  ON public.admin_notes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- 2. nudge_log table for automated email tracking
CREATE TABLE public.nudge_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nudge_type text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  email_id text
);

ALTER TABLE public.nudge_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view nudge logs"
  ON public.nudge_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert nudge logs"
  ON public.nudge_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'service_role');

-- 3. get_user_engagement_stats() function
CREATE OR REPLACE FUNCTION public.get_user_engagement_stats()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  company text,
  signed_up_at timestamptz,
  last_sign_in_at timestamptz,
  project_count bigint,
  document_count bigint,
  has_qb_connection boolean,
  has_completed_onboarding boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    p.full_name,
    p.company,
    u.created_at AS signed_up_at,
    u.last_sign_in_at,
    COALESCE(proj.cnt, 0) AS project_count,
    COALESCE(docs.cnt, 0) AS document_count,
    COALESCE(qb.has_qb, false) AS has_qb_connection,
    COALESCE(proj.has_onboarding, false) AS has_completed_onboarding
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::bigint AS cnt,
      bool_or(pr.current_phase > 1 OR pr.status != 'draft') AS has_onboarding
    FROM public.projects pr
    WHERE pr.user_id = u.id
  ) proj ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt
    FROM public.documents d
    JOIN public.projects pr2 ON pr2.id = d.project_id
    WHERE pr2.user_id = u.id
  ) docs ON true
  LEFT JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1 FROM public.company_info ci
      JOIN public.projects pr3 ON pr3.id = ci.project_id
      WHERE pr3.user_id = u.id AND ci.realm_id IS NOT NULL
    ) AS has_qb
  ) qb ON true
  ORDER BY u.created_at DESC;
END;
$$;
