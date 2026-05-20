## What's already in place
`grant-cpa-role` already sends a Resend welcome email at the moment the role is granted (lines 106-140 of the edge function). So new grants are technically covered — but there's no record of whether the welcome was actually delivered, so we can't backfill safely.

## Gap to close
1. **Track delivery** — we don't know which existing CPAs received the welcome. Without a marker we'd either skip everyone or risk double-sending.
2. **Backfill** — 4 existing CPAs in `user_roles`:
   - Kacy Ora (kacy.ora@gmail.com) — granted 2026-04-12
   - Mike Feeley (feeley_mike@outlook.com) — granted 2026-05-19
   - Alex (raboinab@gmail.com) — granted 2026-05-19
   - Chris LeBlanc (cpleblanc14@gmail.com) — granted 2026-05-20 *(also missing a `cpa_profiles` row)*

   None have `cpa_profiles.onboarding_completed_at` set, so we can't infer from that.

## Plan

### 1. Migration: add a delivery marker
Add `welcomed_at timestamptz` to `cpa_profiles`. NULL = never welcomed. Set at the moment we send.

### 2. Update `grant-cpa-role`
- After a successful Resend send, set `cpa_profiles.welcomed_at = now()` for that user.
- If Resend fails, leave NULL so backfill will retry it later.
- Also: ensure a `cpa_profiles` row exists even if the row was already there (Chris's case is unusual but defensive — re-check after upsert).

### 3. New edge function: `notify-existing-cpas` (admin-only, one-shot/idempotent)
- Verifies caller is admin.
- Finds every user with `cpa` role whose `cpa_profiles.welcomed_at IS NULL` (or no profile row).
- For each: ensures cpa_profile exists, then sends the same welcome email used by `grant-cpa-role` (shared helper), sets `welcomed_at = now()` on success.
- Returns `{ sent: [emails], skipped: [reason], failed: [errors] }`.
- Safe to re-run — anyone already welcomed is skipped.

### 4. Shared helper
Extract the welcome email HTML + send into `supabase/functions/_shared/cpa-welcome.ts` so `grant-cpa-role` and `notify-existing-cpas` use identical copy.

### 5. Run the backfill once
After deploy, call `notify-existing-cpas` against the 4 CPAs above. Report exactly who was emailed.

## Verification
- DB: query `cpa_profiles.welcomed_at` for all 4 users after run — all should be set.
- Resend: confirm 200 response per send in function logs.
- Idempotence: invoke `notify-existing-cpas` a second time → should return `sent: []` with all 4 in `skipped: "already welcomed"`.
- Future grants: granting a new test CPA still sets `welcomed_at` and sends exactly one email.

## Out of scope (ask before doing)
- Re-sending to CPAs who already received the welcome (e.g., resend if they lost it). Add a `force=true` flag later if needed.
- Changing email copy — using the existing template verbatim.

## Email copy
Identical to current `grant-cpa-role` email. From `shepi <hello@shepi.ai>`, subject "Welcome to the shepi Network", links to `/cpa/onboarding` and `/cpa`. If you want different copy for the backfill ("Quick note — we never confirmed your CPA invite, here's the link…"), say so and I'll branch it.
