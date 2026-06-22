CREATE OR REPLACE FUNCTION public.get_project_role(_user_id uuid, _project_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.projects
        WHERE id = _project_id
          AND user_id = _user_id
      ) THEN 'owner'
      ELSE (
        SELECT role
        FROM public.project_shares
        WHERE project_id = _project_id
          AND (
            shared_with_user_id = _user_id
            OR (
              _user_id = auth.uid()
              AND shared_with_email = (auth.jwt() ->> 'email')
            )
          )
        LIMIT 1
      )
    END
$$;

CREATE OR REPLACE FUNCTION public.has_project_access(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.project_shares
    WHERE project_id = _project_id
      AND (
        shared_with_user_id = auth.uid()
        OR shared_with_email = (auth.jwt() ->> 'email')
      )
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = _project_id
      AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.project_shares
    WHERE project_id = _project_id
      AND (
        shared_with_user_id = _user_id
        OR (
          _user_id = auth.uid()
          AND shared_with_email = (auth.jwt() ->> 'email')
        )
      )
  )
$$;