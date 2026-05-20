## Scope
Remove three things from the CPA flow entirely: LinkedIn URL, states served, and liability-insurance requirement. This is a product-level decision, so it propagates beyond the onboarding screen.

## Files to change

### 1. `src/pages/cpa/CpaOnboarding.tsx`
- Remove the **States served** card (entire section + `US_STATES` constant + `statesServed` state + the `states_served` field in the save patch and stub-create insert).
- Remove the **LinkedIn URL** input + `linkedin` state + `linkedin_url` in save patch.
- Remove **liability insurance** from `DOC_TYPES`, from the `Documents` card description ("Liability insurance certificate is required to claim engagements"), from the upload side-effect that sets `liability_covered`, and from the checklist.
- Update checklist to: Confirm contact info, Add at least one industry, Short professional bio, W-9 on file. (4 items → percentages recalc automatically.)

### 2. `src/components/cpa/CpaApplicationForm.tsx`
- Remove the **LinkedIn URL** field, its zod entry, default value, and the rendered `<Field>`.
- Keep `state_of_licensure` — that's the CPA's actual license state, different from "states served".

### 3. `src/pages/admin/AdminCpaApplications.tsx`
- Remove `linkedin_url` from the `CpaApplication` type and the `<Detail label="LinkedIn" …>` row.

### 4. Marketing pages
- `src/pages/ForCpas.tsx`: remove the FAQ entry about liability insurance, drop "proof of liability coverage" from the onboarding-steps copy, and remove the trailing "your own professional liability coverage" line.
- `src/pages/CpaPartners.tsx`: remove the "You carry your own professional liability (E&O) coverage…" bullet.

### 5. `src/components/cpa/ProviderAgreementContent.tsx`
- Audit and remove the liability-insurance / E&O clauses (will read the file during implementation; remove only the insurance-specific paragraphs, keep the rest of the agreement intact).

## Database — no schema changes
Leave the existing columns (`states_served`, `linkedin_url`, `liability_covered`, `liability_expires_at` on `cpa_profiles`; `linkedin_url` on `cpa_applications`) in place. They become dormant — no UI reads or writes them. This avoids data loss for the 4 existing CPAs and keeps the migration small. We can drop the columns later if you want a cleanup pass.

## Memory update
Project memory currently states: *"Marketing and legal docs MUST NOT claim shepi carries E&O… Each party carries its own."* That sentence assumes CPAs carry their own insurance. I'll soften it to: *"Marketing and legal docs MUST NOT claim shepi carries E&O, umbrella, cyber, or any other insurance, nor require CPAs to carry insurance. Revisit only when a policy is actually bound."*

## Verification
- Load `/cpa/onboarding` as Alex → no States, no LinkedIn, no liability mention; checklist has 4 items; saving works.
- Load `/cpa/apply` (public application) → no LinkedIn field; submit still succeeds.
- Load admin CPA applications → no LinkedIn row.
- Visit `/for-cpas` and `/cpa-partners` → no liability-insurance copy remaining (`rg -i "liability|E&O|insurance" src/pages` should come back clean for the CPA-facing pages).

## Out of scope (confirm if you want it)
- Dropping the DB columns.
- Touching CPA roles/permissions logic (`/cpa` queue, claim flow) — unaffected.
- Public `/scope` page wording about insurance — leaving alone unless you flag it.
