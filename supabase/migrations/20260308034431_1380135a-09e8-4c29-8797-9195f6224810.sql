UPDATE reclassification_jobs 
SET status = 'failed', error_message = 'Timed out - sequential batches exceeded edge function limit', updated_at = now()
WHERE id = '87281c24-3a83-401d-88b8-145c997598bd' AND status = 'processing';