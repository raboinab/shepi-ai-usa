-- 1. Block users from updating their own credit balance
DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;

-- 2. Block users from self-upgrading their subscription
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;

-- 3. Add explicit UPDATE policy on documents storage bucket (mirrors INSERT)
CREATE POLICY "Users can update their own documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = (auth.uid())::text)
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = (auth.uid())::text);