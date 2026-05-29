## Goal

Enforce "Chart of Accounts must exist before Trial Balance" as a real invariant, not a single-screen nudge. Today the gate only lives on the TB wizard section; the Documents tab and the QB sync path both bypass it.

## Changes

### 1. Frontend — close the UI gaps

**`src/components/wizard/sections/DocumentUploadSection.tsx`**
- When the selected `docType === "trial_balance"`, check the same condition used by TrialBalanceSection: `coaAccounts.length > 0 || qbSyncCompleted`.
- If COA is missing, disable the file picker for that doc type and show the same "Chart of Accounts Required" panel with a "Go to Chart of Accounts" button (reuse the visual treatment from `TrialBalanceSection.tsx:578-596`).
- Same treatment for any other TB-dependent doc types if they exist (audit only `trial_balance` for now).

**`src/components/wizard/sections/TrialBalanceSection.tsx`**
- Stop trusting `syncSource === "quickbooks"` alone. Replace `isQBUser` bypass in `coaLocked` with a stricter check: COA is "ready" only if `coaAccounts.length > 0` OR a completed QB COA sync record exists (`qb_sync_status` for `chart_of_accounts` = `complete`).
- This prevents the case where a stale `syncSource` flag from a prior partial sync removes the lock even though no COA rows landed.

**Shared helper** — extract `useCoaReadiness(projectId, wizardData)` hook so the DocumentUpload and TrialBalance sections cannot drift again. Returns `{ ready, reason, hasRows, qbSyncComplete }`.

### 2. Backend — enforce the invariant server-side

**`supabase/functions/process-quickbooks-file/index.ts`**
- Before processing a `trial_balance` upload, query `chart_of_accounts` (or the project's COA rows table) for the project. If zero rows AND no in-flight COA sync, return `409 Conflict` with `{ error: "coa_required", message: "Upload Chart of Accounts before Trial Balance" }`.
- Log the rejection so we can see if it ever fires in production.

**`supabase/functions/complete-qb-sync/index.ts` and `qb-sync-complete/index.ts`**
- When aggregating TB rows, if the project has zero COA rows, short-circuit with a clear error status on the sync job rather than silently writing TB rows that will all fail to link.
- Do NOT block the QB COA sync itself; only block TB aggregation that would otherwise mis-link.

**Frontend error handling**
- In whatever calls `process-quickbooks-file` for TB uploads, surface the new `coa_required` error as a toast pointing the user back to COA.

### 3. Tests

- Unit test for `useCoaReadiness`: returns `ready:false` when `coaAccounts=[]` and `syncSource="quickbooks"` but no completed COA sync row; returns `ready:true` when COA rows exist; returns `ready:true` when QB COA sync is complete.
- Edge function test in `process-quickbooks-file`: TB upload with zero COA rows → 409.
- Edge function test in `complete-qb-sync`: TB aggregation skipped when COA empty, sync job marked with explicit error.

## Out of scope

- No changes to COA processing order or the 154-row mapping.
- No retroactive cleanup of existing projects that already have orphan TB rows; that would need a separate one-off script.
- No change to AR/AP/Fixed Assets ordering — only the COA → TB dependency, which is the one that causes silent mis-linking.

## Files touched

- `src/components/wizard/sections/DocumentUploadSection.tsx` (edit)
- `src/components/wizard/sections/TrialBalanceSection.tsx` (edit)
- `src/hooks/useCoaReadiness.ts` (new)
- `src/hooks/useCoaReadiness.test.ts` (new)
- `supabase/functions/process-quickbooks-file/index.ts` (edit)
- `supabase/functions/complete-qb-sync/index.ts` (edit)
- `supabase/functions/qb-sync-complete/index.ts` (edit)
- relevant `*_test.ts` files in each edge function dir (new/edit)
