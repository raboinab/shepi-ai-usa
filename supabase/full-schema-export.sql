-- ============================================================================
-- FULL SCHEMA EXPORT
-- Generated: 2026-04-18T01:51:18.672983Z
-- Source: Supabase project sqwohcvobfnymsbzlfqr (live)
-- This is a complete, replay-safe DDL dump including:
--   extensions, enums, sequences, tables, constraints (PK/UQ/CHECK/FK),
--   indexes, functions, triggers, RLS policies, and storage buckets.
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pg_cron";  -- v1.6.4
CREATE EXTENSION IF NOT EXISTS "pg_graphql";  -- v1.5.11
CREATE EXTENSION IF NOT EXISTS "pg_net";  -- v0.19.5
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";  -- v1.11
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- v1.3
CREATE EXTENSION IF NOT EXISTS "supabase_vault";  -- v0.3.1
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- v1.1
CREATE EXTENSION IF NOT EXISTS "vector";  -- v0.8.0

-- ============================================================================
-- 2. ENUM TYPES
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'cpa');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proof_validation_status') THEN
    CREATE TYPE public.proof_validation_status AS ENUM ('validated', 'supported', 'partial', 'insufficient', 'contradictory', 'pending');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_status') THEN
    CREATE TYPE public.workflow_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workflow_type') THEN
    CREATE TYPE public.workflow_type AS ENUM ('IMPORT_QUICKBOOKS_DATA', 'PROCESS_DOCUMENT', 'SYNC_TO_SHEET', 'FULL_DATA_SYNC', 'GENERATE_QOE_REPORT', 'VALIDATE_ADJUSTMENTS', 'REFRESH_QB_TOKEN');
  END IF;
END $$;

-- ============================================================================
-- 3. SEQUENCES
-- ============================================================================
-- (no user-defined sequences in public schema)

-- ============================================================================
-- 4. TABLES (columns, defaults, NOT NULL)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.adjustment_proofs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  adjustment_id text NOT NULL,
  document_id uuid,
  validation_score integer,
  validation_status public.proof_validation_status DEFAULT 'pending'::proof_validation_status NOT NULL,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  key_findings text[] DEFAULT '{}'::text[],
  red_flags text[] DEFAULT '{}'::text[],
  validated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  verification_type text DEFAULT 'manual_proof'::text NOT NULL,
  traceability_data jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.adjustment_proposals (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  master_proposal_id uuid,
  detector_type text NOT NULL,
  detector_run_id uuid,
  title text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  block text DEFAULT 'DD'::text NOT NULL,
  adjustment_class text DEFAULT 'nonrecurring'::text NOT NULL,
  intent text DEFAULT 'remove_expense'::text NOT NULL,
  template_id text,
  linked_account_number text,
  linked_account_name text,
  proposed_amount numeric,
  proposed_period_values jsonb DEFAULT '{}'::jsonb NOT NULL,
  allocation_mode text DEFAULT 'monthly'::text NOT NULL,
  period_range jsonb,
  evidence_strength text DEFAULT 'moderate'::text NOT NULL,
  review_priority text DEFAULT 'normal'::text NOT NULL,
  internal_score integer DEFAULT 50 NOT NULL,
  support_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  ai_rationale text,
  ai_key_signals jsonb DEFAULT '[]'::jsonb NOT NULL,
  ai_warnings jsonb DEFAULT '[]'::jsonb NOT NULL,
  ai_model text,
  status text DEFAULT 'new'::text NOT NULL,
  reviewer_user_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  edited_amount numeric,
  edited_period_values jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  ai_prompt_version text,
  hypothesis_id uuid,
  finding_id uuid,
  rejection_category text,
  rejection_reason text,
  support_tier integer,
  support_tier_label text,
  evidence_report jsonb,
  missing_evidence jsonb DEFAULT '[]'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_notes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.analysis_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  job_type text DEFAULT 'full_discovery'::text NOT NULL,
  status text DEFAULT 'queued'::text NOT NULL,
  config_json jsonb DEFAULT '{}'::jsonb NOT NULL,
  source_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  progress_percent integer DEFAULT 0 NOT NULL,
  detector_summary jsonb DEFAULT '{}'::jsonb NOT NULL,
  error_message text,
  requested_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  worker_run_id text,
  attempt_number integer DEFAULT 1 NOT NULL,
  last_heartbeat_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  revenue_model jsonb DEFAULT '{}'::jsonb NOT NULL,
  cost_structure jsonb DEFAULT '{}'::jsonb NOT NULL,
  operations_footprint jsonb DEFAULT '{}'::jsonb NOT NULL,
  capital_structure jsonb DEFAULT '{}'::jsonb NOT NULL,
  industry_classification text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  business_model jsonb,
  source_observation_ids uuid[]
);

CREATE TABLE IF NOT EXISTS public.canonical_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  source_txn_id text,
  txn_date date,
  description text,
  vendor text,
  amount numeric,
  account_number text,
  account_name text,
  memo text,
  raw_reference jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  account_type text,
  job_id uuid,
  source_processed_data_id uuid,
  source_document_id uuid,
  source_record_id text,
  fallback_hash text,
  posting_period text,
  amount_abs numeric,
  amount_signed numeric,
  payee text,
  txn_type text,
  split_account text,
  check_number text,
  is_year_end boolean DEFAULT false,
  raw_payload jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  context_type text DEFAULT 'wizard'::text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.claim_ledger (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  observation_id uuid,
  tension_id uuid,
  hypothesis_id uuid,
  finding_id uuid,
  adjustment_id uuid,
  observation_statement text,
  tension_statement text,
  hypothesis_claim text,
  finding_narrative text,
  tension_magnitude numeric,
  hypothesis_estimated_impact numeric,
  finding_computed_amount numeric,
  adjustment_proposed_amount numeric,
  chain_complete boolean DEFAULT false NOT NULL,
  dropped_at text,
  drop_reason text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  adjustment_title text
);

CREATE TABLE IF NOT EXISTS public.company_info (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid,
  company_name text,
  realm_id text,
  bearer_token text,
  refresh_token text,
  auth_code text,
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  company text,
  role text,
  interest text
);

CREATE TABLE IF NOT EXISTS public.cpa_claims (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  cpa_user_id uuid NOT NULL,
  claimed_at timestamptz DEFAULT now() NOT NULL,
  status text DEFAULT 'in_progress'::text NOT NULL,
  notes text,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.demo_views (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  page text NOT NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.detector_runs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  detector_type text NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  candidate_count integer DEFAULT 0 NOT NULL,
  proposal_count integer DEFAULT 0 NOT NULL,
  error_message text,
  execution_ms integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  skipped_reason text,
  debug_json jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.dfy_provider_agreements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  agreement_version text NOT NULL,
  accepted_at timestamptz DEFAULT now() NOT NULL,
  ip_address text
);

CREATE TABLE IF NOT EXISTS public.docuclipper_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  document_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  job_id text NOT NULL,
  status text DEFAULT 'submitted'::text NOT NULL,
  extracted_data jsonb,
  transaction_count integer,
  period_start date,
  period_end date,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  category text,
  created_at timestamptz DEFAULT now(),
  institution text,
  account_label text,
  account_type text,
  docuclipper_job_id text,
  period_start date,
  period_end date,
  processing_status text DEFAULT 'pending'::text,
  parsed_summary jsonb,
  coverage_validated boolean DEFAULT false,
  validation_result jsonb,
  validated_at timestamptz,
  company_name text,
  extracted_data jsonb,
  document_ids text,
  status text,
  job_id text,
  document_type text,
  description text
);

CREATE TABLE IF NOT EXISTS public.entity_nodes (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  entity_type text,
  canonical_name text,
  aliases text[] DEFAULT '{}'::text[],
  roles text[] DEFAULT '{}'::text[],
  linked_accounts jsonb DEFAULT '[]'::jsonb NOT NULL,
  transaction_volume numeric,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  linked_txn_count integer DEFAULT 0,
  linked_txn_total numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.findings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  hypothesis_id uuid,
  resolver_type text,
  computed_amount numeric,
  period_values jsonb DEFAULT '{}'::jsonb NOT NULL,
  evidence_strength text DEFAULT 'moderate'::text NOT NULL,
  hypothesis_outcome text,
  narrative text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  accounts_involved text[],
  title text,
  direction text,
  adjustment_class text,
  identified_items jsonb DEFAULT '[]'::jsonb,
  key_signals text[],
  assumptions text[],
  what_we_cannot_verify text[],
  alternative_explanations_considered text[],
  outcome_explanation text
);

CREATE TABLE IF NOT EXISTS public.flagged_transactions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  transaction_date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  account_name text NOT NULL,
  flag_type text NOT NULL,
  flag_reason text NOT NULL,
  confidence_score numeric DEFAULT 0.5 NOT NULL,
  suggested_adjustment_type text,
  suggested_adjustment_amount numeric,
  status text DEFAULT 'pending'::text NOT NULL,
  ai_analysis jsonb DEFAULT '{}'::jsonb,
  source_data jsonb DEFAULT '{}'::jsonb,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  flag_category text DEFAULT 'adjustment_candidate'::text NOT NULL,
  classification_context jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.hypotheses (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text,
  severity text,
  hypothesis_claim text,
  estimated_ebitda_impact numeric,
  falsification_conditions jsonb DEFAULT '[]'::jsonb NOT NULL,
  resolution_plan jsonb DEFAULT '{}'::jsonb NOT NULL,
  owned_accounts text[] DEFAULT '{}'::text[],
  tension_ids uuid[] DEFAULT '{}'::uuid[],
  status text DEFAULT 'proposed'::text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  alternative_explanations text[],
  impact_direction text,
  supporting_observation_ids uuid[],
  required_resolvers text[],
  resolution_result text,
  final_ebitda_impact numeric,
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.nudge_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  nudge_type text NOT NULL,
  sent_at timestamptz DEFAULT now() NOT NULL,
  email_id text
);

CREATE TABLE IF NOT EXISTS public.observations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text,
  source text,
  statement text,
  value numeric,
  unit text,
  period text,
  confidence_basis text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  supporting_accounts text[],
  supporting_evidence text[]
);

