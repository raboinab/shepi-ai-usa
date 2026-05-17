# Phase 4 — Make the CPA marketplace functional end-to-end

Two tracks in parallel. 4a unblocks CPA supply (currently nothing links to the application form). 4b makes a "claim" mean something real — for the CPA, the client, and the DFY product promise of CPA-led review.

Skipped on purpose: ratings, reputation scoring, payouts, complex disputes. Not needed yet.

---

## 4a — Discovery surface

Goal: A CPA who hears about Shepi can find the application in under 30 seconds from any entry point.

1. **`/for-cpas` marketing page** — typographic SEO page using the `src/components/content/*` pattern (consistent with the rest of the marketing site per project memory). Sections:
   - Hero: "Earn side income reviewing QoE adjustments"
   - Who it's for (independent CPAs, small-firm partners with capacity)
   - How it works (apply → onboard → claim DFY deals → review adjustments → get paid)
   - Compensation framing (placeholder until payments phase — "competitive per-engagement fees")
   - What we are NOT (no attestation/audit opinion — protects UPL/insurance posture per Core memory)
   - CTA → `/cpa-partners` application form
2. **Footer link** — "For CPAs" added to the marketing footer.
3. **Homepage strip** — small inline section on `Index.tsx` (bg-secondary band, eyebrow + serif heading + one-line pitch + button), placed below an existing section. Follows the inline section pattern per memory.
4. **Head metadata** — unique title/description/og for `/for-cpas`.

No backend changes. Pure presentation.

---

## 4b — Engagement loop

Goal: Drive `cpa_claims.status` through a real state machine with UI on both sides (CPA + client) and surface adjustment review — the actual DFY deliverable.

### State machine on `cpa_claims.status`

```text
proposed     ← CPA hits "Claim" on a DFY project (was: in_progress)
   │
   ├─ withdrawn   (CPA backs out before client accepts)
   │
   ▼
accepted     ← client confirms the assigned CPA (auto-accept after 48h)
   │
   ▼
in_review    ← CPA opens engagement workspace, begins review
   │
   ▼
completed    ← CPA submits completion summary; client notified
```

No dispute flow yet — admin can reassign manually from `AdminDFYEngagements`.

### Schema changes (migration)

- Replace loose default `'in_progress'` on `cpa_claims.status` with `'proposed'`.
- Add columns: `accepted_at`, `accepted_by_user_id`, `completed_at`, `completion_summary text`, `withdrawn_at`, `withdrawn_reason text`.
- New table `cpa_adjustment_reviews`:
  - `id`, `claim_id` (fk cpa_claims), `proposal_id` (fk adjustment_proposals), `cpa_user_id`
  - `decision` (`confirmed | modified | rejected`)
  - `cpa_note text`, `modified_amount numeric NULL`, `modified_period_values jsonb NULL`
  - `reviewed_at timestamptz`, standard timestamps
  - Unique `(claim_id, proposal_id)`
  - RLS: CPA on own claim can read/write; client (project owner / shared editor) can read; admin full; service_role full.
- Auto-accept job: extend existing `cpa-sla-check` to also auto-flip `proposed → accepted` after 48h.

### CPA-side UI

- `CpaQueue.tsx`: claim button writes `status='proposed'`, then routes to new engagement workspace.
- New `src/pages/cpa/CpaEngagement.tsx` (route: `/cpa/engagements/:projectId`):
  - Header: project, client, current status, days-in-stage.
  - "Adjustments to review" tab — list of `adjustment_proposals` for the project, each with confirm / modify / reject + note. Writes to `cpa_adjustment_reviews`.
  - "Documents" tab — read-only list of project documents (already accessible via `auto_share_on_cpa_claim` share).
  - "Complete engagement" button (enabled when all proposals reviewed) → opens summary modal → writes `status='completed'`, `completion_summary`.
  - "Withdraw" button → confirm dialog → `status='withdrawn'`.
- `CpaEngagements.tsx`: list view grouped by status.

### Client-side UI

- New `src/components/dfy/CpaReviewerPanel.tsx` mounted on the project workspace when `service_tier='done_for_you'` AND a `cpa_claims` row exists:
  - Shows assigned CPA's `cpa_profiles` (name, firm, state, years experience, bio) — RLS already allows this via `Project members view assigned CPA profile`.
  - Current stage with progress dots.
  - If `status='proposed'`: "Accept this reviewer" / "Request different reviewer" buttons. The latter posts to admin (writes a notification, doesn't auto-reassign).
  - If `status='in_review'`: shows count of reviewed-so-far adjustments.
  - If `status='completed'`: shows CPA's completion summary + downloadable indicator that the DFY review is done.
- Surfacing on each `adjustment_proposals` row in the client's review UI: if `cpa_adjustment_reviews` exists, show a "CPA reviewed: ✓ confirmed / modified / rejected" badge + CPA note. Read-only for the client. This is the visible payoff for the DFY tier.

### Admin

- `AdminDFYEngagements.tsx` gains a status filter and a "Reassign CPA" action (sets current claim to `withdrawn`, allows a new CPA to claim).

### Notifications (extends existing `cpa-notify`)

Add event types — DB triggers piggyback on the same function:
- `claim_accepted_by_client` → CPA
- `claim_auto_accepted` → CPA + client
- `engagement_completed` → client
- `claim_withdrawn` → admin + client

---

## Build order

1. Migration: `cpa_claims` columns + `cpa_adjustment_reviews` table + RLS.
2. Backend wiring: extend `cpa-notify` event types; extend `cpa-sla-check` for auto-accept.
3. CPA engagement workspace (`CpaEngagement.tsx`) + claim flow update.
4. Client `CpaReviewerPanel` + per-proposal CPA review badge.
5. Admin reassign action.
6. In parallel: 4a discovery surface (`/for-cpas` page, footer link, homepage strip).

---

## Open questions before I start

1. **Auto-accept window** — 48h reasonable, or do you want shorter/longer? Or require explicit client acceptance with no auto-flip?
2. **"Request different reviewer"** — should this just notify admin (light-touch), or should it instantly free the project back into the pool?
3. **Where exactly on the project workspace** does `CpaReviewerPanel` mount — top of the deal workspace, sidebar, or its own tab? I'd default to a prominent banner at the top, collapsible.
4. **Per-proposal review badge** — confirm this should appear in the *client's* adjustment review UI (the existing screen where they see AI-flagged adjustments), not just in the CPA's workspace.
