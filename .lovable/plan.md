## Goal

Improve General Ledger reconciliation for project `621a6c9f-1c25-40fa-92fa-6762ae3fe72b` by fixing the remaining generic parser/classification bugs in `analyze-general-ledger`, not by special-casing this company.

## Diagnosis

The 74% result is now concentrated in two real code issues:

1. **Balance-sheet ending balance selection is wrong for reverse-chronological QuickBooks GL exports**
   - QuickBooks exports rows newest-first.
   - The analyzer currently picks a row from the max transaction date as the ending balance.
   - In these files, the correct ending balance is `Beginning Balance + Summary Amount`.
   - This explains:
     - `1001 Undeposited Funds (Sales)` showing `$1,067,904` instead of `$534,331`
     - `1175 Inventory Asset` showing `$354,416` instead of `$635,082`
     - Fidelity, PayPal, A/P, Sales Tax, and other BS variances.

2. **Deleted marketplace fee accounts are still classified as `OTHER`**
   - Accounts like `Shopify Fee - VampireFreaks (deleted)`, `PayPal Fee - USD (deleted)`, `Shop Pay Fee (deleted)`, `Amazon Fee - US (deleted)` are expense accounts.
   - Because they miss COA classification and fall through as `OTHER`, the analyzer uses the latest running-balance row instead of full-period activity.
   - Their GL summaries already match TB; the wrong balance selector is what creates the variance.

## Implementation Plan

### 1. Fix BS snapshot logic in the GL parser

Update the per-account snapshot calculation so that when a section has a valid beginning balance and summary amount, the snapshot uses:

```text
snapshotBalance = beginningBalance + summaryNet
```

This should take precedence over selecting a balance from the latest transaction date for normal balance-sheet sections.

Keep the existing balance-column fallback only for cases where summary data is missing.

### 2. Detect reverse-chronological GL row ordering defensively

Add a lightweight detector per account section:

- Track the first and last real transaction dates in row order.
- If first date is later than last date, mark the section as reverse chronological.
- In reverse chronological sections, never use the max-date row as the ending snapshot when a section summary is available.

This makes the fix robust for future QuickBooks exports with the same ordering.

### 3. Expand name-pattern classification for platform fees

Update the fallback classifier so deleted/orphaned fee accounts classify as `EXPENSE`, including common marketplace/payment processor fee names:

```text
paypal fee, shopify fee, shop pay fee, amazon fee, afterpay fee,
klarna fee, sezzle fee, ebay fee, etsy fee, tiktok fee,
market pro fee, foreign currency fees, rate difference
```

Keep revenue-specific patterns like `shipping income`, `refund`, `return`, and `discount` classified as revenue/contra-revenue.

### 4. Preserve generic behavior

Do not hardcode this project ID or account names as one-off overrides. The changes should operate on:

- QuickBooks GL structure
- section summary math
- row ordering
- general account-name patterns

### 5. Verification

After deployment:

1. Re-run **General Ledger Analysis** on `621a6c9f…`.
2. Confirm expected changes:
   - `1001 Undeposited Funds (Sales)` drops to about `$534,331` and matches TB.
   - `1175 Inventory Asset` rises to about `$635,082` and matches TB.
   - deleted platform fee accounts match their TB amounts.
   - BS variances from reverse-row ordering materially shrink.
   - Reconciliation should move well above 74%.
3. If remaining variances exist, inspect only the new residual rows and iterate narrowly.