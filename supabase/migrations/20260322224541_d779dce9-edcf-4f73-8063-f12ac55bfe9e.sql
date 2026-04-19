
DELETE FROM public.detector_runs
WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';

DELETE FROM public.canonical_transactions
WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';

DELETE FROM public.analysis_jobs
WHERE project_id = '7ed459ed-a728-4bec-9e9d-b35eb036d46a';
