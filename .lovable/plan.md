## Problem

The AI Discovery section is still hitting the section error boundary on `/project/fa0768ca…`. The defensive null guards I added earlier didn't catch the real culprit. The 14 saved proposals look clean in the DB (no null `proposed_amount`, no null `proposed_period_values`, all statuses are valid strings), and a fresh job (`7922e84a…`) is sitting `running` at 20% — but neither of those should crash render.

Without the actual error message or a console-log dump we're guessing. The fastest path to a real fix is to make the boundary's fallback show the error message inline (instead of hiding it behind "Copy error details").

## Plan

**1. Surface the real error in `SectionErrorBoundary`**

Change `src/components/system/SectionErrorBoundary.tsx` so the fallback renders, inline:
- `this.state.error?.message` in a monospaced `<pre>` block
- the first ~10 lines of `this.state.errorInfo?.componentStack` (so we can see which child threw)
- keep the existing "Reset section" and "Copy error details" buttons

This is a tiny, low-risk change scoped to the fallback UI only. No business logic touched.

**2. You reload the page and paste what shows**

Once the inline error is visible, paste the message + component stack back into chat. With the real stack I can pinpoint the throwing component in one round-trip instead of guessing at more defensive coercions.

**3. (Likely follow-up, not in this plan)** Patch whatever the stack reveals — almost certainly a single field access in `ProposalDetailCard`, `CpaReviewBadge`, or the bridge-summary computation. I'll propose that as a separate plan once we have the error text.

## Out of scope

- Not touching the stuck `7922e84a…` job yet — it's not what's crashing render (running jobs render the progress bar fine).
- Not changing `useDiscoveryProposals` or proposal data.
- Worker stall debugging (why jobs hang at 20%) is a separate workstream.

## Technical notes

Files changed: `src/components/system/SectionErrorBoundary.tsx` only.

```text
[AlertTriangle] AI Discovery is temporarily unavailable
A proposal or analysis job failed to render…

Error: <message here>
  at ProposalDetailCard (DiscoveryProposalsSection.tsx:377)
  at … (first ~10 lines of component stack)

[Reset section]  [Copy error details]
```
