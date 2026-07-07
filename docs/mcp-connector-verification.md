# Shepi MCP Connector Verification Guide

End-to-end setup and test script for the two MCP servers Shepi exposes:

| Client   | Endpoint                                                                         | Server module                              |
| -------- | -------------------------------------------------------------------------------- | ------------------------------------------ |
| ChatGPT  | `https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/chatgpt-mcp`              | `supabase/functions/chatgpt-mcp` (widgets) |
| Claude   | `https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/mcp`                      | `src/lib/mcp` (Lovable SDK)                |

Both share the same Supabase OAuth 2.1 authorization server, so a user signs into Shepi once per client and both servers accept the same identity.

---

## 1. Prerequisites

1. A Shepi account signed in at <https://shepi.ai> with **at least one project** that has:
   - Wizard data populated (target company, periods, fiscal year end).
   - At least one uploaded document.
   - At least one adjustment proposal (any status).
2. Note the project's UUID from the URL: `https://shepi.ai/project/<PROJECT_ID>/...`.
3. ChatGPT: a plan that supports **Custom Connectors** (Business / Enterprise / Pro).
4. Claude: **Claude.ai** with Custom Connectors enabled (Pro / Team / Enterprise).

---

## 2. Connect ChatGPT

1. In ChatGPT, open **Settings → Connectors → Add custom connector**.
2. Name: `Shepi`. URL:
   ```
   https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/chatgpt-mcp
   ```
3. Click **Connect**. ChatGPT opens a browser tab to the Supabase authorize endpoint, which redirects to `https://shepi.ai/.lovable/oauth/consent?authorization_id=...`.
4. If not signed in, sign in — you'll return to the consent page. Click **Approve**.
5. You should land back in ChatGPT with the connector listed as **Connected** and tools enumerated.

**Expected tool list (10):** `echo`, `list_projects`, `get_project_summary`, `get_quality_of_earnings_summary`, `create_project`, `list_adjustments`, `update_adjustment_status`, `list_documents`, `get_export_data`, plus the `project-summary` widget resource.

## 3. Connect Claude

1. In Claude, open **Settings → Connectors → Add custom connector**.
2. Name: `Shepi`. URL:
   ```
   https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/mcp
   ```
3. Click **Connect** → same Supabase → shepi.ai consent flow → **Approve**.
4. Verify the connector shows **Connected**.

**Expected tool list (10):** same names as ChatGPT (Claude does not render the widget).

---

## 4. Per-tool verification prompts

Run each prompt in a fresh conversation in **both** ChatGPT and Claude. Substitute `<PROJECT_ID>`, `<ADJUSTMENT_ID>`, etc. as needed. After each prompt, ask the assistant to **show the raw tool call and result JSON** so you can verify the tool actually fired (both clients support this on request).

### 4.1 `echo` — connectivity smoke test

> Use the Shepi `echo` tool with the text "hello from verification" and show me the raw result.

**Pass:** result contains `hello from verification`.

### 4.2 `list_projects`

> Using Shepi, list my projects (limit 10). Show the raw JSON.

**Pass:** returns an array of project rows with `id`, `name`, `target_company`, `service_tier`. Confirm your test project appears.

### 4.3 `get_project_summary`

> Using Shepi, get the project summary for project `<PROJECT_ID>`. Show the raw JSON.

**Pass:** returns a single object with `current_phase`, `current_section`, `service_tier`, `fiscal_year_end`. In ChatGPT the **Project Summary widget** should render inline.

### 4.4 `get_quality_of_earnings_summary`

> Using Shepi, compute the Quality of Earnings summary for project `<PROJECT_ID>`. Show the raw JSON.

**Pass:** result includes numeric `revenue`, `grossProfit`, `netIncome`, `reportedEbitda`, `totalAdjustments`, `adjustedEbitda`, plus `scope: "LTM..."`. ChatGPT re-renders the widget with metrics.

### 4.5 `list_documents`

> Using Shepi, list documents for project `<PROJECT_ID>` (limit 50). Show the raw JSON.

**Pass:** array of documents with `name`, `category`, `processing_status`, `period_start`/`period_end`. Row count matches Shepi's in-app Documents tab.

### 4.6 `list_adjustments`

