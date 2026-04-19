-- Test user access for raboinab@gmail.com to project 7ed459ed-a728-4bec-9e9d-b35eb036d46a

-- 1. Check whitelist status
SELECT 'WHITELIST CHECK:' as test, email, created_at 
FROM whitelisted_users 
WHERE email = 'raboinab@gmail.com';

-- 2. Check admin role
SELECT 'ADMIN ROLE CHECK:' as test, ur.role, u.email
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'raboinab@gmail.com';

-- 3. Check project exists
SELECT 'PROJECT CHECK:' as test, id, user_id, name
FROM projects
WHERE id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';

-- 4. Test has_role function
SELECT 'HAS_ROLE CHECK:' as test, has_role('1cc25ae2-1f2f-43d1-af6a-2b61ef8976a3'::uuid, 'admin'::app_role) as is_admin;

-- 5. Test if RLS would allow access (simulate the SELECT policy)
SELECT 'RLS POLICY TEST:' as test,
  CASE 
    WHEN has_role('1cc25ae2-1f2f-43d1-af6a-2b61ef8976a3'::uuid, 'admin'::app_role) THEN 'ADMIN CAN SEE ALL'
    WHEN user_id = '1cc25ae2-1f2f-43d1-af6a-2b61ef8976a3'::uuid THEN 'USER OWNS IT'
    ELSE 'NO ACCESS'
  END as access_result
FROM projects
WHERE id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';

-- 6. Check React Query might have stale data - this is CLIENT side issue
SELECT 'NOTE:' as test, 'If all above pass, issue is React Query cache (5min) or check-subscription cache (2min). Wait or clear browser localStorage.' as message;
