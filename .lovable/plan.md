## Goal

Standardize every chat / extraction / reasoning call across edge functions onto Anthropic Claude (routed through Vercel AI Gateway under ZDR), so the stack matches the "Anthropic for everything" intent. Embeddings stay on OpenAI (Anthropic has no embedding model), and the ZDR probe stays on `openai/gpt-4o-mini` (known-good ZDR canary).

## Model mapping

| Current | New |
|---|---|
| `openai/gpt-4o` (heavy extraction, vision) | `anthropic/claude-sonnet-4` |
| `openai/gpt-4o-mini` (cheap classify / suggest) | `anthropic/claude-haiku-4` |
| `google/gemini-2.5-pro` (payroll, just-changed) | `anthropic/claude-sonnet-4` |
| `anthropic/claude-sonnet-4` / `claude-sonnet-4-6` / `claude-opus-4-7` | leave as-is |
| `openai/text-embedding-3-small` | **keep** (Anthropic has no embeddings) |
| ZDR probe `openai/gpt-4o-mini` in `_shared/zdrGuard.ts` | **keep** (canary) |

## Files to edit

Swap the `model:` string only — keep prompts, tools, temperature, max_tokens, `aiFetch` + ZDR guard untouched.

**gpt-4o → claude-sonnet-4**
- `supabase/functions/validate-financial-statement/index.ts`
- `supabase/functions/validate-adjustment-proof/index.ts`
- `supabase/functions/process-debt-schedule/index.ts` *(note: this one still uses Lovable AI Gateway + `LOVABLE_API_KEY`, not Vercel — see "Open question" below)*
- `supabase/functions/process-inventory-report/index.ts`
- `supabase/functions/extract-document-text/index.ts`
- `supabase/functions/parse-cim/index.ts`
- `supabase/functions/parse-tax-return/index.ts`
- `supabase/functions/process-lease-agreement/index.ts`
- `supabase/functions/process-supporting-document/index.ts`
- `supabase/functions/process-material-contract/index.ts`
- `supabase/functions/process-fixed-assets/index.ts`

**gpt-4o-mini → claude-haiku-4**
- `supabase/functions/validate-document-type/index.ts` (2 call sites)
- `supabase/functions/analyze-wip/index.ts`
- `supabase/functions/suggest-wip-account/index.ts`
- `supabase/functions/process-reclassification-job/index.ts` (2 chat call sites; leave embeddings line alone)

**gemini-2.5-pro → claude-sonnet-4**
- `supabase/functions/process-payroll-document/index.ts` (the original payroll fix)

**Leave alone**
- `_shared/zdrGuard.ts` (ZDR canary probe)
- `embed-rag-chunks`, `embed-project-data`, `embed-qoe-book`, `insights-chat` embedding call, `process-reclassification-job` embedding call — all embeddings stay on OpenAI
- `classify-transfers`, `insights-chat` chat models — already Anthropic

## Risks / things to verify after swap

1. **Vision payloads.** Many of the extractors send `{ type: "image_url", image_url: { url: fileBase64 } }`. Vercel AI Gateway normalizes this to Anthropic's `image` block format, but PDFs-as-base64 sometimes need `application/pdf` data URLs vs PNG. Smoke-test payroll + one PDF extractor (debt schedule or tax return) after deploy.
2. **Tool-calling.** `suggest-wip-account` uses OpenAI-style `tools` + `tool_choice: { type: "function", function: { name } }`. Claude supports this through the gateway; format is compatible. Verify the response still has `choices[0].message.tool_calls[0]`.
3. **max_tokens.** Claude Sonnet 4 caps output at 64k; current functions use 4k–8k, so no change needed.
4. **`process-debt-schedule`** is the only file calling `ai.gateway.lovable.dev` with `LOVABLE_API_KEY` instead of Vercel + ZDR. Swapping just the model name there will route through Lovable's gateway (not Vercel/ZDR). Probably wants to be migrated to `aiFetch` + Vercel too, but that's a separate change from "standardize on Anthropic."

## Open question (need your call before I touch code)

**`process-debt-schedule/index.ts`** — do you want me to:
- (a) just swap the model string and leave it on Lovable AI Gateway, or
- (b) migrate it to Vercel AI Gateway + `aiFetch` + ZDR like the other extractors, then swap to Claude?

Option (b) is the consistent answer if the goal is "everything on Anthropic via Vercel under ZDR."

## Out of scope

- No changes to embeddings, prompts, RLS, or client code.
- No new secrets — Anthropic is reached through the existing `VERCEL_AI_GATEWAY_KEY`.
