# Web Spreadsheet Integration Plan

> **Goal:** Replace Google Sheets integration with embedded web-based spreadsheet from `dynamic-business-analyzer`

## Executive Summary

This document outlines the migration from Google Sheets to an embedded React-based spreadsheet component. The new approach eliminates external API dependencies, provides faster performance, and gives full control over the QoE workbook experience.

**Status:** ⏸️ Waiting for `dynamic-business-analyzer` to reach 90%+ validation match rate

---

## Current State (Google Sheets)

### Architecture
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  shepi-ai-web   │────▶│  Python Sheets   │────▶│  Google Sheets  │
│    (React)      │     │      API         │     │      API        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│    Supabase     │     │  SHEPI_SHEETS_*  │
│   Edge Funcs    │     │     secrets      │
└─────────────────┘     └──────────────────┘
```

### Current Edge Functions
- `create-project-sheet/` - Creates Google Spreadsheet for a project
- `sync-sheet/` - Push/pull data between Supabase and Google Sheets
  - Push: wizard_data → Google Sheets tabs
  - Pull: Google Sheets tabs → wizard_data

### Dependencies
- `SHEPI_SHEETS_API_URL` - Python backend URL
- `SHEPI_SHEETS_API_KEY` - API authentication key
- Google Workspace API quotas
- External network latency

---

## Target State (Web Spreadsheet)

### Architecture
```
┌─────────────────────────────────────────┐
│            shepi-ai-web (React)         │
│  ┌───────────────────────────────────┐  │
│  │      WorkbookShell Component      │  │
│  │  ┌────────────┐ ┌──────────────┐  │  │
│  │  │ Tab Strip  │ │ Spreadsheet  │  │  │
│  │  │            │ │    Grid      │  │  │
│  │  └────────────┘ └──────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │    Supabase     │
          │   (deals DB)    │
          └─────────────────┘
```

### Benefits
- ✅ No external API dependencies
- ✅ Sub-second load times (no Google API latency)
- ✅ Works offline with cached data
- ✅ Full control over formulas and calculations
- ✅ No Google API quotas
- ✅ Consistent Excel-like UX
- ✅ Real-time auto-save
- ✅ XLSX export built-in

---

## Files to Copy from `dynamic-business-analyzer`

### 1. Components (NEW - no conflicts)
```
src/components/workbook/
├── SpreadsheetGrid.tsx          # Core spreadsheet grid
├── WorkbookShell.tsx            # Main container with tab strip
└── tabs/
    ├── APAgingTab.tsx
    ├── ARAgingTab.tsx
    ├── BSDetailedTab.tsx
    ├── BSSummaryTab.tsx
    ├── CashTab.tsx
    ├── COGSTab.tsx
    ├── FixedAssetsTab.tsx
    ├── FreeCashFlowTab.tsx
    ├── IncomeStatementTab.tsx
    ├── ISDetailedTab.tsx
    ├── NWCAnalysisTab.tsx
    ├── OpExTab.tsx
    ├── OtherCurrentAssetsTab.tsx
    ├── OtherCurrentLiabilitiesTab.tsx
    ├── OtherExpenseTab.tsx
    ├── PayrollTab.tsx
    ├── ProofOfCashTab.tsx
    ├── QoEAnalysisTab.tsx
    ├── SalesTab.tsx
    ├── SetupTab.tsx
    ├── SubAccountDetailTab.tsx
    ├── TopCustomersTab.tsx
    ├── TopVendorsTab.tsx
    └── TrialBalanceTab.tsx
```

### 2. Library Files (NEW - no conflicts)
```
src/lib/
├── calculations.ts              # EBITDA, margins, sums, etc.
├── deal-labels.ts               # Dynamic label resolution
├── export-builders.ts           # Build grid rows for each tab
├── export-workbook.ts           # XLSX export functionality
├── format.ts                    # Currency/percent formatting
├── reseed-tb.ts                 # Trial balance utilities
├── validate-export.ts           # Validation engine
├── validation-mappings.ts       # Cell mapping definitions
└── workbook-tabs.ts             # Tab definitions
```

### 3. Hooks (NEW - no conflicts)
```
src/hooks/
├── use-deal-data.ts             # Fetch deal data from Supabase
└── use-export-workbook.ts       # XLSX export hook
```

### 4. Data Files (NEW)
```
src/data/
├── cell-mapping.json
├── data-flow.json
├── dropdown-options.json
├── full-cell-mapping.json
├── google-sheets-cell-mapping.json
├── google-sheets-compared-mapping.json
├── reference-workbook.xlsx
├── web-app-schema.json
├── TAB_*.md                     # 23 tab documentation files
└── complete_spec/               # 27 JSON specification files
    ├── FORMULA_PATTERNS.json
    ├── ROW_COLUMN_MAP.json
    └── TAB_*.json
