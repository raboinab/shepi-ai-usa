## Fix `has_project_access` regression, tighten upload RLS, and formalize admin/CPA access

### 1. Fix `has_project_access` email-share resolution + add admin/CPA bypass

Current two-arg `has_project_access(_user_id, _project_id)` resolves email shares via `_user_id = auth.uid() AND shared_with_email = auth.jwt()->>'email'`. When edge functions call this RPC with the **service role**, `auth.uid()` is NULL, so email-based shares never match server-side. Restore the pre-regression `auth.users` lookup and add role bypasses:

```sql
CREATE OR REPLACE FUNCTION public.has_project_access(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects
                 WHERE id = _project_id AND user_id = _user_id)
  OR EXISTS (SELECT 1 FROM public.project_shares
             WHERE project_id = _project_id
               AND (shared_with_user_id = _user_id
                    OR shared_with_email = (SELECT email FROM auth.users WHERE id = _user_id)))
  OR EXISTS (SELECT 1 FROM public.user_roles
             WHERE user_id = _user_id AND role IN ('admin','cpa'))
$$;
```

Apply the same `auth.users` email lookup to `get_project_role`, and have it return `'admin'` / `'cpa'` when the user holds that role (so downstream role checks treat them as full editors).

Also update the one-arg `has_project_access(_project_id)` variant to include the same `admin`/`cpa` bypass via `auth.uid()`.

### 2. Grant admin + CPA full write access across project-scoped tables

Today admins only have SELECT policies on most tables and CPAs have narrow review-only access. Add `FOR ALL` policies (USING + WITH CHECK based on `has_role(auth.uid(),'admin')` or `'cpa'`) on the project-scoped tables so both roles can insert/update/delete on any project:

- `projects`, `documents`, `processed_data`, `docuclipper_jobs`
- `canonical_transactions`, `flagged_transactions`, `adjustment_proofs`, `adjustment_proposals`
- `company_info`, `chat_messages`, `workflows`, `project_document_requirements`, `project_narratives`, `project_data_chunks`
- `storage.objects` for the `documents` bucket (SELECT/INSERT/UPDATE/DELETE for admin + cpa)

Admin gets unconditional access; CPA gets the same for now (matches "CPA can do anything on any project"). If you'd rather scope CPAs to only projects they've claimed via `cpa_claims`, say so and I'll narrow the CPA policies to `EXISTS (SELECT 1 FROM cpa_claims WHERE project_id = ... AND cpa_user_id = auth.uid())` instead.

### 3. Close the upload RLS gap

Root cause of the VampireFreaks incident: user `1cc25ae2` with no project access inserted a `documents` row for a project they don't own or share. Tighten the `documents` INSERT policy so `WITH CHECK` requires `user_id = auth.uid() AND has_project_access(auth.uid(), project_id)`. Apply the same guard to the `documents` storage-bucket INSERT policy (project id is encoded in the object path).

Because `has_project_access` now includes the admin/CPA bypass, this doesn't restrict staff — only random users uploading into projects they don't belong to.

### 4. Resolve the current VampireFreaks incident

Recommended: **re-upload the chart of accounts as owner `bd55164a`**. The qbToJson converter is already fixed and yields 141 accounts on this file. No `project_shares` row is created for `1cc25ae2` unless you confirm they should be a collaborator.

### Verification

- `SELECT has_project_access('<admin-user-id>', '<any-project-id>')` → `true`.
- `SELECT has_project_access('<cpa-user-id>', '<any-project-id>')` → `true`.
- `SELECT has_project_access('<email-shared-user-id>', '<project-id>')` server-side → `true` (previously `false`).
- Insert into `documents` as an unrelated user → RLS denial.
- Re-run `qbToJson`/`process-chart-of-accounts` as owner on VampireFreaks → 141 accounts persisted.
- Run `supabase--linter` after the migration to confirm no new warnings.

### Not doing without confirmation

- Sharing the project with `1cc25ae2`.
- Deleting the orphan CSV row.
- Scoping CPA access to only claimed projects (say the word and I'll switch to per-claim scoping instead of blanket CPA access).
