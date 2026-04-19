# Shepi Engineering Doctrine

> **The in-app workbook engine is the accounting spine.**
> Everything else is ingestion, enrichment, analysis, or presentation.

This document is the architectural constitution for Shepi development.
Every feature, PR, and design decision should be evaluated against these principles.

---

## System Layers

```text
┌─────────────────────────────────────────────────────────────────┐
│               EXTERNAL SOURCES (Data Ingestion)                  │
│  QuickBooks API  │  Bank Statements  │  Document Upload  │ Manual│
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            DOCUMENT PIPELINE (Extraction & Normalization)        │
│  Upload → Parse (DocuClipper) → canonical_transactions           │
│  154-row COA mapping  │  Period standardization  │  UUID IDs     │
│  ⚠️ NO AI, NO GUESSING, NO HEURISTICS in normalization           │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               WORKBOOK ENGINE (Source of Truth)                   │
│  10 INPUT tabs ──────▶ Grid Builders ──────▶ 19 CALCULATED tabs  │
│  29 total tabs  │  build*Grid() functions  │  GridData format    │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            AI DISCOVERY & INTERPRETATION                         │
│  Detectors → Observations → Tensions → Hypotheses → Findings    │
│  → Adjustment Proposals (with evidence adjudication)             │
│  Insights Chat  │  Risk Indicators  │  Quick Insights            │
│  ✅ Suggest, Explain, Summarize — Never Modify Numbers           │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            DELIVERABLES (The Actual Product)                     │
│  PDF Export ✅  │  Excel Download ✅  │  Data Room Package 🔜    │
│  Data Sources + Disclaimer tabs  │  AI-Assisted branding         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tier Classification

### Tier 1 — Accounting Spine (Must Be Boring & Correct)

| Component | Key Files | Rules |
|-----------|-----------|-------|
| Chart of Accounts | `qbAccountMappings.ts` | No AI, 154-row mapping only |
| Trial Balance | `trialBalanceUtils.ts`, grid builders | Multi-period, plug row preserved |
| DD Adjustments | `DDAdjustmentsSection.tsx` | Manual entry, grid-computed |
| Reclassifications | `ReclassificationsSection.tsx` | UUID IDs, FS Line Item mapping |
| AR/AP Aging | Aging sections | Fixed period blocks |
| Canonical Transactions | `canonical_transactions` table | GL ingestion from all sources |
| COA Mapping | `qbAccountMappings.ts` | Every account → fsType + fsLineItem |

**Engineering Rules for Tier 1:**
- No AI predictions
- No heuristics unless logged
- No guessing amounts
- IDs must be UUID-stable
- Validation errors must surface, never silently coerce
- If it breaks, the entire platform breaks

### Tier 2 — Supporting Schedules (Still Accounting)

| Component | Status | Notes |
|-----------|--------|-------|
| Fixed Assets | Built | Syncs to dedicated tab |
| Payroll | Built | Syncs to DD Adjustments |
| Proof of Cash | Built | Automated from bank statements + GL |
| Material Contracts | Built | Lease/commitment data |
| Top Customers/Vendors | Built | Concentration analysis |
| WIP Schedule | Built | Conditional on `wipEnabled`, over/under billing waterfall |

**Rules:** Same as Tier 1. No AI guessing. WIP data flows into BS memo lines, NWC adjustments, and QoE suggestions.

### Tier 3 — AI Discovery & Interpretation (Built)

| Component | Key Files | Purpose |
|-----------|-----------|---------|
| AI Discovery Pipeline | `analysis_jobs`, `detector_runs` | Run detectors against project data |
| Observations | `observations` table | Raw patterns found in data |
| Tensions | `tensions` table | Anomalies between expected and actual |
| Hypotheses | `hypotheses` table | Testable claims about adjustments |
| Findings | `findings` table | Resolved hypotheses with evidence |
| Adjustment Proposals | `adjustment_proposals` table | Suggested DD adjustments with evidence |
| Evidence Adjudication | `support_tier`, `verification_report` | Tier 0-4 evidence quality scoring |
| Insights Chat | `insights-chat/`, `AIChatPanel.tsx` | Explain, educate, suggest |
| Risk Indicators | `RiskIndicators.tsx` | Quantified 0-100 risk scoring |
| Quick Insights | `QuickInsights.tsx` | WIP, concentration, margin insights |

**Rules:**
- Read from workbook data only
- Cite data sources in explanations
- Suggest, never apply — proposals require user review
- Confine AI prompts to edge functions
- Evidence tiers determine proposal credibility

### Tier 4 — Deliverables (The Actual Product)

| Component | Status | Notes |
|-----------|--------|-------|
| PDF Export | ✅ Built | Includes Data Sources + Disclaimer |
| Excel Download | ✅ Built | All 29 tabs via grid builders |
| Data Room Package | 🔜 Planned | Combined export |

**Data Completeness Disclosures:** Every export includes Data Sources and Disclaimer tabs. AI-Assisted branding is always shown regardless of user tier or credentials.

---

## Document Pipeline

```text
Upload → Storage → Parse (DocuClipper / direct) → processed_data
                                                  → canonical_transactions
                                                  → coverage tracking
