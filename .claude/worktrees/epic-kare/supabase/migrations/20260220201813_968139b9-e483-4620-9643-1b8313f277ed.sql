-- Add unique constraint on user_id for user_credits so upsert works correctly
ALTER TABLE public.user_credits ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);