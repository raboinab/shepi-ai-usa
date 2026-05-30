CREATE OR REPLACE FUNCTION public.notify_cpa_chat_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  request_id BIGINT;
  has_cpa_claim boolean;
BEGIN
  -- Only notify on real human↔human engagement chat.
  -- AI assistant chat (wizard/other contexts) must not generate emails or notifications,
  -- regardless of role (the CPA's own AI prompts are role='user' too).
  IF NEW.context_type IS DISTINCT FROM 'engagement' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.cpa_claims WHERE project_id = NEW.project_id
  ) INTO has_cpa_claim;

  IF NOT has_cpa_claim THEN
    RETURN NEW;
  END IF;

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cpa-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'event_type', 'chat_message',
      'message_id', NEW.id::text,
      'project_id', NEW.project_id::text,
      'sender_user_id', NEW.user_id::text,
      'role', NEW.role,
      'preview', LEFT(COALESCE(NEW.content, ''), 240)
    )
  ) INTO request_id;
  RETURN NEW;
END;
$function$;