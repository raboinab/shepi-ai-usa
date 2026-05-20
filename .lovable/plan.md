## Goal
Verify the DFY document intake workflow works end-to-end as a real client and real CPA would use it. No "looks fine" claims — every assertion backed by a DB query, network call, or rendered screenshot.

## Test pass

### 1. Database seed verification
- Query `project_document_requirements` for an existing DFY project: confirm 10 rows seeded (4 required, 5 recommended, 1 optional) with correct `requirement_key`s.
- Verify trigger fires: insert a test project with `service_tier='done_for_you'`, confirm 10 requirement rows auto-create. Clean up.
- Confirm backfill ran for all pre-existing DFY projects (count requirements per project, none should be 0).

### 2. Edge function: `nudge-dfy-client`
Direct `curl` against the deployed function with a real DFY `project_id`:
- **Happy path** — missing required docs present → returns `{sent: true}`, Resend email logged, `cpa_nudges` row inserted, `cpa_notifications` row inserted for client.
- **Rate limit** — second call within 48h → 429.
- **No missing docs** — project with all required uploaded+approved → `{sent: false, reason: "No missing..."}`.
- **Unauth** — call without auth, `sent_by_system=false` → 401.
- **Bad project** — invalid `project_id` → 404.
- Inspect edge function logs for any errors after each call.

### 3. Client UI (`/project/:id` as buyer)
Browser tool, logged in as a DFY project owner:
- Confirm `DocumentIntakePanel` renders with all 10 requirements grouped by tier.
- Status badges correct: "Not uploaded" for empty, "Awaiting review" after upload, "Approved"/"Rejected" reflect `project_document_reviews`.
- "Mark N/A" flow → writes `marked_na=true` + reason, badge updates without refresh.
- Custom requirement added by CPA appears in the client view.

### 4. CPA UI (`/cpa/engagements/:id` as CPA)
Browser tool, logged in as a CPA with a claim:
- Panel shows same 10 + management controls.
- Approve a pending upload → `project_document_reviews` row `status='approved'`, badge flips.
- Reject with reason → row `status='rejected'`, reason stored, client badge shows rejection.
- Add custom requirement → new row `is_custom=true`, appears in both CPA and client panels.
- "Send nudge" button → triggers function, shows toast, disabled for 48h after.

### 5. Realtime / refresh
After CPA approves in one tab, client tab reflects within a reasonable poll (or on next manual refresh — document which).

### 6. Regression
Run `bunx vitest run` to confirm no existing test broke.

## Fix-and-retest loop
Any failure → fix → re-run that specific check. Final summary lists every check with pass/fail and the evidence (query result, status code, screenshot reference).

## Deliverable
A test report posted in chat with:
- ✅/❌ per check
- DB query outputs for seed + review writes
- HTTP status + response body for each curl
- Screenshots of client panel and CPA panel in 3+ states (empty, awaiting, approved, rejected)
- Any bugs found and the fix applied

## Out of scope (deferred, will flag separately)
- Daily auto-nudge cron
- Hard readiness gate locking adjustment review tab
- `DfyStatusBanner` "Awaiting documents" state
