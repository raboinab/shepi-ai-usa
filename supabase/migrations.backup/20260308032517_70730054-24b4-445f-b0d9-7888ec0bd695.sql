UPDATE reclassification_jobs 
SET status = 'failed', error_message = 'Reset - adding batch support', updated_at = now()
WHERE id = 'f182f490-ffeb-4a4c-b928-4916646c009d' AND status = 'processing';