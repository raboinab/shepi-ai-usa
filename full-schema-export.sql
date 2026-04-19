-- ============================================================
-- SHEPI AI – Complete Database Schema Export
-- Exported: 2026-03-11
-- Project: sqwohcvobfnymsbzlfqr
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- 2. CUSTOM ENUM TYPES
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TYPE public.workflow_type AS ENUM (
  'IMPORT_QUICKBOOKS_DATA',
  'PROCESS_DOCUMENT',
  'SYNC_TO_SHEET',
  'FULL_DATA_SYNC',
  'GENERATE_QOE_REPORT',
  'VALIDATE_ADJUSTMENTS',
  'REFRESH_QB_TOKEN'
);

CREATE TYPE public.workflow_status AS ENUM (
  'pending', 'running', 'completed', 'failed', 'cancelled'
);

CREATE TYPE public.proof_validation_status AS ENUM (
  'validated', 'supported', 'partial', 'insufficient', 'contradictory', 'pending'
);

-- ============================================================
-- 3. TABLES
-- ============================================================

-- profiles
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text,
  company text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

-- user_roles
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role)
);

-- user_credits
CREATE TABLE public.user_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  credits_remaining integer NOT NULL DEFAULT 0,
  total_credits_purchased integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_credits_pkey PRIMARY KEY (id),
  CONSTRAINT user_credits_user_id_key UNIQUE (user_id)
);

-- subscriptions
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type text NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id)
);

-- tos_acceptances
CREATE TABLE public.tos_acceptances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tos_version text NOT NULL,
  ip_address text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tos_acceptances_pkey PRIMARY KEY (id)
);

-- whitelisted_users
CREATE TABLE public.whitelisted_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  notes text,
  added_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whitelisted_users_pkey PRIMARY KEY (id),
  CONSTRAINT whitelisted_users_email_key UNIQUE (email)
);

-- contact_submissions
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  company text,
  role text,
  interest text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
);

-- demo_views
CREATE TABLE public.demo_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  page text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT demo_views_pkey PRIMARY KEY (id)
);

-- nudge_log
CREATE TABLE public.nudge_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nudge_type text NOT NULL,
  email_id text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT nudge_log_pkey PRIMARY KEY (id)
);

-- admin_notes
CREATE TABLE public.admin_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_notes_pkey PRIMARY KEY (id)
);

-- processed_webhook_events
CREATE TABLE public.processed_webhook_events (
  event_id text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processed_webhook_events_pkey PRIMARY KEY (event_id)
);

-- promo_config
CREATE TABLE public.promo_config (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL,
  value integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promo_config_pkey PRIMARY KEY (id),
  CONSTRAINT promo_config_key_key UNIQUE (key)
);

-- projects
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  client_name text,
  target_company text,
  transaction_type text,
  industry text,
  status text DEFAULT 'draft',
  fiscal_year_end text,
  periods jsonb DEFAULT '[]'::jsonb,
  wizard_data jsonb DEFAULT '{}'::jsonb,
  current_phase integer DEFAULT 1,
  current_section integer DEFAULT 1,
  google_sheet_id text,
  google_sheet_url text,
  funded_by_credit boolean NOT NULL DEFAULT false,
  credit_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- project_shares
CREATE TABLE public.project_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  shared_with_user_id uuid,
  role text NOT NULL DEFAULT 'editor',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT project_shares_pkey PRIMARY KEY (id),
  CONSTRAINT project_shares_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- project_payments
CREATE TABLE public.project_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT project_payments_pkey PRIMARY KEY (id),
  CONSTRAINT project_payments_project_id_key UNIQUE (project_id),
  CONSTRAINT project_payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- company_info
CREATE TABLE public.company_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid,
  company_name text,
  realm_id text,
  bearer_token text,
  refresh_token text,
  auth_code text,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_info_pkey PRIMARY KEY (id),
  CONSTRAINT company_info_project_id_key UNIQUE (project_id),
  CONSTRAINT company_info_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- documents
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  category text,
  document_type text,
  institution text,
  account_label text,
  account_type text,
  company_name text,
  status text,
  processing_status text DEFAULT 'pending',
  job_id text,
  docuclipper_job_id text,
  document_ids text,
  extracted_data jsonb,
  parsed_summary jsonb,
  validation_result jsonb,
  coverage_validated boolean DEFAULT false,
  validated_at timestamptz,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- docuclipper_jobs
CREATE TABLE public.docuclipper_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  job_id text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  error_message text,
  extracted_data jsonb,
  transaction_count integer,
  period_start date,
  period_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT docuclipper_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT docuclipper_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT docuclipper_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- processed_data
CREATE TABLE public.processed_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  source_document_id uuid,
  source_type text NOT NULL,
  data_type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  qb_realm_id text,
  validation_status text NOT NULL DEFAULT 'pending',
  record_count integer,
  period_start date,
  period_end date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT processed_data_pkey PRIMARY KEY (id),
  CONSTRAINT processed_data_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT processed_data_source_document_id_fkey FOREIGN KEY (source_document_id) REFERENCES public.documents(id)
);

