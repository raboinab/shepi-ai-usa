-- Add admin role to user afd4f13e-d4f7-48a8-855e-6103a95ed06b
INSERT INTO public.user_roles (user_id, role)
VALUES ('afd4f13e-d4f7-48a8-855e-6103a95ed06b', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
