-- Add validation tracking columns to documents table
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS validation_result jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS validated_at timestamptz DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.documents.validation_result IS 'AI validation result including detected type, confidence, and recommendations';
COMMENT ON COLUMN public.documents.validated_at IS 'Timestamp when the document was validated by AI';