# Fix subscription "needs refresh" bug

## What's broken

`useSubscription` races Supabase's session restore on first load. If the query fires before the session is ready, it caches an empty "no access" result for 30 seconds, so any project the user clicks into shows "Payment Required" until they hard-refresh the page.

Concretely, in `src/hooks/useSubscription.ts`:
- The query has no `enabled` gate, so it runs immediately on mount.
- When there's no session, the fetcher returns `DEFAULTS` as a *successful* value — React Query caches it.
- There's no listener on `supabase.auth.onAuthStateChange`, so when `SIGNED_IN` fires a moment later, nothing invalidates the cache.
- `staleTime: 30s` then blocks a refetch.

## Fix (single file: `src/hooks/useSubscription.ts`)

1. Track auth readiness with a tiny piece of state driven by `supabase.auth.getSession()` + `onAuthStateChange`. Expose a boolean `hasSession`.
2. Gate the React Query with `enabled: hasSession`. While `hasSession` is `undefined` (still resolving), keep `isLoading` true so consumers like `Project.tsx` keep showing the spinner instead of the paywall.
3. Drop the `if (!session) return DEFAULTS` short-circuit from `fetchSubscriptionStatus` — with the `enabled` gate it can't be called without a session anymore.
4. On `onAuthStateChange`:
   - `SIGNED_IN` / `TOKEN_REFRESHED` → `queryClient.invalidateQueries({ queryKey: ['subscription-status'] })`
   - `SIGNED_OUT` → `queryClient.setQueryData(['subscription-status'], DEFAULTS)` and flip `hasSession` to false.
5. Keep `staleTime: 30s` and `gcTime: 60s`. Keep the public API of the hook identical — `loading`, `checkSubscription`, `hasAccessToProject`, etc. all behave the same, just correctly now.

## Why this is enough

- No more cached empty result: the query simply doesn't run until we know there's a session.
- Any later sign-in (OAuth callback, magic link, token refresh) invalidates the cached value, so `hasAccessToProject` flips to true without a manual refresh.
- `Project.tsx` and `Dashboard.tsx` need no changes — they already gate UI on `subscriptionLoading`, which will now stay `true` through the auth-restore window instead of resolving to a false-negative.

## Verification

1. Hard-refresh on a project URL while logged in → expect spinner, then the project loads. No "Payment Required" flash, no manual refresh needed.
2. Sign out → land on `/auth`, sign back in → click straight into a paid project → loads first try.
3. Open dev tools Network tab: confirm `check-subscription` fires *after* the session is present (Authorization header populated), not before.
4. Console: `[useSubscription] Parsed result:` should show real `paidProjects` on first load, never the empty default while signed in.

## Out of scope

- The `TransferReviewDialog` / "Review & Approve" pointer-events fix from earlier — already shipped, unrelated.
- Edge function code — already cleaned up in the previous turn.
