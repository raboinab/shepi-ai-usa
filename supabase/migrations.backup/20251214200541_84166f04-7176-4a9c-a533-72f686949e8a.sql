-- Add admin read access to profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin read access to projects
CREATE POLICY "Admins can view all projects"
ON public.projects
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin read access to subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin read access to project_payments
CREATE POLICY "Admins can view all project payments"
ON public.project_payments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin read access to documents
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Bootstrap first admin user (Alex)
-- Note: This will only succeed if the user exists in auth.users
-- If the user doesn't exist yet, this will be skipped
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'afd4f13e-d4f7-48a8-855e-6103a95ed06b') THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES ('afd4f13e-d4f7-48a8-855e-6103a95ed06b', 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END $$;
