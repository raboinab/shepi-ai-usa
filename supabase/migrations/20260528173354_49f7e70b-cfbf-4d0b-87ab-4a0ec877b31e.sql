CREATE POLICY "Admins view all provider agreements"
ON public.dfy_provider_agreements
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));