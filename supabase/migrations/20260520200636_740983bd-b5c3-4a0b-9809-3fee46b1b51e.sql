
-- Storage policy: allow any user with project access to read documents bucket files
-- referenced by a documents row in a project they can access.
DROP POLICY IF EXISTS "Project members can view shared documents" ON storage.objects;
CREATE POLICY "Project members can view shared documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = storage.objects.name
      AND public.has_project_access(auth.uid(), d.project_id)
  )
);

-- One-shot clone function (dropped at end)
CREATE OR REPLACE FUNCTION public._clone_landscaping_for_cpa(
  _src_project_id uuid,
  _new_owner uuid,
  _cpa_user_id uuid,
  _name_suffix text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  _new_project_id uuid := gen_random_uuid();
  _src projects%ROWTYPE;
  _cpa_email text;
BEGIN
  SELECT * INTO _src FROM projects WHERE id = _src_project_id;

  -- 1. Project row, owned by Annabelle
  INSERT INTO projects (id, user_id, name, client_name, target_company, status, wizard_data, periods,
    fiscal_year_end, industry, transaction_type, service_tier, current_phase, current_section,
    google_sheet_id, google_sheet_url, funded_by_credit, credit_expires_at)
  VALUES (
    _new_project_id, _new_owner,
    _src.name || ' — ' || _name_suffix,
    'Annabelle Winterberry',
    _src.target_company, _src.status, _src.wizard_data, _src.periods, _src.fiscal_year_end,
    _src.industry, _src.transaction_type, _src.service_tier, _src.current_phase, _src.current_section,
    NULL, NULL, _src.funded_by_credit, _src.credit_expires_at
  );

  -- 2. Documents map
  CREATE TEMP TABLE _doc_map (old_id uuid, new_id uuid) ON COMMIT DROP;
  INSERT INTO _doc_map SELECT id, gen_random_uuid() FROM documents WHERE project_id = _src_project_id;

  INSERT INTO documents (id, project_id, user_id, name, file_path, file_type, file_size,
    category, institution, account_label, account_type, docuclipper_job_id, period_start, period_end,
    processing_status, parsed_summary, coverage_validated, company_name, extracted_data, document_ids,
    status, job_id, document_type, description, validated_at, validation_result, created_at)
  SELECT dm.new_id, _new_project_id, _new_owner, d.name, d.file_path, d.file_type, d.file_size,
    d.category, d.institution, d.account_label, d.account_type, d.docuclipper_job_id, d.period_start, d.period_end,
    d.processing_status, d.parsed_summary, d.coverage_validated, d.company_name, d.extracted_data, d.document_ids,
    d.status, d.job_id, d.document_type, d.description, d.validated_at, d.validation_result, d.created_at
  FROM documents d JOIN _doc_map dm ON dm.old_id = d.id;

  -- 3. Processed data
  INSERT INTO processed_data (id, project_id, user_id, data_type, data, source_type,
    period_start, period_end, qb_realm_id, source_document_id, record_count, validation_status)
  SELECT gen_random_uuid(), _new_project_id, _new_owner, pd.data_type, pd.data, pd.source_type,
    pd.period_start, pd.period_end, pd.qb_realm_id,
    COALESCE((SELECT new_id FROM _doc_map WHERE old_id = pd.source_document_id), pd.source_document_id),
    pd.record_count, pd.validation_status
  FROM processed_data pd WHERE pd.project_id = _src_project_id;

  -- 4. Analysis jobs map
  CREATE TEMP TABLE _job_map (old_id uuid, new_id uuid) ON COMMIT DROP;
  INSERT INTO _job_map SELECT id, gen_random_uuid() FROM analysis_jobs WHERE project_id = _src_project_id;

  INSERT INTO analysis_jobs (id, project_id, user_id, job_type, status, config_json, source_summary,
    detector_summary, progress_percent, worker_run_id, requested_at, started_at, completed_at,
    error_message, attempt_number, last_heartbeat_at, created_at, updated_at)
  SELECT jm.new_id, _new_project_id, _new_owner, aj.job_type, aj.status, aj.config_json, aj.source_summary,
    aj.detector_summary, aj.progress_percent, aj.worker_run_id, aj.requested_at, aj.started_at, aj.completed_at,
    aj.error_message, aj.attempt_number, aj.last_heartbeat_at, aj.created_at, aj.updated_at
  FROM analysis_jobs aj JOIN _job_map jm ON jm.old_id = aj.id;

  -- 5. Canonical transactions (heavy)
  INSERT INTO canonical_transactions (id, project_id, user_id, source_type, source_txn_id,
    txn_date, description, vendor, amount, account_number, account_name, memo, raw_reference,
    account_type, source_processed_data_id, source_document_id, source_record_id, fallback_hash,
    posting_period, amount_abs, amount_signed, payee, txn_type, split_account, is_year_end,
    raw_payload, check_number, job_id)
  SELECT gen_random_uuid(), _new_project_id, _new_owner, ct.source_type, ct.source_txn_id,
    ct.txn_date, ct.description, ct.vendor, ct.amount, ct.account_number, ct.account_name,
    ct.memo, ct.raw_reference, ct.account_type, ct.source_processed_data_id,
    COALESCE((SELECT new_id FROM _doc_map WHERE old_id = ct.source_document_id), ct.source_document_id),
    ct.source_record_id, ct.fallback_hash, ct.posting_period, ct.amount_abs, ct.amount_signed,
    ct.payee, ct.txn_type, ct.split_account, ct.is_year_end, ct.raw_payload, ct.check_number,
    (SELECT new_id FROM _job_map WHERE old_id = ct.job_id)
  FROM canonical_transactions ct WHERE ct.project_id = _src_project_id;

  -- 6. Flagged transactions
  INSERT INTO flagged_transactions (id, project_id, user_id, transaction_date, description,
    amount, account_name, flag_type, flag_reason, confidence_score, suggested_adjustment_type,
    suggested_adjustment_amount, status, ai_analysis, source_data, flag_category, classification_context)
  SELECT gen_random_uuid(), _new_project_id, _new_owner, ft.transaction_date, ft.description,
    ft.amount, ft.account_name, ft.flag_type, ft.flag_reason, ft.confidence_score,
    ft.suggested_adjustment_type, ft.suggested_adjustment_amount, ft.status, ft.ai_analysis,
    ft.source_data, ft.flag_category, ft.classification_context
  FROM flagged_transactions ft WHERE ft.project_id = _src_project_id;

  -- 7. Findings (hypothesis_id nulled — not cloning hypothesis chain)
  CREATE TEMP TABLE _finding_map (old_id uuid, new_id uuid) ON COMMIT DROP;
  INSERT INTO _finding_map SELECT id, gen_random_uuid() FROM findings WHERE project_id = _src_project_id;

  INSERT INTO findings (id, job_id, project_id, user_id, hypothesis_id, direction, title,
    accounts_involved, metadata, narrative, hypothesis_outcome, evidence_strength, period_values,
    computed_amount, resolver_type, identified_items, key_signals, adjustment_class, assumptions,
    what_we_cannot_verify, alternative_explanations_considered, outcome_explanation, created_at)
  SELECT fm.new_id, (SELECT new_id FROM _job_map WHERE old_id = f.job_id), _new_project_id, _new_owner,
    NULL, f.direction, f.title,
    f.accounts_involved, f.metadata, f.narrative, f.hypothesis_outcome, f.evidence_strength, f.period_values,
    f.computed_amount, f.resolver_type, f.identified_items, f.key_signals, f.adjustment_class, f.assumptions,
    f.what_we_cannot_verify, f.alternative_explanations_considered, f.outcome_explanation, f.created_at
  FROM findings f JOIN _finding_map fm ON fm.old_id = f.id;

  -- 8. Adjustment proposals
  INSERT INTO adjustment_proposals (id, job_id, project_id, user_id, detector_type, title, description,
    block, adjustment_class, intent, template_id, linked_account_number, linked_account_name,
    proposed_amount, proposed_period_values, allocation_mode, period_range, evidence_strength,
    internal_score, support_json, ai_rationale, ai_key_signals, ai_warnings, ai_model, status,
    edited_amount, edited_period_values, ai_prompt_version,
    finding_id, rejection_category, rejection_reason, support_tier, support_tier_label,
    evidence_report, missing_evidence, review_priority, created_at, updated_at)
  SELECT gen_random_uuid(), (SELECT new_id FROM _job_map WHERE old_id = ap.job_id), _new_project_id, _new_owner,
    ap.detector_type, ap.title, ap.description, ap.block, ap.adjustment_class, ap.intent,
    ap.template_id, ap.linked_account_number, ap.linked_account_name,
    ap.proposed_amount, ap.proposed_period_values, ap.allocation_mode, ap.period_range, ap.evidence_strength,
    ap.internal_score, ap.support_json, ap.ai_rationale, ap.ai_key_signals, ap.ai_warnings, ap.ai_model, ap.status,
    ap.edited_amount, ap.edited_period_values, ap.ai_prompt_version,
    (SELECT new_id FROM _finding_map WHERE old_id = ap.finding_id),
    ap.rejection_category, ap.rejection_reason, ap.support_tier, ap.support_tier_label,
    ap.evidence_report, ap.missing_evidence, ap.review_priority, ap.created_at, ap.updated_at
  FROM adjustment_proposals ap WHERE ap.project_id = _src_project_id;

  -- 9. Project narratives (PDF slide drafts)
  INSERT INTO project_narratives (id, project_id, slide_key, content, source_hash, model,
    generated_by, generated_at, edited_by, edited_at, created_at, updated_at)
  SELECT gen_random_uuid(), _new_project_id, pn.slide_key, pn.content, pn.source_hash, pn.model,
    pn.generated_by, pn.generated_at, pn.edited_by, pn.edited_at, pn.created_at, pn.updated_at
  FROM project_narratives pn WHERE pn.project_id = _src_project_id;

  -- 10. CPA claim (auto-accepted) + project share
  SELECT email INTO _cpa_email FROM auth.users WHERE id = _cpa_user_id;
  INSERT INTO cpa_claims (project_id, cpa_user_id, status, claimed_at, accepted_at, accepted_by_user_id, notes)
  VALUES (_new_project_id, _cpa_user_id, 'accepted', now(), now(), _new_owner,
          'Auto-assigned sandbox engagement for messaging test');
  INSERT INTO project_shares (project_id, shared_with_user_id, shared_with_email, role, created_by)
  VALUES (_new_project_id, _cpa_user_id, COALESCE(_cpa_email, ''), 'editor', _new_owner)
  ON CONFLICT DO NOTHING;

  -- cleanup temp tables (ON COMMIT DROP catches them, but DROP IF EXISTS is explicit)
  DROP TABLE IF EXISTS _doc_map;
  DROP TABLE IF EXISTS _job_map;
  DROP TABLE IF EXISTS _finding_map;

  RETURN _new_project_id;
END;
$fn$;

-- Suspend notification triggers for the bulk clone
ALTER TABLE projects DISABLE TRIGGER USER;
ALTER TABLE cpa_claims DISABLE TRIGGER USER;
ALTER TABLE documents DISABLE TRIGGER USER;
ALTER TABLE processed_data DISABLE TRIGGER USER;
ALTER TABLE chat_messages DISABLE TRIGGER USER;

-- Run for each active CPA
SELECT public._clone_landscaping_for_cpa(
  '17ba0cb7-abe3-463d-810d-95178429481b'::uuid,
  '894774d8-2d8a-40de-b5ad-a5c8ec6a9d93'::uuid,
  '411badcb-ea7f-4e0f-95d8-059a3dca0ddb'::uuid,
  'Kacy Ora'
);
SELECT public._clone_landscaping_for_cpa(
  '17ba0cb7-abe3-463d-810d-95178429481b'::uuid,
  '894774d8-2d8a-40de-b5ad-a5c8ec6a9d93'::uuid,
  'd57b7352-6189-4f57-982c-6ef70ee17dd0'::uuid,
  'Mike Feeley'
);
SELECT public._clone_landscaping_for_cpa(
  '17ba0cb7-abe3-463d-810d-95178429481b'::uuid,
  '894774d8-2d8a-40de-b5ad-a5c8ec6a9d93'::uuid,
  '3209cbbf-ca5a-434f-800a-419df42b8828'::uuid,
  'Chris LeBlanc'
);
SELECT public._clone_landscaping_for_cpa(
  '17ba0cb7-abe3-463d-810d-95178429481b'::uuid,
  '894774d8-2d8a-40de-b5ad-a5c8ec6a9d93'::uuid,
  '1cc25ae2-1f2f-43d1-af6a-2b61ef8976a3'::uuid,
  'Alex Raboin'
);

-- Re-enable triggers
ALTER TABLE projects ENABLE TRIGGER USER;
ALTER TABLE cpa_claims ENABLE TRIGGER USER;
ALTER TABLE documents ENABLE TRIGGER USER;
ALTER TABLE processed_data ENABLE TRIGGER USER;
ALTER TABLE chat_messages ENABLE TRIGGER USER;

-- Drop the one-shot helper
DROP FUNCTION public._clone_landscaping_for_cpa(uuid, uuid, uuid, text);
