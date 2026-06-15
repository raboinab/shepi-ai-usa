
# Trust Center: inherited-compliance framing

Reframe the Trust Center to accurately surface that Shepi runs entirely on SOC 2 Type II and ISO 27001 certified infrastructure, while staying honest that Shepi itself is not yet independently audited. This is the standard "inherited controls" framing every well-built early-stage SaaS uses (Linear, Vercel, Resend, Cal.com all do it this way).

## The honest claim

> Shepi is built on infrastructure that is SOC 2 Type II and ISO 27001 certified. The platform inherits the physical, network, and operational controls of its subprocessors (Supabase, AWS, Vercel, Stripe, Intuit). Shepi's own SOC 2 Type I audit is on the roadmap.

That sentence is defensible to a PE associate, an SBA lender's risk team, and an FTC investigator simultaneously. What we will NOT claim:

- "Shepi is SOC 2 certified" (would be false)
- "Shepi is ISO 27001 certified" (would be false)
- Display SOC 2 / ISO 27001 badges as if they were Shepi's own (would be false)
- "Compliant with SOC 2" without the "infrastructure" qualifier (misleading)

## Changes to `/security`

### 1. New "Compliance" section, slotted between "Infrastructure" and "What we don't have yet"

Heading: `Compliance & Certifications`. Subhead one-liner: "Shepi runs on certified infrastructure; the platform itself is pre-audit."

Sub-section A — **Infrastructure certifications (inherited)**: a ComparisonTable listing each subprocessor, what they're certified for, and what control we inherit from them. Verified-public certifications only:

| Provider | Role | Certifications | What we inherit |
|---|---|---|---|
| AWS (us-east) | Underlying compute, network, storage | SOC 1 / SOC 2 / SOC 3 Type II, ISO 27001 / 27017 / 27018, PCI DSS Level 1, HIPAA-eligible | Physical security, network controls, hardware lifecycle |
| Supabase | Database, auth, storage, edge functions | SOC 2 Type II, HIPAA available | Database hardening, backup operations, access logging |
| Vercel | Hosting, AI Gateway | SOC 2 Type II, ISO 27001, GDPR | Edge delivery, build pipeline, zero-data-retention LLM routing |
| Stripe | Billing | PCI DSS Level 1, SOC 1 / SOC 2 Type II | Cardholder data handling — Shepi never touches card numbers |
| Intuit (QuickBooks) | OAuth source of GL data | SOC 2, ISO 27001 | OAuth flow, read-only scope enforcement |

Sub-section B — **What Shepi itself controls**: short list of the controls *we* are responsible for on top of inherited infrastructure (RLS policies, role separation, secret management, code review, dependency scanning, edge function authorization). Frame as: certified infra is necessary but not sufficient; here's the layer above it that's on us.

Sub-section C — **Shepi's own audit status**: one paragraph stating Shepi has not yet completed an independent SOC 2 or ISO 27001 audit, that SOC 2 Type I is on the roadmap below, and that enterprise prospects can request our current security questionnaire (CAIQ-lite) under NDA via security@shepi.ai.

### 2. Update "At a Glance" StatRow

Replace one of the four chips with `SOC 2 + ISO 27001 · Certified infrastructure` so the framing is visible above the fold. The full nuance lives in the Compliance section below.

### 3. Update "What We Don't Have Yet"

Soften the SOC 2 bullet from a blanket "no SOC 2 report" to: "Shepi's own SOC 2 Type I report is in progress — see roadmap. Underlying infrastructure (AWS, Supabase, Vercel) is SOC 2 Type II and ISO 27001 certified today." Other gap bullets unchanged.

### 4. Update FAQ + FAQ JSON-LD

Replace the existing "Is Shepi SOC 2 certified?" Q&A with the inherited-controls answer, and add a new entry: "Do you inherit your providers' SOC 2 / ISO 27001 controls?" — answered with the standard inherited-controls explanation and a link to the compliance section.

### 5. Update SEO description

Current: "...TLS, AES-256, per-deal RLS isolation, read-only QuickBooks OAuth, and an honest list of what we don't have yet."

New: "Shepi runs on SOC 2 Type II and ISO 27001 certified infrastructure (AWS, Supabase, Vercel). Encryption, per-deal RLS isolation, read-only QuickBooks OAuth, and an honest list of what's still on the roadmap."

## Changes to `/subprocessors`

The existing page lists subprocessors but doesn't surface their certifications. Add a "Certifications" column to the existing table with the same data as above. No restructuring — just one more column.

## What this plan does NOT do

- No SOC 2 / ISO 27001 badges representing Shepi itself.
- No claim that Shepi is "certified" or "compliant" without the "infrastructure" qualifier.
- No fabricated audit dates for Shepi's own report.
- No edits to /dpa, /privacy, /terms — the legal pages stay as-is until counsel reviews any compliance language.
- No new pages; just edits to `src/pages/Security.tsx` and `src/pages/Subprocessors.tsx`.

## Files touched

- `src/pages/Security.tsx` — new Compliance section, updated StatRow, gaps section, FAQ, FAQ JSON-LD, SEO description.
- `src/pages/Subprocessors.tsx` — add Certifications column to the existing table.
