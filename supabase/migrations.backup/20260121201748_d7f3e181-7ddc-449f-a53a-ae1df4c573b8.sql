-- Allow user_id to be null for external QuickBooks authorization flows
-- This enables the "Request QuickBooks Access" shared link flow where 
-- external business owners authorize QuickBooks without being logged in.
-- The existing trigger (populate_company_info_user_id) will populate user_id from project.user_id

ALTER TABLE public.company_info 
ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN public.company_info.user_id IS 
  'Can be NULL when QuickBooks is authorized via shared link. Triggers populate from project.user_id.';