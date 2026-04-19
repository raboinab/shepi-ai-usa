-- Update chat_messages SELECT policy to use has_project_access for consistent access control
-- This ensures email-based shares work correctly

DROP POLICY IF EXISTS "Users can read their project chat messages" ON public.chat_messages;

CREATE POLICY "Users can read their project chat messages"
ON public.chat_messages
FOR SELECT
USING (has_project_access(auth.uid(), project_id));