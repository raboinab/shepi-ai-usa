
## Plan: Fix build errors

**1. Stripe imports** (`check-subscription`, `create-checkout`, `customer-portal`, `stripe-webhook`)
Replace `import Stripe from "npm:stripe@18.5.0"` with `import Stripe from "https://esm.sh/stripe@18.5.0?target=deno"` and same treatment for `npm:@supabase/supabase-js@2.87.1` → `https://esm.sh/@supabase/supabase-js@2.87.1`. This matches the esm.sh pattern already used elsewhere (e.g. `ai-backend-proxy`) and works in Deno without the npm: specifier resolver.

**2. `analyze-transactions` bugs** (`supabase/functions/analyze-transactions/index.ts`)
- Line 1076: `BATCH_SIZE` → `GL_BATCH_SIZE`
- Line 1108: `flag.flag_type` / `flag.is_reclassification` → `result.flag_type` / `result.is_reclassification` (the loop variable is `result`, not `flag`)
- Add optional `classification_context?: object` field to the `FlaggedTransaction` interface (line 60-75) so the property is allowed.

**3. `ai-backend-proxy` type guard** (line 104)
Change `err.message` to a guarded read:
```ts
const message = err instanceof Error ? err.message : "Proxy error";
```

**4. `breakdownGridBuilder` type issue**
The `ec` constant is typed as `{ acctNo: string; fsLine: string; sub1: string } | {}`, which doesn't satisfy `Record<string, string | number | null>`. Fix by giving it an explicit type:
```ts
const ec: Record<string, string> = showDetail ? { acctNo: "", fsLine: "", sub1: "" } : {};
```

**5. Exclude `.claude/worktrees` from type checking**
Add `"exclude": [".claude", "supabase/functions"]` to `tsconfig.app.json`. The `supabase/functions/` folder is Deno code that shouldn't be checked by the Vite/Node tsconfig either — it has its own runtime. (The functions still get type-checked when deployed via the Supabase tooling.)

### Files touched
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/customer-portal/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/analyze-transactions/index.ts`
- `supabase/functions/ai-backend-proxy/index.ts`
- `supabase/functions/_shared/workbook/breakdownGridBuilder.ts`
- `tsconfig.app.json`

No new dependencies. No behavior changes — these are pure compile fixes.
