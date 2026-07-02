-- ============================================================
-- Security fixes bundle
-- ============================================================

-- 1) project_payments: remove user INSERT; only service role writes
DROP POLICY IF EXISTS "Users can insert their own project payments" ON public.project_payments;
DROP POLICY IF EXISTS "Service role can manage project_payments" ON public.project_payments;
CREATE POLICY "Service role can manage project_payments"
ON public.project_payments FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 2) subscriptions: remove user INSERT; only service role writes
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service role can manage subscriptions"
ON public.subscriptions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- 3) cpa_claims: restrict CPA SELECT to own rows only
DROP POLICY IF EXISTS "CPAs can view cpa_claims" ON public.cpa_claims;
CREATE POLICY "CPAs can view own cpa_claims"
ON public.cpa_claims FOR SELECT
USING (
  (has_role(auth.uid(), 'cpa'::app_role) AND cpa_user_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4) flagged_transactions: owner-only per trust model
DROP POLICY IF EXISTS "Project members can view flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Project members can update flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Project members can delete flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Project members can create flagged transactions" ON public.flagged_transactions;

CREATE POLICY "Owners can view flagged transactions"
ON public.flagged_transactions FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can insert flagged transactions"
ON public.flagged_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update flagged transactions"
ON public.flagged_transactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can delete flagged transactions"
ON public.flagged_transactions FOR DELETE
USING (auth.uid() = user_id);

-- 5) reclassification_jobs: verify project ownership on INSERT
DROP POLICY IF EXISTS "Users can create their own reclassification jobs" ON public.reclassification_jobs;
CREATE POLICY "Users can create their own reclassification jobs"
ON public.reclassification_jobs FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = reclassification_jobs.project_id
      AND p.user_id = auth.uid()
  )
);

-- 6) SECURITY DEFINER — revoke EXECUTE from anon/authenticated on
--    functions that are only used internally by triggers.
REVOKE EXECUTE ON FUNCTION public.auto_share_on_cpa_claim() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_cpa_profile_on_role_grant() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_cpa_chat_message() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_cpa_claim_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_cpa_dfy_project_created() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_cpa_dfy_project_upgraded() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_enrich_document() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_signup() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_qb_sync_complete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_company_info_user_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.populate_detector_run_from_job() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_null_company_info_user_id() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_dfy_document_requirements() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_job_id_columns() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_job_id_on_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_status_to_processing_status() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_workflow_progress_on_insert() FROM anon, authenticated;

-- User-callable SECURITY DEFINER RPCs — revoke anon only, keep authenticated
REVOKE EXECUTE ON FUNCTION public.get_project_role(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_project_access(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_project_access(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_project_chunks(uuid, text, double precision, integer, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.match_rag_chunks(extensions.vector, double precision, integer, text[], double precision, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fetch_processed_data_chunked(uuid, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.fetch_processed_data_ids(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reset_project_data(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.duplicate_project(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_engagement_stats() FROM anon;

-- 7) firm-logos bucket: drop the broad SELECT policy so bucket listing
--    is not possible. Direct public URLs continue to work because the
--    bucket is public (served via CDN without RLS).
DROP POLICY IF EXISTS "Firm logos are publicly readable" ON storage.objects;

-- 8) Auth config (leaked password protection + MFA) — set via GoTrue
--    admin API. These cannot be changed from SQL; they are configured
--    in Supabase Dashboard → Authentication → Providers/Policies.
--    Marking findings as fixed depends on dashboard config; this
--    migration is a no-op for those two.