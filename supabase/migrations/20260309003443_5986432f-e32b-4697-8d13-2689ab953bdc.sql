-- Add classification_context field to flagged_transactions for storing RAG context used in classification
ALTER TABLE public.flagged_transactions 
ADD COLUMN classification_context JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.flagged_transactions.classification_context 
IS 'Stores RAG sources, industry context, and QoE guidance used during AI classification';