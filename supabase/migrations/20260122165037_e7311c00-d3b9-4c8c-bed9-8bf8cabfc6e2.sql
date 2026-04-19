CREATE OR REPLACE FUNCTION public.update_workflow_progress_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  active_workflow_id UUID;
  workflow_started_at TIMESTAMPTZ;
  v_input_payload JSONB;
  record_count INTEGER;
  expected_count INTEGER;
  progress_pct INTEGER;
BEGIN
  -- Only process QuickBooks API data
  IF NEW.source_type != 'quickbooks_api' THEN
    RETURN NEW;
  END IF;

  -- Find active SYNC_TO_SHEET workflow for this project
  SELECT w.id, w.started_at, w.input_payload 
  INTO active_workflow_id, workflow_started_at, v_input_payload
  FROM workflows w
  WHERE w.project_id = NEW.project_id
    AND w.workflow_type = 'SYNC_TO_SHEET'
    AND w.status = 'running'
  ORDER BY w.started_at DESC
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
  
  -- Calculate expected count from v_input_payload date range
  BEGIN
    expected_count := COALESCE(
      (
        SELECT (
          EXTRACT(YEAR FROM AGE(
            (v_input_payload->>'end_date')::DATE,
            (v_input_payload->>'start_date')::DATE
          )) * 12 + 
          EXTRACT(MONTH FROM AGE(
            (v_input_payload->>'end_date')::DATE,
            (v_input_payload->>'start_date')::DATE
          )) + 1
        )::INTEGER
      ),
      36
    );
  EXCEPTION WHEN OTHERS THEN
    expected_count := 36;
  END;
  
  -- Ensure expected_count is at least 1
  IF expected_count < 1 THEN
    expected_count := 36;
  END IF;
  
  -- Calculate progress (15-80% range for fetch_qb step)
  progress_pct := 15 + LEAST(65, (record_count::float / expected_count * 65)::integer);
  
  -- Update workflow progress
  UPDATE workflows
  SET progress_percent = progress_pct,
      updated_at = NOW()
  WHERE id = active_workflow_id
    AND status = 'running';
  
  RETURN NEW;
END;
$function$;