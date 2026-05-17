CREATE POLICY "Admins can insert cpa_claims"
ON public.cpa_claims
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));