CREATE POLICY "Admins can delete any project"
ON public.projects FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));