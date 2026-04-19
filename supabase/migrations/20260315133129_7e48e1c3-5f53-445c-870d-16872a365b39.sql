CREATE INDEX IF NOT EXISTS idx_processed_data_project_type 
  ON public.processed_data (project_id, data_type);

CREATE INDEX IF NOT EXISTS idx_project_shares_shared_user 
  ON public.project_shares (shared_with_user_id);

CREATE INDEX IF NOT EXISTS idx_project_shares_shared_email 
  ON public.project_shares (shared_with_email);

CREATE INDEX IF NOT EXISTS idx_documents_project_status 
  ON public.documents (project_id, processing_status);