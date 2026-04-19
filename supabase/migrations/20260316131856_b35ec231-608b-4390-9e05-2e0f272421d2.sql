UPDATE processed_data 
SET data = jsonb_set(jsonb_set(data::jsonb, '{_meta,status}', '"error"'), '{_meta,error}', '"Chain interrupted — please re-run"'),
    validation_status = 'error'
WHERE id = '8f08540f-c006-4610-b376-1fc8167a8694';