CREATE TABLE IF NOT EXISTS public.processed_data (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  source_type text NOT NULL,
  data_type text NOT NULL,
  source_document_id uuid,
  qb_realm_id text,
  period_start date,
  period_end date,
  data jsonb DEFAULT '{}'::jsonb NOT NULL,
  record_count integer,
  validation_status text DEFAULT 'pending'::text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  event_id text NOT NULL,
  processed_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  full_name text,
  company text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_data_chunks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  data_type text NOT NULL,
  period text,
  fs_section text,
  chunk_key text NOT NULL,
  content text NOT NULL,
  embedding public.vector,
  token_count integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_payments (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stripe_payment_intent_id text,
  amount integer NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  paid_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_shares (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  shared_with_user_id uuid,
  role text DEFAULT 'editor'::text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  client_name text,
  target_company text,
  transaction_type text,
  industry text,
  status text DEFAULT 'draft'::text,
  fiscal_year_end text,
  periods jsonb DEFAULT '[]'::jsonb,
  wizard_data jsonb DEFAULT '{}'::jsonb,
  current_phase integer DEFAULT 1,
  current_section integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  google_sheet_id text,
  google_sheet_url text,
  funded_by_credit boolean DEFAULT false NOT NULL,
  credit_expires_at timestamptz,
  service_tier text DEFAULT 'diy'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.promo_config (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  key text NOT NULL,
  value integer DEFAULT 0 NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.proposal_evidence (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  proposal_id uuid NOT NULL,
  canonical_txn_id uuid,
  source_type text NOT NULL,
  source_txn_id text,
  txn_date date,
  description text,
  vendor text,
  amount numeric,
  account_number text,
  account_name text,
  match_quality text DEFAULT 'moderate'::text NOT NULL,
  reason text,
  raw_reference jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  fallback_hash text
);

CREATE TABLE IF NOT EXISTS public.qb_sync_requests (
  project_id uuid NOT NULL,
  last_requested_at timestamptz DEFAULT now() NOT NULL,
  request_count integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rag_chunks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  content text NOT NULL,
  embedding public.vector,
  source text NOT NULL,
  source_title text,
  source_license text,
  chapter text,
  section text,
  page_number integer,
  chunk_index integer NOT NULL,
  topic_tags text[] DEFAULT '{}'::text[],
  authority_weight double precision DEFAULT 1.0,
  token_count integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reclassification_jobs (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending'::text NOT NULL,
  input_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_type text NOT NULL,
  status text DEFAULT 'inactive'::text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tensions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  category text,
  direction text,
  magnitude numeric,
  severity text,
  statement text,
  expected_value numeric,
  actual_value numeric,
  benchmark_source text,
  accounts_implicated text[] DEFAULT '{}'::text[],
  observation_ids uuid[] DEFAULT '{}'::uuid[],
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  gap_percent numeric,
  magnitude_basis text
);

CREATE TABLE IF NOT EXISTS public.tos_acceptances (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  tos_version text NOT NULL,
  accepted_at timestamptz DEFAULT now() NOT NULL,
  ip_address text
);

CREATE TABLE IF NOT EXISTS public.upload_errors (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid,
  project_id uuid,
  context text NOT NULL,
  file_name text,
  file_size bigint,
  file_type text,
  stage text NOT NULL,
  error_code text,
  error_message text,
  error_details jsonb,
  user_agent text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  credits_remaining integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  total_credits_purchased integer DEFAULT 0 NOT NULL,
  credit_type text DEFAULT 'per_project'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.verification_attempts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  job_id uuid,
  proposal_id uuid,
  adjustment_description text NOT NULL,
  proposed_amount numeric NOT NULL,
  adjustment_class text,
  period text,
  account_hints text[],
  schema_hints jsonb,
  status text NOT NULL,
  verified_amount numeric NOT NULL,
  variance_amount numeric NOT NULL,
  matching_txn_count integer DEFAULT 0 NOT NULL,
  diagnostic_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  source_data_version jsonb DEFAULT '{}'::jsonb,
  ai_summary text,
  contradictions jsonb DEFAULT '[]'::jsonb,
  data_gaps jsonb DEFAULT '[]'::jsonb,
  verified_by_user_id uuid,
  verified_at timestamptz DEFAULT now() NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.verification_transaction_snapshots (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  verification_attempt_id uuid NOT NULL,
  transaction_id uuid,
  source_document_id uuid,
  source_type text,
  txn_date date,
  description text,
  account_name text,
  account_number text,
  counterparty text,
  amount_signed numeric,
  amount_abs numeric,
  raw_transaction jsonb NOT NULL,
  matched_reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.whitelisted_users (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  email text NOT NULL,
  added_by uuid,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  workflow_type public.workflow_type NOT NULL,
  status public.workflow_status DEFAULT 'pending'::workflow_status NOT NULL,
  progress_percent integer DEFAULT 0 NOT NULL,
  current_step text,
  steps jsonb DEFAULT '[]'::jsonb NOT NULL,
  input_payload jsonb DEFAULT '{}'::jsonb NOT NULL,
  output_payload jsonb,
  error_message text,
  error_details jsonb,
  retry_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  started_at timestamptz,
  completed_at timestamptz
);

-- ============================================================================
-- 5. CONSTRAINTS (PRIMARY KEY, UNIQUE, CHECK, FOREIGN KEY)
-- ============================================================================
-- ---- PRIMARY KEY ----
ALTER TABLE public.adjustment_proofs DROP CONSTRAINT IF EXISTS adjustment_proofs_pkey;
ALTER TABLE public.adjustment_proofs ADD CONSTRAINT adjustment_proofs_pkey PRIMARY KEY (id);
ALTER TABLE public.adjustment_proposals DROP CONSTRAINT IF EXISTS adjustment_proposals_pkey;
ALTER TABLE public.adjustment_proposals ADD CONSTRAINT adjustment_proposals_pkey PRIMARY KEY (id);
ALTER TABLE public.admin_notes DROP CONSTRAINT IF EXISTS admin_notes_pkey;
ALTER TABLE public.admin_notes ADD CONSTRAINT admin_notes_pkey PRIMARY KEY (id);
ALTER TABLE public.analysis_jobs DROP CONSTRAINT IF EXISTS analysis_jobs_pkey;
ALTER TABLE public.analysis_jobs ADD CONSTRAINT analysis_jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_pkey;
ALTER TABLE public.business_profiles ADD CONSTRAINT business_profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.canonical_transactions DROP CONSTRAINT IF EXISTS canonical_transactions_pkey;
ALTER TABLE public.canonical_transactions ADD CONSTRAINT canonical_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE public.claim_ledger DROP CONSTRAINT IF EXISTS claim_ledger_pkey;
ALTER TABLE public.claim_ledger ADD CONSTRAINT claim_ledger_pkey PRIMARY KEY (id);
ALTER TABLE public.company_info DROP CONSTRAINT IF EXISTS company_info_pkey;
ALTER TABLE public.company_info ADD CONSTRAINT company_info_pkey PRIMARY KEY (id);
ALTER TABLE public.contact_submissions DROP CONSTRAINT IF EXISTS contact_submissions_pkey;
ALTER TABLE public.contact_submissions ADD CONSTRAINT contact_submissions_pkey PRIMARY KEY (id);
ALTER TABLE public.cpa_claims DROP CONSTRAINT IF EXISTS cpa_claims_pkey;
ALTER TABLE public.cpa_claims ADD CONSTRAINT cpa_claims_pkey PRIMARY KEY (id);
ALTER TABLE public.demo_views DROP CONSTRAINT IF EXISTS demo_views_pkey;
ALTER TABLE public.demo_views ADD CONSTRAINT demo_views_pkey PRIMARY KEY (id);
ALTER TABLE public.detector_runs DROP CONSTRAINT IF EXISTS detector_runs_pkey;
ALTER TABLE public.detector_runs ADD CONSTRAINT detector_runs_pkey PRIMARY KEY (id);
ALTER TABLE public.dfy_provider_agreements DROP CONSTRAINT IF EXISTS dfy_provider_agreements_pkey;
ALTER TABLE public.dfy_provider_agreements ADD CONSTRAINT dfy_provider_agreements_pkey PRIMARY KEY (id);
ALTER TABLE public.docuclipper_jobs DROP CONSTRAINT IF EXISTS docuclipper_jobs_pkey;
ALTER TABLE public.docuclipper_jobs ADD CONSTRAINT docuclipper_jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_pkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_pkey PRIMARY KEY (id);
ALTER TABLE public.entity_nodes DROP CONSTRAINT IF EXISTS entity_nodes_pkey;
ALTER TABLE public.entity_nodes ADD CONSTRAINT entity_nodes_pkey PRIMARY KEY (id);
ALTER TABLE public.findings DROP CONSTRAINT IF EXISTS findings_pkey;
ALTER TABLE public.findings ADD CONSTRAINT findings_pkey PRIMARY KEY (id);
ALTER TABLE public.flagged_transactions DROP CONSTRAINT IF EXISTS flagged_transactions_pkey;
ALTER TABLE public.flagged_transactions ADD CONSTRAINT flagged_transactions_pkey PRIMARY KEY (id);
ALTER TABLE public.hypotheses DROP CONSTRAINT IF EXISTS hypotheses_pkey;
ALTER TABLE public.hypotheses ADD CONSTRAINT hypotheses_pkey PRIMARY KEY (id);
ALTER TABLE public.nudge_log DROP CONSTRAINT IF EXISTS nudge_log_pkey;
ALTER TABLE public.nudge_log ADD CONSTRAINT nudge_log_pkey PRIMARY KEY (id);
ALTER TABLE public.observations DROP CONSTRAINT IF EXISTS observations_pkey;
ALTER TABLE public.observations ADD CONSTRAINT observations_pkey PRIMARY KEY (id);
ALTER TABLE public.processed_data DROP CONSTRAINT IF EXISTS processed_data_pkey;
ALTER TABLE public.processed_data ADD CONSTRAINT processed_data_pkey PRIMARY KEY (id);
ALTER TABLE public.processed_webhook_events DROP CONSTRAINT IF EXISTS processed_webhook_events_pkey;
ALTER TABLE public.processed_webhook_events ADD CONSTRAINT processed_webhook_events_pkey PRIMARY KEY (event_id);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.project_data_chunks DROP CONSTRAINT IF EXISTS project_data_chunks_pkey;
ALTER TABLE public.project_data_chunks ADD CONSTRAINT project_data_chunks_pkey PRIMARY KEY (id);
ALTER TABLE public.project_payments DROP CONSTRAINT IF EXISTS project_payments_pkey;
ALTER TABLE public.project_payments ADD CONSTRAINT project_payments_pkey PRIMARY KEY (id);
ALTER TABLE public.project_shares DROP CONSTRAINT IF EXISTS project_shares_pkey;
ALTER TABLE public.project_shares ADD CONSTRAINT project_shares_pkey PRIMARY KEY (id);
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE public.promo_config DROP CONSTRAINT IF EXISTS promo_config_pkey;
ALTER TABLE public.promo_config ADD CONSTRAINT promo_config_pkey PRIMARY KEY (id);
ALTER TABLE public.proposal_evidence DROP CONSTRAINT IF EXISTS proposal_evidence_pkey;
ALTER TABLE public.proposal_evidence ADD CONSTRAINT proposal_evidence_pkey PRIMARY KEY (id);
ALTER TABLE public.qb_sync_requests DROP CONSTRAINT IF EXISTS qb_sync_requests_pkey;
ALTER TABLE public.qb_sync_requests ADD CONSTRAINT qb_sync_requests_pkey PRIMARY KEY (project_id);
ALTER TABLE public.rag_chunks DROP CONSTRAINT IF EXISTS rag_chunks_pkey;
ALTER TABLE public.rag_chunks ADD CONSTRAINT rag_chunks_pkey PRIMARY KEY (id);
ALTER TABLE public.reclassification_jobs DROP CONSTRAINT IF EXISTS reclassification_jobs_pkey;
ALTER TABLE public.reclassification_jobs ADD CONSTRAINT reclassification_jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_pkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE public.tensions DROP CONSTRAINT IF EXISTS tensions_pkey;
ALTER TABLE public.tensions ADD CONSTRAINT tensions_pkey PRIMARY KEY (id);
ALTER TABLE public.tos_acceptances DROP CONSTRAINT IF EXISTS tos_acceptances_pkey;
ALTER TABLE public.tos_acceptances ADD CONSTRAINT tos_acceptances_pkey PRIMARY KEY (id);
ALTER TABLE public.upload_errors DROP CONSTRAINT IF EXISTS upload_errors_pkey;
ALTER TABLE public.upload_errors ADD CONSTRAINT upload_errors_pkey PRIMARY KEY (id);
ALTER TABLE public.user_credits DROP CONSTRAINT IF EXISTS user_credits_pkey;
ALTER TABLE public.user_credits ADD CONSTRAINT user_credits_pkey PRIMARY KEY (id);
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_pkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.verification_attempts DROP CONSTRAINT IF EXISTS verification_attempts_pkey;
ALTER TABLE public.verification_attempts ADD CONSTRAINT verification_attempts_pkey PRIMARY KEY (id);
ALTER TABLE public.verification_transaction_snapshots DROP CONSTRAINT IF EXISTS verification_transaction_snapshots_pkey;
ALTER TABLE public.verification_transaction_snapshots ADD CONSTRAINT verification_transaction_snapshots_pkey PRIMARY KEY (id);
ALTER TABLE public.whitelisted_users DROP CONSTRAINT IF EXISTS whitelisted_users_pkey;
ALTER TABLE public.whitelisted_users ADD CONSTRAINT whitelisted_users_pkey PRIMARY KEY (id);
ALTER TABLE public.workflows DROP CONSTRAINT IF EXISTS workflows_pkey;
ALTER TABLE public.workflows ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);

-- ---- UNIQUE ----
ALTER TABLE public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_job_id_key;
ALTER TABLE public.business_profiles ADD CONSTRAINT business_profiles_job_id_key UNIQUE (job_id);
ALTER TABLE public.company_info DROP CONSTRAINT IF EXISTS unique_project_connection;
ALTER TABLE public.company_info ADD CONSTRAINT unique_project_connection UNIQUE (project_id);
ALTER TABLE public.cpa_claims DROP CONSTRAINT IF EXISTS cpa_claims_project_id_key;
ALTER TABLE public.cpa_claims ADD CONSTRAINT cpa_claims_project_id_key UNIQUE (project_id);
ALTER TABLE public.detector_runs DROP CONSTRAINT IF EXISTS detector_runs_job_detector_unique;
ALTER TABLE public.detector_runs ADD CONSTRAINT detector_runs_job_detector_unique UNIQUE (job_id, detector_type);
ALTER TABLE public.docuclipper_jobs DROP CONSTRAINT IF EXISTS docuclipper_jobs_job_id_key;
ALTER TABLE public.docuclipper_jobs ADD CONSTRAINT docuclipper_jobs_job_id_key UNIQUE (job_id);
ALTER TABLE public.flagged_transactions DROP CONSTRAINT IF EXISTS flagged_transactions_unique;
ALTER TABLE public.flagged_transactions ADD CONSTRAINT flagged_transactions_unique UNIQUE (project_id, transaction_date, description, amount);
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
ALTER TABLE public.project_data_chunks DROP CONSTRAINT IF EXISTS project_data_chunks_chunk_key_key;
ALTER TABLE public.project_data_chunks ADD CONSTRAINT project_data_chunks_chunk_key_key UNIQUE (chunk_key);
ALTER TABLE public.project_payments DROP CONSTRAINT IF EXISTS project_payments_project_id_key;
ALTER TABLE public.project_payments ADD CONSTRAINT project_payments_project_id_key UNIQUE (project_id);
ALTER TABLE public.project_payments DROP CONSTRAINT IF EXISTS project_payments_project_user_unique;
ALTER TABLE public.project_payments ADD CONSTRAINT project_payments_project_user_unique UNIQUE (project_id, user_id);
ALTER TABLE public.project_payments DROP CONSTRAINT IF EXISTS project_payments_stripe_payment_intent_id_key;
ALTER TABLE public.project_payments ADD CONSTRAINT project_payments_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);
ALTER TABLE public.project_shares DROP CONSTRAINT IF EXISTS project_shares_project_id_shared_with_email_key;
ALTER TABLE public.project_shares ADD CONSTRAINT project_shares_project_id_shared_with_email_key UNIQUE (project_id, shared_with_email);
ALTER TABLE public.promo_config DROP CONSTRAINT IF EXISTS promo_config_key_key;
ALTER TABLE public.promo_config ADD CONSTRAINT promo_config_key_key UNIQUE (key);
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_stripe_subscription_id_key;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
ALTER TABLE public.user_credits DROP CONSTRAINT IF EXISTS user_credits_user_id_key;
ALTER TABLE public.user_credits ADD CONSTRAINT user_credits_user_id_key UNIQUE (user_id);
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.whitelisted_users DROP CONSTRAINT IF EXISTS whitelisted_users_email_key;
ALTER TABLE public.whitelisted_users ADD CONSTRAINT whitelisted_users_email_key UNIQUE (email);

-- ---- CHECK ----
ALTER TABLE public.adjustment_proofs DROP CONSTRAINT IF EXISTS adjustment_proofs_validation_score_check;
ALTER TABLE public.adjustment_proofs ADD CONSTRAINT adjustment_proofs_validation_score_check CHECK (((validation_score >= 0) AND (validation_score <= 100)));
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_role_check;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text])));
ALTER TABLE public.flagged_transactions DROP CONSTRAINT IF EXISTS flagged_transactions_flag_category_check;
ALTER TABLE public.flagged_transactions ADD CONSTRAINT flagged_transactions_flag_category_check CHECK ((flag_category = ANY (ARRAY['adjustment_candidate'::text, 'bookkeeping_gap'::text])));
ALTER TABLE public.project_payments DROP CONSTRAINT IF EXISTS project_payments_status_check;
ALTER TABLE public.project_payments ADD CONSTRAINT project_payments_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])));
ALTER TABLE public.project_shares DROP CONSTRAINT IF EXISTS project_shares_role_check;
ALTER TABLE public.project_shares ADD CONSTRAINT project_shares_role_check CHECK ((role = ANY (ARRAY['viewer'::text, 'editor'::text, 'admin'::text])));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'in-progress'::text, 'completed'::text, 'archived'::text])));
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_transaction_type_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['buy-side'::text, 'sell-side'::text])));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_type_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_type_check CHECK ((plan_type = ANY (ARRAY['monthly'::text, 'per_project'::text])));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'cancelled'::text, 'past_due'::text, 'inactive'::text])));
ALTER TABLE public.verification_attempts DROP CONSTRAINT IF EXISTS verification_attempts_status_check;
ALTER TABLE public.verification_attempts ADD CONSTRAINT verification_attempts_status_check CHECK ((status = ANY (ARRAY['verified'::text, 'partial_match'::text, 'not_found'::text, 'overridden'::text])));
ALTER TABLE public.workflows DROP CONSTRAINT IF EXISTS workflows_progress_percent_check;
ALTER TABLE public.workflows ADD CONSTRAINT workflows_progress_percent_check CHECK (((progress_percent >= 0) AND (progress_percent <= 100)));

