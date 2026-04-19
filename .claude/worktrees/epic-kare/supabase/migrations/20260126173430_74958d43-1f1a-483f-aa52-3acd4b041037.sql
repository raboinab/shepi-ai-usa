-- Part 1: Create rate-limiting table for QB sync requests
CREATE TABLE IF NOT EXISTS public.qb_sync_requests (
  project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  last_requested_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1
);

-- Enable RLS but allow service role access
ALTER TABLE public.qb_sync_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view (for debugging)
CREATE POLICY "Admins can view sync requests" ON public.qb_sync_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Part 2: Update the trigger function with rate limiting
CREATE OR REPLACE FUNCTION public.notify_qb_sync_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
  last_request timestamptz;
  cooldown_seconds int := 10;
BEGIN
  IF NEW.source_type = 'quickbooks_api' THEN
    -- Rate limit check: skip if already triggered recently for this project
    SELECT last_requested_at INTO last_request
    FROM qb_sync_requests
    WHERE project_id = NEW.project_id;
    
    IF last_request IS NOT NULL 
       AND last_request > (now() - make_interval(secs => cooldown_seconds)) THEN
      -- Skip - already triggered recently
      RAISE LOG 'notify_qb_sync_complete: SKIPPED (rate limited) for project_id=%, last_request=%', 
        NEW.project_id, last_request;
      RETURN NEW;
    END IF;
    
    -- Update rate limit tracker (upsert)
    INSERT INTO qb_sync_requests (project_id, last_requested_at, request_count)
    VALUES (NEW.project_id, now(), 1)
    ON CONFLICT (project_id) 
    DO UPDATE SET 
      last_requested_at = now(),
      request_count = qb_sync_requests.request_count + 1;
    
    -- Fire the HTTP call (only once per 10 seconds per project)
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
    
    RAISE LOG 'notify_qb_sync_complete: triggered for project_id=%, request_id=%', 
      NEW.project_id, request_id;
  END IF;
  
  RETURN NEW;
END;
$function$;