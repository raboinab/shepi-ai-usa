CREATE POLICY "Admins can view all documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND public.has_role(auth.uid(), 'admin')
);