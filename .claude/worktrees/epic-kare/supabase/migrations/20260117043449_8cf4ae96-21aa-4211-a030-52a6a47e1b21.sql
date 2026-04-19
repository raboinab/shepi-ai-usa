-- Create whitelisted_users table for managing subscription bypass
CREATE TABLE public.whitelisted_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  added_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.whitelisted_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view whitelist
CREATE POLICY "Admins can view whitelist"
  ON public.whitelisted_users
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can add to whitelist
CREATE POLICY "Admins can add to whitelist"
  ON public.whitelisted_users
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can remove from whitelist
CREATE POLICY "Admins can remove from whitelist"
  ON public.whitelisted_users
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed existing whitelisted users
INSERT INTO public.whitelisted_users (email, notes) VALUES
  ('raboinab@gmail.com', 'Owner'),
  ('kacy.ora@gmail.com', 'Admin team member');