-- ---- FOREIGN KEY ----
ALTER TABLE public.adjustment_proofs DROP CONSTRAINT IF EXISTS adjustment_proofs_document_id_fkey;
ALTER TABLE public.adjustment_proofs ADD CONSTRAINT adjustment_proofs_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL;
ALTER TABLE public.adjustment_proofs DROP CONSTRAINT IF EXISTS adjustment_proofs_project_id_fkey;
ALTER TABLE public.adjustment_proofs ADD CONSTRAINT adjustment_proofs_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.adjustment_proposals DROP CONSTRAINT IF EXISTS adjustment_proposals_detector_run_id_fkey;
ALTER TABLE public.adjustment_proposals ADD CONSTRAINT adjustment_proposals_detector_run_id_fkey FOREIGN KEY (detector_run_id) REFERENCES detector_runs(id);
ALTER TABLE public.adjustment_proposals DROP CONSTRAINT IF EXISTS adjustment_proposals_finding_id_fkey;
ALTER TABLE public.adjustment_proposals ADD CONSTRAINT adjustment_proposals_finding_id_fkey FOREIGN KEY (finding_id) REFERENCES findings(id);
ALTER TABLE public.adjustment_proposals DROP CONSTRAINT IF EXISTS adjustment_proposals_hypothesis_id_fkey;
ALTER TABLE public.adjustment_proposals ADD CONSTRAINT adjustment_proposals_hypothesis_id_fkey FOREIGN KEY (hypothesis_id) REFERENCES hypotheses(id);
ALTER TABLE public.adjustment_proposals DROP CONSTRAINT IF EXISTS adjustment_proposals_job_id_fkey;
ALTER TABLE public.adjustment_proposals ADD CONSTRAINT adjustment_proposals_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.adjustment_proposals DROP CONSTRAINT IF EXISTS adjustment_proposals_master_proposal_id_fkey;
ALTER TABLE public.adjustment_proposals ADD CONSTRAINT adjustment_proposals_master_proposal_id_fkey FOREIGN KEY (master_proposal_id) REFERENCES adjustment_proposals(id);
ALTER TABLE public.adjustment_proposals DROP CONSTRAINT IF EXISTS adjustment_proposals_project_id_fkey;
ALTER TABLE public.adjustment_proposals ADD CONSTRAINT adjustment_proposals_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.analysis_jobs DROP CONSTRAINT IF EXISTS analysis_jobs_project_id_fkey;
ALTER TABLE public.analysis_jobs ADD CONSTRAINT analysis_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.business_profiles DROP CONSTRAINT IF EXISTS business_profiles_job_id_fkey;
ALTER TABLE public.business_profiles ADD CONSTRAINT business_profiles_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.canonical_transactions DROP CONSTRAINT IF EXISTS canonical_transactions_job_id_fkey;
ALTER TABLE public.canonical_transactions ADD CONSTRAINT canonical_transactions_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.canonical_transactions DROP CONSTRAINT IF EXISTS canonical_transactions_project_id_fkey;
ALTER TABLE public.canonical_transactions ADD CONSTRAINT canonical_transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_project_id_fkey;
ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.claim_ledger DROP CONSTRAINT IF EXISTS claim_ledger_adjustment_id_fkey;
ALTER TABLE public.claim_ledger ADD CONSTRAINT claim_ledger_adjustment_id_fkey FOREIGN KEY (adjustment_id) REFERENCES adjustment_proposals(id);
ALTER TABLE public.claim_ledger DROP CONSTRAINT IF EXISTS claim_ledger_finding_id_fkey;
ALTER TABLE public.claim_ledger ADD CONSTRAINT claim_ledger_finding_id_fkey FOREIGN KEY (finding_id) REFERENCES findings(id);
ALTER TABLE public.claim_ledger DROP CONSTRAINT IF EXISTS claim_ledger_hypothesis_id_fkey;
ALTER TABLE public.claim_ledger ADD CONSTRAINT claim_ledger_hypothesis_id_fkey FOREIGN KEY (hypothesis_id) REFERENCES hypotheses(id);
ALTER TABLE public.claim_ledger DROP CONSTRAINT IF EXISTS claim_ledger_job_id_fkey;
ALTER TABLE public.claim_ledger ADD CONSTRAINT claim_ledger_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.claim_ledger DROP CONSTRAINT IF EXISTS claim_ledger_observation_id_fkey;
ALTER TABLE public.claim_ledger ADD CONSTRAINT claim_ledger_observation_id_fkey FOREIGN KEY (observation_id) REFERENCES observations(id);
ALTER TABLE public.claim_ledger DROP CONSTRAINT IF EXISTS claim_ledger_tension_id_fkey;
ALTER TABLE public.claim_ledger ADD CONSTRAINT claim_ledger_tension_id_fkey FOREIGN KEY (tension_id) REFERENCES tensions(id);
ALTER TABLE public.company_info DROP CONSTRAINT IF EXISTS company_info_project_id_fkey;
ALTER TABLE public.company_info ADD CONSTRAINT company_info_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.cpa_claims DROP CONSTRAINT IF EXISTS cpa_claims_project_id_fkey;
ALTER TABLE public.cpa_claims ADD CONSTRAINT cpa_claims_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.detector_runs DROP CONSTRAINT IF EXISTS detector_runs_job_id_fkey;
ALTER TABLE public.detector_runs ADD CONSTRAINT detector_runs_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.detector_runs DROP CONSTRAINT IF EXISTS detector_runs_project_id_fkey;
ALTER TABLE public.detector_runs ADD CONSTRAINT detector_runs_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.dfy_provider_agreements DROP CONSTRAINT IF EXISTS dfy_provider_agreements_user_id_fkey;
ALTER TABLE public.dfy_provider_agreements ADD CONSTRAINT dfy_provider_agreements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.docuclipper_jobs DROP CONSTRAINT IF EXISTS docuclipper_jobs_document_id_fkey;
ALTER TABLE public.docuclipper_jobs ADD CONSTRAINT docuclipper_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;
ALTER TABLE public.docuclipper_jobs DROP CONSTRAINT IF EXISTS docuclipper_jobs_project_id_fkey;
ALTER TABLE public.docuclipper_jobs ADD CONSTRAINT docuclipper_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.docuclipper_jobs DROP CONSTRAINT IF EXISTS docuclipper_jobs_user_id_fkey;
ALTER TABLE public.docuclipper_jobs ADD CONSTRAINT docuclipper_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_project_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_user_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.entity_nodes DROP CONSTRAINT IF EXISTS entity_nodes_job_id_fkey;
ALTER TABLE public.entity_nodes ADD CONSTRAINT entity_nodes_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.findings DROP CONSTRAINT IF EXISTS findings_hypothesis_id_fkey;
ALTER TABLE public.findings ADD CONSTRAINT findings_hypothesis_id_fkey FOREIGN KEY (hypothesis_id) REFERENCES hypotheses(id);
ALTER TABLE public.findings DROP CONSTRAINT IF EXISTS findings_job_id_fkey;
ALTER TABLE public.findings ADD CONSTRAINT findings_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.flagged_transactions DROP CONSTRAINT IF EXISTS flagged_transactions_project_id_fkey;
ALTER TABLE public.flagged_transactions ADD CONSTRAINT flagged_transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.hypotheses DROP CONSTRAINT IF EXISTS hypotheses_job_id_fkey;
ALTER TABLE public.hypotheses ADD CONSTRAINT hypotheses_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.observations DROP CONSTRAINT IF EXISTS observations_job_id_fkey;
ALTER TABLE public.observations ADD CONSTRAINT observations_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.observations DROP CONSTRAINT IF EXISTS observations_project_id_fkey;
ALTER TABLE public.observations ADD CONSTRAINT observations_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.processed_data DROP CONSTRAINT IF EXISTS processed_data_project_id_fkey;
ALTER TABLE public.processed_data ADD CONSTRAINT processed_data_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.processed_data DROP CONSTRAINT IF EXISTS processed_data_source_document_id_fkey;
ALTER TABLE public.processed_data ADD CONSTRAINT processed_data_source_document_id_fkey FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE SET NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.project_data_chunks DROP CONSTRAINT IF EXISTS project_data_chunks_project_id_fkey;
ALTER TABLE public.project_data_chunks ADD CONSTRAINT project_data_chunks_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_payments DROP CONSTRAINT IF EXISTS project_payments_project_id_fkey;
ALTER TABLE public.project_payments ADD CONSTRAINT project_payments_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_payments DROP CONSTRAINT IF EXISTS project_payments_user_id_fkey;
ALTER TABLE public.project_payments ADD CONSTRAINT project_payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.project_shares DROP CONSTRAINT IF EXISTS project_shares_project_id_fkey;
ALTER TABLE public.project_shares ADD CONSTRAINT project_shares_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE public.projects ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.proposal_evidence DROP CONSTRAINT IF EXISTS proposal_evidence_canonical_txn_id_fkey;
ALTER TABLE public.proposal_evidence ADD CONSTRAINT proposal_evidence_canonical_txn_id_fkey FOREIGN KEY (canonical_txn_id) REFERENCES canonical_transactions(id);
ALTER TABLE public.proposal_evidence DROP CONSTRAINT IF EXISTS proposal_evidence_proposal_id_fkey;
ALTER TABLE public.proposal_evidence ADD CONSTRAINT proposal_evidence_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES adjustment_proposals(id) ON DELETE CASCADE;
ALTER TABLE public.qb_sync_requests DROP CONSTRAINT IF EXISTS qb_sync_requests_project_id_fkey;
ALTER TABLE public.qb_sync_requests ADD CONSTRAINT qb_sync_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.reclassification_jobs DROP CONSTRAINT IF EXISTS reclassification_jobs_project_id_fkey;
ALTER TABLE public.reclassification_jobs ADD CONSTRAINT reclassification_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.tensions DROP CONSTRAINT IF EXISTS tensions_job_id_fkey;
ALTER TABLE public.tensions ADD CONSTRAINT tensions_job_id_fkey FOREIGN KEY (job_id) REFERENCES analysis_jobs(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.verification_attempts DROP CONSTRAINT IF EXISTS verification_attempts_proposal_id_fkey;
ALTER TABLE public.verification_attempts ADD CONSTRAINT verification_attempts_proposal_id_fkey FOREIGN KEY (proposal_id) REFERENCES adjustment_proposals(id);
ALTER TABLE public.verification_transaction_snapshots DROP CONSTRAINT IF EXISTS verification_transaction_snapshots_verification_attempt_id_fkey;
ALTER TABLE public.verification_transaction_snapshots ADD CONSTRAINT verification_transaction_snapshots_verification_attempt_id_fkey FOREIGN KEY (verification_attempt_id) REFERENCES verification_attempts(id) ON DELETE CASCADE;
ALTER TABLE public.workflows DROP CONSTRAINT IF EXISTS workflows_project_id_fkey;
ALTER TABLE public.workflows ADD CONSTRAINT workflows_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- ============================================================================
-- 6. INDEXES (non-constraint-backed)
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_adjustment_proofs_adj_id_type ON public.adjustment_proofs USING btree (adjustment_id, verification_type) WHERE (verification_type <> 'document_attachment'::text);
CREATE INDEX IF NOT EXISTS idx_adjustment_proofs_adjustment_id ON public.adjustment_proofs USING btree (adjustment_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proofs_project_id ON public.adjustment_proofs USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_job ON public.adjustment_proposals USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_project ON public.adjustment_proposals USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_project_status ON public.adjustment_proposals USING btree (project_id, status);
CREATE INDEX IF NOT EXISTS idx_adjustment_proposals_support_tier ON public.adjustment_proposals USING btree (support_tier);
CREATE INDEX IF NOT EXISTS idx_ap_project_status ON public.adjustment_proposals USING btree (project_id, status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project ON public.analysis_jobs USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON public.analysis_jobs USING btree (project_id, status);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user ON public.analysis_jobs USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_job_id ON public.business_profiles USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_project_id ON public.business_profiles USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_canonical_transactions_project ON public.canonical_transactions USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_canonical_txns_project ON public.canonical_transactions USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_ct_job ON public.canonical_transactions USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_ct_project_account ON public.canonical_transactions USING btree (project_id, account_name);
CREATE INDEX IF NOT EXISTS idx_ct_project_date ON public.canonical_transactions USING btree (project_id, txn_date);
CREATE INDEX IF NOT EXISTS idx_ct_project_vendor ON public.canonical_transactions USING btree (project_id, vendor);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_context ON public.chat_messages USING btree (project_id, context_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_context_created ON public.chat_messages USING btree (project_id, context_type, created_at);
CREATE INDEX IF NOT EXISTS idx_claim_ledger_adjustment ON public.claim_ledger USING btree (adjustment_id);
CREATE INDEX IF NOT EXISTS idx_claim_ledger_chain_complete ON public.claim_ledger USING btree (chain_complete);
CREATE INDEX IF NOT EXISTS idx_claim_ledger_job_id ON public.claim_ledger USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_claim_ledger_project_id ON public.claim_ledger USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_detector_runs_job ON public.detector_runs USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_docuclipper_jobs_document_id ON public.docuclipper_jobs USING btree (document_id);
CREATE INDEX IF NOT EXISTS idx_docuclipper_jobs_job_id ON public.docuclipper_jobs USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_docuclipper_jobs_project_id ON public.docuclipper_jobs USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_docuclipper_jobs_status ON public.docuclipper_jobs USING btree (status);
CREATE INDEX IF NOT EXISTS idx_documents_project_filepath ON public.documents USING btree (project_id, file_path);
CREATE INDEX IF NOT EXISTS idx_documents_project_status ON public.documents USING btree (project_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_job_id ON public.entity_nodes USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_entity_nodes_project_id ON public.entity_nodes USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_findings_job_id ON public.findings USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_findings_project_id ON public.findings USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_flagged_transactions_category ON public.flagged_transactions USING btree (flag_category);
CREATE INDEX IF NOT EXISTS idx_flagged_transactions_project_status ON public.flagged_transactions USING btree (project_id, status);
CREATE INDEX IF NOT EXISTS idx_hypotheses_job_id ON public.hypotheses USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_hypotheses_project_id ON public.hypotheses USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_observations_job_id ON public.observations USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_observations_project_id ON public.observations USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_processed_data_project_type ON public.processed_data USING btree (project_id, data_type);
CREATE INDEX IF NOT EXISTS idx_processed_data_source_document ON public.processed_data USING btree (source_document_id);
CREATE INDEX IF NOT EXISTS idx_processed_data_source_type ON public.processed_data USING btree (source_type);
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at ON public.processed_webhook_events USING btree (processed_at);
CREATE INDEX IF NOT EXISTS idx_project_data_chunks_embedding ON public.project_data_chunks USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists='100');
CREATE INDEX IF NOT EXISTS idx_project_data_chunks_project_type ON public.project_data_chunks USING btree (project_id, data_type);
CREATE INDEX IF NOT EXISTS idx_project_shares_project ON public.project_shares USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_shared_email ON public.project_shares USING btree (shared_with_email);
CREATE INDEX IF NOT EXISTS idx_project_shares_shared_user ON public.project_shares USING btree (shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_projects_id_user ON public.projects USING btree (id, user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_evidence_proposal ON public.proposal_evidence USING btree (proposal_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_authority ON public.rag_chunks USING btree (authority_weight);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding ON public.rag_chunks USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists='100');
CREATE INDEX IF NOT EXISTS idx_rag_chunks_source ON public.rag_chunks USING btree (source);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_topics ON public.rag_chunks USING gin (topic_tags);
CREATE INDEX IF NOT EXISTS idx_tensions_job_id ON public.tensions USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_tensions_project_id ON public.tensions USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_tensions_severity ON public.tensions USING btree (severity);
CREATE INDEX IF NOT EXISTS idx_upload_errors_project ON public.upload_errors USING btree (project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upload_errors_user ON public.upload_errors USING btree (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_project ON public.verification_attempts USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_proposal ON public.verification_attempts USING btree (proposal_id);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_status ON public.verification_attempts USING btree (status);
CREATE INDEX IF NOT EXISTS idx_verification_attempts_user ON public.verification_attempts USING btree (verified_by_user_id);
CREATE INDEX IF NOT EXISTS idx_vts_transaction ON public.verification_transaction_snapshots USING btree (transaction_id);
CREATE INDEX IF NOT EXISTS idx_vts_verification ON public.verification_transaction_snapshots USING btree (verification_attempt_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON public.workflows USING btree (project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows USING btree (status);
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows USING btree (user_id);

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_share_on_cpa_claim()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  cpa_email text;
BEGIN
  SELECT email INTO cpa_email FROM auth.users WHERE id = NEW.cpa_user_id;

  INSERT INTO public.project_shares (project_id, shared_with_user_id, shared_with_email, role, created_by)
  VALUES (NEW.project_id, NEW.cpa_user_id, COALESCE(cpa_email, ''), 'editor', NEW.cpa_user_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.duplicate_project(_source_project_id uuid, _new_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _new_project_id uuid := gen_random_uuid();
  _src_row projects%ROWTYPE;
BEGIN
  SELECT * INTO _src_row FROM projects WHERE id = _source_project_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source project not found';
  END IF;

  INSERT INTO projects (id, user_id, name, client_name, target_company, status, wizard_data, periods,
    fiscal_year_end, industry, transaction_type, service_tier, current_phase, current_section,
    google_sheet_id, google_sheet_url, funded_by_credit, credit_expires_at)
  VALUES (
    _new_project_id, _src_row.user_id,
    COALESCE(_new_name, _src_row.name || ' (Copy)'),
    _src_row.client_name, _src_row.target_company, _src_row.status,
    _src_row.wizard_data, _src_row.periods, _src_row.fiscal_year_end,
    _src_row.industry, _src_row.transaction_type, _src_row.service_tier,
    _src_row.current_phase, _src_row.current_section,
    _src_row.google_sheet_id, _src_row.google_sheet_url,
    _src_row.funded_by_credit, _src_row.credit_expires_at
  );

  CREATE TEMP TABLE _doc_map (old_id uuid, new_id uuid) ON COMMIT DROP;
  INSERT INTO _doc_map (old_id, new_id)
  SELECT id, gen_random_uuid() FROM documents WHERE project_id = _source_project_id;

  INSERT INTO documents (id, project_id, user_id, name, file_path, file_type, file_size,
    category, institution, account_label, account_type, docuclipper_job_id, period_start,
    period_end, processing_status, parsed_summary, coverage_validated, company_name,
    extracted_data, document_ids, status, job_id, document_type, description, validated_at, validation_result)
  SELECT dm.new_id, _new_project_id, d.user_id, d.name, d.file_path, d.file_type, d.file_size,
    d.category, d.institution, d.account_label, d.account_type, d.docuclipper_job_id, d.period_start,
    d.period_end, d.processing_status, d.parsed_summary, d.coverage_validated, d.company_name,
    d.extracted_data, d.document_ids, d.status, d.job_id, d.document_type, d.description, d.validated_at, d.validation_result
  FROM documents d
  JOIN _doc_map dm ON dm.old_id = d.id;

  INSERT INTO processed_data (id, project_id, user_id, data_type, data, source_type,
    period_start, period_end, qb_realm_id, source_document_id, record_count, validation_status)
  SELECT gen_random_uuid(), _new_project_id, pd.user_id, pd.data_type, pd.data, pd.source_type,
    pd.period_start, pd.period_end, pd.qb_realm_id,
    COALESCE((SELECT new_id FROM _doc_map WHERE old_id = pd.source_document_id), pd.source_document_id),
    pd.record_count, pd.validation_status
  FROM processed_data pd WHERE pd.project_id = _source_project_id;

  INSERT INTO canonical_transactions (id, project_id, user_id, source_type, source_txn_id,
    txn_date, description, vendor, amount, account_number, account_name, memo, raw_reference,
    account_type, source_processed_data_id, source_document_id, source_record_id, fallback_hash,
    posting_period, amount_abs, amount_signed, payee, txn_type, split_account, is_year_end,
    raw_payload, check_number, job_id)
  SELECT gen_random_uuid(), _new_project_id, ct.user_id, ct.source_type, ct.source_txn_id,
    ct.txn_date, ct.description, ct.vendor, ct.amount, ct.account_number, ct.account_name,
    ct.memo, ct.raw_reference, ct.account_type, ct.source_processed_data_id,
    COALESCE((SELECT new_id FROM _doc_map WHERE old_id = ct.source_document_id), ct.source_document_id),
    ct.source_record_id, ct.fallback_hash, ct.posting_period, ct.amount_abs, ct.amount_signed,
    ct.payee, ct.txn_type, ct.split_account, ct.is_year_end, ct.raw_payload, ct.check_number, ct.job_id
  FROM canonical_transactions ct WHERE ct.project_id = _source_project_id;

  INSERT INTO flagged_transactions (id, project_id, user_id, transaction_date, description,
    amount, account_name, flag_type, flag_reason, confidence_score, suggested_adjustment_type,
    suggested_adjustment_amount, status, ai_analysis, source_data, flag_category, classification_context)
  SELECT gen_random_uuid(), _new_project_id, ft.user_id, ft.transaction_date, ft.description,
    ft.amount, ft.account_name, ft.flag_type, ft.flag_reason, ft.confidence_score,
    ft.suggested_adjustment_type, ft.suggested_adjustment_amount, ft.status, ft.ai_analysis,
    ft.source_data, ft.flag_category, ft.classification_context
  FROM flagged_transactions ft WHERE ft.project_id = _source_project_id;

  -- Clone project_data_chunks with remapped chunk_key (replace source project ID with new one)
  INSERT INTO project_data_chunks (id, project_id, chunk_key, data_type, content,
    period, fs_section, token_count, metadata, embedding)
  SELECT gen_random_uuid(), _new_project_id,
    replace(pdc.chunk_key, _source_project_id::text, _new_project_id::text),
    pdc.data_type, pdc.content,
    pdc.period, pdc.fs_section, pdc.token_count, pdc.metadata, pdc.embedding
  FROM project_data_chunks pdc WHERE pdc.project_id = _source_project_id;

  INSERT INTO company_info (id, project_id, user_id, company_name, realm_id, bearer_token,
    refresh_token, token_expires_at, auth_code)
  SELECT gen_random_uuid(), _new_project_id, ci.user_id, ci.company_name, ci.realm_id,
    ci.bearer_token, ci.refresh_token, ci.token_expires_at, ci.auth_code
  FROM company_info ci WHERE ci.project_id = _source_project_id;

  RETURN _new_project_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fetch_processed_data_chunked(_project_id uuid, _data_type text, _chunk_size integer DEFAULT 50, _offset integer DEFAULT 0)
 RETURNS SETOF processed_data
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET LOCAL statement_timeout = '900s';
  RETURN QUERY
    SELECT * FROM public.processed_data
    WHERE project_id = _project_id
      AND data_type = _data_type
    ORDER BY id
    LIMIT _chunk_size
    OFFSET _offset;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fetch_processed_data_ids(_project_id uuid, _data_type text)
 RETURNS TABLE(id uuid, period_start date, period_end date, source_type text, record_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET LOCAL statement_timeout = '60s';
  RETURN QUERY
    SELECT pd.id, pd.period_start, pd.period_end, pd.source_type, pd.record_count
    FROM public.processed_data pd
    WHERE pd.project_id = _project_id
      AND pd.data_type = _data_type
    ORDER BY pd.period_start;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_project_role(_user_id uuid, _project_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_engagement_stats()
 RETURNS TABLE(user_id uuid, email text, full_name text, company text, signed_up_at timestamp with time zone, last_sign_in_at timestamp with time zone, project_count bigint, document_count bigint, has_qb_connection boolean, has_completed_onboarding boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.email::text AS email,
    p.full_name,
    p.company,
    u.created_at AS signed_up_at,
    u.last_sign_in_at,
    COALESCE(proj.cnt, 0) AS project_count,
    COALESCE(docs.cnt, 0) AS document_count,
    COALESCE(qb.has_qb, false) AS has_qb_connection,
    COALESCE(proj.has_onboarding, false) AS has_completed_onboarding
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::bigint AS cnt,
      bool_or(pr.current_phase > 1 OR pr.status != 'draft') AS has_onboarding
    FROM public.projects pr
    WHERE pr.user_id = u.id
  ) proj ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::bigint AS cnt
    FROM public.documents d
    JOIN public.projects pr2 ON pr2.id = d.project_id
    WHERE pr2.user_id = u.id
  ) docs ON true
  LEFT JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1 FROM public.company_info ci
      JOIN public.projects pr3 ON pr3.id = ci.project_id
      WHERE pr3.user_id = u.id AND ci.realm_id IS NOT NULL
    ) AS has_qb
  ) qb ON true
  ORDER BY u.created_at DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_project_access(_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.project_shares
    WHERE project_id = _project_id
      AND (shared_with_user_id = auth.uid()
           OR shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.has_project_access(_user_id uuid, _project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    -- User owns the project
    SELECT 1 FROM public.projects WHERE id = _project_id AND user_id = _user_id
  ) OR EXISTS (
    -- User has a share entry (by user_id or email)
    SELECT 1 FROM public.project_shares 
    WHERE project_id = _project_id 
    AND (
      shared_with_user_id = _user_id 
      OR shared_with_email = (SELECT email FROM auth.users WHERE id = _user_id)
    )
  )
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.match_project_chunks(_project_id uuid, query_embedding extensions.vector, match_threshold double precision DEFAULT 0.65, match_count integer DEFAULT 15, data_type_filter text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, data_type text, period text, fs_section text, content text, token_count integer, similarity double precision, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  WITH scored AS (
    SELECT
      c.id,
      c.data_type,
      c.period,
      c.fs_section,
      c.content,
      c.token_count,
      (1 - (c.embedding <=> query_embedding))::double precision AS similarity,
      c.metadata,
      ROW_NUMBER() OVER (
        PARTITION BY c.data_type, c.period
        ORDER BY (1 - (c.embedding <=> query_embedding)) DESC
      ) AS partition_rank
    FROM public.project_data_chunks c
    WHERE
      c.project_id = _project_id
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
    combined.id,
    combined.data_type,
    combined.period,
    combined.fs_section,
    combined.content,
    combined.token_count,
    combined.similarity,
    combined.metadata
  FROM combined
  ORDER BY combined.priority, combined.similarity DESC
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_project_chunks(_project_id uuid, query_embedding text, match_threshold double precision DEFAULT 0.65, match_count integer DEFAULT 15, data_type_filter text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, data_type text, period text, fs_section text, content text, token_count integer, similarity double precision, metadata jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _embedding vector(1536);
BEGIN
  _embedding := query_embedding::vector(1536);

  RETURN QUERY
  WITH scored AS (
    SELECT
      c.id,
      c.data_type,
      c.period,
      c.fs_section,
      c.content,
      c.token_count,
      (1 - (c.embedding <=> _embedding))::double precision AS similarity,
      c.metadata,
      ROW_NUMBER() OVER (
        PARTITION BY c.data_type, c.period
        ORDER BY (1 - (c.embedding <=> _embedding)) DESC
      ) AS partition_rank
    FROM public.project_data_chunks c
    WHERE
      c.project_id = _project_id
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
    combined.id,
    combined.data_type,
    combined.period,
    combined.fs_section,
    combined.content,
    combined.token_count,
    combined.similarity,
    combined.metadata
  FROM combined
  ORDER BY combined.priority, combined.similarity DESC
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_rag_chunks(query_embedding extensions.vector, match_threshold double precision DEFAULT 0.72, match_count integer DEFAULT 5, source_filter text[] DEFAULT NULL::text[], min_authority double precision DEFAULT 0.0, topic_filter text[] DEFAULT NULL::text[])
 RETURNS TABLE(id uuid, content text, source text, source_title text, chapter text, section text, page_number integer, similarity double precision, authority_weight double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  WITH ranked_chunks AS (
    SELECT
      rc.id,
      rc.content,
      rc.source,
      rc.source_title,
      rc.chapter,
      rc.section,
      rc.page_number,
      (1 - (rc.embedding <=> query_embedding))::FLOAT AS similarity,
      rc.authority_weight,
      ROW_NUMBER() OVER (
        PARTITION BY rc.source, rc.chapter 
        ORDER BY (1 - (rc.embedding <=> query_embedding)) DESC
      ) AS chapter_rank
    FROM rag_chunks rc
    WHERE 
      rc.embedding IS NOT NULL
      AND (1 - (rc.embedding <=> query_embedding)) > match_threshold
      AND (source_filter IS NULL OR rc.source = ANY(source_filter))
      AND rc.authority_weight >= min_authority
      AND (topic_filter IS NULL OR rc.topic_tags && topic_filter)
  )
  SELECT 
    ranked_chunks.id,
    ranked_chunks.content,
    ranked_chunks.source,
    ranked_chunks.source_title,
    ranked_chunks.chapter,
    ranked_chunks.section,
    ranked_chunks.page_number,
    ranked_chunks.similarity,
    ranked_chunks.authority_weight
  FROM ranked_chunks
  WHERE ranked_chunks.chapter_rank = 1
  ORDER BY ranked_chunks.similarity * ranked_chunks.authority_weight DESC
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_enrich_document()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
BEGIN
  -- Only fire when extracted_data goes from NULL to non-NULL
  IF OLD.extracted_data IS NULL AND NEW.extracted_data IS NOT NULL THEN
    -- Only fire if not already enriched
    IF NEW.account_label IS NULL OR NEW.period_start IS NULL OR NEW.parsed_summary IS NULL THEN
      SELECT net.http_post(
        url := supabase_url || '/functions/v1/enrich-document',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := jsonb_build_object(
          'document_id', NEW.id::text
        )
      ) INTO request_id;

      RAISE LOG 'notify_enrich_document: triggered for document_id=%, request_id=%', NEW.id, request_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_new_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  user_email TEXT;
  request_id BIGINT;
BEGIN
  -- Look up the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  SELECT net.http_post(
    url := supabase_url || '/functions/v1/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'event_type', 'signup',
      'user_email', COALESCE(user_email, 'unknown'),
      'user_name', COALESCE(NEW.full_name, 'Unknown')
    )
  ) INTO request_id;

  RAISE LOG 'notify_new_signup: triggered for user_id=%, request_id=%', NEW.user_id, request_id;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.notify_qb_sync_complete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  supabase_url TEXT := 'https://sqwohcvobfnymsbzlfqr.supabase.co';
  request_id BIGINT;
  last_request timestamptz;
  cooldown_seconds int := 10;
BEGIN
  IF NEW.source_type = 'quickbooks_api' THEN
    -- Rate limit check: skip if already triggered recently for this project
    SELECT last_requested_at INTO last_request
    FROM qb_sync_requests
    WHERE project_id = NEW.project_id;
    
    IF last_request IS NOT NULL 
       AND last_request > (now() - make_interval(secs => cooldown_seconds)) THEN
      -- Skip - already triggered recently
      RAISE LOG 'notify_qb_sync_complete: SKIPPED (rate limited) for project_id=%, last_request=%', 
        NEW.project_id, last_request;
      RETURN NEW;
    END IF;
    
    -- Update rate limit tracker (upsert)
    INSERT INTO qb_sync_requests (project_id, last_requested_at, request_count)
    VALUES (NEW.project_id, now(), 1)
    ON CONFLICT (project_id) 
    DO UPDATE SET 
      last_requested_at = now(),
      request_count = qb_sync_requests.request_count + 1;
    
    -- Fire the HTTP call (only once per 10 seconds per project)
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
    
    RAISE LOG 'notify_qb_sync_complete: triggered for project_id=%, request_id=%', 
      NEW.project_id, request_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.populate_company_info_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If user_id is NULL, derive it from the project
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- If still NULL (project not found), raise an error
    IF NEW.user_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create company_info: project_id % not found or has no user_id', NEW.project_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.populate_detector_run_from_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.project_id IS NULL OR NEW.user_id IS NULL THEN
    SELECT project_id, user_id
    INTO NEW.project_id, NEW.user_id
    FROM public.analysis_jobs
    WHERE id = NEW.job_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_null_company_info_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If user_id is being set to NULL, restore from projects
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM public.projects
    WHERE id = NEW.project_id;
    
    -- If still NULL, keep the old value
    IF NEW.user_id IS NULL THEN
      NEW.user_id := OLD.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_project_data(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_project_owner uuid;
BEGIN
  -- Check the project exists and get owner
  SELECT user_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Only allow project owner or admin
  IF v_user_id != v_project_owner AND NOT has_role(v_user_id, 'admin') THEN
    RAISE EXCEPTION 'Permission denied: only project owner or admin can reset';
  END IF;

  -- Delete all related data (order matters for FK constraints)
  DELETE FROM public.adjustment_proofs WHERE project_id = p_project_id;
  DELETE FROM public.flagged_transactions WHERE project_id = p_project_id;
  DELETE FROM public.chat_messages WHERE project_id = p_project_id;
  DELETE FROM public.docuclipper_jobs WHERE project_id = p_project_id;
  DELETE FROM public.processed_data WHERE project_id = p_project_id;
  DELETE FROM public.documents WHERE project_id = p_project_id;
  DELETE FROM public.company_info WHERE project_id = p_project_id;
  DELETE FROM public.workflows WHERE project_id = p_project_id;

  -- Reset the project shell
  UPDATE public.projects SET
    wizard_data = '{}'::jsonb,
    current_phase = 1,
    current_section = 1,
    periods = '[]'::jsonb,
    fiscal_year_end = NULL,
    industry = NULL,
    google_sheet_id = NULL,
    google_sheet_url = NULL,
    status = 'draft'
  WHERE id = p_project_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_job_id_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.sync_job_id_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.job_id IS NOT NULL AND NEW.docuclipper_job_id IS NULL THEN
    NEW.docuclipper_job_id := NEW.job_id;
  ELSIF NEW.docuclipper_job_id IS NOT NULL AND NEW.job_id IS NULL THEN
    NEW.job_id := NEW.docuclipper_job_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_status_to_processing_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IS NOT NULL
     AND (NEW.processing_status IS NOT DISTINCT FROM OLD.processing_status) THEN
    NEW.processing_status := NEW.status;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_credits_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_workflow_progress_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  active_workflow_id UUID;
  workflow_started_at TIMESTAMPTZ;
  v_input_payload JSONB;
  record_count INTEGER;
  expected_count INTEGER;
  progress_pct INTEGER;
BEGIN
  -- Only process QuickBooks API data
  IF NEW.source_type != 'quickbooks_api' THEN
    RETURN NEW;
  END IF;

  -- Find active SYNC_TO_SHEET workflow for this project
  SELECT w.id, w.started_at, w.input_payload 
  INTO active_workflow_id, workflow_started_at, v_input_payload
  FROM workflows w
  WHERE w.project_id = NEW.project_id
    AND w.workflow_type = 'SYNC_TO_SHEET'
    AND w.status = 'running'
  ORDER BY w.started_at DESC
  LIMIT 1;
  
  IF active_workflow_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count trial_balance records synced since workflow started
  SELECT COUNT(*) INTO record_count
  FROM processed_data
  WHERE project_id = NEW.project_id
    AND source_type = 'quickbooks_api'
    AND data_type = 'trial_balance'
    AND created_at >= workflow_started_at;
  
  -- Calculate expected count from v_input_payload date range
  BEGIN
    expected_count := COALESCE(
      (
        SELECT (
          EXTRACT(YEAR FROM AGE(
            (v_input_payload->>'end_date')::DATE,
            (v_input_payload->>'start_date')::DATE
          )) * 12 + 
          EXTRACT(MONTH FROM AGE(
            (v_input_payload->>'end_date')::DATE,
            (v_input_payload->>'start_date')::DATE
          )) + 1
        )::INTEGER
      ),
      36
    );
  EXCEPTION WHEN OTHERS THEN
    expected_count := 36;
  END;
  
  -- Ensure expected_count is at least 1
  IF expected_count < 1 THEN
    expected_count := 36;
  END IF;
  
  -- Calculate progress (15-80% range for fetch_qb step)
  progress_pct := 15 + LEAST(65, (record_count::float / expected_count * 65)::integer);
  
  -- Update workflow progress
  UPDATE workflows
  SET progress_percent = progress_pct,
      updated_at = NOW()
  WHERE id = active_workflow_id
    AND status = 'running';
  
  RETURN NEW;
END;
$function$
;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
DROP TRIGGER IF EXISTS update_adjustment_proofs_updated_at ON public.adjustment_proofs;
CREATE TRIGGER update_adjustment_proofs_updated_at BEFORE UPDATE ON public.adjustment_proofs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trigger_populate_company_info_user_id ON public.company_info;
CREATE TRIGGER trigger_populate_company_info_user_id BEFORE INSERT ON public.company_info FOR EACH ROW EXECUTE FUNCTION populate_company_info_user_id();
DROP TRIGGER IF EXISTS trigger_prevent_null_company_info_user_id ON public.company_info;
CREATE TRIGGER trigger_prevent_null_company_info_user_id BEFORE UPDATE ON public.company_info FOR EACH ROW EXECUTE FUNCTION prevent_null_company_info_user_id();
DROP TRIGGER IF EXISTS update_company_info_updated_at ON public.company_info;
CREATE TRIGGER update_company_info_updated_at BEFORE UPDATE ON public.company_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_auto_share_on_cpa_claim ON public.cpa_claims;
CREATE TRIGGER trg_auto_share_on_cpa_claim AFTER INSERT ON public.cpa_claims FOR EACH ROW EXECUTE FUNCTION auto_share_on_cpa_claim();
DROP TRIGGER IF EXISTS update_cpa_claims_updated_at ON public.cpa_claims;
CREATE TRIGGER update_cpa_claims_updated_at BEFORE UPDATE ON public.cpa_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_populate_detector_run_from_job ON public.detector_runs;
CREATE TRIGGER trg_populate_detector_run_from_job BEFORE INSERT ON public.detector_runs FOR EACH ROW EXECUTE FUNCTION populate_detector_run_from_job();
DROP TRIGGER IF EXISTS update_docuclipper_jobs_updated_at ON public.docuclipper_jobs;
CREATE TRIGGER update_docuclipper_jobs_updated_at BEFORE UPDATE ON public.docuclipper_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS trg_enrich_document_on_extracted_data ON public.documents;
CREATE TRIGGER trg_enrich_document_on_extracted_data AFTER UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION notify_enrich_document();
DROP TRIGGER IF EXISTS trg_enrich_document_on_insert ON public.documents;
CREATE TRIGGER trg_enrich_document_on_insert AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION notify_enrich_document();
DROP TRIGGER IF EXISTS trg_sync_job_id ON public.documents;
CREATE TRIGGER trg_sync_job_id BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION sync_job_id_columns();
DROP TRIGGER IF EXISTS trg_sync_job_id_insert ON public.documents;
CREATE TRIGGER trg_sync_job_id_insert BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION sync_job_id_on_insert();
DROP TRIGGER IF EXISTS trg_sync_status ON public.documents;
CREATE TRIGGER trg_sync_status BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION sync_status_to_processing_status();
DROP TRIGGER IF EXISTS update_flagged_transactions_updated_at ON public.flagged_transactions;
CREATE TRIGGER update_flagged_transactions_updated_at BEFORE UPDATE ON public.flagged_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS on_qb_data_inserted ON public.processed_data;
CREATE TRIGGER on_qb_data_inserted AFTER INSERT ON public.processed_data FOR EACH ROW WHEN (((new.source_type = 'quickbooks'::text) OR (new.source_type = 'quickbooks_api'::text))) EXECUTE FUNCTION notify_qb_sync_complete();
DROP TRIGGER IF EXISTS trigger_workflow_progress_on_processed_data ON public.processed_data;
CREATE TRIGGER trigger_workflow_progress_on_processed_data AFTER INSERT ON public.processed_data FOR EACH ROW EXECUTE FUNCTION update_workflow_progress_on_insert();
DROP TRIGGER IF EXISTS update_processed_data_updated_at ON public.processed_data;
CREATE TRIGGER update_processed_data_updated_at BEFORE UPDATE ON public.processed_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS on_profile_created_notify ON public.profiles;
CREATE TRIGGER on_profile_created_notify AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION notify_new_signup();
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_promo_config_updated_at ON public.promo_config;
CREATE TRIGGER update_promo_config_updated_at BEFORE UPDATE ON public.promo_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rag_chunks_updated_at ON public.rag_chunks;
CREATE TRIGGER update_rag_chunks_updated_at BEFORE UPDATE ON public.rag_chunks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON public.user_credits;
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE FUNCTION update_user_credits_updated_at();
DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS enforce_bucket_name_length_trigger ON storage.buckets;
CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();
DROP TRIGGER IF EXISTS protect_buckets_delete ON storage.buckets;
CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
DROP TRIGGER IF EXISTS protect_objects_delete ON storage.objects;
CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();
DROP TRIGGER IF EXISTS update_objects_updated_at ON storage.objects;
CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (enable + policies)
-- ============================================================================
ALTER TABLE public.adjustment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adjustment_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cpa_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detector_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dfy_provider_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.docuclipper_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hypotheses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nudge_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_data_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_sync_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reclassification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tos_acceptances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_transaction_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whitelisted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all adjustment proofs" ON public.adjustment_proofs;
CREATE POLICY "Admins can view all adjustment proofs" ON public.adjustment_proofs
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own adjustment proofs" ON public.adjustment_proofs;
CREATE POLICY "Users can create their own adjustment proofs" ON public.adjustment_proofs
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete their own adjustment proofs" ON public.adjustment_proofs;
CREATE POLICY "Users can delete their own adjustment proofs" ON public.adjustment_proofs
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own adjustment proofs" ON public.adjustment_proofs;
CREATE POLICY "Users can update their own adjustment proofs" ON public.adjustment_proofs
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view project adjustment proofs" ON public.adjustment_proofs;
CREATE POLICY "Users can view project adjustment proofs" ON public.adjustment_proofs
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

DROP POLICY IF EXISTS "Service role manages adjustment proposals" ON public.adjustment_proposals;
CREATE POLICY "Service role manages adjustment proposals" ON public.adjustment_proposals
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can update their own adjustment proposals" ON public.adjustment_proposals;
CREATE POLICY "Users can update their own adjustment proposals" ON public.adjustment_proposals
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view project adjustment proposals" ON public.adjustment_proposals;
CREATE POLICY "Users can view project adjustment proposals" ON public.adjustment_proposals
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

DROP POLICY IF EXISTS "Admins can create admin notes" ON public.admin_notes;
CREATE POLICY "Admins can create admin notes" ON public.admin_notes
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((has_role(auth.uid(), 'admin'::app_role) AND (auth.uid() = admin_id)));

DROP POLICY IF EXISTS "Admins can delete admin notes" ON public.admin_notes;
CREATE POLICY "Admins can delete admin notes" ON public.admin_notes
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING ((has_role(auth.uid(), 'admin'::app_role) AND (auth.uid() = admin_id)));

DROP POLICY IF EXISTS "Admins can view all admin notes" ON public.admin_notes;
CREATE POLICY "Admins can view all admin notes" ON public.admin_notes
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role manages analysis jobs" ON public.analysis_jobs;
CREATE POLICY "Service role manages analysis jobs" ON public.analysis_jobs
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can insert their own analysis jobs" ON public.analysis_jobs;
CREATE POLICY "Users can insert their own analysis jobs" ON public.analysis_jobs
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own analysis jobs" ON public.analysis_jobs;
CREATE POLICY "Users can update their own analysis jobs" ON public.analysis_jobs
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view project analysis jobs" ON public.analysis_jobs;
CREATE POLICY "Users can view project analysis jobs" ON public.analysis_jobs
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

DROP POLICY IF EXISTS "Service role full access business_profiles" ON public.business_profiles;
CREATE POLICY "Service role full access business_profiles" ON public.business_profiles
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project business_profiles" ON public.business_profiles;
CREATE POLICY "Users can view project business_profiles" ON public.business_profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM analysis_jobs aj
  WHERE ((aj.id = business_profiles.job_id) AND has_project_access(aj.project_id)))));

DROP POLICY IF EXISTS "Service role manages canonical transactions" ON public.canonical_transactions;
CREATE POLICY "Service role manages canonical transactions" ON public.canonical_transactions
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project canonical transactions" ON public.canonical_transactions;
CREATE POLICY "Users can view project canonical transactions" ON public.canonical_transactions
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

DROP POLICY IF EXISTS "Admins can view all chat messages" ON public.chat_messages;
CREATE POLICY "Admins can view all chat messages" ON public.chat_messages
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete their project chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete their project chat messages" ON public.chat_messages
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (((project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.user_id = auth.uid()))) OR (get_project_role(auth.uid(), project_id) = ANY (ARRAY['editor'::text, 'admin'::text]))));

DROP POLICY IF EXISTS "Users can insert chat messages to their projects" ON public.chat_messages;
CREATE POLICY "Users can insert chat messages to their projects" ON public.chat_messages
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((auth.uid() = user_id) AND has_project_access(auth.uid(), project_id)));

DROP POLICY IF EXISTS "Users can read their project chat messages" ON public.chat_messages;
CREATE POLICY "Users can read their project chat messages" ON public.chat_messages
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_project_access(auth.uid(), project_id));

DROP POLICY IF EXISTS "Service role full access claim_ledger" ON public.claim_ledger;
CREATE POLICY "Service role full access claim_ledger" ON public.claim_ledger
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project claim_ledger" ON public.claim_ledger;
CREATE POLICY "Users can view project claim_ledger" ON public.claim_ledger
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM analysis_jobs aj
  WHERE ((aj.id = claim_ledger.job_id) AND has_project_access(aj.project_id)))));

DROP POLICY IF EXISTS "Admins can view all company info" ON public.company_info;
CREATE POLICY "Admins can view all company info" ON public.company_info
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create company info for their projects" ON public.company_info;
CREATE POLICY "Users can create company info for their projects" ON public.company_info
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete their own company info" ON public.company_info;
CREATE POLICY "Users can delete their own company info" ON public.company_info
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own company info" ON public.company_info;
CREATE POLICY "Users can update their own company info" ON public.company_info
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own company info" ON public.company_info;
CREATE POLICY "Users can view their own company info" ON public.company_info
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((length(TRIM(BOTH FROM name)) >= 1) AND (length(TRIM(BOTH FROM message)) >= 1) AND (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)));

DROP POLICY IF EXISTS "Only admins can view contact submissions" ON public.contact_submissions;
CREATE POLICY "Only admins can view contact submissions" ON public.contact_submissions
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete cpa_claims" ON public.cpa_claims;
CREATE POLICY "Admins can delete cpa_claims" ON public.cpa_claims
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "CPAs can insert cpa_claims" ON public.cpa_claims;
CREATE POLICY "CPAs can insert cpa_claims" ON public.cpa_claims
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((has_role(auth.uid(), 'cpa'::app_role) AND (cpa_user_id = auth.uid())));

DROP POLICY IF EXISTS "CPAs can update own cpa_claims" ON public.cpa_claims;
CREATE POLICY "CPAs can update own cpa_claims" ON public.cpa_claims
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((((cpa_user_id = auth.uid()) AND has_role(auth.uid(), 'cpa'::app_role)) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "CPAs can view cpa_claims" ON public.cpa_claims;
CREATE POLICY "CPAs can view cpa_claims" ON public.cpa_claims
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((has_role(auth.uid(), 'cpa'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Service role full access cpa_claims" ON public.cpa_claims;
CREATE POLICY "Service role full access cpa_claims" ON public.cpa_claims
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Admins can view all demo views" ON public.demo_views;
CREATE POLICY "Admins can view all demo views" ON public.demo_views
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own demo views" ON public.demo_views;
CREATE POLICY "Users can insert their own demo views" ON public.demo_views
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own demo views" ON public.demo_views;
CREATE POLICY "Users can view their own demo views" ON public.demo_views
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Service role manages detector runs" ON public.detector_runs;
CREATE POLICY "Service role manages detector runs" ON public.detector_runs
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project detector runs" ON public.detector_runs;
CREATE POLICY "Users can view project detector runs" ON public.detector_runs
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

DROP POLICY IF EXISTS "Users can insert own acceptance" ON public.dfy_provider_agreements;
CREATE POLICY "Users can insert own acceptance" ON public.dfy_provider_agreements
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can read own acceptance" ON public.dfy_provider_agreements;
CREATE POLICY "Users can read own acceptance" ON public.dfy_provider_agreements
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins can view all docuclipper jobs" ON public.docuclipper_jobs;
CREATE POLICY "Admins can view all docuclipper jobs" ON public.docuclipper_jobs
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own docuclipper jobs" ON public.docuclipper_jobs;
CREATE POLICY "Users can create their own docuclipper jobs" ON public.docuclipper_jobs
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete their own docuclipper jobs" ON public.docuclipper_jobs;
CREATE POLICY "Users can delete their own docuclipper jobs" ON public.docuclipper_jobs
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own docuclipper jobs" ON public.docuclipper_jobs;
CREATE POLICY "Users can update their own docuclipper jobs" ON public.docuclipper_jobs
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own docuclipper jobs" ON public.docuclipper_jobs;
CREATE POLICY "Users can view their own docuclipper jobs" ON public.docuclipper_jobs
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents" ON public.documents
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can delete their documents" ON public.documents;
CREATE POLICY "Users can delete their documents" ON public.documents
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their documents" ON public.documents;
CREATE POLICY "Users can update their documents" ON public.documents
  AS PERMISSIVE
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can upload documents to their projects" ON public.documents;
CREATE POLICY "Users can upload documents to their projects" ON public.documents
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their project documents" ON public.documents;
CREATE POLICY "Users can view their project documents" ON public.documents
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Service role full access entity_nodes" ON public.entity_nodes;
CREATE POLICY "Service role full access entity_nodes" ON public.entity_nodes
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project entity_nodes" ON public.entity_nodes;
CREATE POLICY "Users can view project entity_nodes" ON public.entity_nodes
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM analysis_jobs aj
  WHERE ((aj.id = entity_nodes.job_id) AND has_project_access(aj.project_id)))));

DROP POLICY IF EXISTS "Service role full access findings" ON public.findings;
CREATE POLICY "Service role full access findings" ON public.findings
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project findings" ON public.findings;
CREATE POLICY "Users can view project findings" ON public.findings
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM analysis_jobs aj
  WHERE ((aj.id = findings.job_id) AND has_project_access(aj.project_id)))));

DROP POLICY IF EXISTS "Admins can view all flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Admins can view all flagged transactions" ON public.flagged_transactions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Users can create flagged transactions" ON public.flagged_transactions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete their own flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Users can delete their own flagged transactions" ON public.flagged_transactions
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Users can update their own flagged transactions" ON public.flagged_transactions
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Users can view their own flagged transactions" ON public.flagged_transactions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Service role full access hypotheses" ON public.hypotheses;
CREATE POLICY "Service role full access hypotheses" ON public.hypotheses
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project hypotheses" ON public.hypotheses;
CREATE POLICY "Users can view project hypotheses" ON public.hypotheses
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM analysis_jobs aj
  WHERE ((aj.id = hypotheses.job_id) AND has_project_access(aj.project_id)))));

DROP POLICY IF EXISTS "Admins can view nudge logs" ON public.nudge_log;
CREATE POLICY "Admins can view nudge logs" ON public.nudge_log
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role can insert nudge logs" ON public.nudge_log;
CREATE POLICY "Service role can insert nudge logs" ON public.nudge_log
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Service role full access observations" ON public.observations;
CREATE POLICY "Service role full access observations" ON public.observations
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project observations" ON public.observations;
CREATE POLICY "Users can view project observations" ON public.observations
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM analysis_jobs aj
  WHERE ((aj.id = observations.job_id) AND has_project_access(aj.project_id)))));