-- chat_messages
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  context_type text NOT NULL DEFAULT 'wizard',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- flagged_transactions
CREATE TABLE public.flagged_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  description text NOT NULL,
  account_name text NOT NULL,
  amount numeric NOT NULL,
  transaction_date date NOT NULL,
  flag_type text NOT NULL,
  flag_reason text NOT NULL,
  flag_category text NOT NULL DEFAULT 'adjustment_candidate',
  confidence_score numeric NOT NULL DEFAULT 0.5,
  suggested_adjustment_type text,
  suggested_adjustment_amount numeric,
  status text NOT NULL DEFAULT 'pending',
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  source_data jsonb DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flagged_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT flagged_transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- adjustment_proofs
CREATE TABLE public.adjustment_proofs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  adjustment_id text NOT NULL,
  document_id uuid,
  validation_status public.proof_validation_status NOT NULL DEFAULT 'pending',
  validation_score integer,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  key_findings text[] DEFAULT '{}'::text[],
  red_flags text[] DEFAULT '{}'::text[],
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT adjustment_proofs_pkey PRIMARY KEY (id),
  CONSTRAINT adjustment_proofs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT adjustment_proofs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- workflows
CREATE TABLE public.workflows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  workflow_type public.workflow_type NOT NULL,
  status public.workflow_status NOT NULL DEFAULT 'pending',
  current_step text,
  progress_percent integer NOT NULL DEFAULT 0,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb,
  error_message text,
  error_details jsonb,
  retry_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workflows_pkey PRIMARY KEY (id),
  CONSTRAINT workflows_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- qb_sync_requests
CREATE TABLE public.qb_sync_requests (
  project_id uuid NOT NULL,
  last_requested_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  CONSTRAINT qb_sync_requests_pkey PRIMARY KEY (project_id),
  CONSTRAINT qb_sync_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- rag_chunks
CREATE TABLE public.rag_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text NOT NULL,
  source text NOT NULL,
  source_title text,
  source_license text,
  chapter text,
  section text,
  page_number integer,
  chunk_index integer NOT NULL,
  embedding extensions.vector,
  authority_weight double precision DEFAULT 1.0,
  token_count integer,
  topic_tags text[] DEFAULT '{}'::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT rag_chunks_pkey PRIMARY KEY (id)
);

-- reclassification_jobs
CREATE TABLE public.reclassification_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reclassification_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT reclassification_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE
);

-- analysis_jobs
CREATE TABLE public.analysis_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  job_type text NOT NULL DEFAULT 'full_discovery',
  status text NOT NULL DEFAULT 'queued',
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  detector_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress_percent integer NOT NULL DEFAULT 0,
  error_message text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT analysis_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT analysis_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- ============================================================
-- canonical_transactions
-- ============================================================
-- IMPORTANT FOR BACKEND / DISCOVERY SERVICE:
--   For GL rows (source_type = 'general_ledger'):
--     - 'amount' is typically NULL
--     - Use 'amount_signed' for signed values (e.g., 12000.00 or -5000.00)
--     - Use 'amount_abs' for absolute values (always positive)
--     - 'description' is often empty; use 'memo' or 'vendor' as fallback text fields
--     - 'payee' is another fallback for entity identification
--   For bank/credit-card rows (source_type = 'bank' | 'credit_card'):
--     - 'amount' is typically populated
--     - 'description' is usually populated
-- ============================================================
CREATE TABLE public.canonical_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  source_type text NOT NULL,                    -- 'general_ledger', 'bank', 'credit_card'
  source_txn_id text,                           -- original ID from source system
  source_record_id text,
  source_document_id uuid,
  source_processed_data_id uuid,
  job_id uuid,                                  -- FK to analysis_jobs
  txn_date date,
  amount numeric,                               -- OFTEN NULL for GL rows — see notes above
  amount_abs numeric,                           -- absolute value (always positive)
  amount_signed numeric,                        -- signed value (preserves debit/credit direction)
  description text,                             -- OFTEN EMPTY for GL rows
  memo text,                                    -- secondary text field (fallback for description)
  vendor text,                                  -- vendor/payee name
  payee text,                                   -- alternative payee field
  account_name text,                            -- e.g. "Repairs & Maintenance"
  account_number text,
  account_type text,                            -- e.g. "Expense", "Income", "Asset"
  txn_type text,                                -- e.g. "Journal Entry", "Bill", "Check"
  split_account text,
  check_number text,
  posting_period text,                          -- e.g. "2024-01"
  is_year_end boolean DEFAULT false,
  fallback_hash text,                           -- dedup hash when source_txn_id is missing
  raw_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT canonical_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT canonical_transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT canonical_transactions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.analysis_jobs(id)
);

-- adjustment_proposals
CREATE TABLE public.adjustment_proposals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  detector_type text NOT NULL,
  detector_run_id uuid,
  master_proposal_id uuid,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  block text NOT NULL DEFAULT 'DD',
  adjustment_class text NOT NULL DEFAULT 'nonrecurring',
  intent text NOT NULL DEFAULT 'remove_expense',
  template_id text,
  linked_account_number text,
  linked_account_name text,
  allocation_mode text NOT NULL DEFAULT 'monthly',
  proposed_amount numeric,
  proposed_period_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  period_range jsonb,
  evidence_strength text NOT NULL DEFAULT 'moderate',
  review_priority text NOT NULL DEFAULT 'normal',
  internal_score integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'new',
  ai_rationale text,
  ai_model text,
  ai_prompt_version text,
  ai_key_signals jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  support_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_user_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  edited_amount numeric,
  edited_period_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT adjustment_proposals_pkey PRIMARY KEY (id),
  CONSTRAINT adjustment_proposals_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.analysis_jobs(id),
  CONSTRAINT adjustment_proposals_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT adjustment_proposals_master_proposal_id_fkey FOREIGN KEY (master_proposal_id) REFERENCES public.adjustment_proposals(id),
  CONSTRAINT adjustment_proposals_detector_run_id_fkey FOREIGN KEY (detector_run_id) REFERENCES public.detector_runs(id)
);

