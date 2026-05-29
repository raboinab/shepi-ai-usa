## Plan

Fix the Chart of Accounts screen so the project you linked loads the full COA and stops warning that required categories are missing when the data is actually mapped.

### What I found
- The latest processed COA for project `fa0768ca-96f9-4ded-b498-f64ca5be3ede` has **89 accounts** in `processed_data`.
- The project’s saved `wizard_data.chartOfAccounts.accounts` currently has **0 accounts**, so the screen is auto-loading from `processed_data`.
- The UI shows **79 accounts** because the frontend merge logic is collapsing some QuickBooks accounts when no account numbers exist, despite QuickBooks account IDs being available.
- The “Missing: COGS, Operating Expenses...” warning is a UI label mismatch: backend mappings use workbook line items like `Cost of Goods Sold` and `Operating expenses`, while the COA review badge expects `COGS` and `Operating Expenses`.

### Changes to make
1. **Preserve QuickBooks account IDs during COA transformation**
   - Update `src/lib/chartOfAccountsUtils.ts` so `transformCoaData()` reads lowercase QuickBooks fields too: `id`, `acctNum`, `fullyQualifiedName`, `parentRef`, `name`.
   - This should prevent account merge collisions and keep all 89 accounts.

2. **Normalize COA category validation**
   - Update `ChartOfAccountsSection.tsx` so missing-category detection treats these as equivalent:
     - `COGS` = `Cost of Goods Sold`
     - `Operating Expenses` = `Operating expenses`
     - `Current Assets` = `Cash and cash equivalents`, `Accounts receivable`, `Other current assets`
     - `Current Liabilities` = `Current liabilities`, `Other current liabilities`
     - `Long-Term Liabilities` = `Long term liabilities`
   - Keep display text user-friendly while validating against the real workbook taxonomy.

3. **Avoid stale “reviewed” state after a new COA import**
   - When a new/changed COA is loaded, keep or reset the review prompt appropriately so the user is prompted to review the latest mapping state, not a stale one.

4. **Add regression coverage**
   - Extend `chartOfAccountsUtils.test.ts` to verify lowercase QuickBooks account IDs are preserved and same leaf-name accounts no longer merge incorrectly.
   - Add/adjust tests for category readiness normalization if the existing test setup supports it.

### Expected result
- Re-opening that project’s COA section should load **89 accounts**, not 79.
- The missing category badge should stop flagging COGS / Operating Expenses when mapped accounts exist.
- The Trial Balance step can then use the complete COA for account matching.