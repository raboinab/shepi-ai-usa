
-- Trigger function: when extracted_data transitions from NULL to non-NULL,
-- call the enrich-document edge function via pg_net.
CREATE OR REPLACE FUNCTION public.notify_enrich_document()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
BEGIN
  -- Only fire when extracted_data goes from NULL to non-NULL
  IF OLD.extracted_data IS NULL AND NEW.extracted_data IS NOT NULL THEN
    -- Only fire if not already enriched
    IF NEW.account_label IS NULL OR NEW.period_start IS NULL OR NEW.parsed_summary IS NULL THEN
      SELECT net.http_post(
        url := supabase_url || '/functions/v1/enrich-document',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'document_id', NEW.id::text
        )
      ) INTO request_id;

      RAISE LOG 'notify_enrich_document: triggered for document_id=%, request_id=%', NEW.id, request_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to documents table (AFTER UPDATE so the row is committed)
CREATE TRIGGER trg_enrich_document_on_extracted_data
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_enrich_document();

-- Also trigger on INSERT (Cloud Run may insert with extracted_data already set)
CREATE TRIGGER trg_enrich_document_on_insert
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_enrich_document();
