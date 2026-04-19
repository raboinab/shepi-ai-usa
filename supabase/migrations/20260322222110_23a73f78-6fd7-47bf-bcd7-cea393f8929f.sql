-- Remove duplicate detector_runs, keeping only the latest per (job_id, detector_type)
DELETE FROM public.detector_runs
WHERE id NOT IN (
  SELECT DISTINCT ON (job_id, detector_type) id
  FROM public.detector_runs
  ORDER BY job_id, detector_type, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.detector_runs
  ADD CONSTRAINT detector_runs_job_detector_unique UNIQUE (job_id, detector_type);

-- Add tracking columns to analysis_jobs
ALTER TABLE public.analysis_jobs
  ADD COLUMN IF NOT EXISTS worker_run_id text,
  ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;