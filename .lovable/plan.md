

## What I found

You're moving off Lovable Cloud, but the codebase still has a few Lovable-Cloud-specific pieces. Good news: **email is mostly already independent** — the contact form, admin notifications, and engagement nudges all use **Resend directly**, not Lovable's email infrastructure. There are only a couple of real Lovable-Cloud dependencies left.

---

## Concerns ranked by severity

### 🔴 1. `auth-email-hook` is fully dependent on Lovable Cloud
File: `supabase/functions/auth-email-hook/index.ts`
- Imports `npm:@lovable.dev/email-js` and `npm:@lovable.dev/webhooks-js`
- Reads `LOVABLE_API_KEY` and verifies signed webhooks from Lovable's auth-email pipeline
- Sends via `sendLovableEmail()` to a Lovable-provided callback URL

When you leave Lovable Cloud, this function stops working. Auth emails (signup confirm, password reset, magic link, invite, email change, reauthentication) **will silently fail to send**.

**Fix:** Rewrite this function to be a standard Supabase Auth email hook that renders the same React Email templates and sends via **Resend** (you already have `RESEND_API_KEY` set up). Templates in `supabase/functions/_shared/email-templates/` can be reused as-is.

### 🔴 2. `src/integrations/lovable/index.ts` — Lovable Cloud OAuth wrapper
- Imports `@lovable.dev/cloud-auth-js`
- Wraps Google/Apple OAuth through Lovable's auth bridge

`src/pages/Auth.tsx` already calls `supabase.auth.signInWithOAuth()` directly for Google (line 181), so the `lovable` wrapper may not even be in active use. We should:
- Verify nothing imports `@/integrations/lovable`
- If unused → delete the file and remove the npm package
- If used → swap call sites to the direct `supabase.auth.signInWithOAuth()` pattern

### 🟡 3. `parse-tax-return` references undefined `LOVABLE_API_KEY`
File: `supabase/functions/parse-tax-return/index.ts` line 661 checks `LOVABLE_API_KEY` but that constant is never declared at the top of the file (the search found no `const LOVABLE_API_KEY = ...`). This is either dead code from an older AI-gateway path, or a real bug that fails at runtime. Either way: replace with the `OPENAI_API_KEY` it already declares on line 657, or remove the check.

### 🟢 4. Resend-based emails — already portable, no action needed
These three already use Resend directly with `RESEND_API_KEY`. They will keep working as long as that secret stays set on the new Supabase project:
- `submit-contact` — contact form notifications
- `notify-admin` — admin alerts + welcome emails
- `send-engagement-email` — day-3/7/14 user nudges

Just make sure to copy `RESEND_API_KEY` into the new project's edge function secrets.

### 🟢 5. Other things you might worry about — but are fine
- **Lovable AI gateway usage:** Searched the codebase, no functions use `ai.gateway.lovable.dev`. AI calls go through OpenAI directly (`OPENAI_API_KEY`).
- **Edge function deployment:** All 70+ functions are plain Deno + Supabase. Deploy with `supabase functions deploy` — no Lovable-specific tooling needed.
- **Migration scripts:** `migrate-push-*` and `dump-*` functions you already built are designed exactly for this kind of move.

---

## Recommended order of operations

1. **Rewrite `auth-email-hook`** to use Resend + React Email rendering (keep the existing templates). Configure it as a Supabase Auth hook on the new project.
2. **Audit `src/integrations/lovable/index.ts`** — find usages, replace or delete, drop the `@lovable.dev/cloud-auth-js` package.
3. **Fix the `LOVABLE_API_KEY` reference in `parse-tax-return`**.
4. **Copy secrets** to the new Supabase project: `RESEND_API_KEY`, `OPENAI_API_KEY`, Stripe keys, QuickBooks keys, etc.
5. **Verify** by triggering: signup confirmation, password reset, contact form, admin notification.

---

## Files I'd touch

- `supabase/functions/auth-email-hook/index.ts` — full rewrite (Resend + React Email)
- `supabase/functions/parse-tax-return/index.ts` — fix the undefined env-var check
- `src/integrations/lovable/index.ts` — likely delete
- `package.json` — drop `@lovable.dev/cloud-auth-js` (and possibly `@lovable.dev/email-js`, `@lovable.dev/webhooks-js` if no longer needed; the rewritten hook won't need them)
- Possibly `src/pages/Auth.tsx` if it actually imports the lovable wrapper anywhere

No DB schema changes. No data migration concerns. The breakage surface is small and localized to auth emails + an unused-looking OAuth wrapper.

