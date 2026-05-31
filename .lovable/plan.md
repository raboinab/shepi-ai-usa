## What the logs show

Job `0f8afaa8-2909-4acb-978f-a36b2e84580a` (project `fa0768ca…`) is **already `completed` at 100%** in `analysis_jobs`. No error. The UI showing "Running… 40%" is a stale snapshot held by the client — the realtime `postgres_changes` notification for the final status update never reached this tab.

Recent history on the same project confirms the pattern:
- `0f8afaa8…` — completed, UI stuck at 40%
- `3b8cbe6a…` — completed, previously shown stuck at 80%
- `7922e84a…` — completed, previously caused the "cannot add postgres_changes callbacks after subscribe()" crash

The earlier session already patched `src/hooks/useDiscoveryProposals.ts` (unique channel nonce, dropped `job?.status` from deps). That fix is in source but **not in the deployed bundle** (`DDAdjustmentsSection-CL-tBoEn.js` is pre-fix), so production clients still hit the broken subscription path and miss terminal updates.

## Plan

### 1. Publish the app
The realtime-subscription fix already lives in `src/hooks/useDiscoveryProposals.ts`. Publishing rebuilds the bundle and ships it to `shepi.ai`. This alone resolves the "cannot add postgres_changes callbacks" crash and the missed-update issue for new sessions.

### 2. Add a polling safety net in `useDiscoveryProposals.ts`
Realtime delivery can still drop a message (tab backgrounded, websocket hiccup, mobile network). Add a lightweight poll while a job is `queued` or `running`:

- Every 5s, re-fetch the current job row from `analysis_jobs` by id.
- Stop polling as soon as status is `completed`, `failed`, or `cancelled`.
- Same setState path as the realtime handler, so no duplicate logic.

This guarantees the UI converges to the terminal state even if the realtime event is lost.

### 3. No worker / no DB changes
The worker is fine — every recent job completed. No migration, no edge function change.

## Out of scope

- Removing the inline error pre-block from `SectionErrorBoundary` — keep it.
- The old `finding_group` schema-cache errors from May 19 — already resolved.
- Any change to `trigger-discovery` — not the source of the issue.