DROP POLICY IF EXISTS "Admins can view all processed data" ON public.processed_data;
CREATE POLICY "Admins can view all processed data" ON public.processed_data
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own processed data" ON public.processed_data;
CREATE POLICY "Users can create their own processed data" ON public.processed_data
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete their own processed data" ON public.processed_data;
CREATE POLICY "Users can delete their own processed data" ON public.processed_data
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own processed data" ON public.processed_data;
CREATE POLICY "Users can update their own processed data" ON public.processed_data
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own processed data" ON public.processed_data;
CREATE POLICY "Users can view their own processed data" ON public.processed_data
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Service role manages webhook events" ON public.processed_webhook_events;
CREATE POLICY "Service role manages webhook events" ON public.processed_webhook_events
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Service role manages project chunks" ON public.project_data_chunks;
CREATE POLICY "Service role manages project chunks" ON public.project_data_chunks
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can read chunks for their projects" ON public.project_data_chunks;
CREATE POLICY "Users can read chunks for their projects" ON public.project_data_chunks
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_project_access(auth.uid(), project_id));

DROP POLICY IF EXISTS "Admins can view all project payments" ON public.project_payments;
CREATE POLICY "Admins can view all project payments" ON public.project_payments
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own project payments" ON public.project_payments;
CREATE POLICY "Users can insert their own project payments" ON public.project_payments
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own project payments" ON public.project_payments;
CREATE POLICY "Users can view their own project payments" ON public.project_payments
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users cannot update payment records" ON public.project_payments;
CREATE POLICY "Users cannot update payment records" ON public.project_payments
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (false);

