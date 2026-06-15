# Add Zero Data Retention section to Trust Center

Add a dedicated, visible "Zero Data Retention" section to `/security`. ZDR applies broadly across Shepi — not just to AI sub-processors — because financial data pulled from QuickBooks and uploaded documents is processed and returned, not retained for any secondary purpose.

## Scope

Single-file change to `src/pages/Security.tsx`. No new route, no uploaded document — contractual + architectural posture only.

## New section: "Zero Data Retention"

Placed directly after the existing **Compliance & Certifications** section.

Content blocks:

1. **Eyebrow + heading**: "Data Handling · Zero Data Retention"
2. **Lead paragraph** — plain English:
   - Shepi is a processing engine, not a data warehouse. Customer financial data — QuickBooks pulls, uploaded statements, GL detail — is ingested, analyzed, and returned as deliverables. We do not retain it for secondary use, do not sell it, do not share it, and do not use it to train any model.
   - For AI-assisted analysis, prompts route through Vercel AI Gateway to Anthropic and OpenAI under no-retention, no-training terms.
3. **BenefitGrid (4 cards)** — what ZDR means at Shepi:
   - **No model training** — Your data is never used to train foundation models or any Shepi model.
   - **No retention beyond the engagement** — Customers can purge project data at any time; we retain only what's needed to deliver the project and meet legal/tax obligations.
   - **No human review of customer data** — Internal staff do not browse customer data; access is role-scoped and audit-logged.
   - **No secondary use** — Data is never repackaged, resold, or used for benchmarking, analytics products, or marketing.
4. **ComparisonTable — "How each data flow is handled"**:
   | Data flow | Retention posture |
   |---|---|
   | Prompts/completions to Claude or OpenAI via Vercel AI Gateway | Zero retention, zero training (upstream contractual) |
   | Document text extracted for AI analysis | Processed in-request; not stored on AI sub-processor side |
   | QuickBooks pulls + financial data in Postgres | Held only for the active engagement; purged on customer request; never sent to LLMs in raw form and never used to train models |
   | Files at rest in Supabase Storage | Encrypted at rest; scoped to the project; deleted with the project |
   | Application logs (Vercel, Supabase) | Operational only; standard short retention; no customer financial content |
5. **Evidence / references** — small text block:
   - Link to **Vercel AI Gateway data processing terms** (external)
   - Link to **DPA §6 (AI Sub-processors)** (internal `/dpa`)
   - Link to **Subprocessors** (internal `/subprocessors`)
   - Note: "No separate ZDR contract is required — the no-retention posture flows from Shepi's architecture and Vercel AI Gateway's upstream agreements. Enterprise prospects can request the current data-flow diagram under NDA via security@shepi.ai."

## Supporting tweaks (same file)

- **At-a-Glance StatRow** — add a fourth stat: `Zero Data Retention`
- **FAQ** — keep the existing "Do you train AI models on our data?" answer but append: "See the Zero Data Retention section above for the full data-flow breakdown."
- **FAQ JSON-LD** — mirror the same appended sentence so search-result rich snippets stay aligned.
- **SEO meta description** — append " · Zero Data Retention" if under 160 chars (trim other phrasing if needed).

## What this does NOT change

- No edits to `/dpa`, `/subprocessors`, `/privacy`, `/terms`.
- No new route, no uploaded PDF, no badge.
- No claim that Shepi has a signed standalone ZDR addendum — framing is "we inherit ZDR from Vercel AI Gateway upstream + we don't retain customer data ourselves by design," consistent with the inherited-compliance posture already established for SOC 2 / ISO 27001.

## Files

- `src/pages/Security.tsx` — add section, update StatRow, FAQ, FAQ JSON-LD, SEO description.
