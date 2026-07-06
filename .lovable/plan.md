Build a v1 MCP server for Shepi that exposes read-only, create/modify, and export operations while respecting the existing auth model and the "no CPA attestation" constraint.

## 1. Add authentication to the MCP server
- Add `auth: auth.oauth.issuer(...)` to `src/lib/mcp/index.ts` using `import.meta.env.VITE_SUPABASE_PROJECT_ID`.
- This ensures tools run as the authenticated user; Supabase RLS enforces access.
- Do not add a separate shared API key model.

## 2. Tool inventory (v1)
Read-only tools:
- `list_projects` — list user's projects (name, status, tier, target_company, updated_at).
- `get_project_summary` — read a single project's metadata and current phase/section.
- `list_documents` — list documents for a project with status and category.
- `list_adjustments` — list adjustment_proposals for a project (category, amount, status).
- `get_adjustment_detail` — read one adjustment with rationale and evidence summary.
- `get_quality_of_earnings_summary` — return a structured summary of adjusted EBITDA and key add-backs for a project.

Create/modify tools:
- `create_project` — create a new project with minimal required fields.
- `create_adjustment` — insert an adjustment_proposal for a project.
- `update_adjustment_status` — mark an adjustment as `pending`, `accepted`, or `rejected`.

Export tools:
- `export_pdf_report` — generate and return a signed PDF report URL for a project.
- `export_excel_workbook` — generate and return a signed XLSX workbook URL.

## 3. Implementation details
- Store each tool in `src/lib/mcp/tools/<tool-name>.ts` as a default `defineTool` export.
- Use `ToolContext` to get the user token and forward it to Supabase via `createClient` with `Authorization: Bearer <token>`.
- Keep all tool handlers import-safe; read env only inside handlers.
- Reuse existing app helpers (e.g., PDF/XLSX builders, project summary logic) by extracting small server-safe functions rather than duplicating logic.
- Add `needsApproval` annotations to create/modify/export tools.

## 4. Security and compliance
- Never return raw tokens or other users' data.
- Validate `project_id` belongs to the calling user (via RLS and an explicit ownership check in each tool).
- Avoid any tool that issues an audit opinion, attestation, or CPA report; keep language as "summary" / "review" / "seller-prepared package" consistent with project memory.
- Cap result payloads to avoid token overload in the MCP client.

## 5. Monetization positioning
- Keep the MCP server available to paid subscribers only (DIY and DFY tiers; free users get the echo tool only or a clear upgrade message).
- Export tools count toward existing export credits / DFY review fees already in the app.
- Do not introduce a separate MCP billing model in v1.

## 6. Validation and deployment
- After editing, run `app_mcp_server--extract_mcp_manifest` to confirm the manifest lists all 10 tools.
- Deploy the `mcp` edge function.
- Test the echo and `list_projects` tools against the deployed endpoint.

## 7. Files to touch
- `src/lib/mcp/index.ts` — add auth and import all tools.
- `src/lib/mcp/tools/*.ts` — one file per tool.
- Possibly refactor existing summary/export helpers into server-safe shared modules.
- No changes to the frontend, marketing copy, or payment logic.
