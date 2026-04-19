-- Rewrite hardcoded old-project URLs inside trigger functions
-- and re-add the realtime publication on the new project.

-- ---------- 1. notify_qb_sync_complete ----------
CREATE OR REPLACE FUNCTION public.notify_qb_sync_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  request_id BIGINT;
  last_request timestamptz;
  cooldown_seconds int := 10;
BEGIN
  IF NEW.source_type = 'quickbooks_api' THEN
    SELECT last_requested_at INTO last_request
    FROM qb_sync_requests
    WHERE project_id = NEW.project_id;

    IF last_request IS NOT NULL
       AND last_request > (now() - make_interval(secs => cooldown_seconds)) THEN
      RAISE LOG 'notify_qb_sync_complete: SKIPPED (rate limited) for project_id=%, last_request=%',
        NEW.project_id, last_request;
      RETURN NEW;
    END IF;

    INSERT INTO qb_sync_requests (project_id, last_requested_at, request_count)
    VALUES (NEW.project_id, now(), 1)
    ON CONFLICT (project_id)
    DO UPDATE SET
      last_requested_at = now(),
      request_count = qb_sync_requests.request_count + 1;

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

-- ---------- 2. notify_enrich_document ----------
CREATE OR REPLACE FUNCTION public.notify_enrich_document()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  request_id BIGINT;
BEGIN
  IF OLD.extracted_data IS NULL AND NEW.extracted_data IS NOT NULL THEN
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
$function$;

-- ---------- 3. notify_new_signup ----------
CREATE OR REPLACE FUNCTION public.notify_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  user_email TEXT;
  request_id BIGINT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'event_type', 'signup',
      'user_email', COALESCE(user_email, 'unknown'),
      'user_name', COALESCE(NEW.full_name, 'Unknown')
    )
  ) INTO request_id;

  RAISE LOG 'notify_new_signup: triggered for user_id=%, request_id=%', NEW.user_id, request_id;
  RETURN NEW;
END;
$function$;

-- ---------- 4. Re-add realtime publication ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE
  public.adjustment_proposals,
  public.analysis_jobs,
  public.chat_messages,
  public.documents,
  public.projects,
  public.reclassification_jobs,
  public.workflows;

-- ---------- 5. Storage bucket ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Note: the `app.settings.service_role_key` GUC referenced in triggers above is
-- a Lovable-Cloud convention. On a standard Supabase project this returns NULL.
-- After verifying everything works, set it (one-time) by storing the new project's
-- service role key in Supabase Vault and updating each trigger to read from there,
-- OR remove the Authorization header entirely and configure each receiving edge
-- function with `verify_jwt = false`.
