
# DFY Document Intake & Readiness Gate

## The problem
When a buyer/client purchases Done-For-You, the CPA is assigned but cannot start until the client has uploaded all source documents. Today there is no shared workspace, no "required documents" checklist, no readiness gate, and no nudge loop. We need all four.

## Core model

1. **One project, shared access.** The DFY client is the project owner; the assigned CPA gets project access via the existing `cpa_claims` row + `has_project_access()`. Both work in the same `/project/:id` workspace. Client uses the existing wizard upload UI; CPA sees uploads in real time.

2. **Required-document checklist per engagement.** We already have `DOCUMENT_CHECKLIST` in `fetchDocumentSources.ts` with `required | recommended | optional` tiers. We promote this to a **per-project intake checklist** with explicit status: `not_uploaded → uploaded → cpa_approved | cpa_rejected (with reason)`. The CPA can mark any required item as "still missing" or "wrong file — please re-upload."

3. **Readiness gate.** A `cpa_claim` cannot move past `accepted` into `in_review` until all **required** items are `uploaded` (auto) and (optionally) `cpa_approved`. The DFY status banner already has an "Awaiting documents" stage we'll add between `accepted` and `in_review`.

4. **Nudge loop.** Both system-driven (cron) and CPA-driven ("Nudge client" button). Emails via Resend + in-app `cpa_notifications`.

## Client experience (DFY buyer)

- On the project page, a new **"Document Intake"** panel appears above the wizard for DFY projects. It shows:
  - Progress bar: `X of Y required documents uploaded`
  - Each required item with status pill, upload button, and any CPA rejection note
  - Banner: *"Your CPA reviewer is waiting on these documents to begin."*
- Once all required are uploaded → banner flips to *"All set — your CPA will begin review shortly."* and the claim auto-advances to `in_review`-eligible.
- Email + in-app notification when the CPA rejects a file or requests additional docs.

## CPA experience

- On `/cpa/engagement/:projectId`, a new **"Document Intake"** tab (first tab, before "Adjustment review") shows the same checklist with:
  - Approve / Reject (with reason) per item
  - "Request additional document" → adds an ad-hoc required item with description
  - **"Nudge client"** button → sends email + in-app notification, rate-limited to once per 48h
- Adjustment-review tab is disabled with a tooltip until all required items are `cpa_approved` (or the CPA explicitly overrides with "Start review anyway").

## Nudge system

- New edge function `nudge-dfy-client` (callable by CPA button and by cron):
  - For a given claim, finds missing required docs, sends a Resend email to the client with the list + deep link, inserts a `cpa_notifications` row, and logs the nudge.
- Scheduled cron (Supabase scheduled function) `dfy-readiness-cron` runs daily:
  - For every `cpa_claim` in `accepted` status older than 3 days with missing required docs → auto-nudge (escalating cadence: day 3, day 7, then weekly; cap at 4 total auto-nudges).
  - Notifies admin + CPA after day 14 of inactivity so they can intervene.

## Technical details

### Database (one migration)

- `project_document_requirements` table:
  - `id`, `project_id`, `requirement_key` (e.g. `chart_of_accounts`), `label`, `tier` (required/recommended/optional), `is_custom` (bool, for CPA-added ad-hoc requests), `requested_by_user_id`, `notes`, `created_at`
  - Seeded by trigger on `projects` insert when `service_tier='done_for_you'` from the canonical checklist.
- `project_document_reviews` table (CPA approvals per requirement):
  - `id`, `requirement_id`, `document_id` (nullable until uploaded), `status` (`pending|approved|rejected`), `rejection_reason`, `reviewed_by_user_id`, `reviewed_at`
- `cpa_nudges` table:
  - `id`, `claim_id`, `project_id`, `sent_by` (`system|cpa_user_id`), `missing_keys jsonb`, `email_id`, `created_at`
- RLS: project members + assigned CPA read/write their scope; service role full access.
- Add `cpa_claim.status = 'awaiting_documents'` enum value (or use a derived view; status stays `accepted` and we compute readiness from the checklist — simpler, recommended).

### Edge functions
- `nudge-dfy-client` — POST `{claim_id, sent_by}` → email + notification + log
- `dfy-readiness-cron` — scheduled daily; finds candidates and calls `nudge-dfy-client`
- Extend `grant-cpa-role` / claim creation flow to seed `project_document_requirements` when a DFY project is created (or backfill on first CPA claim if missing).

### Frontend
- `src/components/dfy/DocumentIntakePanel.tsx` — used on Project page (client view) and CpaEngagement page (CPA view), behavior switches on role.
- Extend `DfyStatusBanner` with "Awaiting documents (X/Y uploaded)" state, derived from requirements.
- New tab in `CpaEngagement.tsx`: "Document Intake" with approve/reject + nudge button. Gate the "Adjustment review" tab on readiness.
- Email templates (Resend): client nudge, CPA "docs ready" notification, admin escalation.

## Open questions for you
1. Should the CPA be able to **bypass the readiness gate** and start review anyway, or is the gate hard? (Recommendation: soft gate with an explicit override that logs to admin.)
2. Default required set: keep the existing 4 (`COA`, `TB`, `GL`, `Bank Statements`) or expand for DFY (e.g. add Tax Returns, AR/AP aging)?
3. Nudge cadence: day 3 / 7 / 14 / 21 OK, or more aggressive?
4. Should clients be able to mark a requirement as "N/A — does not apply to my business" (subject to CPA approval)?

If those are fine as proposed, I'll build it in this order: migration → intake panel (client) → CPA intake tab + nudge button → readiness gate on banner/review tab → cron nudge function.
