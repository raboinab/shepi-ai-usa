# Fix stale insurance reference in Provider Agreement §3

## Problem

`src/components/cpa/ProviderAgreementContent.tsx` line 43 still says:

> "shepi provides the software, matching, billing, operational infrastructure, **and professional-liability backstop described in §16**. shepi is not a CPA firm and does not provide accountancy services."

This contradicts the cleaned §16, which now says each party carries its own insurance and shepi maintains no umbrella/backstop. It also violates the core memory rule: marketing/legal docs must not imply shepi carries E&O, umbrella, or any insurance.

## Change

Edit one line in `src/components/cpa/ProviderAgreementContent.tsx`:

**From:**
> shepi provides the software, matching, billing, operational infrastructure, and professional-liability backstop described in §16. shepi is not a CPA firm and does not provide accountancy services.

**To:**
> shepi provides the software, matching, billing, and operational infrastructure that supports the engagement. shepi is not a CPA firm and does not provide accountancy services, and does not maintain professional-liability insurance covering Provider's work.

## Other legal surfaces — verified clean

- `src/pages/DPA.tsx` — no insurance language
- `src/pages/Subprocessors.tsx` — no insurance language
- `src/pages/ScopeOfWork.tsx` — only "GL coverage" (data scope, not insurance)
- `src/components/terms/TermsContent.tsx` §7/§10 — cleaned previous round, "own professional-liability coverage" wording is correct (refers to the Matched CPA's own coverage, not shepi's)
- `src/components/cpa/ProviderAgreementContent.tsx` §16 itself — already correct
- Termageddon-embedded pages (`Privacy`, `Cookies`, `EULA`) — out of scope per user, managed in Termageddon dashboard

## Out of scope

- No version bump for Provider Agreement — single-line internal-consistency fix to a clause already aligned with the live posture; not a material change in obligations. If you want a bump anyway, say so and I'll roll the Provider Agreement version.
- No DB changes, no Terms re-prompt, no marketing-page edits.

## Verification

After edit:
```
rg -in "backstop|backed by.*insur|shepi.*(umbrella|maintains.*insur|carries.*insur|professional-liability backstop)" src/
```
Should return zero hits (the `AccountantsCPA.tsx` "backed by comprehensive analysis" match is unrelated copy and stays).
