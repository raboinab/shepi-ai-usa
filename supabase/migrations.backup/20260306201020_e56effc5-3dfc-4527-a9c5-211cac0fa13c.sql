CREATE OR REPLACE FUNCTION public.match_project_chunks(_project_id uuid, query_embedding extensions.vector, match_threshold double precision DEFAULT 0.65, match_count integer DEFAULT 15, data_type_filter text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, data_type text, period text, fs_section text, content text, token_count integer, similarity double precision, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      c.id,
      c.data_type,
      c.period,
      c.fs_section,
      c.content,
      c.token_count,
      (1 - (c.embedding <=> query_embedding))::double precision AS similarity,
      c.metadata,
      ROW_NUMBER() OVER (
        PARTITION BY c.data_type, c.period
        ORDER BY (1 - (c.embedding <=> query_embedding)) DESC
      ) AS partition_rank
    FROM public.project_data_chunks c
    WHERE
      c.project_id = _project_id
      AND c.embedding IS NOT NULL
      AND (1 - (c.embedding <=> query_embedding)) > match_threshold
      AND (data_type_filter IS NULL OR c.data_type = ANY(data_type_filter))
  ),
  diverse AS (
    SELECT * FROM scored WHERE partition_rank = 1
  ),
  combined AS (
    (SELECT *, 1 AS priority FROM diverse)
    UNION ALL
    (SELECT *, 2 AS priority FROM scored WHERE partition_rank > 1)
  )
  SELECT
    combined.id,
    combined.data_type,
    combined.period,
    combined.fs_section,
    combined.content,
    combined.token_count,
    combined.similarity,
    combined.metadata
  FROM combined
  ORDER BY combined.priority, combined.similarity DESC
  LIMIT match_count;
END;
$function$;