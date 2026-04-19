# Shepi Engineering Doctrine

> **The Google Sheet is the accounting engine.**
> Everything else is plumbing, enrichment, or presentation.

This document is the architectural constitution for Shepi development.
Every feature, PR, and design decision should be evaluated against these principles.

---

## System Layers

```text
┌─────────────────────────────────────────────────────────────────┐
│               EXTERNAL TRUTH (Data Sources)                      │
│  QuickBooks API (85%)  │  Document Upload  │  Manual Entry      │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            NORMALIZATION & ENRICHMENT (Deterministic)            │
│  154-row COA mapping  │  Period standardization  │  UUID IDs    │
│  ⚠️ NO AI, NO GUESSING, NO HEURISTICS                           │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│               SPREADSHEET ENGINE (Source of Truth)               │
│  9 WRITE tabs ──────────▶ Formulas ──────────▶ 15+ READ tabs    │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│            INTERPRETATION LAYER (AI Lives Here)                  │
│  Insights Chat  │  Executive Summary  │  Risk Flags  │  PDF     │
│  ✅ Suggest, Explain, Summarize — Never Modify Numbers          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tier Classification

### Tier 1 — Accounting Spine (Must Be Boring & Correct)

| Component | Files | Rules |
|-----------|-------|-------|
| Chart of Accounts | `complete-qb-sync`, `chartOfAccountsUtils.ts` | No AI, 154-row mapping only |
| Trial Balance | `sync-sheet`, `trialBalanceUtils.ts` | Multi-period, plug row preserved |
| DD Adjustments | `DDAdjustmentsSection.tsx`, `sync-sheet` | Manual entry, formula-computed |
| Reclassifications | `ReclassificationsSection.tsx`, `sync-sheet` | UUID IDs, FS Line Item mapping |
| AR/AP Aging | Aging sections, `sync-sheet` | Fixed period blocks |

**Engineering Rules for Tier 1:**
- No AI predictions
- No heuristics unless logged
- No guessing amounts
- IDs must be UUID-stable
- Validation errors must surface, never silently coerce
- If it breaks, the entire platform breaks

### Tier 2 — Supporting Schedules (Still Accounting)

| Component | Files | Status |
|-----------|-------|--------|
| Fixed Assets | `FixedAssetsSection.tsx` | Syncs to dedicated tab |
| Payroll | `PayrollSection.tsx` | Syncs to DD Adjustments |
| Proof of Cash | `ProofOfCashSection.tsx` | Bank reconciliation |
| Material Contracts | `MaterialContractsSection.tsx` | Lease/commitment data |
| Top Customers/Vendors | Concentration sections | Syncs to dedicated tabs |

**Rules:** Same as Tier 1. Still no AI guessing.

### Tier 3 — Interpretation Layer (AI Belongs Here)

| Component | Files | Purpose |
|-----------|-------|---------|
| Insights Chat | `insights-chat/index.ts`, `AIChatPanel.tsx` | Explain, educate, suggest |
| QoE Executive Summary | Future | Draft narrative from sheet data |
| Risk Indicators | `RiskIndicators.tsx` | Surface patterns from READ tabs |
| AI Suggestions | Future | Suggest reclassifications (user accepts) |

**Rules:**
- Read from REPORT tabs only
- Cite sheet cell sources in explanations
- Suggest, never apply
- Confine all AI prompts to `insights-chat`

### Tier 4 — Deliverables (The Actual Product)

| Component | Status | Priority |
|-----------|--------|----------|
| PDF Export | Not built | HIGH |
| Excel Download | Not built | HIGH |
| Data Room Package | Not built | MEDIUM |

---

## Coding Rules by Area

### Backend (Edge Functions)

1. **Schema Stability**
   - COA and TB schemas are contracts — version and test them
   - Use `src/lib/workbookContract.ts` as authoritative tab/column spec

2. **Sync Pipeline**
   - All WRITE tab data flows through `sync-sheet`
   - Transformers must match workbook column structure exactly
   - Pad rows to consistent column counts

3. **Data Validation**
   - Reject invalid data with explicit errors — no silent coercion
   - Log validation failures to Sentry/console
   - If it doesn't match `{ reclassifications: [...] }`, reject it

4. **ID Stability**
   - Use UUID for all user-created entries
   - Never use `Date.now()` for IDs

5. **Period Handling**
   - Standardize to YYYY-MM-DD format
   - Validate against `project.periods` configuration

### Frontend (React/Wizard)

1. **WRITE vs READ Separation**
   - WRITE sections: user input → save → sync to sheet
   - READ sections: pull from sheet → display only (no editing)

2. **Make Broken Sync Visible**
   - Show sync errors prominently
   - Never hide "unsynced" state from users

3. **Placeholders Are Bugs**
   - All metrics should pull from actual sheet data
   - Replace hardcoded values with parsed rawData

4. **Export UX Priority**
   - Users pay for deliverables, not dashboards
   - Build export functionality before cosmetic features

### AI / Insights

1. **Never Touch Inputs**
   - AI reads REPORT tabs only
   - AI cannot modify wizard_data directly

2. **Suggest, Don't Apply**
   - Reclassification suggestions require user "Accept"
   - Suggestions use structured output (fenced code blocks)

3. **Cite Sources**
   - Reference specific cells/tabs when explaining
   - "The Balance Sheet shows..."

4. **Response Contract**
   - Finding → Impact → Verification structure
   - No markdown formatting in chat responses
   - Max 25 words quoted from RAG sources

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

**This discipline is why lenders will trust Shepi.**

---

## Scope Protection

### Do NOT Build (Until Core Is Solid)
- [ ] Real-time collaboration features
- [ ] Multiple workbook templates
- [ ] Custom formula builder
- [ ] Native mobile app
- [ ] Multi-currency support (beyond display)
- [ ] Batch project operations

### Build Only After MVP
- [ ] AI auto-apply reclassifications
- [ ] Automated anomaly detection alerts
- [ ] Client portal / external sharing
- [ ] Integration with other accounting systems

### MVP Checklist (Before Adding Features)
- [ ] All 9 WRITE tabs sync correctly
- [ ] All REPORT tabs display actual sheet data
- [ ] PDF export generates professional output
- [ ] Excel download works
- [ ] Reclassifications end-to-end verified

---

## Quick Reference Tables

### WRITE Tabs (9 total)

| Tab | Wizard Section | Transformer |
|-----|----------------|-------------|
| Due Diligence Information | Project Setup | `dueDiligenceToSheet` |
| Trial Balance | Trial Balance | `trialBalanceToSheet` |
| Due Diligence Adjustments | DD Adjustments, Reclassifications, Payroll | `adjustmentsToSheet`, `reclassificationsToSheet` |
| AR Aging | AR Aging | `arAgingToSheet` |
| AP Aging | AP Aging | `apAgingToSheet` |
| Fixed Assets | Fixed Assets | `fixedAssetsToSheet` |
| Top Customers by Year | Top Customers | `topCustomersToSheet` |
| Top Vendors by Year | Top Vendors | `topVendorsToSheet` |
| Proof of Cash | Proof of Cash | `proofOfCashToSheet` |

### READ Tabs (15+ total)

| Tab | Data Displayed | Component |
|-----|----------------|-----------|
| Income Statement | Revenue, Expenses, Net Income | `IncomeStatementSection` |
| Balance Sheet | Assets, Liabilities, Equity | `BalanceSheetSection` |
| QoE Analysis | Adjusted EBITDA bridge | `QoEAnalysisSection` |
| NWC Analysis | Working capital trends | `NWCFCFSection` |
| Free Cash Flow | Cash flow from operations | `NWCFCFSection` |

---

## Summary

**Shepi is not an AI accounting system.**
**It is a deterministic accounting engine with an AI analyst sitting on top of it.**

The spreadsheet does the math. The AI explains the results. The user makes the decisions.
