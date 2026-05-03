# Fix misfiring sign_up GA4 event

## Problem
GA4 shows 9 `sign_up` conversions over 28 days but Supabase `auth.users` confirms far fewer real new accounts. Two bugs in `src/pages/Auth.tsx`:

1. **Line 179** — `trackEvent("sign_up", { method: "google" })` fires inside `handleGoogleSignIn` before redirect to Google. Supabase `signInWithOAuth` is used for both new sign-ups AND returning sign-ins, so every existing user clicking "Sign in with Google" fires `sign_up`. Bailing at Google's consent screen still counts.
2. **Line 227** — `trackEvent("sign_up", { method: "password" })` fires after `supabase.auth.signUp()` returns success, but that happens the moment the verification email is sent — the user may never click the link.

## Fix
Move all `sign_up` firing out of `Auth.tsx` and into `AuthCallback.tsx`, where we can inspect the actual session and distinguish new accounts from returning users.

### Detection rule
A user is brand-new if `Math.abs(new Date(user.created_at).getTime() - new Date(user.last_sign_in_at).getTime()) < 10_000` (within 10s). For returning users `last_sign_in_at` jumps to "now" while `created_at` stays original.

Works for both Google OAuth (account created on first OAuth) and email/password (account created when verification link is clicked → which is when callback fires).

## File changes

### `src/pages/Auth.tsx`
- Delete line 179: `trackEvent("sign_up", { method: "google" });`
- Delete line 227: `trackEvent("sign_up", { method: "password" });`
- (Skip the optional `auth_initiated` event — not needed.)

### `src/pages/AuthCallback.tsx`
Add helper at top of file:

```ts
import { trackEvent } from "@/lib/analytics";

function fireAuthEvent(
  user: { created_at?: string; last_sign_in_at?: string; app_metadata?: { provider?: string } },
  fallbackMethod = "unknown"
) {
  if (!user.created_at || !user.last_sign_in_at) return;
  const created = new Date(user.created_at).getTime();
  const lastSignIn = new Date(user.last_sign_in_at).getTime();
  const isNewUser = Math.abs(lastSignIn - created) < 10_000;
  const method = user.app_metadata?.provider ?? fallbackMethod;
  trackEvent(isNewUser ? "sign_up" : "login", { method });
}
```

Call it in three places:
1. After `result.success` inside `processCallback` (~line 76) — fires `sign_up` or `login` depending on freshness.
2. Inside `onAuthStateChange` `SIGNED_IN` branch (~line 84).
3. "Existing session found" branch (~line 56) — will always classify as `login` since `created_at` and `last_sign_in_at` will be far apart.

## GA4 admin
No change. `sign_up` stays a key event; `login` intentionally is not (retention, not acquisition).

## Verification
- Incognito: existing Google account → expect `login` in DebugView, not `sign_up`.
- Incognito: brand-new Google account → expect `sign_up`.
- Email/password: complete verification link → expect `sign_up` after `/auth/callback`.
- 3–7 days post-deploy: re-run `scripts/daily-action-items.py`; `sign_up` should match real new rows in `auth.users`.

## Out of scope
- Backfilling historical GA4 data (not editable).
- Renaming `sign_up` (preserve trend continuity).
- Auditing other events (`demo_started`, `begin_checkout`, etc.).

Approve and I'll ship it.