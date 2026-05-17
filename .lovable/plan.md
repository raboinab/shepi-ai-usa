## Managed CPA Marketplace — Build Plan

Goal: turn the existing `/cpa-partners` page + `cpa_claims` plumbing into a real managed marketplace. Six phases, shippable one at a time. Phase 1–3 unblock recruiting + day-to-day ops; Phase 4–6 round out the promises already made on the marketing site.

Every phase respects the project Core memory: shepi is analytical software, **CPA-led review**, not attestation. None of these changes touch that distinction.

---

### Phase 1 — Application intake (replace the `mailto:`)

Stop relying on `partners@shepi.ai`. Capture applicants in a queryable table with SLA tracking.

- **DB**: new `cpa_applications` table
  - `full_name`, `email`, `phone`, `state_of_licensure` (text), `license_number`, `years_experience`, `qoe_background` (text), `firm_affiliation` (text, nullable), `side_work_permitted` (bool), `conflicts_disclosure` (text), `linkedin_url`, `referral_source`
  - `status` enum: `submitted | in_review | approved | rejected | withdrawn`
  - `reviewer_user_id`, `reviewed_at`, `decision_notes`, `created_at`
  - RLS: anyone can `INSERT` (public form); only `admin` role can `SELECT/UPDATE`. Applicant cannot read back.
- **Form on `/cpa-partners`**: replace both `mailto:` CTAs with an inline application form (drawer or section). Client-side validation, submits via `createServerFn` (`submitCpaApplication`) which inserts the row and sends two emails via Resend (already configured): confirmation to the applicant ("we'll come back in 3 business days") and notification to `partners@shepi.ai`.
- **Admin queue**: new `/admin/cpa-applications` page (sibling of AdminContacts), lists applications with filters, detail drawer with approve/reject buttons. Reject sends a polite decline email; approve hands off to Phase 2.
- **SLA telemetry**: add a column to admin list showing days-since-submission, highlight red after 3 business days.

### Phase 2 — Vetting → promote to CPA user

One-click admission from the approved application.

- **DB**: new `cpa_profiles` table keyed by `user_id`
  - `application_id`, `display_name`, `state_of_licensure`, `license_number`, `license_verified_at`, `license_verified_by`, `liability_covered` (bool, default true — shepi umbrella), `background_check_status`, `w9_on_file` (bool), `payout_method_id` (nullable, links to Phase 5), `industries` (text[]), `states_served` (text[]), `max_concurrent_engagements` (int default 3), `active` (bool default true), `bio`
  - RLS: CPA can `SELECT/UPDATE` own row (limited columns); admin full access.
- **Promote flow in admin**: button on an approved application → creates `auth.users` invite via `supabaseAdmin.auth.admin.inviteUserByEmail`, inserts `user_roles` row with `cpa`, creates `cpa_profiles` row pre-filled from the application, marks the application `approved`. Sends welcome email with login link + link to onboarding checklist.
- **CPA onboarding page**: new `/cpa/onboarding` route (under `CpaLayout`) — finish profile, accept provider agreement (already exists), confirm industries/states served, upload W-9 (uses existing `documents` storage bucket with new `category = 'cpa_w9'`).
- **CpaSidebar**: add "My Profile" link.

### Phase 3 — Notifications

No CPA should need to keep `/cpa` open. Use Resend (already wired).

- **`createServerFn` triggers**:
  - On `projects.insert` where `service_tier = 'done_for_you'` → email all CPAs matching state+industry filters (using `cpa_profiles`).
  - On `cpa_claims.insert` → email Client ("Your CPA, [name], state [X], license #[Y], has been matched") + email admin.
  - On `cpa_claims.status` change → email Client.
  - On `chat_messages.insert` in DFY engagement → email the other party (debounced via `nudge_log`, which already exists).
  - Daily cron (pg_cron → `/api/public/cron/cpa-sla`) checks for engagements where status hasn't moved within 48h of claim or 72h after match — emails admin.
- **In-app**: small unread badge on `CpaSidebar` items using a `cpa_notifications` table (id, user_id, type, payload, read_at).

### Phase 4 — Matching upgrade (deliver on the "state + industry matched" promise)

Keep the claim model but stop showing every CPA every project.

- **CpaQueue filters**: server-side filter `projects` against `cpa_profiles.states_served` and `industries`. Add UI toggles ("Show all open", "Show matches only" defaults on).
- **Capacity cap**: block claim button when CPA already has `max_concurrent_engagements` open engagements.
- **Conflict screen at claim time**: before insert, modal asks "Do you have an independence conflict with [Client / target company]?" Yes blocks the claim and writes a row to `cpa_conflict_declarations` (audit trail).
- **Admin override**: in `/admin/dfy-engagements`, allow admin to directly assign a project to a specific CPA (inserts the claim on their behalf, used for hand-routed deals or escalations).
- **SLA timers** visible in `CpaEngagements` ("Match SLA: 1–2 days · 18h elapsed").

### Phase 5 — Payouts

Make "we pay you per engagement" real.

- **Stripe Connect Express** (separate from any Client-facing Stripe). Add via `enable_stripe_payments` if not already, then enable Connect onboarding.
- **DB**: `cpa_payout_accounts` (user_id, stripe_connect_account_id, status, onboarded_at). `cpa_payouts` (engagement claim_id, amount_cents, currency, status, stripe_transfer_id, paid_at).
- **Per-engagement rate**: add `cpa_payout_amount_cents` to `cpa_claims` (default from a `cpa_rates` settings table, override by admin per deal). Visible to CPA before they claim.
- **Trigger**: when CPA flips status to `delivered` AND admin marks the engagement `client_accepted`, a server function creates a Stripe transfer to the CPA's connected account, writes `cpa_payouts` row, emails CPA the receipt.
- **1099 prep**: yearly export from `cpa_payouts` joined to `cpa_profiles` (W-9 data) → CSV ready for accountant.

### Phase 6 — Signed deliverable

Tie the CPA's identity to the actual report bytes.

- **Signature capture**: on the `delivered` action in `CpaEngagements`, modal asks the CPA to confirm name + state + license # and type their name. Stores `cpa_signatures` row (claim_id, user_id, name, state, license_number, signed_at, ip, pdf_hash).
- **Stamp the PDF**: extend `src/lib/pdf/pdfWorker.ts` (the same builder used for demo PDF) to render a "CPA-Reviewed" footer on every page with the signing CPA's name, state, license #, and the signature timestamp. Re-export after signing; store under `documents` with `category = 'cpa_signed_report'`.
- **Client-facing**: `DfyStatusBanner` shows "Your CPA: [name, state, license #]" once a claim exists; full signed PDF available in Export Center once signed.
- **Audit**: signatures are append-only (no update/delete RLS).

---

## Cross-cutting / out of scope

- **Marketing copy stays put.** The `/cpa-partners` page and Pricing DFY card are correct; only the CTA changes from `mailto:` to the application form (Phase 1).
- **No changes to the core "shepi is not a CPA firm" framing.** The signed deliverable in Phase 6 is signed *by the matched CPA in their professional capacity*, not by shepi.
- **Liability umbrella evidence**: separately, drop the COI PDF in `/public/legal/` and link it from `/cpa-partners`. Not code, but needed for Phase 1 credibility — flagging here for the user to provide.
- **Stripe Connect KYC/tax filing** is Stripe's responsibility once onboarded; we don't take that on.

---

## Suggested sequencing

```text
Week 1   Phase 1 — Intake form + admin queue        (unblocks recruiting today)
Week 1   Phase 2 — Promote flow + cpa_profiles      (unblocks first real CPA)
Week 2   Phase 3 — Notifications                    (unblocks "set and forget")
Week 3   Phase 4 — Matching + conflict + capacity   (delivers marketing promise)
Week 4   Phase 5 — Stripe Connect payouts           (unblocks "we pay you")
Week 5   Phase 6 — Signed deliverable               (rounds out CPA-Signed tier)
```

---

## Two decisions I need from you before building

1. **Payouts provider** — Stripe Connect Express is the default (you already use Stripe for Client billing, lowest ops overhead, handles 1099-NEC). Confirm, or say if you'd rather pay manually via ACH/Wise outside the app for now and skip Phase 5 for v1.
2. **Notification channel** — Resend email only (already configured), or also wire Slack DMs / SMS via Twilio? Email only is fastest.

If you say "go", default answers are Stripe Connect + email-only and I'll start Phase 1 immediately.
