-- Add columns Cloud Run expects
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS extracted_data jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS document_ids text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS status text DEFAULT NULL;

-- Trigger: when Cloud Run sets 'status', mirror it to 'processing_status'
CREATE OR REPLACE FUNCTION public.sync_status_to_processing_status()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IS NOT NULL
     AND (NEW.processing_status IS NOT DISTINCT FROM OLD.processing_status) THEN
    NEW.processing_status := NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_status
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_status_to_processing_status();

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';