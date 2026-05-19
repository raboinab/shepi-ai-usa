INSERT INTO public.cpa_profiles (user_id, full_name, email, license_number, state_of_licensure, states_served, industries, active)
SELECT ur.user_id,
       COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1), 'CPA'),
       COALESCE(au.email, ''),
       '', '', '{}'::text[], '{}'::text[], true
FROM public.user_roles ur
JOIN auth.users au ON au.id = ur.user_id
LEFT JOIN public.cpa_profiles cp ON cp.user_id = ur.user_id
WHERE ur.role = 'cpa' AND cp.id IS NULL;