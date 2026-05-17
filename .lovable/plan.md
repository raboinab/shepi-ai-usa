
# Phase 4c — Close the engagement loop for live CPAs

Three deferred items, sequenced so each unblocks the next.

## 1. Auto-accept cron (`proposed` → `accepted` after 48h)

Why: CPA can't start review work until the claim is `accepted`. We can't wait on every client to manually confirm — that stalls real engagements.

- New TanStack server route `src/routes/api/public/hooks/cpa-auto-accept.ts`
  - `POST` handler, no auth header required (route lives under `/api/public/*`)
  - Uses `supabaseAdmin` to flip `cpa_claims` where `status='proposed'` AND `claimed_at < now() - interval '48 hours'` AND `withdrawn_at IS NULL` to `status='accepted'`, sets `accepted_at=now()`, leaves `accepted_by_user_id NULL` (signals auto-accept).
  - Logs how many rows were flipped, returns `{ accepted: <count> }`.
  - For each accepted claim, inserts a `cpa_notifications` row for the CPA (`event_type='claim_auto_accepted'`) and one for the project owner (`event_type='claim_auto_accepted_client'`).
- Schedule with `pg_cron` every hour calling that route (empty body). One-time setup via the insert tool (not migration) per the schedule-jobs-modern guidance.
- Surface auto-accept in the existing `DfyStatusBanner`: when `accepted_by_user_id IS NULL` and `status IN ('accepted','in_review','completed')`, show a small "auto-confirmed after 48h" caption next to the CPA name.

## 2. "CPA reviewed" badges on the client's adjustment UI

Why: clients in DFY need to see which adjustments their assigned CPA has already touched (and how), not just trust the banner.

- Extend the client's adjustment review screen (the per-proposal cards rendered in the project workspace's adjustments tab) with a small badge driven by `cpa_adjustment_reviews`:
  - `confirmed` → green "CPA confirmed" pill with reviewer name on hover
  - `modified` → amber "CPA modified" pill, shows original vs `modified_amount`
  - `rejected` → red "CPA rejected" pill with `cpa_note` in a popover
  - no row → no badge
- Data: one server function `getCpaReviewsForProject(projectId)` returning a map keyed by `proposal_id`. Reads `cpa_adjustment_reviews` joined to `cpa_profiles` for the CPA's display name. RLS already allows project members to SELECT via the existing `Project members can view cpa reviews` policy, so a normal `requireSupabaseAuth` server fn is sufficient.
- New presentation component `src/components/cpa/CpaReviewBadge.tsx`. Mounted only when the project has a non-withdrawn `cpa_claims` row (avoid noise for SD/non-DFY projects).
- Also surface the badge inline in the report's adjustments list (PDF/XLSX builders are untouched — UI only) so it shows up wherever the client browses adjustments.

## 3. Admin "Reassign CPA" action

Why: when a CPA goes dark, is conflicted, or the client requested a different reviewer, ops needs a one-click recovery.

- Extend `src/pages/admin/AdminDFYEngagements.tsx` with a "Reassign" button on each engagement row, opening a dialog that:
  - Lists active CPAs (`cpa_profiles` where `active=true`) excluding the current assignee, with current open-engagement count next to each name (respect `max_concurrent_engagements` — disable rows at capacity).
  - Requires a short reason (stored in `withdrawn_reason` on the old claim).
- One server function `reassignCpaClaim({ claimId, newCpaUserId, reason })`, admin-gated via `requireSupabaseAuth` + `has_role(uid,'admin')` check inside the handler. Steps inside a transaction:
  1. Mark old `cpa_claims` row `status='withdrawn'`, set `withdrawn_at=now()`, `withdrawn_reason=reason`.
  2. Insert a new `cpa_claims` row for `newCpaUserId` with `status='proposed'`, `claimed_at=now()` (admin-initiated proposal).
  3. Insert two `cpa_notifications`: `claim_withdrawn` to the old CPA, `claim_proposed_by_admin` to the new CPA. Also notify the project owner via the in-app notification surface the banner already reads from.
- Existing `cpa_adjustment_reviews` rows tied to the old `claim_id` are kept as historical record; the new CPA starts fresh. Badges keep showing prior decisions but their popover labels the reviewer's name so clients see continuity.

## Status filter on admin engagements list

Small UX win that lands cheaply with #3: add a status segmented control (All / Proposed / Accepted / In review / Completed / Withdrawn) on `AdminDFYEngagements.tsx`.

## Technical notes

- No new tables. Reuses `cpa_claims`, `cpa_adjustment_reviews`, `cpa_notifications`, `cpa_profiles`.
- No edge functions. Cron hits a TanStack server route per stack convention.
- The auto-accept route is idempotent: running it twice in the same hour is a no-op because the `status='proposed'` filter excludes already-flipped rows.
- The `accepted_by_user_id IS NULL` convention is the single source of truth for "this was auto-accepted" — no extra column needed.
- Migration only needed if we discover `cpa_notifications.event_type` doesn't already accept the new event strings; the column is `text` with no CHECK constraint, so no migration required.

## Build order

1. Server fn `getCpaReviewsForProject` + `CpaReviewBadge` component + mount in client adjustment UI. (Lowest risk, immediately visible value.)
2. Auto-accept route + pg_cron schedule + banner caption.
3. Admin Reassign dialog + server fn + status filter.

After each step I'll verify with a build check; for the cron I'll also trigger the route once manually via `invoke-server-function` and confirm `cpa_claims` rows flip as expected.
