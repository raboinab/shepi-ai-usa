-- Replace overly-permissive INSERT policy on contact_submissions
-- Keeps public form submissions working, but avoids WITH CHECK (true)

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
TO public
WITH CHECK (
  length(trim(name)) >= 1
  AND length(trim(message)) >= 1
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
