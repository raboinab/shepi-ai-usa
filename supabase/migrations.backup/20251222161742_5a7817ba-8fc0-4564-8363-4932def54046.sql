-- Create enum for validation status
CREATE TYPE public.proof_validation_status AS ENUM ('validated', 'supported', 'partial', 'insufficient', 'contradictory', 'pending');

-- Create adjustment_proofs table
CREATE TABLE public.adjustment_proofs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    adjustment_id TEXT NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    validation_score INTEGER CHECK (validation_score >= 0 AND validation_score <= 100),
    validation_status proof_validation_status NOT NULL DEFAULT 'pending',
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    key_findings TEXT[] DEFAULT '{}',
    red_flags TEXT[] DEFAULT '{}',
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.adjustment_proofs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own adjustment proofs"
ON public.adjustment_proofs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own adjustment proofs"
ON public.adjustment_proofs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adjustment proofs"
ON public.adjustment_proofs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own adjustment proofs"
ON public.adjustment_proofs
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all adjustment proofs"
ON public.adjustment_proofs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_adjustment_proofs_updated_at
BEFORE UPDATE ON public.adjustment_proofs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_adjustment_proofs_project_id ON public.adjustment_proofs(project_id);
CREATE INDEX idx_adjustment_proofs_adjustment_id ON public.adjustment_proofs(adjustment_id);