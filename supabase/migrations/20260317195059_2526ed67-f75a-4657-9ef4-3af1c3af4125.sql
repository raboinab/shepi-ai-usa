DROP TRIGGER IF EXISTS on_reclassification_job_insert ON public.reclassification_jobs;
DROP FUNCTION IF EXISTS public.notify_reclassification_job();