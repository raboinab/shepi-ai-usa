-- Add Admin User Script
-- This script adds admin role to an existing user

-- INSTRUCTIONS:
-- 1. Sign up in your app first to create the user account
-- 2. Find your user ID from Supabase Dashboard → Authentication → Users
-- 3. Replace 'YOUR-USER-ID-HERE' below with your actual user ID
-- 4. Run this script using one of these methods:
--    Option A: Supabase Dashboard → SQL Editor → New Query → Paste & Run
--    Option B: Command line (if you have psql access)

-- Add admin role to user
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR-USER-ID-HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the role was added
SELECT 
    u.id,
    u.email,
    ur.role,
    ur.created_at as role_added_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = 'YOUR-USER-ID-HERE';
