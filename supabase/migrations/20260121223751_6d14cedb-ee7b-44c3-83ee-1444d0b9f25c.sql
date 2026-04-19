-- Fix the trigger function to use correct pg_net schema (net.http_post instead of extensions.http_post)
CREATE OR REPLACE FUNCTION public.notify_qb_sync_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
BEGIN
  -- Only trigger for QuickBooks data
  IF NEW.source_type = 'quickbooks' THEN
    -- Call edge function via pg_net (fire-and-forget)
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/complete-qb-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
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
  END IF;
  
  RETURN NEW;
END;
$function$;