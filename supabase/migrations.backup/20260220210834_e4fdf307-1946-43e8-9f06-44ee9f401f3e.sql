
-- Create tos_acceptances table for tracking Terms of Service acceptance
CREATE TABLE public.tos_acceptances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  tos_version text NOT NULL,
  accepted_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text NULL
);

-- Enable RLS
ALTER TABLE public.tos_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can insert their own acceptance record
CREATE POLICY "Users can insert their own tos acceptance"
ON public.tos_acceptances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own acceptance records
CREATE POLICY "Users can view their own tos acceptances"
ON public.tos_acceptances
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all acceptances
CREATE POLICY "Admins can view all tos acceptances"
ON public.tos_acceptances
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- No UPDATE or DELETE policies — records are immutable once created
