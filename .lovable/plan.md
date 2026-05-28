Mark all 4 of annabellewinterberry@gmail.com's existing projects as `funded_by_credit = true` (with NULL `credit_expires_at` = non-expiring legacy access), so `check-subscription` returns them in `paidProjects` and unlocks the UI.

Projects affected:
- Landscaping Biz — Kacy Ora
- Landscaping Biz — Mike Feeley
- Landscaping Biz — Chris LeBlanc
- Landscaping Biz — Alex Raboin

Her 200-credit balance is left untouched (retroactive grant, not a purchase). She'll need to refresh/re-login to see the change.

```sql
UPDATE public.projects
SET funded_by_credit = true
WHERE user_id = '894774d8-2d8a-40de-b5ad-a5c8ec6a9d93'
  AND id IN (
    '356b8b85-934a-45d7-a11b-d17a5ae79954',
    '3eb58ee7-e962-4262-abb4-5b42b058dc1b',
    '72089e37-c6a3-445b-8736-1f6c24e6d4c5',
    'fa0768ca-96f9-4ded-b498-f64ca5be3ede'
  );
```
