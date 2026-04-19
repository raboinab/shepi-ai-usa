-- Fix INSERT policy to allow shared users to save chat messages
DROP POLICY IF EXISTS "Users can insert chat messages to their projects" ON chat_messages;

CREATE POLICY "Users can insert chat messages to their projects" 
ON chat_messages FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND has_project_access(auth.uid(), project_id)
);

-- Fix DELETE policy to allow shared editors/admins to clear history
DROP POLICY IF EXISTS "Users can delete their project chat messages" ON chat_messages;

CREATE POLICY "Users can delete their project chat messages" 
ON chat_messages FOR DELETE 
USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  OR (
    get_project_role(auth.uid(), project_id) IN ('editor', 'admin')
  )
);