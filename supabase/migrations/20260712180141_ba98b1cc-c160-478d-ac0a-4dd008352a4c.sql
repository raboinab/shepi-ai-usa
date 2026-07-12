
-- Grant admin role to raboinab@gmail.com if user exists now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'raboinab@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Auto-grant admin role on signup/verification for the site owner email
CREATE OR REPLACE FUNCTION public.grant_site_owner_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'raboinab@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_site_owner ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_site_owner
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_site_owner_admin();

DROP TRIGGER IF EXISTS on_auth_user_updated_grant_site_owner ON auth.users;
CREATE TRIGGER on_auth_user_updated_grant_site_owner
AFTER UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_site_owner_admin();
