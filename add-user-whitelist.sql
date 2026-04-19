-- Add raboinab@gmail.com to whitelist and admin
-- This grants full access to the application

-- Add to whitelisted_users for full access
INSERT INTO public.whitelisted_users (email, created_at)
VALUES ('raboinab@gmail.com', NOW())
ON CONFLICT (email) DO NOTHING;

-- Get user ID and add admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'raboinab@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify setup
SELECT 
    u.id as user_id,
    u.email,
    w.email as whitelisted,
    ur.role as admin_role
FROM auth.users u
LEFT JOIN public.whitelisted_users w ON LOWER(u.email) = LOWER(w.email)
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'raboinab@gmail.com';
