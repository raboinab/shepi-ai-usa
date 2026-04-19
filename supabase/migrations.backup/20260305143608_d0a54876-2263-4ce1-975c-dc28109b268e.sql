
-- Phase 1: project_data_chunks table + match_project_chunks RPC

-- 1. Create the table
CREATE TABLE public.project_data_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  data_type text NOT NULL,
  period text,
  fs_section text,
  chunk_key text NOT NULL UNIQUE,
  content text NOT NULL,
  embedding extensions.vector(1536),
  token_count integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes
CREATE INDEX idx_project_data_chunks_project_type ON public.project_data_chunks (project_id, data_type);
CREATE INDEX idx_project_data_chunks_embedding ON public.project_data_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 3. Enable RLS
ALTER TABLE public.project_data_chunks ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies
CREATE POLICY "Users can read chunks for their projects"
  ON public.project_data_chunks
  FOR SELECT
  TO authenticated
  USING (public.has_project_access(auth.uid(), project_id));

CREATE POLICY "Service role manages project chunks"
  ON public.project_data_chunks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5. match_project_chunks RPC with diversity logic
CREATE OR REPLACE FUNCTION public.match_project_chunks(
  _project_id uuid,
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.65,
  match_count integer DEFAULT 15,
  data_type_filter text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  data_type text,
  period text,
  fs_section text,
  content text,
  token_count integer,
  similarity double precision,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  -- Phase 1: top-1 per (data_type, period) partition for diversity
  diverse AS (
    SELECT * FROM scored WHERE partition_rank = 1
  ),
  -- Phase 2: fill remaining slots from all scored chunks by similarity
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
$$;
