# Memory: doctrine-v1
Updated: 2026-02-01

## Core Principle
The Google Sheet is the accounting engine. Everything else is plumbing, enrichment, or presentation.

## Tier Classification

**Tier 1 — Accounting Spine (No AI, No Guessing)**
- Chart of Accounts, Trial Balance, DD Adjustments, Reclassifications, AR/AP Aging
- Rules: UUID IDs, no heuristics, validation errors must surface

**Tier 2 — Supporting Schedules (Still Accounting)**
- Fixed Assets, Payroll, Proof of Cash, Material Contracts, Top Customers/Vendors
- Rules: Same as Tier 1

**Tier 3 — Interpretation Layer (AI Lives Here)**
- Insights Chat, Executive Summary, Risk Indicators
- Rules: Read REPORT tabs only, suggest never apply, cite sources

**Tier 4 — Deliverables**
- PDF Export, Excel Download, Data Room Package

## Key Contracts

**WRITE Tabs (9):** Due Diligence Information, Trial Balance, Due Diligence Adjustments, AR Aging, AP Aging, Fixed Assets, Top Customers by Year, Top Vendors by Year, Proof of Cash

**READ Tabs (15+):** Income Statement, Balance Sheet, QoE Analysis, NWC Analysis, Free Cash Flow, etc.

**154-Row COA Mapping:** Schema contract in `src/lib/qbAccountMappings.ts`. Every account must resolve to fsType + fsLineItem. Never guess or default silently.

## Coding Rules

- Backend: All WRITE data flows through `sync-sheet`, UUID for IDs, explicit validation errors
- Frontend: WRITE sections save to sheet, READ sections display only, placeholders are bugs
- AI: Never modify wizard_data, suggestions require user "Accept", cite sheet sources

## Scope Protection

Do NOT build: real-time collab, multiple templates, custom formulas, native mobile, multi-currency, batch ops

MVP first: All 9 WRITE tabs sync, REPORT tabs display actual data, PDF/Excel export works
