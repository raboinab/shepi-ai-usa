UPDATE public.analysis_jobs
SET status = 'failed',
    error_message = 'Auto-expired: stale job manually cleared',
    updated_at = now()
WHERE project_id = '7ed459ed-5765-4435-ac78-4ea8f1c3d5e7'::uuid
  AND status IN ('queued', 'running');