```

### Document Types
- **Financial:** Trial Balance, General Ledger, Bank Statements
- **Supporting:** Tax Returns, Contracts, Payroll Reports
- **Construction/WIP:** Job Cost Reports, WIP Schedule (conditional on `wipEnabled`)

### Checklist Tiers
- **Required:** Must have for valid analysis
- **Recommended:** Improves accuracy significantly
- **Optional:** Nice-to-have for depth

---

## Evidence Adjudication Engine

### Support Tiers

| Tier | Label | Meaning |
|------|-------|---------|
| 0 | Unsupported | No evidence found |
| 1 | Low Support | Weak/indirect evidence only |
| 2 | Moderate Support | Partial evidence, gaps remain |
| 3 | Well Supported | Strong evidence from primary sources |
| 4 | Fully Verified | Multiple corroborating sources |

### Proposal Lifecycle

```text
Detector → candidate → proposal (pending)
  → evidence adjudication (support_tier, verification_report)
  → user review → accepted / rejected
  → if accepted: becomes DD Adjustment
```

### Rules
- Proposals always start as `status: "pending"`
- `support_tier` and `evidence_summary` are computed by the evidence engine
- `missing_evidence` suggests what documents would strengthen the claim
- Users must explicitly accept or reject — no auto-apply
- Rejected proposals store `rejection_reason` and `rejection_category`

---

## Conditional Features

### WIP / Construction Support
- **Flag:** `wipEnabled` on project wizard data
- **Auto-enable:** When industry is in `construction_property` category
- **Activates:** WIP Schedule tab, Job Cost Reports + WIP Schedule document types
- **Financial Impact:** Over/under billing flows to BS memo lines, NWC adjustments, QoE suggestions
- **Risk Factors:** Stale WIP, margin outliers, over/under billing anomalies, job concentration

### Inventory Support
- **Flag:** `inventoryEnabled` on project wizard data
- **Activates:** Inventory-related document checklist items (inventory counts, valuation reports)

---

## Workbook Architecture

### 29 Tabs (defined in `src/lib/workbook-tabs.ts`)

| # | Tab | Type | Category |
|---|-----|------|----------|
| 1 | Due Diligence Information | input | setup |
| 2 | Trial Balance | input | financial |
| 3 | QoE Analysis | calculated | financial |
| 5 | Reconciling IS & BS | calculated | financial |
| 6 | Income Statement | calculated | financial |
| 7 | Income Statement - Detailed | calculated | financial |
| 8 | Sales | calculated | financial |
| 9 | Cost of Goods Sold | calculated | financial |
| 10 | Operating Expenses | calculated | financial |
| 11 | Other Expense (Income) | calculated | financial |
| 12 | Payroll & Related | calculated | financial |
| 13 | Working Capital | calculated | working-capital |
| 14 | NWC Analysis | calculated | working-capital |
| 15 | Balance Sheet | calculated | financial |
| 16 | Balance Sheet - Detailed | calculated | financial |
| 17 | Cash | calculated | working-capital |
| 18 | AR Aging | input | working-capital |
| 19 | Other Current Assets | calculated | working-capital |
| 20 | Fixed Assets | input | working-capital |
| 21 | AP Aging | input | working-capital |
| 22 | Other Current Liabilities | calculated | working-capital |
| 23 | WIP Schedule | input | working-capital |
| 24 | Top Customers by Year | input | supplementary |
| 25 | Top Vendors by Year | input | supplementary |
| 26 | Proof of Cash | calculated | supplementary |
| 27 | Free Cash Flow | calculated | supplementary |
| 28 | Disclaimer | calculated | supplementary |
| 29 | Data Sources | calculated | supplementary |

### Grid Builder Registry
Every tab has a corresponding `build*Grid()` function in `src/lib/workbook-grid-builders/` that produces a `GridData` object. This is the single source of truth for both on-screen rendering and XLSX/PDF export.

---

## Coding Rules by Area

### Backend (Edge Functions)

1. **Schema Stability** — COA and TB schemas are contracts; version and test them
2. **Data Pipeline** — Documents → parsed data → canonical_transactions → grid builders
3. **Data Validation** — Reject invalid data with explicit errors; no silent coercion
4. **ID Stability** — UUID for all user-created entries; never use `Date.now()`
5. **Period Handling** — Standardize to YYYY-MM-DD; validate against `project.periods`

### Frontend (React/Workbook)

1. **INPUT vs CALCULATED** — INPUT tabs: user entry → save to project data. CALCULATED tabs: grid builder output → display only
2. **Grid Builders** — Every calculated tab must have a registered `build*Grid()` function
3. **Make Broken State Visible** — Show sync/validation errors prominently
4. **Placeholders Are Bugs** — All metrics must pull from actual project data
5. **Export UX Priority** — Users pay for deliverables, not dashboards

### AI / Discovery

1. **Never Touch Inputs** — AI reads workbook data only, cannot modify project data directly
2. **Suggest, Don't Apply** — Proposals require explicit user acceptance
3. **Cite Sources** — Reference specific accounts, periods, or data points
4. **Evidence Required** — Every proposal must have a `support_tier` and `evidence_summary`
5. **Response Contract** — Finding → Impact → Verification structure

### Exports

1. **Data Completeness** — Always include Data Sources + Disclaimer tabs
2. **AI-Assisted Branding** — Always shown regardless of user tier
3. **Grid Parity** — Export output must match on-screen grid exactly
4. **Cover Page** — PDF includes AI-Assisted badge

---

## The 154-Row Mapping Contract

The 154-row mapping table (`src/lib/qbAccountMappings.ts`) is a **schema**, not a helper.

### Rules
- Version it (changes require review)
- Test against it (unit tests for edge cases)
- Never auto-expand silently

### Resolution Requirements
Every account MUST resolve to:
- `fsType`: "BS" | "IS"
- `fsLineItem`: Standardized classification
- Optional: `subAccount1`, `subAccount2`, `subAccount3`

### Failure Handling
If mapping fails:
1. Log the unmapped account
2. Surface in UI as "Needs Classification"
3. Never guess or default silently

---

## Risk Scoring Doctrine

- All risk scores are quantified 0-100
- Coverage scores reflect document completeness
- No subjective opinions — only data-backed flags
- Risk indicators cite specific data points
- WIP-specific risks: stale WIP, margin outliers, over/under billing, job concentration

---

## Scope Protection

### Do NOT Build (Until Core Is Solid)
- Real-time collaboration features
- Multiple workbook templates
- Custom formula builder
- Native mobile app
- Multi-currency support (beyond display)
- Batch project operations

### Build After Current Priorities
- AI auto-apply reclassifications (require user acceptance flow first)
- Client portal / external sharing
- Integration with other accounting systems beyond QuickBooks
- Automated anomaly detection alerts (partially built via Discovery)

### Current Status
- [x] All 10 INPUT tabs sync correctly
- [x] All CALCULATED tabs display via grid builders
- [x] PDF export generates professional output with disclosures
- [x] Excel download works (all 29 tabs)
- [x] Reclassifications end-to-end verified
- [x] AI Discovery pipeline operational
- [x] Evidence adjudication engine deployed
- [x] WIP Schedule integrated into financial waterfall
- [ ] Data Room Package export
- [ ] COA line items for Contract Assets/Liabilities
- [ ] Python WIP analyzer detector

---

## Security Principles

Security is not a feature — it is a property of every line of code.

### Database Security

| Rule | Detail |
|------|--------|
| RLS is mandatory | Every user-facing table must have RLS enabled with `auth.uid()` scoping |
| Service-only tables | Use `service_role` policies for internal tables (webhook events, nudge logs) |
| No client-supplied user_id | Always derive `user_id` from `auth.uid()` or service role |
| Shared access | Use `has_project_access()` / `get_project_role()` security definer functions |

### Edge Function Security

| Rule | Detail |
|------|--------|
| Validate auth | Every protected endpoint must verify JWT or API key |
| Sanitize errors | Log full details server-side, return generic messages to clients |
| Payload limits | Validate request body size and reject oversized payloads |
| No internal leaks | Never expose database queries, service URLs, or stack traces |

### AI Safety Controls

| Rule | Detail |
|------|--------|
| Token limits | Always set `max_tokens` on AI requests (default: 4096) |
| Input truncation | Truncate user messages to 8,000 chars, history to 20 messages |
| Prompt injection guard | Reject messages matching known override patterns |
| System/user separation | System instructions in system message only |
| Output validation | Never auto-execute AI-generated code |
| Cost controls | Rate limit AI endpoints per user |

### Webhook Security

| Rule | Detail |
|------|--------|
| Signature verification | Always verify webhook signatures |
| Idempotency | Store processed event IDs in `processed_webhook_events` |
| Timestamp validation | Reject stale events |

### File Upload Security

| Rule | Detail |
|------|--------|
| Allowed types | `.pdf`, `.xlsx`, `.xls`, `.csv`, `.json` |
| Size limit | Max 50MB per file |
| MIME validation | Validate MIME type matches extension |
| Safe filenames | Generate server-side filenames |

---

## Summary

**Shepi is not an AI accounting system.**
**It is a deterministic workbook engine with an AI analyst and evidence engine on top.**

The workbook does the math. The AI discovers patterns and suggests adjustments. The evidence engine grades the claims. The user makes the decisions.
