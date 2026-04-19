-- Enable pg_net extension for HTTP calls from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Function to call complete-qb-sync edge function when QB data is inserted
CREATE OR REPLACE FUNCTION public.notify_qb_sync_complete()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
BEGIN
  -- Call edge function via pg_net (fire-and-forget)
  SELECT net.http_post(
    url := supabase_url || '/functions/v1/complete-qb-sync',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'project_id', NEW.project_id::text,
      'data_type', NEW.data_type,
      'record_id', NEW.id::text,
      'source_type', NEW.source_type
    )
  ) INTO request_id;
  
  RAISE LOG 'notify_qb_sync_complete: triggered for project_id=%, data_type=%, request_id=%', 
    NEW.project_id, NEW.data_type, request_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_qb_data_inserted ON public.processed_data;

-- Create trigger on processed_data table
-- Fires when QuickBooks data is inserted
CREATE TRIGGER on_qb_data_inserted
  AFTER INSERT ON public.processed_data
  FOR EACH ROW
  WHEN (NEW.source_type = 'quickbooks' OR NEW.source_type = 'quickbooks_api')
  EXECUTE FUNCTION public.notify_qb_sync_complete();

-- Clean up stuck workflows (mark as failed)
UPDATE public.workflows 
SET 
  status = 'failed',
  error_message = 'Workflow timed out - migrated to new trigger-based sync',
  completed_at = now(),
  updated_at = now()
WHERE status IN ('pending', 'running')
AND workflow_type = 'SYNC_TO_SHEET'
AND updated_at < now() - interval '15 minutes';