-- Enable pgvector extension for vector similarity search
create extension if not exists vector;

-- Create table for QoE book chunks
create table if not exists qoe_book_chunks (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  chapter text,
  page_number int,
  chunk_index int not null,
  token_count int,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for similarity search using cosine distance
create index if not exists qoe_book_chunks_embedding_idx 
  on qoe_book_chunks 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create index for filtering by chapter
create index if not exists qoe_book_chunks_chapter_idx 
  on qoe_book_chunks (chapter);

-- Create function to search for similar chunks
create or replace function match_qoe_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  chapter text,
  page_number int,
  chunk_index int,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    qoe_book_chunks.id,
    qoe_book_chunks.content,
    qoe_book_chunks.chapter,
    qoe_book_chunks.page_number,
    qoe_book_chunks.chunk_index,
    qoe_book_chunks.metadata,
    1 - (qoe_book_chunks.embedding <=> query_embedding) as similarity
  from qoe_book_chunks
  where 1 - (qoe_book_chunks.embedding <=> query_embedding) > match_threshold
  order by qoe_book_chunks.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Add comment
comment on table qoe_book_chunks is 'Stores chunked content from Quality of Earnings book with embeddings for RAG retrieval';
comment on function match_qoe_chunks is 'Performs vector similarity search to find relevant book chunks for a given query embedding';
