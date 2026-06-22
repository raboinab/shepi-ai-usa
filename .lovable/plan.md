# Stop Dashboard from acting on subscription state before it loads

## What's still broken

The `useSubscription` fix from the previous turn correctly defers the `check-subscription` call until auth is ready. But `Dashboard.tsx` still reads `hasAccessToProject(project.id)` at click time and at render time *while `subscriptionLoading` is true*. During that brief window after login, `paidProjects` is the empty default, so:

- Clicking a project tile → `hasAccessToProject` returns `false` → opens the payment dialog (or routes to the paywall) instead of opening the project. A second click works because subscription data has loaded by then.
- The grid briefly renders every owned project tile with a lock icon and 75% opacity.

## Fix (single file: `src/pages/Dashboard.tsx`)

1. **`handleProjectClick` (line 239)** — treat "still loading" as "let the project page decide", not as "no access":
   - If `subscriptionLoading` is true, navigate to `/project/${project.id}` directly. The project page already shows a spinner while loading and the correct paywall only after it has real data.
   - Otherwise, keep the existing branch (paywall dialog when `!hasAccessToProject`).

2. **Project tile render (around lines 511-527)** — don't display the lock affordance until we actually know:
   - Compute `const accessKnown = !subscriptionLoading;`
   - Only apply `opacity-75` and render the `<Lock />` icon when `accessKnown && !hasAccess`.
   - While loading, show the tile as a normal, clickable card.

3. No changes to `useSubscription`, `Project.tsx`, or the edge function — Project.tsx already gates its render on `subscriptionLoading` and shows the correct paywall only after data resolves.

## Verification

1. Sign in as `annabellewinterberry@gmail.com`, land on `/dashboard`, immediately click a paid project tile (before the subscription request would normally finish). Expect: project opens on the first click, shows the spinner briefly if needed, then loads the project. No payment dialog flash.
2. While Dashboard is loading subscription state, project tiles should not show the lock icon or dimmed styling.
3. Sign in as a user with no access to a project, wait for subscription to load, click the project → payment dialog still appears (existing behavior preserved).

## Out of scope

- `useSubscription` hook changes (already correct after previous turn).
- The Pricing/Account/PaymentSuccess pages — they don't gate click actions on `hasAccessToProject` mid-load.
