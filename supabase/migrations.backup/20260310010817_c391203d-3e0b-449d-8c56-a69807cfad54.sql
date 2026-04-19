
CREATE OR REPLACE FUNCTION public.populate_detector_run_from_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.project_id IS NULL OR NEW.user_id IS NULL THEN
    SELECT project_id, user_id
    INTO NEW.project_id, NEW.user_id
    FROM public.analysis_jobs
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_populate_detector_run_from_job ON public.detector_runs;
CREATE TRIGGER trg_populate_detector_run_from_job
  BEFORE INSERT ON public.detector_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_detector_run_from_job();
