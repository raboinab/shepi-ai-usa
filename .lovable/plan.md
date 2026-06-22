## Bug: "Review & Approve" sometimes needs a page refresh to work

### What's happening

The symptom — clicking a button that does nothing until you refresh — is the well-known Radix UI bug where `<body>` is left with `pointer-events: none` after a Dialog/Select/Popover/Tooltip closes. Once that happens, every subsequent click on the page (including the "Review & Approve" button in Proof of Cash) is swallowed. A page reload clears the inline style and clicks start working again.

This codepath is a perfect setup for the bug:

- `ProofOfCashTab` keeps `<TransferReviewDialog>` mounted whenever the user isn't in mock mode.
- Inside the dialog there are `Dialog`, plus nested `Select`, `Popover`, `Tooltip`, `Collapsible` (Radix primitives layered together).
- Closing the dialog (Save, Cancel, ESC, or backdrop click) — or closing a nested `Select`/`Popover` — can leave `document.body.style.pointerEvents = "none"`.
- Next time the user clicks "Review & Approve" in the workbook UI, nothing happens until refresh.

Versions in use (`@radix-ui/react-dialog ^1.1.15`, `react-select ^2.2.6`, `react-popover ^1.1.15`) are all in the range where this regression has been reported intermittently.

### Fix

Add a small, focused safety net that restores body pointer-events whenever the transfer-review dialog transitions from open → closed. This is the minimum-risk pre-call fix — no library upgrade, no broad refactor.

In `src/components/workbook/shared/TransferReviewDialog.tsx`:

1. Wrap the existing `onOpenChange` so that when `open` becomes `false`, we schedule a microtask (`requestAnimationFrame` / `setTimeout(0)`) that:
   - Clears `document.body.style.pointerEvents` if it equals `"none"`.
   - Also clears any leftover `data-scroll-locked` attribute Radix sometimes leaves on `<html>`.
2. Add a `useEffect` cleanup on unmount with the same clear, in case the dialog unmounts mid-transition.

In `src/components/workbook/tabs/ProofOfCashTab.tsx`:

- Before calling `setReviewOpen(true)` from the "Review & Approve" `onClick`, defensively clear `document.body.style.pointerEvents` if it's stuck on `"none"`. This guarantees the very next click works even if the page already entered the stuck state from an earlier interaction.

### What I will NOT change

- No Radix version bumps (risk before Neal's call).
- No changes to the classification pipeline, `useTransferClassification`, or save logic.
- No UI/visual changes.
- No changes to mock mode or any unrelated tabs.

### Verification

- Build passes.
- Drive Playwright headless against the running dev server to: open the Proof of Cash tab on a real project, open the Review dialog, change a category in the nested `Select`, close the dialog via Cancel, then click "Review & Approve" again immediately. Expect the dialog to re-open without a refresh, and `document.body.style.pointerEvents` to be empty.
- If reproducing the original failure proves flaky in CI-style headless run, manually verify via `page.evaluate` that the body style is clean after each close.

Total change surface: ~15 lines across two files. Safe to ship before the catering deal call.