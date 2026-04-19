CREATE INDEX IF NOT EXISTS idx_canonical_transactions_project ON public.canonical_transactions (project_id);
CREATE INDEX IF NOT EXISTS idx_flagged_transactions_project_status ON public.flagged_transactions (project_id, status);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_project_status ON public.adjustment_proposals (project_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_context ON public.chat_messages (project_id, context_type);
CREATE INDEX IF NOT EXISTS idx_processed_data_project_type ON public.processed_data (project_id, data_type);