> Using Shepi, list adjustments for project `<PROJECT_ID>` with status `pending`. Show the raw JSON.

**Pass:** array filtered to pending only. Grab an `id` from the response for the next test — call it `<ADJUSTMENT_ID>`.

### 4.7 `get_adjustment_detail` *(Claude only — not exposed by ChatGPT server)*

> Using Shepi, get adjustment detail for adjustment `<ADJUSTMENT_ID>` on project `<PROJECT_ID>`. Show the raw JSON.

**Pass:** returns the full proposal with `ai_rationale`, `proposed_period_values`, and any linked evidence. Skip this test in ChatGPT.

### 4.8 `update_adjustment_status`

> Using Shepi, update adjustment `<ADJUSTMENT_ID>` on project `<PROJECT_ID>` to status `pending` with reviewer notes "verification test — no change". Show the raw JSON.

**Pass:** returns updated row with `reviewed_at` set. Re-run `list_adjustments` to confirm the note persisted. Use `pending` to avoid mutating real review state; if the row was already accepted/rejected, restore it manually afterward.

### 4.9 `get_export_data`

> Using Shepi, get the export data for project `<PROJECT_ID>`. Show the raw JSON.

**Pass:** returns `qoe_metrics`, `export_url` (`https://shepi.ai/project/<PROJECT_ID>/workbook`), and `wizard_data`. Confirm `qoe_metrics.adjustedEbitda` matches the value from step 4.4.

### 4.10 `create_project` — destructive, run last

> Using Shepi, create a new project named "MCP verification — DELETE ME" with target company "Verify Co", service tier `diy`. Show the raw JSON.

**Pass:** returns a new project row with `status: "draft"`. Delete it from the Shepi Projects page after both clients pass.

---

## 5. OAuth / transport sanity checks (optional, without a client)

Verify the servers respond correctly before opening ChatGPT/Claude:

```bash
# Unauthenticated MCP POST returns 401 with a WWW-Authenticate pointer.
curl -i -X POST \
  -H "Accept: application/json, text/event-stream" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}' \
  https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/chatgpt-mcp

# Protected-resource metadata is public.
curl -s https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/chatgpt-mcp/.well-known/oauth-protected-resource | jq
curl -s https://mdgmessqbfebrbvjtndz.supabase.co/functions/v1/mcp/.well-known/oauth-protected-resource | jq

# Supabase authorization server advertises DCR + PKCE.
curl -s https://mdgmessqbfebrbvjtndz.supabase.co/auth/v1/.well-known/oauth-authorization-server | jq
```

**Pass:** `401` with `WWW-Authenticate: Bearer resource_metadata=...`, the metadata document names `authorization_servers`, and the auth-server document lists a `registration_endpoint` (dynamic client registration).

---

## 6. Failure triage

| Symptom                                              | Likely cause                                            | Fix                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Consent screen lands on `/` instead of returning     | `next=` not preserved through the auth path             | Sign in through the consent URL directly, or check `src/pages/OAuthConsent.tsx` redirect chain   |
| ChatGPT "connector failed" during add                | Streamable HTTP headers or 406                          | Confirm curl 401 above returns proper `WWW-Authenticate`; redeploy `chatgpt-mcp`                 |
| Tool returns "Not authenticated" mid-conversation    | Token expired                                           | Disconnect and reconnect the connector                                                           |
| `list_documents`/`get_export_data` missing in ChatGPT| `chatgpt-mcp` not redeployed after tool addition        | `supabase--deploy_edge_functions chatgpt-mcp`                                                    |
| Row missing in results but visible in-app            | RLS scoped to a different user (shared project?)        | Confirm the signed-in identity owns or is shared on the project                                  |
| Widget never renders in ChatGPT                      | Model didn't request the resource                       | Re-run 4.3 and ask ChatGPT explicitly to "show the project-summary widget"                       |

---

## 7. Sign-off checklist

- [ ] ChatGPT connector connected, 10 tools listed
- [ ] Claude connector connected, 10 tools listed
- [ ] Steps 4.1 – 4.10 pass in ChatGPT (skip 4.7)
- [ ] Steps 4.1 – 4.10 pass in Claude
- [ ] `create_project` test project deleted
- [ ] Adjustment status restored if changed
