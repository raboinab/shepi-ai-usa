
-- Webhook idempotency table
CREATE TABLE public.processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: service role only
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages webhook events"
  ON public.processed_webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-cleanup: delete events older than 7 days (optional index)
CREATE INDEX idx_processed_webhook_events_processed_at ON public.processed_webhook_events (processed_at);
