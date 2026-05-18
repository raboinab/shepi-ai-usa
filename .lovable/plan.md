## Fix: 12 truncated seoTitles + seoDescriptions in /guides

Confirmed the regression on every file you listed. Git history isn't accessible from this sandbox, so I can't `git log -p` the originals — I'll rewrite to complete sentences (option B). Titles intentionally exceed 60 chars where needed; Google will truncate with `…` and that reads as a real page, vs. the current hand-cut `& |` endings.

### Proposed values

Each row: file → new `seoTitle` → new `seoDescription`.

1. **RunRateEBITDA.tsx**
   - `Run-Rate EBITDA vs Historical EBITDA — Calculation & When to Use Each | Shepi`
   - `…common pro forma adjustments, and red flags in M&A due diligence.`

2. **EBITDAAdjustments.tsx**
   - `EBITDA Adjustments Guide — Types, Examples & Best Practices | Shepi`
   - `…common examples, documentation standards, and red flags in M&A due diligence.`

3. **WorkingCapitalAnalysis.tsx**
   - `Working Capital Analysis — NWC Peg, Turnover & Seasonality in M&A | Shepi`
   - `…AR/AP/inventory turnover, and how seasonality affects the working capital peg.`

4. **EarningsManipulationSigns.tsx**
   - `Signs of Earnings Manipulation — Financial Red Flags in M&A | Shepi`
   - `…GL-level indicators, and detection techniques for QoE analysts.`

5. **QualityOfEarnings.tsx**
   - `What Is a Quality of Earnings Report? Complete Guide for M&A | Shepi`
   - `…costs, timelines, and how AI is changing QoE analysis.`

6. **QoEReportTemplate.tsx**
   - `QoE Report Template — Executive Summary, EBITDA Schedules & More | Shepi`
   - `…working capital, proof of cash, and supporting schedules.`

7. **RevenueQualityAnalysis.tsx**
   - `Revenue Quality Analysis for M&A — Customer & Recurring Revenue | Shepi`
   - `…AR aging analysis, and revenue recognition red flags.`

8. **AIWontDoYourQoE.tsx**
   - `AI Won't Do Your QoE Analysis (And Why That's the Point) | Shepi`
   - keep current description — already complete.

9. **FinancialRedFlags.tsx**
   - `Financial Red Flags Checklist for M&A Due Diligence | Shepi`
   - `…cash flow signals, GL-level anomalies, and how to investigate each one.`

10. **OwnerCompensationNormalization.tsx**
    - `Owner Compensation Normalization — How to Adjust for QoE | Shepi`
    - `…market-rate replacement, and supporting documentation.`

11. **CashProofAnalysis.tsx**
    - `Proof of Cash Analysis — GL-to-Bank Reconciliation Guide | Shepi`
    - `…commingled personal expenses, and validating reported revenue.`

12. **CustomerConcentrationRisk.tsx**
    - `Customer Concentration Risk — Analysis Guide for M&A | Shepi`
    - `…evaluate mitigating factors, and price concentration into the deal.`

### Out of scope
- `/use-cases/AccountantsCPA.tsx` — title/description already complete; skipping.
- Other guides (EBITDABridge, SDE, DueDiligenceChecklist, SellSide, CanAIReplace, PersonalExpense, AIAccountingAnomaly, GeneralLedgerReview) — checked, all already complete.

### Process
Two edits per file (one for `seoTitle`, one for `seoDescription`) — 24 edits total, all in `src/pages/guides/`. No routing, no JSON-LD, no other copy changes.

Approve and I'll apply all 24 edits in parallel.