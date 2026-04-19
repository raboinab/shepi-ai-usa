-- Function to update workflow progress when processed_data is inserted
CREATE OR REPLACE FUNCTION update_workflow_progress_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  active_workflow_id UUID;
  workflow_started_at TIMESTAMPTZ;
  input_payload JSONB;
  record_count INTEGER;
  expected_count INTEGER;
  progress_pct INTEGER;
BEGIN
  -- Only process QuickBooks API data
  IF NEW.source_type != 'quickbooks_api' THEN
    RETURN NEW;
  END IF;

  -- Find active SYNC_TO_SHEET workflow for this project
  SELECT id, started_at, input_payload INTO active_workflow_id, workflow_started_at, input_payload
  FROM workflows
  WHERE project_id = NEW.project_id
    AND workflow_type = 'SYNC_TO_SHEET'
    AND status = 'running'
  ORDER BY started_at DESC
  LIMIT 1;
  
  IF active_workflow_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count trial_balance records synced since workflow started
  SELECT COUNT(*) INTO record_count
  FROM processed_data
  WHERE project_id = NEW.project_id
    AND source_type = 'quickbooks_api'
    AND data_type = 'trial_balance'
    AND created_at >= workflow_started_at;
  
  -- Calculate expected count from input_payload date range
  -- Default to 36 months (3 years) if not specified
  BEGIN
    expected_count := COALESCE(
      (
        SELECT (
          EXTRACT(YEAR FROM AGE(
            (input_payload->>'end_date')::DATE,
            (input_payload->>'start_date')::DATE
          )) * 12 + 
          EXTRACT(MONTH FROM AGE(
            (input_payload->>'end_date')::DATE,
            (input_payload->>'start_date')::DATE
          )) + 1
        )::INTEGER
      ),
      36
    );
  EXCEPTION WHEN OTHERS THEN
    expected_count := 36;
  END;
  
  -- Ensure expected_count is at least 1 to avoid division by zero
  IF expected_count < 1 THEN
    expected_count := 36;
  END IF;
  
  -- Calculate progress (15-80% range for fetch_qb step)
  -- 15% is starting point, 80% means fetch complete (transform/push remaining)
  progress_pct := 15 + LEAST(65, (record_count::float / expected_count * 65)::integer);
  
  -- Update workflow progress and timestamp
  UPDATE workflows
  SET progress_percent = progress_pct,
      updated_at = NOW()
  WHERE id = active_workflow_id
    AND status = 'running';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger (drop if exists first)
DROP TRIGGER IF EXISTS trigger_workflow_progress_on_processed_data ON processed_data;
CREATE TRIGGER trigger_workflow_progress_on_processed_data
AFTER INSERT ON processed_data
FOR EACH ROW
EXECUTE FUNCTION update_workflow_progress_on_insert();