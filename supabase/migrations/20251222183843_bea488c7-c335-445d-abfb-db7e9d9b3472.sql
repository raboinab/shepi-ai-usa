-- Create workflow type enum
CREATE TYPE public.workflow_type AS ENUM (
  'IMPORT_QUICKBOOKS_DATA',
  'PROCESS_DOCUMENT',
  'SYNC_TO_SHEET',
  'FULL_DATA_SYNC',
  'GENERATE_QOE_REPORT',
  'VALIDATE_ADJUSTMENTS',
  'REFRESH_QB_TOKEN'
);

-- Create workflow status enum
CREATE TYPE public.workflow_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
);

-- Create workflows table
CREATE TABLE public.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  workflow_type workflow_type NOT NULL,
  status workflow_status NOT NULL DEFAULT 'pending',
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  current_step TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload JSONB,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX idx_workflows_project_id ON public.workflows(project_id);
CREATE INDEX idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX idx_workflows_status ON public.workflows(status);
CREATE INDEX idx_workflows_created_at ON public.workflows(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own workflows"
ON public.workflows
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workflows"
ON public.workflows
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workflows"
ON public.workflows
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all workflows"
ON public.workflows
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_workflows_updated_at
BEFORE UPDATE ON public.workflows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for workflows table
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflows;