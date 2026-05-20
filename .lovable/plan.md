## Goal
Fix CPA notification emails (Mike/Alex/Kacy got nothing last night), backfill Chris's CPA profile, prevent recurrence, and add a durable send log so we can definitively answer "did the email go out?" next time.

## Root cause (confirmed)
- `cpa-notify` is the **only** function calling `https://connector-gateway.lovable.dev/resend/emails`. There is no Resend connector linked to this project — only Supabase is wired up — so every call returns an error and the function silently swallows it. All other senders (`notify-admin`, `nudge-dfy-client`, `auth-email-hook`, `submit-contact`, `submit-cpa-application`, `promote-cpa-application`, `grant-cpa-role`, `send-engagement-email`) already call `https://api.resend.com/emails` directly with `RESEND_API_KEY` and work fine.
- Chris LeBlanc has the `cpa` role but no `cpa_profiles` row, so the dispatcher never even considered him.

## Plan

### 1. Fix `cpa-notify` (the actual bug)
Replace the connector-gateway call with a direct Resend call, matching the pattern the other 8 functions use:
- Endpoint → `https://api.resend.com/emails`
- Auth → `Authorization: Bearer ${RESEND_API_KEY}` only (drop `LOVABLE_API_KEY` + `X-Connection-Api-Key`)
- Keep `from: "Shepi <notifications@shepi.ai>"` (domain is already verified — `notify-admin` and `send-engagement-email` send from the same address)
- Replace the silent `console.error` swallow with a thrown error so failures surface in logs

### 2. Backfill Chris LeBlanc's `cpa_profiles` row
Migration to insert:
- `user_id`: 3209cbbf-…
- `full_name`: Chris LeBlanc
- `email`: cpleblanc14@gmail.com
- `state_of_licensure`: 'PENDING'
- `license_number`: 'PENDING'
- `industries`: '{}' (matches all — same default Alex/Kacy effectively have)
- `active`: true

### 3. Auto-create `cpa_profiles` on role grant (prevent recurrence)
Trigger on `user_roles` `AFTER INSERT WHEN (NEW.role = 'cpa')` that inserts a stub `cpa_profiles` row (`ON CONFLICT (user_id) DO NOTHING`) using the user's email + name from `auth.users`, with `state_of_licensure='PENDING'`, `license_number='PENDING'`, `industries='{}'`, `active=true`. Same defaults as the backfill.

### 4. Add `email_send_log` + wrap every sender
New append-only table:
```text
email_send_log
  id, created_at
  to_email           text
  template / event_type  text
  subject            text
  status             text  -- 'sent' | 'failed' | 'skipped'
  error              text
  resend_id          text
  related_project_id uuid
  related_user_id    uuid
  payload            jsonb
```
RLS: admin-read-only via `has_role(auth.uid(), 'admin')`; service role writes.

Add a tiny shared helper (inline per function, since edge functions can't share folders easily) that wraps the Resend `fetch` call, captures status + resend_id, and inserts a row before returning. Apply to all 9 senders. This would have surfaced the connector-gateway bug the day it shipped.

### 5. Re-fire the Landscaping Biz notification
After 1–4 are deployed, manually invoke `cpa-notify` for project `17ba0cb7-…` with `event_type='dfy_project_posted'` so Mike, Alex, Kacy, **and** Chris actually receive the email they should have gotten last night.

## Order of operations
1. Migration: backfill Chris + trigger + `email_send_log` table (one migration)
2. Edit `cpa-notify/index.ts` (Resend direct call + log insert)
3. Edit the other 8 senders to insert into `email_send_log`
4. Deploy all changed functions
5. Tail logs, then re-fire the Landscaping Biz notification
6. Verify in `email_send_log` that Mike/Alex/Kacy/Chris each have a `sent` row

## Things to confirm before I start
1. OK to use `'PENDING'` placeholders for Chris's license_state / license_number, and `industries='{}'` (matches all)? Same defaults will apply to the new trigger for any future CPA whose profile is auto-stubbed.
2. OK to re-fire the Landscaping Biz `dfy_project_posted` notification once the fix is live? (Alternative: skip step 5 and let the next DFY post be Chris's first email.)
3. For `email_send_log`, OK with admin-only read access via the existing `has_role(auth.uid(), 'admin')` pattern? (No CPA / client visibility.)