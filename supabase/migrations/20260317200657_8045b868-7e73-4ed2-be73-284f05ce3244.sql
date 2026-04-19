CREATE OR REPLACE FUNCTION public.match_rag_chunks(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.72, match_count integer DEFAULT 5, source_filter text[] DEFAULT NULL::text[], min_authority double precision DEFAULT 0.0, topic_filter text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, content text, source text, source_title text, chapter text, section text, page_number integer, similarity double precision, authority_weight double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked_chunks AS (
    SELECT
      rc.id,
      rc.content,
      rc.source,
      rc.source_title,
      rc.chapter,
      rc.section,
      rc.page_number,
      (1 - (rc.embedding <=> query_embedding))::FLOAT AS similarity,
      rc.authority_weight,
      ROW_NUMBER() OVER (
        PARTITION BY rc.source, rc.chapter 
        ORDER BY (1 - (rc.embedding <=> query_embedding)) DESC
      ) AS chapter_rank
    FROM rag_chunks rc
    WHERE 
      rc.embedding IS NOT NULL
      AND (1 - (rc.embedding <=> query_embedding)) > match_threshold
      AND (source_filter IS NULL OR rc.source = ANY(source_filter))
      AND rc.authority_weight >= min_authority
      AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
  )
  SELECT 
    ranked_chunks.id,
    ranked_chunks.content,
    ranked_chunks.source,
    ranked_chunks.source_title,
    ranked_chunks.chapter,
    ranked_chunks.section,
    ranked_chunks.page_number,
    ranked_chunks.similarity,
    ranked_chunks.authority_weight
  FROM ranked_chunks
  WHERE ranked_chunks.chapter_rank = 1
  ORDER BY ranked_chunks.similarity * ranked_chunks.authority_weight DESC
  LIMIT match_count;
END;
$function$;