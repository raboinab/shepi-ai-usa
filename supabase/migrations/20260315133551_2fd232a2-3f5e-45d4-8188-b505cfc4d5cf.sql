CREATE INDEX IF NOT EXISTS idx_documents_project_filepath 
  ON public.documents (project_id, file_path);