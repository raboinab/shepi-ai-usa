-- Create company_info table for QuickBooks OAuth connections
CREATE TABLE public.company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  company_name TEXT,
  realm_id TEXT,
  bearer_token TEXT,
  refresh_token TEXT,
  auth_code TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint (one QB connection per project)
ALTER TABLE public.company_info ADD CONSTRAINT unique_project_connection UNIQUE (project_id);

-- Enable Row Level Security
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own company connections
CREATE POLICY "Users can view their own company info"
  ON public.company_info
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert for their own projects
CREATE POLICY "Users can create company info for their projects"
  ON public.company_info
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own company info
CREATE POLICY "Users can update their own company info"
  ON public.company_info
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own company info
CREATE POLICY "Users can delete their own company info"
  ON public.company_info
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all company info
CREATE POLICY "Admins can view all company info"
  ON public.company_info
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create updated_at trigger
CREATE TRIGGER update_company_info_updated_at
  BEFORE UPDATE ON public.company_info
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();