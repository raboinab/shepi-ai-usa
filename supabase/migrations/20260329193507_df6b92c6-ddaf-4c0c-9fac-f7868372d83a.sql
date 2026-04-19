UPDATE processed_data 
SET data = (data::jsonb - '_delta_reconciliation')::json,
    updated_at = now()
WHERE id = 'c8c40c55-8707-4930-9229-e8b7d4b36f9f'
  AND project_id = '1fb7f974-cb7e-4b28-9006-818e05c4c591';