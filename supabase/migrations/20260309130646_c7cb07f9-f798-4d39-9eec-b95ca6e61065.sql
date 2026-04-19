
-- Helper function: chunked reads with per-query timeout for large JSONB rows
CREATE OR REPLACE FUNCTION public.fetch_processed_data_chunked(
  _project_id uuid,
  _data_type text,
  _chunk_size int DEFAULT 50,
  _offset int DEFAULT 0
)
RETURNS SETOF public.processed_data
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  SET LOCAL statement_timeout = '900s';
  RETURN QUERY
    SELECT * FROM public.processed_data
    WHERE project_id = _project_id
      AND data_type = _data_type
    ORDER BY id
    LIMIT _chunk_size
    OFFSET _offset;
END;
$$;

-- Helper function: lightweight metadata fetch (excludes heavy `data` column)
CREATE OR REPLACE FUNCTION public.fetch_processed_data_ids(
  _project_id uuid,
  _data_type text
)
RETURNS TABLE(id uuid, period_start date, period_end date, source_type text, record_count int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  SET LOCAL statement_timeout = '60s';
  RETURN QUERY
    SELECT pd.id, pd.period_start, pd.period_end, pd.source_type, pd.record_count
    FROM public.processed_data pd
    WHERE pd.project_id = _project_id
      AND pd.data_type = _data_type
    ORDER BY pd.period_start;
END;
$$;