-- proposal_evidence
CREATE TABLE public.proposal_evidence (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL,
  canonical_txn_id uuid,
  source_type text NOT NULL,
  source_txn_id text,
  match_quality text NOT NULL DEFAULT 'moderate',
  reason text,
  description text,
  vendor text,
  account_number text,
  account_name text,
  amount numeric,
  txn_date date,
  fallback_hash text,
  raw_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_evidence_pkey PRIMARY KEY (id),
  CONSTRAINT proposal_evidence_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.adjustment_proposals(id),
  CONSTRAINT proposal_evidence_canonical_txn_id_fkey FOREIGN KEY (canonical_txn_id) REFERENCES public.canonical_transactions(id)
);

-- detector_runs
CREATE TABLE public.detector_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  detector_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  candidate_count integer NOT NULL DEFAULT 0,
  proposal_count integer NOT NULL DEFAULT 0,
  execution_ms integer,
  error_message text,
  skipped_reason text,
  debug_json jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT detector_runs_pkey PRIMARY KEY (id),
  CONSTRAINT detector_runs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.analysis_jobs(id),
  CONSTRAINT detector_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- project_data_chunks (vector embeddings for project financial data)
CREATE TABLE public.project_data_chunks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  data_type text NOT NULL,
  period text,
  fs_section text,
  chunk_key text NOT NULL,
  content text NOT NULL,
  embedding extensions.vector,
  token_count integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_data_chunks_pkey PRIMARY KEY (id),
  CONSTRAINT project_data_chunks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- verification_attempts — Audit trail for adjustment verifications
CREATE TABLE public.verification_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  job_id uuid,
  proposal_id uuid,
  adjustment_description text NOT NULL,
  proposed_amount numeric(18,2) NOT NULL,
  adjustment_class text,
  period text,
  account_hints text[],
  schema_hints jsonb,
  status text NOT NULL CHECK (status IN ('verified','partial_match','not_found','overridden')),
  verified_amount numeric(18,2) NOT NULL,
  variance_amount numeric(18,2) NOT NULL,
  matching_txn_count integer NOT NULL DEFAULT 0,
  diagnostic_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_data_version jsonb DEFAULT '{}'::jsonb,
  ai_summary text,
  contradictions jsonb DEFAULT '[]'::jsonb,
  data_gaps jsonb DEFAULT '[]'::jsonb,
  verified_by_user_id uuid NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT verification_attempts_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES public.adjustment_proposals(id)
);

