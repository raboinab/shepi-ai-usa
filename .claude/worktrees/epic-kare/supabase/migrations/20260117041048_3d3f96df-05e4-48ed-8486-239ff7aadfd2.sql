-- Create project_shares table for sharing projects with other users
CREATE TABLE public.project_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  shared_with_email text NOT NULL,
  shared_with_user_id uuid,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(project_id, shared_with_email)
);

-- Enable RLS on project_shares
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check project access (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User owns the project
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    -- User has a share entry (by user_id or email)
    SELECT 1 FROM public.project_shares 
    WHERE project_id = _project_id 
    AND (
      shared_with_user_id = _user_id 
      OR shared_with_email = (SELECT email FROM auth.users WHERE id = _user_id)
    )
  )
$$;

-- Create function to check project share role
CREATE OR REPLACE FUNCTION public.get_project_role(_user_id uuid, _project_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id) THEN 'owner'
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

-- RLS policies for project_shares table
CREATE POLICY "Users can view shares for their projects or shares with them"
ON public.project_shares
FOR SELECT
USING (
  -- Owner can see all shares for their projects
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
  OR
  -- User can see shares that include them
  shared_with_user_id = auth.uid()
  OR
  shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Project owners can create shares"
ON public.project_shares
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

CREATE POLICY "Project owners can delete shares"
ON public.project_shares
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- Update projects RLS policies to include shared access
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own or shared projects"
ON public.projects
FOR SELECT
USING (
  user_id = auth.uid() 
  OR has_project_access(auth.uid(), id)
);

-- Keep existing UPDATE policy but add shared access for editors/admins
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own or shared projects"
ON public.projects
FOR UPDATE
USING (
  user_id = auth.uid() 
  OR get_project_role(auth.uid(), id) IN ('editor', 'admin')
);

-- Admins policy stays the same
-- Keep DELETE only for owners (existing policy is fine)