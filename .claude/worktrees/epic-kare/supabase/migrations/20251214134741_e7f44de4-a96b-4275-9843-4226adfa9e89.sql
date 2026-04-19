-- Add document tracking columns for bank statements
ALTER TABLE documents ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS account_label TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS account_type TEXT; -- 'bank_statement' | 'credit_card' | 'general_ledger'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS docuclipper_job_id TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending'; -- 'pending' | 'processing' | 'completed' | 'failed'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parsed_summary JSONB; -- Account numbers, transaction count, total debits/credits
ALTER TABLE documents ADD COLUMN IF NOT EXISTS coverage_validated BOOLEAN DEFAULT FALSE;

-- Add index for project lookups
CREATE INDEX IF NOT EXISTS idx_documents_project_status ON documents(project_id, processing_status);