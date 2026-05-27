## Goal

Give Alice (Shepi's autonomous CEO operating system) a read-only MCP server she can call to inspect everything the admin portal shows — users, projects, subscriptions, contacts, CPA pipeline, demo views, promo state, diagnostics — so she can reason about the business in real time.

## Architecture

Single Supabase edge function `alice-mcp` implementing the MCP Streamable HTTP transport via `mcp-lite` + Hono.

```text
Alice (LLM agent) ──HTTPS──▶ /functions/v1/alice-mcp
                              │  header: Authorization: Bearer <ALICE_API_KEY>
                              ▼
                         alice-mcp (Deno)
                          ├─ auth: constant-time compare to ALICE_API_KEY secret
                          ├─ McpServer with read-only tools
                          └─ Supabase client (service role) — read queries only
```

- `verify_jwt = false` in `supabase/config.toml` (auth is the bearer key, not a Supabase JWT).
- Service role key is used server-side only, never returned to the caller.
- All handlers are SELECT/count queries — no inserts, updates, deletes, or RPCs that mutate.

## Auth

- New secret `ALICE_API_KEY` (added via `add_secret` — Alice gets the value out-of-band).
- Edge function rejects any request missing `Authorization: Bearer <ALICE_API_KEY>` with 401.
- Constant-time comparison to prevent timing attacks.

## MCP tools exposed

Mirrors the admin portal pages, all read-only:

| Tool | Returns |
|---|---|
| `get_overview_stats` | Totals: users, projects, active subscriptions, contact submissions, current early-adopter spots |
| `list_users` | Paginated list from `get_user_engagement_stats()` (email, name, signup date, last sign-in, project/doc counts, QB connected, onboarding done) |
| `get_user_detail` | One user by id: profile + their projects + subscription |
| `list_projects` | Paginated projects with owner, tier, phase, status, industry, created_at |
| `get_project_detail` | One project: wizard state, document counts, processed_data summary, CPA claim if any |
| `list_subscriptions` | Active/past subscriptions with plan, status, stripe ids, user email |
| `list_contact_submissions` | Contact form entries, newest first |
| `list_cpa_applications` | Pending + reviewed CPA onboarding apps |
| `list_dfy_engagements` | DFY projects with claim status and assigned CPA |
| `get_demo_views` | Last 30/60/90 days of demo page views, grouped by page, with unique users |
| `get_promo_config` | Current early-adopter spot count and any other promo keys |
| `get_diagnostics` | Edge function health snapshot (latest rows from diagnostics tables already surfaced in `AdminDiagnostics`) |
| `run_sql_read` | (optional, gated) Executes a whitelisted SELECT against a small set of approved views. Off by default — only enable if Alice needs ad-hoc shape we didn't predict. |

Each tool accepts a small Zod-validated input schema (pagination, filters, date ranges) and returns JSON.

## Audit

Edge function logs only (per Alice's choice). Every tool call logs:
`{ ts, tool, params (redacted), result_rows, latency_ms }`
Viewable via Supabase function logs.

## Files

- `supabase/functions/alice-mcp/index.ts` — Hono + mcp-lite server, tool definitions, auth middleware, Supabase service-role client.
- `supabase/config.toml` — add `[functions.alice-mcp] verify_jwt = false`.
- Secret: `ALICE_API_KEY` (added via secrets tool).
- No database migrations. No frontend changes.

## How Alice connects

After deploy, Alice's MCP client points at:
```
https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/alice-mcp
Header: Authorization: Bearer <ALICE_API_KEY>
```
She'll see all tools via the standard MCP `tools/list` call.

## Out of scope (deliberately)

- No writes (per "Read-only" scope choice). When Alice needs to flip promo spots or approve a CPA, we'll add a separate write-capable tool with its own confirmation pattern.
- No DB audit table (per "edge function logs only").
- No multi-tenant scoping — single key, single agent.

## Open question before build

Want `run_sql_read` included from day one (Alice gets escape-hatch flexibility but more surface area), or hold it back and only add named tools as gaps surface?
