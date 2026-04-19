-- Create docuclipper_jobs table for tracking document parsing jobs
CREATE TABLE public.docuclipper_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'submitted',
    extracted_data JSONB,
    transaction_count INTEGER,
    period_start DATE,
    period_end DATE,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_docuclipper_jobs_project_id ON public.docuclipper_jobs(project_id);
CREATE INDEX idx_docuclipper_jobs_document_id ON public.docuclipper_jobs(document_id);
CREATE INDEX idx_docuclipper_jobs_job_id ON public.docuclipper_jobs(job_id);
CREATE INDEX idx_docuclipper_jobs_status ON public.docuclipper_jobs(status);

-- Enable RLS
ALTER TABLE public.docuclipper_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own docuclipper jobs"
ON public.docuclipper_jobs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own docuclipper jobs"
ON public.docuclipper_jobs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own docuclipper jobs"
ON public.docuclipper_jobs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all docuclipper jobs"
ON public.docuclipper_jobs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_docuclipper_jobs_updated_at
BEFORE UPDATE ON public.docuclipper_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();