-- Create processed_data table for storing processed/transformed data
CREATE TABLE public.processed_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL, -- 'docuclipper', 'qbtojson', 'quickbooks_api', 'ai_extraction'
  data_type TEXT NOT NULL, -- 'bank_transactions', 'trial_balance', 'chart_of_accounts', etc.
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL, -- NULL if from API
  qb_realm_id TEXT, -- For QuickBooks API data
  period_start DATE,
  period_end DATE,
  data JSONB NOT NULL DEFAULT '{}', -- The actual processed data
  record_count INTEGER,
  validation_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'validated', 'failed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.processed_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own processed data"
ON public.processed_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own processed data"
ON public.processed_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processed data"
ON public.processed_data
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own processed data"
ON public.processed_data
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all processed data"
ON public.processed_data
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for common queries
CREATE INDEX idx_processed_data_project_type ON public.processed_data(project_id, data_type);
CREATE INDEX idx_processed_data_source_document ON public.processed_data(source_document_id);
CREATE INDEX idx_processed_data_source_type ON public.processed_data(source_type);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_processed_data_updated_at
BEFORE UPDATE ON public.processed_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();