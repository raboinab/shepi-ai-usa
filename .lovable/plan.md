
# Trust Center

A multi-page trust center under `/security`, modeled after the existing `/scope`, `/accuracy`, and `/proof-of-cash` SEO pages (typographic, `src/components/content/*`, max-w-6xl, serif headings, eyebrow labels, bg-background/bg-secondary alternation).

Strategic intent: close the trust-signal gap surfaced in the QoEAgent teardown. State only what is verifiably true today, and be explicit about what is on the roadmap vs. not yet in place — overclaiming is a bigger risk than underclaiming for a PE/search-fund buyer.

## Pages

```
/security                          Trust Center overview (hub)
/security/subprocessors            List of third-party services that touch customer data
/security/dpa                      Data Processing Addendum (plain-language summary + downloadable .pdf placeholder)
/security/responsible-disclosure   Vulnerability reporting policy + contact
```

All four routes added to `src/App.tsx`, `public/sitemap.xml`, and linked from the footer + homepage trust strip.

## /security (hub)

Sections, top to bottom:

1. **Hero** — "Built for diligence-grade data." One-line: customer financials, bank statements, and QBO data handled with the controls a PE associate expects.
2. **At a glance** — `StatRow` with 4 cells: TLS 1.2+ in transit · AES-256 at rest · Per-deal RLS isolation · QBO OAuth, read-only scopes.
3. **Data handling** — `BenefitGrid`: What we collect, where it lives (Supabase/Postgres, US region), retention defaults, customer-initiated deletion.
4. **Authentication & access** — Supabase Auth, RLS per deal, role separation (deal owner vs. CPA reviewer vs. admin), session handling.
5. **AI & customer data** — LLM calls via Lovable AI Gateway; customer data is not used to train third-party models. Prompts and extracted fields are stored against the deal record.
6. **Infrastructure** — Lovable Cloud (Supabase Postgres + Edge Functions), hosted on Supabase's AWS US infrastructure. Daily backups via Supabase. Link to Supabase's own security page.
7. **What we don't have yet** — Honest section. No SOC 2 report, no third-party pen test report, no HIPAA, no SSO/SAML. Links to roadmap below.
8. **Roadmap** — `StepList` with target windows phrased as goals, not commitments: SOC 2 Type I scoping, annual third-party pen test, SAML SSO for DFY accounts, in-app data export.
9. **Contact** — security@shepi.ai for questions; link to `/security/responsible-disclosure` for vulnerability reports.
10. **Related** — `RelatedResourceCards` to `/scope`, `/accuracy`, `/security/subprocessors`, `/security/dpa`.

## /security/subprocessors

Plain table (`ComparisonTable`-style or simple semantic table): Subprocessor · Purpose · Data categories · Region. Seeded entries: Supabase (database, auth, storage — all customer data, US), Lovable (hosting, AI Gateway — prompts + extracted fields, US), Intuit (QBO OAuth — read-only accounting data), Resend or current email provider if configured (transactional email — email addresses only). One-line note: list is current as of the page's "last updated" date; material changes announced via email to account owners with 30 days' notice.

## /security/dpa

Plain-language summary of a standard DPA: roles (shepi = processor), scope of processing, sub-processing, security measures (cross-link to /security), data subject rights, breach notification target (72 hours to account owner), term and deletion on termination. Plus a "Request a signed DPA" CTA mailto:legal@shepi.ai. No downloadable PDF in v1 — wire that up when legal has signed off on the actual document.

## /security/responsible-disclosure

Scope (in-scope: shepi.ai, app.shepi.ai, edge functions; out-of-scope: third-party services, social engineering, DoS). How to report (security@shepi.ai, PGP key optional / "available on request"). Safe harbor language. Response SLA target: acknowledge within 3 business days, status update within 10. No bug bounty payouts in v1 — credit only, stated honestly.

## Technical details

- New files:
  - `src/pages/security/SecurityOverview.tsx`
  - `src/pages/security/Subprocessors.tsx`
  - `src/pages/security/DPA.tsx`
  - `src/pages/security/ResponsibleDisclosure.tsx`
- `src/App.tsx`: register the four routes.
- `public/sitemap.xml`: add all four URLs with `https://shepi.ai/security...` canonicals.
- Footer (`src/components/layout/*` — locate during build): add "Security" link to /security.
- Homepage `Index.tsx`: add a small trust strip (4 chips: TLS · AES-256 · RLS isolation · QBO OAuth read-only) that links to /security. Use the existing inline section pattern, no new layout primitives.
- SEO per page: unique `<title>` (<60 chars) and meta description (<160), canonical to shepi.ai, single H1, JSON-LD `WebPage` on the hub.
- Reuse content components: `HeroCallout`, `StatRow`, `BenefitGrid`, `StepList`, `AccordionFAQ`, `RelatedResourceCards`, `ComparisonTable`. No new components.

## What this plan deliberately does NOT do

- No SOC 2 / ISO / HIPAA badges or implications.
- No "bank-level security" or "enterprise-grade" marketing puffery.
- No insurance claims (per project memory — E&O, cyber, umbrella are off-limits).
- No attestation/audit language (per project memory).
- No real signed DPA PDF — a summary page + mailto only, until legal provides the document.
- No changes to auth, RLS, or any backend code. This is a marketing/trust surface only; the underlying controls described must already be true. If any claim in the draft turns out to be inaccurate, I will remove it rather than soften it.
