
CREATE OR REPLACE FUNCTION public.notify_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  user_email TEXT;
  request_id BIGINT;
BEGIN
  -- Look up the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

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

CREATE TRIGGER on_profile_created_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_signup();
