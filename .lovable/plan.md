## Diagnosis

The Journal Entries viewer reads from `processed_data` via `useAutoLoadJournalEntries` → `transformQBJournalEntriesToWizard(record.data)`.

That transformer currently does:

```ts
const data = qbData as { data?: unknown[]; count?: number };
const rawEntries = data.data || [];
```

It only handles the **QuickBooks API** shape `{ data: [...], count: N }`.

The user's project (`72089e37…`) has two `journal_entries` rows in `processed_data` with `source_type='qbtojson'` (the file-upload / qbtojson pipeline). Their `data` column is a **plain JSON array of 3,099 entries**, not wrapped in `{ data: [...] }`. So `data.data` is `undefined`, the transformer returns `entries: []`, and the section shows "No journal entries yet."

Individual entries already match the expected shape (`id`, `txnDate`, `adjustment`, `line[]` with `journalEntryLineDetail.accountRef` + `postingType`), so only the outer-wrapper handling needs to change.

## Fix

One file: `src/lib/processedDataTransforms.ts` — make `transformQBJournalEntriesToWizard` accept either shape.

```ts
export function transformQBJournalEntriesToWizard(qbData: unknown): JournalEntriesData {
  // Accept both shapes:
  //   - QuickBooks API:    { data: [...], count: N }
  //   - qbtojson upload:   [ ...entries ]
  const rawEntries: unknown[] = Array.isArray(qbData)
    ? qbData
    : (((qbData as { data?: unknown[] })?.data) ?? []);

  // ...rest unchanged
}
```

Nothing else changes — the per-entry mapping, sort, and section UI are correct.

## Verification

After the change, the section on project `72089e37…` should show all 3,099 entries (with date range, totals, and the search/expand table).