DROP POLICY IF EXISTS "Project owners can create shares" ON public.project_shares;
CREATE POLICY "Project owners can create shares" ON public.project_shares
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_shares.project_id) AND (projects.user_id = auth.uid())))));

DROP POLICY IF EXISTS "Project owners can delete shares" ON public.project_shares;
CREATE POLICY "Project owners can delete shares" ON public.project_shares
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_shares.project_id) AND (projects.user_id = auth.uid())))));

DROP POLICY IF EXISTS "Users can view shares for their projects or shares with them" ON public.project_shares;
CREATE POLICY "Users can view shares for their projects or shares with them" ON public.project_shares
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = project_shares.project_id) AND (projects.user_id = auth.uid())))) OR (shared_with_user_id = auth.uid()) OR (shared_with_email = (( SELECT users.email
   FROM auth.users
  WHERE (users.id = auth.uid())))::text)));

DROP POLICY IF EXISTS "Admins can delete any project" ON public.projects;
CREATE POLICY "Admins can delete any project" ON public.projects
  AS PERMISSIVE
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all projects" ON public.projects;
CREATE POLICY "Admins can view all projects" ON public.projects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "CPAs can view done_for_you projects" ON public.projects;
CREATE POLICY "CPAs can view done_for_you projects" ON public.projects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((service_tier = 'done_for_you'::text) AND has_role(auth.uid(), 'cpa'::app_role)));

