
-- 1. Fix has_project_access (two-arg): resolve email shares via auth.users lookup,
--    and include admin/cpa role bypass.
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_id = _project_id
      AND (
        shared_with_user_id = _user_id
        OR shared_with_email = (SELECT email FROM auth.users WHERE id = _user_id)
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin'::app_role, 'cpa'::app_role)
  )
$$;

-- 2. Fix one-arg variant: same admin+cpa bypass, email lookup via auth.users.
CREATE OR REPLACE FUNCTION public.has_project_access(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = _project_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_id = _project_id
      AND (
        shared_with_user_id = auth.uid()
        OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'cpa'::app_role)
  )
$$;

-- 3. Fix get_project_role: admin/cpa return their role; email shares resolve server-side.
CREATE OR REPLACE FUNCTION public.get_project_role(_user_id uuid, _project_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'::app_role) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id) THEN 'owner'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'cpa'::app_role) THEN 'cpa'
      ELSE (
        SELECT role FROM public.project_shares
        WHERE project_id = _project_id
          AND (
            shared_with_user_id = _user_id
            OR shared_with_email = (SELECT email FROM auth.users WHERE id = _user_id)
          )
        LIMIT 1
      )
    END
$$;

-- 4. Blanket admin + CPA full-access policies on project-scoped tables.
--    Idempotent: drop-if-exists then create.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'projects','documents','processed_data','docuclipper_jobs',
    'canonical_transactions','flagged_transactions','adjustment_proofs','adjustment_proposals',
    'company_info','chat_messages','workflows','project_document_requirements',
    'project_narratives','project_data_chunks'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins have full access" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "CPAs have full access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Admins have full access" ON public.%I
       FOR ALL TO authenticated
       USING (public.has_role(auth.uid(), ''admin''::app_role))
       WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))', t);
    EXECUTE format(
      'CREATE POLICY "CPAs have full access" ON public.%I
       FOR ALL TO authenticated
       USING (public.has_role(auth.uid(), ''cpa''::app_role))
       WITH CHECK (public.has_role(auth.uid(), ''cpa''::app_role))', t);
  END LOOP;
END $$;

-- 5. Storage: give admins + CPAs full access to the documents bucket.
DROP POLICY IF EXISTS "Admins full access to documents bucket" ON storage.objects;
CREATE POLICY "Admins full access to documents bucket"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "CPAs full access to documents bucket" ON storage.objects;
CREATE POLICY "CPAs full access to documents bucket"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'documents' AND public.has_role(auth.uid(), 'cpa'::app_role))
WITH CHECK (bucket_id = 'documents' AND public.has_role(auth.uid(), 'cpa'::app_role));

-- 6. Tighten documents INSERT: require project access (owner/share/admin/cpa).
DROP POLICY IF EXISTS "Users can upload documents to their projects" ON public.documents;
CREATE POLICY "Users can upload documents to their projects"
ON public.documents FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.has_project_access(auth.uid(), project_id)
);
