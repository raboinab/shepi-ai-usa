## Fix flagged_transactions visibility for shared project members

Replace the user-scoped RLS policies on `public.flagged_transactions` with project-access-scoped policies so any project member (owner or shared editor like Chris) can see and manage AI Discovery flags.

### Migration

```sql
-- SELECT: any project member can read
DROP POLICY IF EXISTS "Users can view their own flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Admins can view all flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Project members can view flagged transactions"
  ON public.flagged_transactions FOR SELECT TO authenticated
  USING (has_project_access(project_id) OR has_role(auth.uid(), 'admin'::app_role));

-- INSERT: project members can create, must stamp own user_id
DROP POLICY IF EXISTS "Users can create flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Project members can create flagged transactions"
  ON public.flagged_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND has_project_access(project_id));

-- UPDATE / DELETE: any project member can manage flags
DROP POLICY IF EXISTS "Users can update their own flagged transactions" ON public.flagged_transactions;
DROP POLICY IF EXISTS "Users can delete their own flagged transactions" ON public.flagged_transactions;
CREATE POLICY "Project members can update flagged transactions"
  ON public.flagged_transactions FOR UPDATE TO authenticated
  USING (has_project_access(project_id));
CREATE POLICY "Project members can delete flagged transactions"
  ON public.flagged_transactions FOR DELETE TO authenticated
  USING (has_project_access(project_id));
```

### Result

- Chris immediately sees the existing 19 flagged transactions on project `72089e37…`.
- Future AI Discovery runs by either user are visible to both.
- No code changes — RLS-only fix.
