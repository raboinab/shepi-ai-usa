-- ============================================================
-- SHEPI AI – Complete Database Schema Export
-- Exported: 2026-02-22
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
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_submissions_pkey PRIMARY KEY (id)
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
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows (status);

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

-- ============================================================
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

-- ----- profiles -----
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

-- ============================================================
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
