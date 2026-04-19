-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Create table for storing book chunks with embeddings
CREATE TABLE IF NOT EXISTS public.qoe_book_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  chapter TEXT,
  page_number INT,
  chunk_index INT NOT NULL,
  token_count INT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster text search
CREATE INDEX IF NOT EXISTS qoe_book_chunks_chapter_idx ON public.qoe_book_chunks(chapter);
CREATE INDEX IF NOT EXISTS qoe_book_chunks_chunk_index_idx ON public.qoe_book_chunks(chunk_index);

-- Create vector similarity search index (IVFFlat for efficient approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS qoe_book_chunks_embedding_idx 
  ON public.qoe_book_chunks 
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION public.match_qoe_chunks(
  query_embedding extensions.vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  chapter TEXT,
  page_number INT,
  chunk_index INT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qoe_book_chunks.id,
    qoe_book_chunks.content,
    qoe_book_chunks.chapter,
    qoe_book_chunks.page_number,
    qoe_book_chunks.chunk_index,
    1 - (qoe_book_chunks.embedding <=> query_embedding) AS similarity
  FROM qoe_book_chunks
  WHERE 1 - (qoe_book_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY qoe_book_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_qoe_book_chunks_updated_at
  BEFORE UPDATE ON public.qoe_book_chunks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.qoe_book_chunks IS 'Stores chunked passages from the Quality of Earnings book with vector embeddings for RAG retrieval';