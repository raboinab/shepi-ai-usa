
# Publish Shepi MCP for Public Use

Both MCP endpoints are already live and world-reachable on Supabase:

- ChatGPT: `https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/chatgpt-mcp`
- Claude:  `https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/mcp`

Anyone with a Shepi account can already add them today via ChatGPT/Claude "Add custom connector". Access to *data* is per-user via Supabase OAuth (RLS-scoped) — that stays. "Publish for public" therefore means: make the connectors **discoverable and one-click connectable** from the marketing site and AI-agent directories, not "make data public".

## What this plan does

1. **Surface the URLs prominently on shepi.ai** so end users can find and copy them.
2. **Publish machine-readable discovery files** so AI agents and connector catalogs can auto-detect Shepi as an MCP provider.
3. **Verify OAuth is production-ready** (allow-list, consent copy).
4. **Ship the current build** so all of the above is live at shepi.ai.

## Steps

### 1. Marketing surface

- `src/pages/Connect.tsx` — already shows both URLs; add "Add to ChatGPT" and "Add to Claude" one-click deep links (`https://chat.openai.com/connectors/new?url=...`, `https://claude.ai/connectors/new?url=...`) beside each Copy button.
- `src/pages/ForAiAgents.tsx` — add a "Connect via MCP" section that lists both URLs, the 10 exported tools, and links to `docs/mcp-connector-verification.md`.
- Add a `/mcp` route (or anchor on `/connect`) with SEO metadata: title "Connect Shepi to ChatGPT & Claude", description explaining MCP.
- Add the two URLs to `public/sitemap.xml` (as page URLs) and mention them in `public/llms.txt`.

### 2. Discovery / well-known files

- `public/mcp.json` — extend to advertise both endpoints, tool names, and OAuth issuer.
- `public/.well-known/ai-plugin.json` — add `mcp` block pointing at the two endpoints.
- `public/.well-known/agent.json` — same.
- `public/openapi.json` — add short note referencing MCP endpoints.
- Keep the `.well-known/oauth-protected-resource` documents served by the edge functions untouched (they are already correct).

### 3. OAuth production readiness

- Confirm the Supabase Auth redirect allow-list includes `https://shepi.ai/.lovable/oauth/consent` and `https://www.shepi.ai/.lovable/oauth/consent` — required so ChatGPT/Claude's authorize round-trip returns cleanly. (No code change if already present; flag to user if not.)
- Confirm `OAuthConsent.tsx` copy reads well for third-party clients ("Connect ChatGPT to your Shepi account"). Tighten wording if needed.
- No change to token scopes or RLS — public discoverability does not change data isolation.

### 4. Verification

- Re-run the smoke tests in `docs/mcp-connector-verification.md` §5 against production URLs.
- Add one deep-link test: opening the "Add to ChatGPT" button from `/connect` while signed out sends the user through sign-in → consent → connected without landing on `/`.

### 5. Publish

- Call `preview_ui--publish` to push the marketing/discovery changes to `https://shepi.ai`.
- Edge functions (`mcp`, `chatgpt-mcp`) are already deployed and require no republish.

## Technical details

- Both edge functions are `verify_jwt = false` in `supabase/config.toml` (mcp-js and the MCP SDK handle bearer verification themselves).
- OAuth authorization server: `https://mdgmessqbfebrbvjtndz.supabase.co/auth/v1` with DCR + PKCE enabled — ChatGPT/Claude self-register, no per-client secrets to distribute.
- No secrets, DB migrations, or new environment variables are needed.

## Out of scope

- Making project *data* public (would break RLS and privacy — do not do).
- Submitting to third-party MCP registries (OpenAI/Anthropic connector catalogs) — requires their approval flows; can be a follow-up once §1–§5 are live.
