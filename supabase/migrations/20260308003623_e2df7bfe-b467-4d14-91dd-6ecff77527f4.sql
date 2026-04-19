
-- Create reclassification_jobs table
CREATE TABLE public.reclassification_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reclassification_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own reclassification jobs"
  ON public.reclassification_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reclassification jobs"
  ON public.reclassification_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all reclassification jobs"
  ON public.reclassification_jobs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.reclassification_jobs;

-- Trigger to invoke worker via pg_net on new pending job
CREATE OR REPLACE FUNCTION public.notify_reclassification_job()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT net.http_post(
      url := supabase_url || '/functions/v1/process-reclassification-job',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'job_id', NEW.id::text
      )
    ) INTO request_id;

    RAISE LOG 'notify_reclassification_job: triggered for job_id=%, request_id=%', NEW.id, request_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reclassification_job_insert
  AFTER INSERT ON public.reclassification_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_reclassification_job();