DROP POLICY IF EXISTS "Users can create their own projects" ON public.projects;
CREATE POLICY "Users can create their own projects" ON public.projects
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own or shared projects" ON public.projects;
CREATE POLICY "Users can update their own or shared projects" ON public.projects
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING (((user_id = auth.uid()) OR (get_project_role(auth.uid(), id) = ANY (ARRAY['editor'::text, 'admin'::text]))));

DROP POLICY IF EXISTS "Users can view their own or shared projects" ON public.projects;
CREATE POLICY "Users can view their own or shared projects" ON public.projects
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((user_id = auth.uid()) OR has_project_access(auth.uid(), id)));

DROP POLICY IF EXISTS "Anyone can read promo config" ON public.promo_config;
CREATE POLICY "Anyone can read promo config" ON public.promo_config
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Only service role can modify promo config" ON public.promo_config;
CREATE POLICY "Only service role can modify promo config" ON public.promo_config
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Service role manages proposal evidence" ON public.proposal_evidence;
CREATE POLICY "Service role manages proposal evidence" ON public.proposal_evidence
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project proposal evidence" ON public.proposal_evidence;
CREATE POLICY "Users can view project proposal evidence" ON public.proposal_evidence
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM adjustment_proposals ap
  WHERE ((ap.id = proposal_evidence.proposal_id) AND has_project_access(ap.project_id)))));

