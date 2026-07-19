-- Restrict public read access to rag_chunks.
--
-- Previously "Anyone can read rag chunks" (USING (true)) made every column --
-- including source, source_title, source_license ('proprietary'), page_number,
-- and the verbatim book content -- readable by anyone holding the public anon
-- key. That is internal knowledge-base content and should not be world-readable.
--
-- Retrieval is unaffected:
--   * insights-chat edge function reads via the service_role key (bypasses RLS)
--   * match_rag_chunks() is SECURITY DEFINER (bypasses RLS)
-- The only frontend reader is the admin-only useRAGStats hook, so we replace the
-- public policy with an admin-scoped read policy.

DROP POLICY IF EXISTS "Anyone can read rag chunks" ON public.rag_chunks;
DROP POLICY IF EXISTS "Admins can read rag chunks" ON public.rag_chunks;

CREATE POLICY "Admins can read rag chunks"
  ON public.rag_chunks
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Note: "Only service role can manage rag chunks" (FOR ALL, service_role) is
-- left in place -- ingestion/embedding and retrieval continue to work.
