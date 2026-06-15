## A. Rename `/features/quickbooks-integration` → `/features/accounting-integration`

1. **Rename file**: `src/pages/features/QuickBooksIntegration.tsx` → `src/pages/features/AccountingIntegration.tsx`. Rename default export to `AccountingIntegration`. Update `canonical` and JSON-LD `mainEntityOfPage` to `https://shepi.ai/features/accounting-integration`.
2. **`src/App.tsx`**:
   - Rename lazy import identifier `QuickBooksIntegrationPage` → `AccountingIntegrationPage` and update import path.
   - Change route path from `features/quickbooks-integration` to `features/accounting-integration`.
   - Add redirect route: `<Route path="features/quickbooks-integration" element={<Navigate to="/features/accounting-integration" replace />} />` (import `Navigate` from `react-router-dom`).
   - Update `prerenderPaths` entry to the new path.
3. **`public/sitemap.xml`**: replace the URL entry.
4. **Update internal `<Link to="...">`** in:
   - `src/pages/Resources.tsx` (line 74)
   - `src/pages/features/AIAssistant.tsx` (line 114)
   - `src/pages/features/QoESoftware.tsx` (line 97)
   - `src/pages/guides/DueDiligenceChecklist.tsx` (line 72)
   Labels stay; only `to` prop changes.

## B. Remove Intuit from subprocessor disclosures

Rationale: Intuit/QuickBooks is a customer-controlled OAuth data source, not a Shepi subprocessor.

1. **`src/pages/Subprocessors.tsx`** (lines 42–48): delete the entire `Intuit (QuickBooks)` entry.
2. **`src/pages/Security.tsx`**:
   - Line 174: remove `["Intuit (QuickBooks)", ...]` row from the inherited-certifications table.
   - Line 43 (FAQ schema) & line 250 (rendered FAQ): change the list `(AWS, Supabase, Vercel, Stripe, Intuit)` → `(AWS, Supabase, Vercel, Stripe)`.
3. **`src/pages/security/ResponsibleDisclosure.tsx`** (line 46): remove "Intuit" from the out-of-scope third-party list, leaving Supabase, Stripe, Vercel.

## C. Project memory

Add Core rule: *"Intuit/QuickBooks is a customer-controlled OAuth data source, not a Shepi subprocessor — do not list on /security or /subprocessors. Public marketing integration page lives at `/features/accounting-integration`; the old `/features/quickbooks-integration` URL redirects client-side."*

## Out of scope (untouched)

- All in-app product code: `useQuickBooksConnection`, `QuickBooksButton`, wizard sync banners, OAuth connect/sync flow, edge functions, Supabase types, lib utilities, mock data, admin diagnostics, types/workflow.
- The word "intuition" (false-positive matches).

## Technical notes

- Redirect is React Router client-side `<Navigate replace>`, not a true HTTP 301 (Lovable hosting doesn't expose server redirect config). Acceptable since the URL has no significant external backlinks.
- The QuickBooks OAuth connect and sync are unaffected — no in-app files touched.
