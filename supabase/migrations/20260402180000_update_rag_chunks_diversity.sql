-- ============================================================
-- Update match_rag_chunks() diversity logic
-- Changes partition from (source, chapter) to (source, COALESCE(section, chapter))
-- This allows multiple chunks from the same chapter when sections differ,
-- which is important for Nissim and Subramanyam sources that have
-- granular subsection structure within large chapters.
-- ============================================================

CREATE OR REPLACE FUNCTION match_rag_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.72,
  match_count INT DEFAULT 5,
  source_filter TEXT[] DEFAULT NULL,
  min_authority FLOAT DEFAULT 0.0,
  topic_filter TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  source_title TEXT,
  chapter TEXT,
  section TEXT,
  page_number INTEGER,
  similarity FLOAT,
  authority_weight FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
      -- Diversity: max 1 chunk per source + section (or chapter if no section)
      ROW_NUMBER() OVER (
        PARTITION BY rc.source, COALESCE(rc.section, rc.chapter)
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
  WHERE ranked_chunks.chapter_rank = 1  -- Max 1 chunk per section (diversity)
  ORDER BY ranked_chunks.similarity * ranked_chunks.authority_weight DESC  -- Weight by authority
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_rag_chunks IS 'Enhanced vector similarity search with source filtering, authority weighting, and section-level diversity. Uses COALESCE(section, chapter) for diversity partitioning to support sources with granular subsection structure.';
