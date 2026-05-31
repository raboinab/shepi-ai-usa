## Root cause

`src/hooks/useDiscoveryProposals.ts` (lines 293–332) creates a realtime channel named `discovery-job-${currentJobId}` and re-runs whenever `job?.id` or `job?.status` changes. When status flips queued → running for the same job, the effect re-runs: cleanup calls `removeChannel`, but `supabase.channel(name)` is name-keyed and reuses an existing already-`subscribe()`-d channel from the registry before removal settles. Adding the new `.on('postgres_changes', …)` on that already-subscribed channel throws:

> cannot add `postgres_changes` callbacks for realtime:discovery-job-7922e84a-… after `subscribe()`

This kills the render and the section boundary catches it.

## Fix

In `useDiscoveryProposals.ts`:

1. Make the channel name unique per effect run: `discovery-job-${currentJobId}-${nonce}` where `nonce` is generated inside the effect (e.g. `crypto.randomUUID().slice(0,8)` or `Date.now()`). This guarantees no collision with a residual channel in the realtime registry.
2. Drop `job?.status` from the dependency array — re-subscribing on every status change is unnecessary churn; `job?.id` change is the only signal that matters for the channel lifecycle. The handler already updates state correctly for every payload.
3. Keep the existing cleanup (`supabase.removeChannel(channel)`).

That's the whole fix — one file, ~3 lines.

## Out of scope

- The stuck `7922e84a…` worker job (still `running` at 20%) — separate worker problem.
- Bridge / proposal rendering — was never the issue.
- Removing the inline error pre-block from `SectionErrorBoundary` — leave it; it's been useful and harmless.
