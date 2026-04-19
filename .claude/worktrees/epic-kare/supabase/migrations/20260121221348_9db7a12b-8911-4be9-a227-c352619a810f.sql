-- Fix search_path for the notify_qb_sync_complete function
CREATE OR REPLACE FUNCTION public.notify_qb_sync_complete()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
BEGIN
  -- Call edge function via pg_net (fire-and-forget)
  SELECT extensions.http_post(
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;