DROP POLICY IF EXISTS "Admins can view sync requests" ON public.qb_sync_requests;
CREATE POLICY "Admins can view sync requests" ON public.qb_sync_requests
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can read rag chunks" ON public.rag_chunks;
CREATE POLICY "Anyone can read rag chunks" ON public.rag_chunks
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Only service role can manage rag chunks" ON public.rag_chunks;
CREATE POLICY "Only service role can manage rag chunks" ON public.rag_chunks
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Service role can manage all reclassification jobs" ON public.reclassification_jobs;
CREATE POLICY "Service role can manage all reclassification jobs" ON public.reclassification_jobs
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can create their own reclassification jobs" ON public.reclassification_jobs;
CREATE POLICY "Users can create their own reclassification jobs" ON public.reclassification_jobs
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own reclassification jobs" ON public.reclassification_jobs;
CREATE POLICY "Users can view their own reclassification jobs" ON public.reclassification_jobs
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscription" ON public.subscriptions
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own subscription" ON public.subscriptions;
CREATE POLICY "Users can update their own subscription" ON public.subscriptions
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.subscriptions
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Service role full access tensions" ON public.tensions;
CREATE POLICY "Service role full access tensions" ON public.tensions
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text))
  WITH CHECK ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project tensions" ON public.tensions;