-- verification_transaction_snapshots — Immutable evidence snapshots
CREATE TABLE public.verification_transaction_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  verification_attempt_id uuid NOT NULL,
  transaction_id uuid,
  source_document_id uuid,
  source_type text,
  txn_date date,
  description text,
  account_name text,
  account_number text,
  counterparty text,
  amount_signed numeric(18,2),
  amount_abs numeric(18,2),
  raw_transaction jsonb NOT NULL,
  matched_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_transaction_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT verification_transaction_snapshots_verification_attempt_id_fkey FOREIGN KEY (verification_attempt_id) REFERENCES public.verification_attempts(id) ON DELETE CASCADE
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_adjustment_proofs_project ON public.adjustment_proofs (project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON public.chat_messages (project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages (created_at);
CREATE INDEX IF NOT EXISTS idx_company_info_project ON public.company_info (project_id);
CREATE INDEX IF NOT EXISTS idx_company_info_realm ON public.company_info (realm_id);
CREATE INDEX IF NOT EXISTS idx_docuclipper_jobs_document ON public.docuclipper_jobs (document_id);
CREATE INDEX IF NOT EXISTS idx_docuclipper_jobs_project ON public.docuclipper_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents (project_id);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents (processing_status);
CREATE INDEX IF NOT EXISTS idx_flagged_transactions_project ON public.flagged_transactions (project_id);
CREATE INDEX IF NOT EXISTS idx_processed_data_project ON public.processed_data (project_id);
CREATE INDEX IF NOT EXISTS idx_processed_data_type ON public.processed_data (data_type);
CREATE INDEX IF NOT EXISTS idx_processed_data_source ON public.processed_data (source_type);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects (user_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_project ON public.project_shares (project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_email ON public.project_shares (shared_with_email);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source ON public.rag_chunks (source);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_project ON public.workflows (project_id);
CREATE INDEX IF NOT EXISTS idx_demo_views_user ON public.demo_views (user_id);
CREATE INDEX IF NOT EXISTS idx_nudge_log_user ON public.nudge_log (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_notes_user ON public.admin_notes (user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows (status);
CREATE INDEX IF NOT EXISTS idx_reclass_jobs_project ON public.reclassification_jobs (project_id);

-- discovery & canonical_transactions indexes
CREATE INDEX IF NOT EXISTS idx_canonical_txns_project ON public.canonical_transactions (project_id);
CREATE INDEX IF NOT EXISTS idx_canonical_txns_account ON public.canonical_transactions (account_name);
CREATE INDEX IF NOT EXISTS idx_canonical_txns_source ON public.canonical_transactions (source_type);
CREATE INDEX IF NOT EXISTS idx_canonical_txns_job ON public.canonical_transactions (job_id);
CREATE INDEX IF NOT EXISTS idx_canonical_txns_date ON public.canonical_transactions (txn_date);
CREATE INDEX IF NOT EXISTS idx_canonical_txns_posting_period ON public.canonical_transactions (posting_period);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project ON public.analysis_jobs (project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON public.analysis_jobs (status);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_project ON public.adjustment_proposals (project_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_job ON public.adjustment_proposals (job_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_status ON public.adjustment_proposals (status);
CREATE INDEX IF NOT EXISTS idx_proposal_evidence_proposal ON public.proposal_evidence (proposal_id);
CREATE INDEX IF NOT EXISTS idx_detector_runs_job ON public.detector_runs (job_id);
CREATE INDEX IF NOT EXISTS idx_detector_runs_project ON public.detector_runs (project_id);
CREATE INDEX IF NOT EXISTS idx_project_data_chunks_project ON public.project_data_chunks (project_id);
CREATE INDEX IF NOT EXISTS idx_project_data_chunks_type ON public.project_data_chunks (data_type);

-- verification indexes
CREATE INDEX IF NOT EXISTS idx_verification_attempts_project ON public.verification_attempts (project_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user ON public.verification_attempts (verified_by_user_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_status ON public.verification_attempts (status);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_proposal ON public.verification_attempts (proposal_id);
CREATE INDEX IF NOT EXISTS idx_vts_verification ON public.verification_transaction_snapshots (verification_attempt_id);
CREATE INDEX IF NOT EXISTS idx_vts_transaction ON public.verification_transaction_snapshots (transaction_id);

-- composite indexes on existing tables
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_status ON public.analysis_jobs (project_id, status);
CREATE INDEX IF NOT EXISTS idx_ap_project_status ON public.adjustment_proposals (project_id, status);

-- ============================================================
-- 5. DATABASE FUNCTIONS
-- ============================================================

-- update_updated_at_column (generic trigger fn)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- update_user_credits_updated_at
CREATE OR REPLACE FUNCTION public.update_user_credits_updated_at()
  RETURNS trigger LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- handle_new_user (auth trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

-- has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
  RETURNS boolean LANGUAGE sql
  STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- has_project_access
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id uuid, _project_id uuid)
  RETURNS boolean LANGUAGE sql
  STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_id = _project_id
    AND (
      shared_with_user_id = _user_id
      OR shared_with_email = (SELECT email FROM auth.users WHERE id = _user_id)
    )
  )
$$;

-- get_project_role
CREATE OR REPLACE FUNCTION public.get_project_role(_user_id uuid, _project_id uuid)
  RETURNS text LANGUAGE sql
  STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id) THEN 'owner'
      ELSE (
        SELECT role FROM public.project_shares
        WHERE project_id = _project_id
        AND (
          shared_with_user_id = _user_id
          OR shared_with_email = (SELECT email FROM auth.users WHERE id = _user_id)
        )
        LIMIT 1
      )
    END
$$;

-- match_rag_chunks (vector similarity search)
CREATE OR REPLACE FUNCTION public.match_rag_chunks(
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.72,
  match_count integer DEFAULT 5,
  source_filter text[] DEFAULT NULL,
  min_authority double precision DEFAULT 0.0,
  topic_filter text[] DEFAULT NULL
)
  RETURNS TABLE (
    id uuid, content text, source text, source_title text,
    chapter text, section text, page_number integer,
    similarity double precision, authority_weight double precision
  )
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_chunks AS (
    SELECT
      rc.id, rc.content, rc.source, rc.source_title,
      rc.chapter, rc.section, rc.page_number,
      (1 - (rc.embedding <=> query_embedding))::FLOAT AS similarity,
      rc.authority_weight,
      ROW_NUMBER() OVER (
        PARTITION BY rc.source, rc.chapter
        ORDER BY (1 - (rc.embedding <=> query_embedding)) DESC
      ) AS chapter_rank
    FROM rag_chunks rc
    WHERE rc.embedding IS NOT NULL
      AND (1 - (rc.embedding <=> query_embedding)) > match_threshold
      AND (source_filter IS NULL OR rc.source = ANY(source_filter))
      AND rc.authority_weight >= min_authority
      AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
  )
  SELECT
    ranked_chunks.id, ranked_chunks.content, ranked_chunks.source,
    ranked_chunks.source_title, ranked_chunks.chapter, ranked_chunks.section,
    ranked_chunks.page_number, ranked_chunks.similarity, ranked_chunks.authority_weight
  FROM ranked_chunks
  WHERE ranked_chunks.chapter_rank = 1
  ORDER BY ranked_chunks.similarity * ranked_chunks.authority_weight DESC
  LIMIT match_count;
END;
$$;

-- populate_detector_run_from_job (auto-fills project_id & user_id from analysis_jobs)
CREATE OR REPLACE FUNCTION public.populate_detector_run_from_job()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.project_id IS NULL OR NEW.user_id IS NULL THEN
    SELECT project_id, user_id
    INTO NEW.project_id, NEW.user_id
    FROM public.analysis_jobs
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$$;

-- match_project_chunks (vector similarity search for project financial data)
CREATE OR REPLACE FUNCTION public.match_project_chunks(
  _project_id uuid,
  query_embedding extensions.vector,
  match_threshold double precision DEFAULT 0.65,
  match_count integer DEFAULT 15,
  data_type_filter text[] DEFAULT NULL
)
  RETURNS TABLE (
    id uuid, data_type text, period text, fs_section text,
    content text, token_count integer, similarity double precision, metadata jsonb
  )
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      c.id, c.data_type, c.period, c.fs_section, c.content, c.token_count,
      (1 - (c.embedding <=> query_embedding))::double precision AS similarity,
      c.metadata,
      ROW_NUMBER() OVER (
        PARTITION BY c.data_type, c.period
        ORDER BY (1 - (c.embedding <=> query_embedding)) DESC
      ) AS partition_rank
    FROM public.project_data_chunks c
    WHERE c.project_id = _project_id
      AND c.embedding IS NOT NULL
      AND (1 - (c.embedding <=> query_embedding)) > match_threshold
      AND (data_type_filter IS NULL OR c.data_type = ANY(data_type_filter))
  ),
  diverse AS (
    SELECT * FROM scored WHERE partition_rank = 1
  ),
  combined AS (
    (SELECT *, 1 AS priority FROM diverse)
    UNION ALL
    (SELECT *, 2 AS priority FROM scored WHERE partition_rank > 1)
  )
  SELECT
    combined.id, combined.data_type, combined.period, combined.fs_section,
    combined.content, combined.token_count, combined.similarity, combined.metadata
  FROM combined
  ORDER BY combined.priority, combined.similarity DESC
  LIMIT match_count;
END;
$$;

-- match_project_chunks (text overload — accepts embedding as text, casts to vector)
CREATE OR REPLACE FUNCTION public.match_project_chunks(
  _project_id uuid,
  query_embedding text,
  match_threshold double precision DEFAULT 0.65,
  match_count integer DEFAULT 15,
  data_type_filter text[] DEFAULT NULL
)
  RETURNS TABLE (
    id uuid, data_type text, period text, fs_section text,
    content text, token_count integer, similarity double precision, metadata jsonb
  )
  LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  _embedding vector(1536);
BEGIN
  _embedding := query_embedding::vector(1536);
  RETURN QUERY
  WITH scored AS (
    SELECT
      c.id, c.data_type, c.period, c.fs_section, c.content, c.token_count,
      (1 - (c.embedding <=> _embedding))::double precision AS similarity,
      c.metadata,
      ROW_NUMBER() OVER (
        PARTITION BY c.data_type, c.period
        ORDER BY (1 - (c.embedding <=> _embedding)) DESC
      ) AS partition_rank
    FROM public.project_data_chunks c
    WHERE c.project_id = _project_id
      AND c.embedding IS NOT NULL
      AND (1 - (c.embedding <=> _embedding)) > match_threshold
      AND (data_type_filter IS NULL OR c.data_type = ANY(data_type_filter))
  ),
  diverse AS (
    SELECT * FROM scored WHERE partition_rank = 1
  ),
  combined AS (
    (SELECT *, 1 AS priority FROM diverse)
    UNION ALL
    (SELECT *, 2 AS priority FROM scored WHERE partition_rank > 1)
  )
  SELECT
    combined.id, combined.data_type, combined.period, combined.fs_section,
    combined.content, combined.token_count, combined.similarity, combined.metadata
  FROM combined
  ORDER BY combined.priority, combined.similarity DESC
  LIMIT match_count;
END;
$$;

-- reset_project_data (updated to include discovery tables)
CREATE OR REPLACE FUNCTION public.reset_project_data(p_project_id uuid)
  RETURNS void LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_project_owner uuid;
BEGIN
  SELECT user_id INTO v_project_owner FROM public.projects WHERE id = p_project_id;
  IF v_project_owner IS NULL THEN RAISE EXCEPTION 'Project not found'; END IF;
  IF v_user_id != v_project_owner AND NOT has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only project owner or admin can reset';
  END IF;

  -- Delete verification data first (FK order: snapshots -> attempts -> proposals)
  DELETE FROM public.verification_transaction_snapshots WHERE verification_attempt_id IN (
    SELECT id FROM public.verification_attempts WHERE project_id = p_project_id
  );
  DELETE FROM public.verification_attempts WHERE project_id = p_project_id;

  -- Delete discovery data (FK order)
  DELETE FROM public.proposal_evidence WHERE proposal_id IN (
    SELECT id FROM public.adjustment_proposals WHERE project_id = p_project_id
  );
  DELETE FROM public.adjustment_proposals WHERE project_id = p_project_id;
  DELETE FROM public.detector_runs WHERE project_id = p_project_id;
  DELETE FROM public.canonical_transactions WHERE project_id = p_project_id;
  DELETE FROM public.analysis_jobs WHERE project_id = p_project_id;
  DELETE FROM public.project_data_chunks WHERE project_id = p_project_id;

  -- Original cleanup
  DELETE FROM public.adjustment_proofs WHERE project_id = p_project_id;
  DELETE FROM public.flagged_transactions WHERE project_id = p_project_id;
  DELETE FROM public.chat_messages WHERE project_id = p_project_id;
  DELETE FROM public.docuclipper_jobs WHERE project_id = p_project_id;
  DELETE FROM public.processed_data WHERE project_id = p_project_id;
  DELETE FROM public.documents WHERE project_id = p_project_id;
  DELETE FROM public.company_info WHERE project_id = p_project_id;
  DELETE FROM public.workflows WHERE project_id = p_project_id;

  UPDATE public.projects SET
    wizard_data = '{}'::jsonb, current_phase = 1, current_section = 1,
    periods = '[]'::jsonb, fiscal_year_end = NULL, industry = NULL,
    google_sheet_id = NULL, google_sheet_url = NULL, status = 'draft'
  WHERE id = p_project_id;
END;
$$;

-- populate_company_info_user_id
CREATE OR REPLACE FUNCTION public.populate_company_info_user_id()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id FROM public.projects WHERE id = NEW.project_id;
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create company_info: project_id % not found or has no user_id', NEW.project_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- prevent_null_company_info_user_id
CREATE OR REPLACE FUNCTION public.prevent_null_company_info_user_id()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id FROM public.projects WHERE id = NEW.project_id;
    IF NEW.user_id IS NULL THEN
      NEW.user_id := OLD.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- sync_status_to_processing_status
CREATE OR REPLACE FUNCTION public.sync_status_to_processing_status()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IS NOT NULL
     AND (NEW.processing_status IS NOT DISTINCT FROM OLD.processing_status) THEN
    NEW.processing_status := NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

-- sync_job_id_columns
CREATE OR REPLACE FUNCTION public.sync_job_id_columns()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.job_id IS DISTINCT FROM OLD.job_id
     AND NEW.job_id IS NOT NULL
     AND (NEW.docuclipper_job_id IS NOT DISTINCT FROM OLD.docuclipper_job_id) THEN
    NEW.docuclipper_job_id := NEW.job_id;
  END IF;
  IF NEW.docuclipper_job_id IS DISTINCT FROM OLD.docuclipper_job_id
     AND NEW.docuclipper_job_id IS NOT NULL
     AND (NEW.job_id IS NOT DISTINCT FROM OLD.job_id) THEN
    NEW.job_id := NEW.docuclipper_job_id;
  END IF;
  RETURN NEW;
END;
$$;

-- sync_job_id_on_insert
CREATE OR REPLACE FUNCTION public.sync_job_id_on_insert()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.job_id IS NOT NULL AND NEW.docuclipper_job_id IS NULL THEN
    NEW.docuclipper_job_id := NEW.job_id;
  ELSIF NEW.docuclipper_job_id IS NOT NULL AND NEW.job_id IS NULL THEN
    NEW.job_id := NEW.docuclipper_job_id;
  END IF;
  RETURN NEW;
END;
$$;

-- notify_enrich_document
CREATE OR REPLACE FUNCTION public.notify_enrich_document()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
BEGIN
  IF OLD.extracted_data IS NULL AND NEW.extracted_data IS NOT NULL THEN
    IF NEW.account_label IS NULL OR NEW.period_start IS NULL OR NEW.parsed_summary IS NULL THEN
      SELECT net.http_post(
        url := supabase_url || '/functions/v1/enrich-document',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object('document_id', NEW.id::text)
      ) INTO request_id;
      RAISE LOG 'notify_enrich_document: triggered for document_id=%, request_id=%', NEW.id, request_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- notify_qb_sync_complete
CREATE OR REPLACE FUNCTION public.notify_qb_sync_complete()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
  last_request timestamptz;
  cooldown_seconds int := 10;
BEGIN
  IF NEW.source_type = 'quickbooks_api' THEN
    SELECT last_requested_at INTO last_request
    FROM qb_sync_requests WHERE project_id = NEW.project_id;

    IF last_request IS NOT NULL
       AND last_request > (now() - make_interval(secs => cooldown_seconds)) THEN
      RAISE LOG 'notify_qb_sync_complete: SKIPPED (rate limited) for project_id=%', NEW.project_id;
      RETURN NEW;
    END IF;

    INSERT INTO qb_sync_requests (project_id, last_requested_at, request_count)
    VALUES (NEW.project_id, now(), 1)
    ON CONFLICT (project_id)
    DO UPDATE SET last_requested_at = now(),
                  request_count = qb_sync_requests.request_count + 1;

    SELECT net.http_post(
      url := supabase_url || '/functions/v1/complete-qb-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'project_id', NEW.project_id::text,
        'data_type', NEW.data_type,
        'record_id', NEW.id::text,
        'source_type', NEW.source_type
      )
    ) INTO request_id;

    RAISE LOG 'notify_qb_sync_complete: triggered for project_id=%, request_id=%', NEW.project_id, request_id;
  END IF;
  RETURN NEW;
END;
$$;

-- update_workflow_progress_on_insert
CREATE OR REPLACE FUNCTION public.update_workflow_progress_on_insert()
  RETURNS trigger LANGUAGE plpgsql
  SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  active_workflow_id UUID;
  workflow_started_at TIMESTAMPTZ;
  v_input_payload JSONB;
  record_count INTEGER;
  expected_count INTEGER;
  progress_pct INTEGER;
BEGIN
  IF NEW.source_type != 'quickbooks_api' THEN RETURN NEW; END IF;

  SELECT w.id, w.started_at, w.input_payload
  INTO active_workflow_id, workflow_started_at, v_input_payload
  FROM workflows w
  WHERE w.project_id = NEW.project_id
    AND w.workflow_type = 'SYNC_TO_SHEET'
    AND w.status = 'running'
  ORDER BY w.started_at DESC LIMIT 1;

  IF active_workflow_id IS NULL THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO record_count
  FROM processed_data
  WHERE project_id = NEW.project_id
    AND source_type = 'quickbooks_api'
    AND data_type = 'trial_balance'
    AND created_at >= workflow_started_at;

  BEGIN
    expected_count := COALESCE(
      (SELECT (
        EXTRACT(YEAR FROM AGE((v_input_payload->>'end_date')::DATE, (v_input_payload->>'start_date')::DATE)) * 12 +
        EXTRACT(MONTH FROM AGE((v_input_payload->>'end_date')::DATE, (v_input_payload->>'start_date')::DATE)) + 1
      )::INTEGER), 36);
  EXCEPTION WHEN OTHERS THEN expected_count := 36;
  END;

  IF expected_count < 1 THEN expected_count := 36; END IF;

  progress_pct := 15 + LEAST(65, (record_count::float / expected_count * 65)::integer);

  UPDATE workflows SET progress_percent = progress_pct, updated_at = NOW()
  WHERE id = active_workflow_id AND status = 'running';

  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.company_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.docuclipper_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.processed_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.flagged_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.adjustment_proofs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.promo_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.rag_chunks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- user_credits updated_at
CREATE TRIGGER set_user_credits_updated_at BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION update_user_credits_updated_at();

-- auth trigger (on auth.users)
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- company_info user_id triggers
CREATE TRIGGER populate_company_info_user_id_trigger BEFORE INSERT ON public.company_info
  FOR EACH ROW EXECUTE FUNCTION populate_company_info_user_id();

CREATE TRIGGER prevent_null_company_info_user_id_trigger BEFORE UPDATE ON public.company_info
  FOR EACH ROW EXECUTE FUNCTION prevent_null_company_info_user_id();

-- documents sync triggers
CREATE TRIGGER sync_status_to_processing BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION sync_status_to_processing_status();

CREATE TRIGGER sync_job_id_on_update BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION sync_job_id_columns();

CREATE TRIGGER sync_job_id_on_insert BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION sync_job_id_on_insert();

-- document enrichment trigger
CREATE TRIGGER notify_enrich_document_trigger AFTER UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION notify_enrich_document();

-- processed_data triggers
CREATE TRIGGER notify_qb_sync_complete_trigger AFTER INSERT ON public.processed_data
  FOR EACH ROW EXECUTE FUNCTION notify_qb_sync_complete();

CREATE TRIGGER update_workflow_progress_trigger AFTER INSERT ON public.processed_data
  FOR EACH ROW EXECUTE FUNCTION update_workflow_progress_on_insert();

-- detector_runs auto-populate trigger
CREATE TRIGGER trg_populate_detector_run_from_job BEFORE INSERT ON public.detector_runs
  FOR EACH ROW EXECUTE FUNCTION populate_detector_run_from_job();

-- updated_at triggers for discovery tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.analysis_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.adjustment_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.project_data_chunks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tos_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelisted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docuclipper_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_sync_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detector_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_data_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_transaction_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclassification_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- user_roles -----
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ----- user_credits -----
CREATE POLICY "Users can view own credits" ON public.user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON public.user_credits FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----- subscriptions -----
CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own subscription" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- tos_acceptances -----
CREATE POLICY "Users can view their own tos acceptances" ON public.tos_acceptances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tos acceptance" ON public.tos_acceptances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tos acceptances" ON public.tos_acceptances FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- whitelisted_users -----
CREATE POLICY "Admins can view whitelist" ON public.whitelisted_users FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can add to whitelist" ON public.whitelisted_users FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can remove from whitelist" ON public.whitelisted_users FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ----- contact_submissions -----
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions FOR INSERT WITH CHECK (
  length(TRIM(BOTH FROM name)) >= 1
  AND length(TRIM(BOTH FROM message)) >= 1
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
CREATE POLICY "Only admins can view contact submissions" ON public.contact_submissions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- promo_config -----
CREATE POLICY "Anyone can read promo config" ON public.promo_config FOR SELECT USING (true);
CREATE POLICY "Only service role can modify promo config" ON public.promo_config FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- projects -----
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own or shared projects" ON public.projects FOR SELECT USING (user_id = auth.uid() OR has_project_access(auth.uid(), id));
CREATE POLICY "Users can update their own or shared projects" ON public.projects FOR UPDATE USING (user_id = auth.uid() OR get_project_role(auth.uid(), id) = ANY(ARRAY['editor','admin']));
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all projects" ON public.projects FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- project_shares -----
CREATE POLICY "Users can view shares for their projects or shares with them" ON public.project_shares FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_shares.project_id AND projects.user_id = auth.uid())
  OR shared_with_user_id = auth.uid()
  OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);
CREATE POLICY "Project owners can create shares" ON public.project_shares FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_shares.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Project owners can delete shares" ON public.project_shares FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_shares.project_id AND projects.user_id = auth.uid())
);

-- ----- project_payments -----
CREATE POLICY "Users can view their own project payments" ON public.project_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own project payments" ON public.project_payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users cannot update payment records" ON public.project_payments FOR UPDATE USING (false);
CREATE POLICY "Admins can view all project payments" ON public.project_payments FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- company_info -----
CREATE POLICY "Users can view their own company info" ON public.company_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create company info for their projects" ON public.company_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company info" ON public.company_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own company info" ON public.company_info FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all company info" ON public.company_info FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- documents -----
CREATE POLICY "Users can view their project documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload documents to their projects" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all documents" ON public.documents FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- docuclipper_jobs -----
CREATE POLICY "Users can view their own docuclipper jobs" ON public.docuclipper_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own docuclipper jobs" ON public.docuclipper_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own docuclipper jobs" ON public.docuclipper_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own docuclipper jobs" ON public.docuclipper_jobs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all docuclipper jobs" ON public.docuclipper_jobs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- processed_data -----
CREATE POLICY "Users can view their own processed data" ON public.processed_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own processed data" ON public.processed_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own processed data" ON public.processed_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own processed data" ON public.processed_data FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all processed data" ON public.processed_data FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- chat_messages -----
CREATE POLICY "Users can read their project chat messages" ON public.chat_messages FOR SELECT USING (has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can insert chat messages to their projects" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND has_project_access(auth.uid(), project_id));
CREATE POLICY "Users can delete their project chat messages" ON public.chat_messages FOR DELETE USING (
  project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  OR get_project_role(auth.uid(), project_id) = ANY(ARRAY['editor','admin'])
);
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- flagged_transactions -----
CREATE POLICY "Users can view their own flagged transactions" ON public.flagged_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create flagged transactions" ON public.flagged_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own flagged transactions" ON public.flagged_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own flagged transactions" ON public.flagged_transactions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all flagged transactions" ON public.flagged_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- adjustment_proofs -----
CREATE POLICY "Users can view their own adjustment proofs" ON public.adjustment_proofs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own adjustment proofs" ON public.adjustment_proofs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own adjustment proofs" ON public.adjustment_proofs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own adjustment proofs" ON public.adjustment_proofs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all adjustment proofs" ON public.adjustment_proofs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- workflows -----
CREATE POLICY "Users can view their own workflows" ON public.workflows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own workflows" ON public.workflows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workflows" ON public.workflows FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all workflows" ON public.workflows FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- qb_sync_requests -----
CREATE POLICY "Admins can view sync requests" ON public.qb_sync_requests FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- ----- rag_chunks -----
CREATE POLICY "Anyone can read rag chunks" ON public.rag_chunks FOR SELECT USING (true);
CREATE POLICY "Only service role can manage rag chunks" ON public.rag_chunks FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- demo_views -----
CREATE POLICY "Users can view their own demo views" ON public.demo_views FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own demo views" ON public.demo_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all demo views" ON public.demo_views FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ----- nudge_log -----
CREATE POLICY "Service role manages nudge log" ON public.nudge_log FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- admin_notes -----
CREATE POLICY "Admins can view all admin notes" ON public.admin_notes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create admin notes" ON public.admin_notes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);
CREATE POLICY "Admins can delete admin notes" ON public.admin_notes FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

-- ----- processed_webhook_events -----
CREATE POLICY "Service role manages webhook events" ON public.processed_webhook_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ----- reclassification_jobs -----
CREATE POLICY "Users can view their own reclassification jobs" ON public.reclassification_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reclassification jobs" ON public.reclassification_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all reclassification jobs" ON public.reclassification_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- canonical_transactions -----
CREATE POLICY "Users can view their own canonical transactions" ON public.canonical_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages canonical transactions" ON public.canonical_transactions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- analysis_jobs -----
CREATE POLICY "Users can view their own analysis jobs" ON public.analysis_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analysis jobs" ON public.analysis_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analysis jobs" ON public.analysis_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages analysis jobs" ON public.analysis_jobs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- adjustment_proposals -----
CREATE POLICY "Users can view their own adjustment proposals" ON public.adjustment_proposals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own adjustment proposals" ON public.adjustment_proposals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages adjustment proposals" ON public.adjustment_proposals FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- proposal_evidence -----
CREATE POLICY "Users can view evidence for their proposals" ON public.proposal_evidence FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM adjustment_proposals ap WHERE ap.id = proposal_evidence.proposal_id AND ap.user_id = auth.uid())
);
CREATE POLICY "Service role manages proposal evidence" ON public.proposal_evidence FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- detector_runs -----
CREATE POLICY "Users can view their own detector runs" ON public.detector_runs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages detector runs" ON public.detector_runs FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- project_data_chunks -----
CREATE POLICY "Users can read chunks for their projects" ON public.project_data_chunks FOR SELECT TO authenticated USING (has_project_access(auth.uid(), project_id));
CREATE POLICY "Service role manages project chunks" ON public.project_data_chunks FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ----- verification_attempts -----
CREATE POLICY "Users can view own verification attempts" ON public.verification_attempts FOR SELECT USING (verified_by_user_id = auth.uid());
CREATE POLICY "Service role full access to verification_attempts" ON public.verification_attempts FOR ALL USING (auth.role() = 'service_role');

-- ----- verification_transaction_snapshots -----
CREATE POLICY "Users can view snapshots for own verifications" ON public.verification_transaction_snapshots FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.verification_attempts va WHERE va.id = verification_transaction_snapshots.verification_attempt_id AND va.verified_by_user_id = auth.uid())
);
CREATE POLICY "Service role full access to snapshots" ON public.verification_transaction_snapshots FOR ALL USING (auth.role() = 'service_role');

-- 8. STORAGE
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
-- ============================================================
-- 9. STORAGE BUCKET RLS POLICIES
-- ============================================================

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can upload their own documents
CREATE POLICY "Users can upload their own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own documents
CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 10. AUTH CONFIGURATION SUMMARY
-- ============================================================
-- Auth providers enabled: email, google (Google OAuth managed via Lovable Cloud settings)
-- Trigger: auth.users AFTER INSERT -> public.handle_new_user()
--   - Auto-creates a row in public.profiles with user_id and full_name from raw_user_meta_data
-- Email confirmation is required before sign-in (auto-confirm is disabled)

-- ============================================================
-- END OF SCHEMA EXPORT
-- ============================================================
