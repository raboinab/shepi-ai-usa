
CREATE OR REPLACE FUNCTION public.duplicate_project(
  _source_project_id uuid,
  _new_name text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  INSERT INTO adjustment_proofs (id, project_id, user_id, adjustment_id, document_id,
    validation_score, validation_status, traceability_data, verification_type, ai_analysis,
    key_findings, red_flags, validated_at)
  SELECT gen_random_uuid(), _new_project_id, ap.user_id, ap.adjustment_id,
    COALESCE((SELECT new_id FROM _doc_map WHERE old_id = ap.document_id), ap.document_id),
    ap.validation_score, ap.validation_status, ap.traceability_data, ap.verification_type,
    ap.ai_analysis, ap.key_findings, ap.red_flags, ap.validated_at
  FROM adjustment_proofs ap WHERE ap.project_id = _source_project_id;

  INSERT INTO project_data_chunks (id, project_id, chunk_key, data_type, content,
    period, fs_section, token_count, metadata, embedding)
  SELECT gen_random_uuid(), _new_project_id, pdc.chunk_key, pdc.data_type, pdc.content,
    pdc.period, pdc.fs_section, pdc.token_count, pdc.metadata, pdc.embedding
  FROM project_data_chunks pdc WHERE pdc.project_id = _source_project_id;

  INSERT INTO company_info (id, project_id, user_id, company_name, realm_id, bearer_token,
    refresh_token, token_expires_at, auth_code)
  SELECT gen_random_uuid(), _new_project_id, ci.user_id, ci.company_name, ci.realm_id,
    ci.bearer_token, ci.refresh_token, ci.token_expires_at, ci.auth_code
  FROM company_info ci WHERE ci.project_id = _source_project_id;

  RETURN _new_project_id;
END;
$$;
