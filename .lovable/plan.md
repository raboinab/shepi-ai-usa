# Fix CPA role toggle blocked by RLS

## Problem
`src/pages/admin/AdminUsers.tsx > toggleCpaRole` does a client-side `insert` / `delete` on `public.user_roles`. That table has RLS enabled but **only one policy**: a SELECT policy `auth.uid() = user_id`. There are no INSERT or DELETE policies for anyone (not even admins), so every toggle from the admin UI is rejected by RLS — that's the "new row violates row-level security policy" you saw.

Same gap will hit any future admin-driven role change (granting `admin`, removing `cpa`, etc.). The `promote-cpa-application` edge function isn't affected because it uses the service role and bypasses RLS.

## Fix
Add two policies to `public.user_roles`, scoped to admins via the existing `has_role()` security-definer function (which already avoids recursion):

```sql
CREATE POLICY "Admins can grant roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can revoke roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
```

The third policy is additive — admins currently can only see their own row, which means the `admin-cpa-roles` query in `AdminUsers.tsx` returns an incomplete set (you'd only see yourself as CPA). Adding it makes the toggle UI actually reflect reality.

No UPDATE policy — role rows are immutable; toggling = delete + insert.

## Why not service-role edge function instead
Pure RLS is simpler, no new function to deploy, and `has_role()` already gates the rest of the admin surface this way. Service-role would only be needed if we wanted non-admins to self-grant — we don't.

## Verification
1. Sign in as an admin, open Admin → Users, toggle CPA on a user → row appears in `user_roles`, toast shows success.
2. Toggle off → row deleted.
3. Sign in as a non-admin, attempt the same call → still rejected (policies require `has_role('admin')`).
4. The `admin-cpa-roles` query now returns all CPA assignments, not just the current admin's row.

## Files touched
- One Supabase migration adding the three policies above. No app code changes.