CREATE POLICY "Users can view project tensions" ON public.tensions
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM analysis_jobs aj
  WHERE ((aj.id = tensions.job_id) AND has_project_access(aj.project_id)))));

DROP POLICY IF EXISTS "Admins can view all tos acceptances" ON public.tos_acceptances;
CREATE POLICY "Admins can view all tos acceptances" ON public.tos_acceptances
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can insert their own tos acceptance" ON public.tos_acceptances;
CREATE POLICY "Users can insert their own tos acceptance" ON public.tos_acceptances
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own tos acceptances" ON public.tos_acceptances;
CREATE POLICY "Users can view their own tos acceptances" ON public.tos_acceptances
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can insert their own upload errors" ON public.upload_errors;
CREATE POLICY "Users can insert their own upload errors" ON public.upload_errors
  AS PERMISSIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (((auth.uid() = user_id) OR (user_id IS NULL)));

DROP POLICY IF EXISTS "Users can view their own upload errors" ON public.upload_errors;
CREATE POLICY "Users can view their own upload errors" ON public.upload_errors
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Users can update own credits" ON public.user_credits;
CREATE POLICY "Users can update own credits" ON public.user_credits
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view own credits" ON public.user_credits;
CREATE POLICY "Users can view own credits" ON public.user_credits
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Service role full access to verification_attempts" ON public.verification_attempts;
CREATE POLICY "Service role full access to verification_attempts" ON public.verification_attempts
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view project verification attempts" ON public.verification_attempts;
CREATE POLICY "Users can view project verification attempts" ON public.verification_attempts
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (has_project_access(project_id));

DROP POLICY IF EXISTS "Service role full access to snapshots" ON public.verification_transaction_snapshots;
CREATE POLICY "Service role full access to snapshots" ON public.verification_transaction_snapshots
  AS PERMISSIVE
  FOR ALL
  TO public
  USING ((auth.role() = 'service_role'::text));

DROP POLICY IF EXISTS "Users can view snapshots for own verifications" ON public.verification_transaction_snapshots;
CREATE POLICY "Users can view snapshots for own verifications" ON public.verification_transaction_snapshots
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((EXISTS ( SELECT 1
   FROM verification_attempts va
  WHERE ((va.id = verification_transaction_snapshots.verification_attempt_id) AND (va.verified_by_user_id = auth.uid())))));

DROP POLICY IF EXISTS "Admins can add to whitelist" ON public.whitelisted_users;
CREATE POLICY "Admins can add to whitelist" ON public.whitelisted_users
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can remove from whitelist" ON public.whitelisted_users;
CREATE POLICY "Admins can remove from whitelist" ON public.whitelisted_users
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view whitelist" ON public.whitelisted_users;
CREATE POLICY "Admins can view whitelist" ON public.whitelisted_users
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all workflows" ON public.workflows;
CREATE POLICY "Admins can view all workflows" ON public.workflows
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own workflows" ON public.workflows;
CREATE POLICY "Users can create their own workflows" ON public.workflows
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can delete their own workflows" ON public.workflows;
CREATE POLICY "Users can delete their own workflows" ON public.workflows
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can update their own workflows" ON public.workflows;
CREATE POLICY "Users can update their own workflows" ON public.workflows
  AS PERMISSIVE
  FOR UPDATE
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Users can view their own workflows" ON public.workflows;
CREATE POLICY "Users can view their own workflows" ON public.workflows
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING ((auth.uid() = user_id));

DROP POLICY IF EXISTS "Admins can view all documents" ON storage.objects;
CREATE POLICY "Admins can view all documents" ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (((bucket_id = 'documents'::text) AND has_role(auth.uid(), 'admin'::app_role)));

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents" ON storage.objects
  AS PERMISSIVE
  FOR DELETE
  TO public
  USING (((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
  AS PERMISSIVE
  FOR INSERT
  TO public
  WITH CHECK (((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents" ON storage.objects
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (((bucket_id = 'documents'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

-- ============================================================================
-- 10. STORAGE BUCKETS
-- ============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Extensions: 8
-- Enum types: 4
-- Tables: 44
-- Columns: 582
-- Constraints (PK/UQ/CHECK/FK): 127
--   Primary keys: 44
--   Unique:       18
--   Check:        11
--   Foreign keys: 54
-- Indexes (total in pg_indexes): 135
-- Functions: 26
-- Triggers: 30
-- RLS policies: 135
-- Storage buckets: 1
-- ============================================================================