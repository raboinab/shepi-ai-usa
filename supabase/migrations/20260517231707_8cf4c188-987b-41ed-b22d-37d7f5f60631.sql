
-- 1. cpa_notifications table
CREATE TABLE public.cpa_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cpa_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.cpa_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications"
  ON public.cpa_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own notifications"
  ON public.cpa_notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins view all notifications"
  ON public.cpa_notifications FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access cpa notifications"
  ON public.cpa_notifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX idx_cpa_notifications_user_unread
  ON public.cpa_notifications(user_id, read_at NULLS FIRST, created_at DESC);

-- 2. Trigger: new DFY project posted
CREATE OR REPLACE FUNCTION public.notify_cpa_dfy_project_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  request_id BIGINT;
BEGIN
  IF NEW.service_tier = 'done_for_you' THEN
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/cpa-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'event_type', 'dfy_project_posted',
        'project_id', NEW.id::text,
        'industry', NEW.industry,
        'transaction_type', NEW.transaction_type,
        'target_company', NEW.target_company,
        'client_name', NEW.client_name
      )
    ) INTO request_id;
    RAISE LOG 'notify_cpa_dfy_project_created: project_id=%, request_id=%', NEW.id, request_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_cpa_dfy_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cpa_dfy_project_created();

-- Also catch projects that get upgraded to DFY later
CREATE OR REPLACE FUNCTION public.notify_cpa_dfy_project_upgraded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  request_id BIGINT;
BEGIN
  IF NEW.service_tier = 'done_for_you'
     AND (OLD.service_tier IS DISTINCT FROM NEW.service_tier) THEN
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/cpa-notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'event_type', 'dfy_project_posted',
        'project_id', NEW.id::text,
        'industry', NEW.industry,
        'transaction_type', NEW.transaction_type,
        'target_company', NEW.target_company,
        'client_name', NEW.client_name
      )
    ) INTO request_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_cpa_dfy_project_upgraded
  AFTER UPDATE OF service_tier ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cpa_dfy_project_upgraded();

-- 3. Trigger: cpa_claims insert / status change
CREATE OR REPLACE FUNCTION public.notify_cpa_claim_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  request_id BIGINT;
  evt text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    evt := 'claim_created';
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    evt := 'claim_status_changed';
  ELSE
    RETURN NEW;
  END IF;

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/cpa-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'event_type', evt,
      'claim_id', NEW.id::text,
      'project_id', NEW.project_id::text,
      'cpa_user_id', NEW.cpa_user_id::text,
      'status', NEW.status,
      'previous_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END
    )
  ) INTO request_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_cpa_claim_change
  AFTER INSERT OR UPDATE ON public.cpa_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cpa_claim_change();

-- 4. Trigger: chat message → notify other party (function debounces)
CREATE OR REPLACE FUNCTION public.notify_cpa_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT := 'https://mdgmessqbfebrbvjtndz.supabase.co';
  request_id BIGINT;
  has_cpa_claim boolean;
BEGIN
  -- Only fire if this project has a CPA engagement
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
$$;

CREATE TRIGGER trg_notify_cpa_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_cpa_chat_message();
