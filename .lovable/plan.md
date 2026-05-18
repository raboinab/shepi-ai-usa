# Test coverage plan for shepi

Goal: stand up a real testing baseline (currently zero tests) and cover the highest-risk paths first — Client↔CPA messaging, money/calculation logic, RLS/auth boundaries, and deal export integrity.

## Phase 1 — Test infrastructure (one-time setup)

1. Add Vitest + React Testing Library + jsdom to devDependencies.
2. Create `vitest.config.ts`, `src/test/setup.ts`, and add `"vitest/globals"` to `tsconfig.app.json`.
3. Add npm scripts: `test`, `test:watch`, `test:e2e`.
4. Verify Playwright config (already installed) and create `e2e/` folder.

## Phase 2 — Messaging (the thing you actually asked about)

**Unit / component (Vitest, fast, runs every push):**
- `src/components/EngagementChat.test.tsx`
  - Renders empty state when no messages.
  - Sends a message → calls `supabase.from('chat_messages').insert` with `context_type: 'engagement'`, role `user`, correct `project_id` and `user_id`.
  - Optimistic message appears immediately; rolled back on insert error.
  - Incoming realtime INSERT for the same project appends; mismatched `context_type` is ignored; duplicate id is deduped.
  - Self vs other label/styling based on `user_id === currentUserId`.
  - Enter sends, Shift+Enter newlines.
  - Supabase client mocked via `vi.mock('@/integrations/supabase/client')`.

**E2E (Playwright, one happy-path round trip):**
- `e2e/engagement-chat.spec.ts`
  - Seed (or reuse) two test accounts: a Client owner of a project and a matched CPA.
  - Two browser contexts in parallel. Client opens engagement → sends "hello from client". CPA on `/cpa/engagements/:id` sees it via realtime within 5s. CPA replies; Client sees the reply. Asserts message order, sender labels, persistence on reload.

**RLS guardrail (Deno test against edge/db):**
- `supabase/functions/_shared/chat_rls_test.ts` — using anon key + two seeded JWTs, assert:
  - Client can SELECT/INSERT on their own project's `chat_messages` with `context_type='engagement'`.
  - Matched CPA can SELECT/INSERT on the same project.
  - An unrelated authenticated user gets zero rows on SELECT and a policy error on INSERT.

## Phase 3 — Other critical paths

Prioritized by blast radius if broken:

1. **Pricing & checkout math** — `src/lib/pricing.ts` unit tests (every tier, every add-on, Network Fee split, refundability boundary from Terms §10.6).
2. **QoE metric calculations** — `src/lib/qoeMetrics.ts`, `src/lib/adjustmentSignUtils.ts`, `src/lib/derivePriorBalances.ts`, `src/lib/nwcDataUtils.ts`. Pure functions, golden-value tests with fixed inputs.
3. **Workbook + PDF builders** — smoke tests for `buildPDFReport` and `TAB_GRID_BUILDERS` using `src/lib/mockDeal.ts` so the demo export regen scripts can't silently break.
4. **Auth / role gates** — `useAdminCheck`, `useCpaCheck`, `useTosAcceptance` hooks (mocked Supabase, assert deny-by-default).
5. **Edge functions (Deno tests)** highest risk first:
   - `create-checkout` — correct line items, metadata, refund path.
   - `cpa-auto-accept` / `cpa-sla-check` — matching + timeout behavior.
   - `check-subscription`, `customer-portal` — entitlement parsing.
   - `export-pdf`, `export-workbook-xlsx` — render without crashing on mock deal.
   - `insights-chat`, `generate-narrative` — auth required, returns 401 without JWT.
6. **SEO regression test** — a tiny Vitest spec that imports every `src/pages/guides/*.tsx`, mounts each, and asserts `seoTitle` ends with `| Shepi` and is ≤ 60 chars, and `seoDescription` is 80–160 chars. Prevents another mid-word truncation incident.

## Phase 4 — CI hook

- Add a single `test` script that runs Vitest in CI mode + Deno tests for edge functions. Playwright stays opt-in via `test:e2e` (needs seeded test users + env).

## Technical details

- Vitest deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.
- Supabase mocking pattern: `vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn(...), auth: { getUser: vi.fn(...) }, channel: vi.fn(...), removeChannel: vi.fn() } }))`. A small `src/test/supabaseMock.ts` helper to keep tests terse.
- Playwright needs two env vars for seeded users: `TEST_CLIENT_EMAIL/PASSWORD`, `TEST_CPA_EMAIL/PASSWORD`, plus `TEST_ENGAGEMENT_PROJECT_ID`. Documented in README.
- Deno tests load `.env` via `https://deno.land/std/dotenv/load.ts` (per project convention) and run with `--allow-net --allow-env`.

## What I'll build first if you approve

Phase 1 + Phase 2 in one pass (infra + full messaging coverage: component tests, E2E spec, RLS test). Then we iterate on Phase 3 sections you care most about — I'd suggest pricing math next since that's where a silent bug costs you real money.
