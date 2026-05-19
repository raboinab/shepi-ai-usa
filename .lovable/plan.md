## Problem

Two paths grant the `cpa` role today:

1. **Application approval** (`promote-cpa-application` edge function) — grants role, creates `cpa_profiles` row, marks application approved, sends welcome email. Works end-to-end.
2. **Direct admin toggle** in `/admin/users` (Chris, Mike, Alex) — does a raw `INSERT INTO user_roles` from the browser. Grants the role but **never creates `cpa_profiles`** and **never sends an email**.

That's why Chris sees "Profile not ready yet" on `/cpa/onboarding` and got no notification: the role exists, the profile row doesn't.

## Fix

Make every path that grants the `cpa` role guarantee a profile stub and notify the user.

### 1. New edge function: `grant-cpa-role`

- Inputs: `user_id` (or `email`), optional `full_name`, `state_of_licensure`.
- Auth: admin only (verify via `has_role(_, 'admin')`).
- Steps:
  - Upsert `user_roles (user_id, 'cpa')`.
  - Upsert minimal `cpa_profiles` row (`user_id`, `email`, `full_name`, `license_number=''`, `state_of_licensure=''`, `active=true`) if none exists. CPA finishes the rest on `/cpa/onboarding`.
  - Send the same "Welcome to the shepi Network" Resend email used by `promote-cpa-application` (extract the HTML into a shared helper or inline copy).
  - Return `{ ok, created_profile, sent_email }`.

### 2. Rewire `/admin/users` CPA toggle

`src/pages/admin/AdminUsers.tsx` currently writes directly to `user_roles`. Change the mutation to:
- On **grant**: call `supabase.functions.invoke('grant-cpa-role', { body: { user_id } })`.
- On **revoke**: keep the direct delete (profile row can stay; flipping `cpa_profiles.active=false` is a separate concern).
- Toast on success: "CPA role granted, welcome email sent."

### 3. Backfill the three existing CPAs

One-off insert: create `cpa_profiles` rows for Chris, Mike, Alex (pull `full_name` / `email` from `profiles`/`auth.users`). Optionally re-send the welcome email — confirm with user before sending.

### 4. Soften the "Profile not ready" screen (small polish)

`src/pages/cpa/CpaOnboarding.tsx` should auto-create a stub on first load if the user has the `cpa` role but no profile row (defensive fallback for any future path we forget). One-line `upsert` keyed on `user_id`.

## Technical notes

- RLS on `cpa_profiles` already has `Service role full access`, so the edge function (service role) can upsert.
- Welcome email template lives in `promote-cpa-application/index.ts` lines 126–137 — copy or extract.
- No schema change needed. No new tables.
- `cpa_profiles.license_number` and `state_of_licensure` are `NOT NULL` — stub with empty strings; onboarding form already lets the CPA fill them in.

## Open questions

- For the 3 existing CPAs: send the welcome email retroactively, or just silently backfill the profile?
- Should revoking the `cpa` role also deactivate (`active=false`) their `cpa_profiles` row?
