-- Add UPDATE policy for documents table
CREATE POLICY "Users can update their documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);