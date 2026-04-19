-- ============================================================
-- Multi-Source RAG Upgrade Migration
-- Creates rag_chunks table and match_rag_chunks() function
-- Migrates existing data from qoe_book_chunks
-- ============================================================

-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create new unified RAG chunks table
CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core content
  content TEXT NOT NULL,
  embedding vector(1536),
  
  -- Source identification
  source TEXT NOT NULL,  -- 'oglove', 'edwards', 'openstax', etc.
  source_title TEXT,     -- Full book/source title
  source_license TEXT,   -- 'proprietary', 'cc-by', 'cc-by-sa', etc.
  
  -- Location within source
  chapter TEXT,
  section TEXT,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL,
  
  -- Metadata for filtering/weighting
  topic_tags TEXT[] DEFAULT '{}',
  authority_weight FLOAT DEFAULT 1.0,  -- 1.0 = primary, 0.5 = secondary
  token_count INTEGER,
  
  -- Audit
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient retrieval
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source ON rag_chunks(source);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON rag_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_topics ON rag_chunks USING gin(topic_tags);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_authority ON rag_chunks(authority_weight);

-- Enable RLS
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Read-only for authenticated users, no public insert/update/delete
CREATE POLICY "Anyone can read rag chunks"
ON rag_chunks FOR SELECT USING (true);

CREATE POLICY "Only service role can manage rag chunks"
ON rag_chunks FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create timestamp update trigger
CREATE TRIGGER update_rag_chunks_updated_at
BEFORE UPDATE ON rag_chunks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Enhanced match function with multi-source support
-- Supports: source filtering, dynamic K, authority weighting,
-- similarity threshold, and chapter-level diversity
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
      -- Rank within each source+chapter for diversity (max 1 per chapter per source)
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
  WHERE ranked_chunks.chapter_rank = 1  -- Max 1 chunk per chapter (diversity)
  ORDER BY ranked_chunks.similarity * ranked_chunks.authority_weight DESC  -- Weight by authority
  LIMIT match_count;
END;
$$;

-- ============================================================
-- Migrate existing data from qoe_book_chunks to rag_chunks
-- ============================================================

INSERT INTO rag_chunks (
  id,
  content,
  embedding,
  source,
  source_title,
  source_license,
  chapter,
  section,
  page_number,
  chunk_index,
  topic_tags,
  authority_weight,
  token_count,
  metadata,
  created_at,
  updated_at
)
SELECT
  id,
  content,
  embedding,
  'oglove' AS source,
  'Quality of Earnings by Thornton L. O''Glove' AS source_title,
  'proprietary' AS source_license,
  chapter,
  NULL AS section,
  page_number,
  chunk_index,
  '{}' AS topic_tags,
  1.0 AS authority_weight,
  token_count,
  metadata,
  created_at,
  updated_at
FROM qoe_book_chunks
WHERE NOT EXISTS (
  SELECT 1 FROM rag_chunks WHERE rag_chunks.id = qoe_book_chunks.id
);

-- ============================================================
-- Add comment for documentation
-- ============================================================

COMMENT ON TABLE rag_chunks IS 'Multi-source RAG knowledge base for QoE analysis. Supports multiple books/sources with authority weighting and topic filtering.';
COMMENT ON FUNCTION match_rag_chunks IS 'Enhanced vector similarity search with source filtering, authority weighting, and chapter-level diversity to prevent duplicate content.';