```

### 5. Files to SKIP (already exist in shepi-ai-web)
```
src/lib/utils.ts                 # Already exists
src/hooks/use-mobile.tsx         # Already exists
src/hooks/use-toast.ts           # Already exists
src/components/ui/*              # Already have shadcn/ui
src/integrations/supabase/*      # Already exists
src/components/NavLink.tsx       # Already exists
```

---

## Data Model Mapping

### Current Shepi Data Model
```typescript
// projects table
{
  id: string;
  wizard_data: {
    chartOfAccounts: ChartOfAccountsEntry[];
    trialBalance: { accounts: TrialBalanceAccount[] };
    adjustments: Adjustment[];
    // ... other sections
  };
  periods: Period[];
  client_name: string;
  target_company: string;
  industry: string;
}
```

### Target Workbook Data Model
```typescript
// DealData (from use-deal-data.ts)
{
  deal: {
    id: string;
    company_name: string;
    target_company: string;
    periods: PeriodDef[];
    metadata: Record<string, any>;
  };
  accounts: Account[];
  trialBalance: TrialBalanceEntry[];
  adjustments: Adjustment[];
  tbIndex: Map<string, number>;
  monthDates: string[];
}
```

### Data Adapter Required
```typescript
// NEW FILE: src/lib/projectToDealAdapter.ts

import type { Project } from '@/types';
import type { DealData } from '@/hooks/use-deal-data';

export function projectToDealData(project: Project): DealData {
  const wizardData = project.wizard_data || {};
  
  // Transform chart of accounts
  const accounts = (wizardData.chartOfAccounts || []).map(coa => ({
    id: coa.id,
    account_number: coa.accountNumber,
    account_name: coa.accountName,
    account_type: coa.accountType,
    line_item: coa.lineItem,
    sub_account_1: coa.subAccount1,
    sub_account_2: coa.subAccount2,
  }));
  
  // Transform trial balance
  const trialBalance = (wizardData.trialBalance?.accounts || []).flatMap(tb => 
    (tb.monthlyBalances || []).map(mb => ({
      id: `${tb.accountId}-${mb.date}`,
      account_id: tb.accountId,
      period_date: mb.date,
      net_amount: mb.amount,
    }))
  );
  
  // Transform adjustments
  const adjustments = (wizardData.adjustments || []).map(adj => ({
    id: adj.id,
    adjustment_number: adj.number,
    adjustment_type: adj.type, // 'MA' | 'DD' | 'PF'
    category: adj.category,
    description: adj.description,
    amounts: adj.periodAmounts,
    sort_order: adj.sortOrder,
  }));
  
  // Build TB index
  const tbIndex = new Map<string, number>();
  for (const tb of trialBalance) {
    tbIndex.set(`${tb.account_id}|${tb.period_date}`, tb.net_amount);
  }
  
  // Extract unique period dates
  const monthDates = [...new Set(trialBalance.map(tb => tb.period_date))].sort();
  
  return {
    deal: {
      id: project.id,
      company_name: project.client_name || '',
      target_company: project.target_company || null,
      periods: (project.periods || []).map(p => ({
        label: p.label,
        start_date: p.startDate,
        end_date: p.endDate,
        months: p.months,
      })),
      metadata: {
        industry: project.industry,
        transaction_type: project.transaction_type,
        sales_label: wizardData.financialLabels?.sales,
        cogs_label: wizardData.financialLabels?.cogs,
        // ... other labels
      },
    },
    accounts,
    trialBalance,
    adjustments,
    tbIndex,
    monthDates,
  };
}
```

---

## Implementation Phases

### Phase 1: Copy Components (Day 1 - 30 min)

```bash
# From shepi-ai-web root
cd /Users/araboin/qofeai/shepi-ai-web

# Copy workbook components
cp -r ../dynamic-business-analyzer/src/components/workbook src/components/

# Copy lib files (excluding utils.ts)
cp ../dynamic-business-analyzer/src/lib/calculations.ts src/lib/
cp ../dynamic-business-analyzer/src/lib/deal-labels.ts src/lib/
cp ../dynamic-business-analyzer/src/lib/export-builders.ts src/lib/
cp ../dynamic-business-analyzer/src/lib/export-workbook.ts src/lib/
cp ../dynamic-business-analyzer/src/lib/format.ts src/lib/workbook-format.ts  # Renamed to avoid conflict
cp ../dynamic-business-analyzer/src/lib/reseed-tb.ts src/lib/
cp ../dynamic-business-analyzer/src/lib/validate-export.ts src/lib/
cp ../dynamic-business-analyzer/src/lib/validation-mappings.ts src/lib/
cp ../dynamic-business-analyzer/src/lib/workbook-tabs.ts src/lib/

# Copy hooks
cp ../dynamic-business-analyzer/src/hooks/use-deal-data.ts src/hooks/useDealData.ts  # Renamed to match convention
cp ../dynamic-business-analyzer/src/hooks/use-export-workbook.ts src/hooks/useExportWorkbook.ts

# Copy data folder
cp -r ../dynamic-business-analyzer/src/data src/
```

### Phase 2: Create Data Adapter (Day 1 - 2-4 hours)

1. Create `src/lib/projectToDealAdapter.ts` (see mapping above)
2. Update `use-deal-data.ts` to support both:
   - Direct deal ID fetch (for standalone mode)
   - Project data transformation (for embedded mode)
3. Add TypeScript types for the workbook data model

### Phase 3: Add Workbook Route (Day 1 - 1 hour)

```typescript
// NEW FILE: src/pages/Workbook.tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WorkbookShell } from '@/components/workbook/WorkbookShell';
import { projectToDealData } from '@/lib/projectToDealAdapter';

export default function Workbook() {
  const { projectId } = useParams<{ projectId: string }>();
  
  const { data: dealData, isLoading } = useQuery({
    queryKey: ['workbook-data', projectId],
    queryFn: async () => {
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      return projectToDealData(project);
    },
    enabled: !!projectId,
  });
  
  if (isLoading) return <div>Loading workbook...</div>;
  
  return <WorkbookShell dealData={dealData} />;
}
```

Add route in `App.tsx`:
```typescript
<Route path="/project/:projectId/workbook" element={<Workbook />} />
```

### Phase 4: Update Project Page (Day 2 - 1 hour)

```typescript
// In src/pages/Project.tsx

// REMOVE:
const handleOpenSheet = async () => {
  // Google Sheets logic
};

// ADD:
const handleOpenWorkbook = () => {
  navigate(`/project/${projectId}/workbook`);
};

// REPLACE button:
<Button onClick={handleOpenWorkbook}>
  <FileSpreadsheet className="w-4 h-4 mr-2" />
  Open Workbook
</Button>
```

### Phase 5: Remove Google Sheets Code (Day 2 - 1-2 hours)

#### Files to DELETE:
```
supabase/functions/create-project-sheet/
supabase/functions/sync-sheet/
```

#### Code to REMOVE:
```typescript
// src/pages/Project.tsx
- import related to Google Sheets
- google_sheet_id state/usage
- handleOpenSheet function
- "Open in Sheets" button

// Remove from projects table usage:
- google_sheet_id
- google_sheet_url
```

#### Environment Variables to REMOVE:
```
SHEPI_SHEETS_API_URL
SHEPI_SHEETS_API_KEY
```

### Phase 6: Testing (Day 2 - 2-3 hours)

#### Manual Testing Checklist
- [ ] Navigate to `/project/:id/workbook`
- [ ] All 23 tabs load correctly
- [ ] Trial Balance data populates
- [ ] QoE calculations match expected values
- [ ] Income Statement totals are correct
- [ ] Balance Sheet balances (assets = liab + equity)
- [ ] Editable cells work (yellow highlight)
- [ ] Tab navigation works
- [ ] XLSX export produces valid file
- [ ] Auto-save persists changes

#### Validation Testing
- [ ] Run validation against reference workbook
- [ ] Match rate should be 90%+

---

## CSS Requirements

Add to `src/index.css`:
```css
/* Excel-like workbook styles */
:root {
  --excel-header-bg: 220 14% 96%;
  --excel-grid: 220 13% 91%;
  --check-pass: 142 76% 36%;
  --check-fail: 0 84% 60%;
}

