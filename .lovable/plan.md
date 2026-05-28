# Admin CPA Roster

A new admin page at `/admin/cpas` that gives you a single place to see and manage every CPA on the platform — not just incoming applications.

## What you'll see

**List view** — table of all `cpa_profiles` rows with:
- Name, email, state · license #
- Status chips: ✅ License verified / ⚠️ Unverified · ✅ W-9 on file / ⚠️ Missing · ✅ Agreement signed / ⚠️ Missing · Active / Inactive
- Engagement count (claims) and "last active"
- Filter: All / Needs attention (anything missing or PENDING) / Active / Inactive
- A row clearly highlighted as "Needs attention" if `state_of_licensure = 'PENDING'`, `license_number = 'PENDING'`, no W-9, or no signed agreement — which will catch Chris immediately.

**Detail drawer** (click row) — three sections:

1. **Identity & License**
   - Editable: full_name, phone, state_of_licensure, license_number, years_experience, bio, industries
   - "Verify license" button → stamps `license_verified_at = now()`
   - "Deactivate / Reactivate" toggle (`active` flag)
   - Shows `onboarding_completed_at`, `created_at`

2. **Onboarding Documents** (from `cpa_onboarding_documents`)
   - List of every uploaded doc with type (W-9 etc.), filename, upload date, current status (pending/approved/rejected)
   - "Download" button → generates a signed URL from the private `cpa-onboarding` storage bucket
   - "Approve / Reject" buttons → updates `status`, `reviewer_user_id = auth.uid()`, `reviewed_at`
   - "Mark W-9 on file" toggle on the profile (`w9_on_file` flag) once W-9 doc is approved

3. **Provider Agreements** (from `dfy_provider_agreements`)
   - Chronological list: agreement_version, accepted_at, ip_address
   - Read-only — these are immutable consent records

## Navigation

Add "CPAs" item to `AdminSidebar.tsx` next to "CPA Applications". Add route `/admin/cpas` in `App.tsx`.

Also add a small **"View CPA profile →"** link on rows in `AdminCpaApplications.tsx` where `status = 'approved'`, deep-linking to that CPA's row in the new roster.

## Technical notes

- New page: `src/pages/admin/AdminCpaRoster.tsx`
- All queries scoped via admin role (existing `has_role(auth.uid(), 'admin')` policies already cover `cpa_profiles`, `cpa_onboarding_documents`, `dfy_provider_agreements`)
- Signed URLs for onboarding docs: `supabase.storage.from('cpa-onboarding').createSignedUrl(path, 60)` — admin-side only, never exposed to clients
- Edit mutations go through the table's existing admin RLS (no new policies needed)
- One small policy gap to fix: admins currently can't SELECT from `dfy_provider_agreements`. Add policy:
  ```sql
  CREATE POLICY "Admins view all provider agreements"
  ON public.dfy_provider_agreements FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));
  ```

## Out of scope (call out if you want them)

- Bulk actions (mass deactivate, mass invite)
- Editing/revoking signed agreements (compliance-sensitive — keep immutable)
- Background-check upload UI (the `background_check_status` field exists; can wire up later if you actually run BG checks)
- Performance / quality metrics per CPA (avg turnaround, client satisfaction) — separate dashboard

## What this immediately fixes

- Chris's "Licensed in PENDING" → you can open his profile, type in his real state + license #, click "Verify license", and the client-facing banner will read correctly within seconds.
- You'll see at a glance which other admin-granted CPAs (if any) have stub data.
