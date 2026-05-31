## What we know

- Project `fa0768ca…` has **11 saved proposals** (all in non-`proposed` statuses) and **1 stuck `running` discovery job** queued at 18:05:57 sitting at `progress=20%` with no updates.
- The user's "Something went wrong" is `AppErrorBoundary` swallowing a render error somewhere inside the wizard. The discovery section is rendered via `DDAdjustmentsSection.tsx:843` and keyed off `job.id` + `proposals.length`, so a malformed value on the in-flight job is a very plausible trigger.
- No runtime-error stack was captured in this snapshot, so we can't pinpoint the exact line yet — but the boundary today is app-wide, which is why the user "can't get to the tab".

## Goal

1. Unblock the page **right now** so the user can navigate to the tab.
2. Make sure a single bad proposal/job can't blank the whole app again.
3. Capture the real stack so we can patch the underlying render bug in a follow-up.

## Plan

### Step 1 — Kill the stuck job (one-off DB write)

Run a single migration / SQL command to mark the stale job failed:

```sql
update public.analysis_jobs
set status = 'failed',
    error_message = 'Manually expired: worker stalled at 20% for >30min',
    updated_at = now()
where id = '8a03c39e-123f-4eb1-8b54-6b876b9917c9';
```

Effect: `useDiscoveryProposals` will pick a non-running latest job, stop polling, and render with the 11 existing proposals.

### Step 2 — Section-level error boundary around Discovery

Add a small reusable `<SectionErrorBoundary>` (own file, class component, same shape as `AppErrorBoundary` but scoped) and wrap the `<DiscoveryProposalsSection>` JSX inside `DDAdjustmentsSection.tsx:843-868` with it. The fallback UI is a compact card:

- Heading "AI Discovery is temporarily unavailable"
- One-line message
- "Reset Discovery" button — clears `jobIdRef` via a reset() callback and re-mounts the section
- "Copy error details" link that exposes the stack so we can fix it
- `console.error(error, errorInfo)` so the next message gives us a real stack via `read_runtime_errors`

This is the same pattern we already use elsewhere; it's purely frontend, no new deps, no design tokens to touch beyond the existing `Card` + `Alert` components.

### Step 3 — Defensive guards we know are cheap (only if scope allows in same pass)

In `DiscoveryProposalsSection.tsx`:

- `formatCurrency(proposal.proposed_amount)` (line 366) — coerce `null/undefined → 0` explicitly inside `formatCurrency` so a null `proposed_amount` never throws.
- `Object.entries(proposal.proposed_period_values)` (ProposalDetailCard:346) — fall back to `{}` if the field is null at runtime even when the type says otherwise.
- `proposals.map(...)` ordering — already defensive.

These are 3-line changes and the most likely culprits for a render-time TypeError on an in-flight proposal row.

### Step 4 — Follow-up after the user re-opens the tab

The new boundary will catch and console.error the real stack. In the next loop I'll pull `read_runtime_errors`, identify the exact crashing line, and patch it. No speculative refactor here.

## Files touched

- `supabase/migrations/<ts>_expire_stuck_discovery_job.sql` (Step 1 — one-off)
- `src/components/system/SectionErrorBoundary.tsx` (new, ~80 lines)
- `src/components/wizard/sections/DDAdjustmentsSection.tsx` (wrap the tab content, ~5 line diff)
- `src/components/wizard/sections/DiscoveryProposalsSection.tsx` + `discovery/ProposalDetailCard.tsx` (defensive null guards, ~5 line diff)

## Out of scope this pass

- The overlap-dedupe "$0 / $2,855" plan from earlier — paused until the page renders again.
- Debugging the Python discovery worker (why it stalled at 20%) — separate from the frontend crash.
- Backfilling `support_json.dedupe` on existing proposals.
