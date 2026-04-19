-- Add indexes to eliminate millions of sequential scans caused by RLS policy evaluations

-- 1. projects.user_id — root cause; used by has_project_access() on every auth request
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects (user_id);

-- 2. projects(id, user_id) — covers the exact has_project_access() lookup pattern
CREATE INDEX IF NOT EXISTS idx_projects_id_user ON public.projects (id, user_id);

-- 3. analysis_jobs.user_id — used by RLS "users can update/insert their own"
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user ON public.analysis_jobs (user_id);

-- 4. project_shares.project_id — used by has_project_access() collaborator check
CREATE INDEX IF NOT EXISTS idx_project_shares_project ON public.project_shares (project_id);