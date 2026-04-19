ALTER TABLE public.business_profiles
  ALTER COLUMN business_model TYPE JSONB
  USING business_model::jsonb;