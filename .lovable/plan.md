

Plan — Switch from Lovable managed OAuth to Supabase Auth (direct), and fix React mismatch.

### What changed and why
The "missing OAuth secret" error comes from Lovable's managed OAuth broker — it expects either Lovable Cloud's managed Google credentials to be enabled or your own credentials configured in the Cloud auth settings. You've decided to skip that layer entirely and call Supabase Auth directly with your own Google OAuth client configured in the Supabase dashboard. Cleaner, fewer moving parts, and matches how the rest of the app already uses `supabase.auth.*`.

### Changes

**1. `src/pages/Auth.tsx` — replace `lovable.auth.signInWithOAuth` with `supabase.auth.signInWithOAuth`**
Two call sites (lines ~182 and ~204). Replace with:
```ts
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google", // or "apple"
  options: { redirectTo: `${window.location.origin}/auth/callback` },
});
```
Drop the `import { lovable } from "@/integrations/lovable/index"` line. `supabase` is already imported elsewhere in the file (or add the import).

**2. Verify `/auth/callback` route exists**
Supabase OAuth redirects back to the `redirectTo` URL with tokens in the hash. The existing `cleanupOAuthHash` util + the OAuth bootstrap in `main.tsx` already handle hash interception, so any route works as the redirect target. I'll double-check the route table in `App.tsx` has an `/auth/callback` (or just use `/auth` which definitely exists). Use `/auth` to keep it simple — the existing hash handler will set the session and the page can route the user onward.

**3. Leave `src/integrations/lovable/index.ts` alone**
It's auto-generated. Don't touch. Just stop importing from it. Apple sign-in goes through the same supabase.auth path.

**4. Action required from you (in Supabase dashboard):**
- Authentication → Providers → Google → enable + paste your Google OAuth Client ID + Secret
- Add `https://sqwohcvobfnymsbzlfqr.supabase.co/auth/v1/callback` as an Authorized redirect URI in Google Cloud Console (under your OAuth client's settings)
- Same for Apple if you want Apple sign-in to keep working

Without step 4, Google sign-in will fail with a different error ("provider not enabled") — but that's a Supabase config issue, not a code issue. Code change is independent.

**5. Fix React version mismatch (quietly)**
Runtime error reports `react@19.2.5` vs `react-dom@19.2.3`. Likely introduced by `vite-react-ssg` or `@unhead/react` pulling a newer react transitively. Pin both to the same version (whichever the project was on before — `19.2.3` is safer since react-dom is at that version). Update `package.json` to pin `react` to `^19.2.3` (or whatever was there pre-SSG-refactor). One-line fix.

### Files touched
- `src/pages/Auth.tsx` (swap 2 OAuth calls + drop import)
- `package.json` (align react version)

### Risk
Low. The existing OAuth-hash interception in `main.tsx` already supports tokens-in-hash flows from any provider — it doesn't care whether the broker was Lovable's or Supabase's. The only behavioral change is the `redirect_uri` round-trip: Supabase redirects to `https://<ref>.supabase.co/auth/v1/callback` first, then back to your app — adds ~100ms but no UX difference.

### Not touched
- SSG hosting blocker (still pending your decision: Lovable support ticket vs Vercel migration)
- Per-page meta tag flushing (still pending, deferred until hosting decided)
- `src/integrations/lovable/` (leave it; it's auto-generated and unused once imports removed)