.financial-grid {
  border-collapse: collapse;
  font-size: 11px;
}

.financial-grid th,
.financial-grid td {
  border: 1px solid hsl(var(--excel-grid));
  padding: 2px 6px;
  white-space: nowrap;
}

.excel-tab {
  padding: 4px 12px;
  font-size: 11px;
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  cursor: pointer;
}

.excel-tab-active {
  background: white;
  border-color: hsl(var(--excel-grid));
  border-bottom-color: white;
  margin-bottom: -1px;
}

.cell-editable {
  background: hsl(60 100% 95%);
}
```

---

## Rollback Plan

If issues arise after deployment:

1. **Revert git commits** to restore Google Sheets integration
2. **Re-deploy edge functions** (create-project-sheet, sync-sheet)
3. **Restore environment variables** (SHEPI_SHEETS_API_*)
4. **Communicate to users** about temporary reversion

---

## Pre-Integration Checklist

Before starting the integration, verify:

- [ ] `dynamic-business-analyzer` validation rate ≥ 90%
- [ ] All 23 tabs implemented and tested
- [ ] XLSX export working correctly
- [ ] No critical bugs in workbook components
- [ ] Data model fully documented
- [ ] Reference workbook values verified

---

## Timeline Summary

| Day | Phase | Effort |
|-----|-------|--------|
| 1 | Copy components | 30 min |
| 1 | Data adapter | 2-4 hours |
| 1 | Workbook route | 1 hour |
| 2 | Update Project page | 1 hour |
| 2 | Remove Google Sheets | 1-2 hours |
| 2 | Testing | 2-3 hours |
| **Total** | | **~1 day** |

---

## Notes

- The `dynamic-business-analyzer` already has Supabase integration - we'll reuse the edge function pattern
- The workbook uses TanStack Query for data fetching - already in shepi-ai-web
- CSS variables align with shadcn/ui theming
- The tab strip mimics Excel's bottom tab bar for familiarity

---

**Document Version:** 1.0  
**Created:** 2026-02-13  
**Last Updated:** 2026-02-13  
**Status:** Ready for review
