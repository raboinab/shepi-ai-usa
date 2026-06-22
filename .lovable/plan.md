## Fix: `check-subscription` post-response microtask warning

### Cause

The function imports Stripe via `https://esm.sh/stripe@18.5.0?target=deno`. The `?target=deno` build pulls in `deno.land/std@0.177.1/node/*` polyfills, whose `_next_tick` shim calls `Deno.core.runMicrotasks()` — an API that edge-runtime no longer supports. Stripe's HTTP client schedules a microtask after the response is sent, which fires the polyfill and produces the `UncaughtException` line in logs. The response has already been returned by then, so users see no impact — but it spams the log stream.

The same pattern exists for the legacy `https://esm.sh/@supabase/supabase-js@2.87.1` import, which works today but is the other place edge-runtime can drift.

### Fix

In `supabase/functions/check-subscription/index.ts`, swap the brittle esm.sh imports for native `npm:` specifiers that the edge runtime resolves directly with no node polyfill shim:

- `import Stripe from "npm:stripe@18.5.0";`
- `import { createClient } from "npm:@supabase/supabase-js@2.87.1";`
- Replace `serve` from `deno.land/std/http/server.ts` with the built-in `Deno.serve(...)` (also avoids dragging in std).

No behavior changes. Same env vars, same response shape, same caching, same logic.

### What I will NOT change

- No logic, no caching, no auth, no Stripe call shape.
- No other edge functions (we'll deal with esm.sh drift elsewhere only if it actually fires).
- No frontend changes.

### Verification

- Deploy is automatic.
- `curl` the function via `supabase--curl_edge_functions` as the logged-in user and confirm `{ paidProjects, projectCredits, hasActiveSubscription, activeProjectCount }` still comes back.
- Tail `check-subscription` logs and confirm no new `UncaughtException` / `Deno.core.runMicrotasks` line appears after the call.

Tiny diff, one file, pre-deal safe.