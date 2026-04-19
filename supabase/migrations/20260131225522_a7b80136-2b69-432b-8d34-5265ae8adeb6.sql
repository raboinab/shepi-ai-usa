-- Drop the legacy function first (depends on table)
DROP FUNCTION IF EXISTS public.match_qoe_chunks(vector(1536), float, int);

-- Drop the legacy table
DROP TABLE IF EXISTS public.qoe_book_chunks;

-- Clear the new table for fresh upload
TRUNCATE public.rag_chunks;