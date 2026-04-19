-- Enable RLS on qoe_book_chunks table
ALTER TABLE public.qoe_book_chunks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read book chunks (they're public reference material, not user data)
CREATE POLICY "Anyone can read book chunks"
  ON public.qoe_book_chunks
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (managed by edge functions)
-- No user-facing write policies needed