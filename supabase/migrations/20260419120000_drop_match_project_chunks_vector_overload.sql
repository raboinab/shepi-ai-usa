-- Resolves PGRST203 on insights-chat RAG calls.
-- Two overloads of match_project_chunks existed (uuid,vector,...) and (uuid,text,...);
-- PostgREST saw the edge function's JSON-string embedding as reachable by both (direct
-- to text, implicit cast to vector) and refused the call. The app at
-- supabase/functions/insights-chat/index.ts:274 sends the embedding as a stringified
-- array and relies on the text overload, which casts internally via query_embedding::vector(1536).
-- Dropping the vector overload leaves one unambiguous function.

DROP FUNCTION IF EXISTS public.match_project_chunks(
  uuid, vector, double precision, integer, text[]
);
