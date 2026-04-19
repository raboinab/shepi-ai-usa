-- Fix: Make verified_by_user_id nullable for service account verifications
ALTER TABLE public.verification_attempts 
ALTER COLUMN verified_by_user_id DROP NOT NULL;

COMMENT ON COLUMN public.verification_attempts.verified_by_user_id IS 
'User who performed the verification. NULL for service account verifications.';