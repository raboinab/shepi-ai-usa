-- Chat messages for AI Assistant persistence
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'wizard',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient querying by project and context
CREATE INDEX idx_chat_messages_project_context_created 
ON chat_messages(project_id, context_type, created_at ASC);

-- Enable Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own project's chat messages (owner or shared)
CREATE POLICY "Users can read their project chat messages"
ON chat_messages FOR SELECT
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  ) OR
  project_id IN (
    SELECT project_id FROM project_shares 
    WHERE shared_with_user_id = auth.uid()
  )
);

-- Users can insert messages to their own projects
CREATE POLICY "Users can insert chat messages to their projects"
ON chat_messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

-- Users can delete their own project's chat messages (for clear chat)
CREATE POLICY "Users can delete their project chat messages"
ON chat_messages FOR DELETE
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

-- Admins can view all chat messages
CREATE POLICY "Admins can view all chat messages"
ON chat_messages FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));