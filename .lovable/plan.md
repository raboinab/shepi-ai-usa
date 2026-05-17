## Use Vercel AI Gateway with ZDR (revised plan)

You're right — this is a much better path than rewriting 12 functions to swap SDKs.

### What Vercel AI Gateway ZDR gives us

- Single OpenAI-compatible endpoint that routes to OpenAI, Anthropic, Google, etc.
- ZDR mode restricts routing to provider deployments that have signed zero-data-retention agreements with Vercel.
- We keep the existing `fetch` + chat-completions code shape; we only change:
  - base URL → `https://ai-gateway.vercel.sh/v1`
  - auth header → `Authorization: Bearer $VERCEL_AI_GATEWAY_KEY`
  - add `?zdr=1` (or the equivalent header/param per their docs) to enforce ZDR routing
  - model strings → namespaced (`anthropic/claude-sonnet-4.5`, `openai/gpt-4o`, `openai/text-embedding-3-small`)
- Embeddings, vision, and chat completions all go through the same endpoint, so `embed-project-data` and `process-reclassification-job` (which uses both) are covered too.

### What this changes vs the previous plan

- **No SDK rewrite.** No Anthropic-specific payload shape, no converting `image_url` → `image/base64` blocks, no swapping JSON-mode for tool-use blocks. Vercel translates that for us when the model is OpenAI-compatible, and we can keep the OpenAI Chat Completions wire format for Anthropic models too via the gateway.
- **Embeddings stay safe.** Project-data embeddings (which DO contain financial data — confirmed against `embed-project-data/index.ts`) get ZDR coverage without migrating off the OpenAI embedding model.
- **One vendor row on the Subprocessors page** instead of three: Vercel (AI Gateway, ZDR). Upstream providers become sub-subprocessors of Vercel under their ZDR contract, which is how Vercel documents it.

### Scope of the change

1. Add secret `VERCEL_AI_GATEWAY_KEY` (you generate it in the Vercel dashboard).
2. New shared helper `supabase/functions/_shared/aiGateway.ts` exporting:
   - `chatCompletion({ model, messages, ...openaiParams })`
   - `embeddings({ model, input })`
   - Both hit the gateway, pin ZDR, and return the OpenAI-shaped response.
3. Find/replace `https://api.openai.com/v1/chat/completions` and `https://api.openai.com/v1/embeddings` across all functions, swap to the helper. Keep model strings the same initially (OpenAI through gateway) so we ship the ZDR fix in one PR without changing model behavior.
4. Optional follow-up PR: switch document-parsing functions to `anthropic/claude-sonnet-4.5` (or keep on OpenAI — your call, model quality is the only question once ZDR is solved).
5. Re-point `generate-narrative` and `classify-transfers/llmClassifier.ts` from direct Anthropic API → gateway too, so we have one auth path and one subprocessor.

### Functions touched

All 12 you listed + the 3 RAG functions (`embed-project-data`, `embed-qoe-book`, `embed-rag-chunks`) + the 2 existing Claude functions (`generate-narrative`, `classify-transfers`). ~17 functions, mechanical search/replace.

### Subprocessors page result

- Remove: Google AI (Gemini), OpenAI, (later) drop direct Anthropic listing.
- Add: **Vercel (AI Gateway, Zero Data Retention)** — "AI model routing for document parsing, analysis, narrative generation, and embeddings. Operates under a ZDR agreement; upstream providers (OpenAI, Anthropic) process requests under sub-processor terms with no data retention."

### Open questions

1. Confirm you want to centralize on Vercel AI Gateway (vs Lovable AI Gateway, which is the project's default — but Lovable AI Gateway's ZDR status with each upstream provider is unverified for this use case).
2. Do you want to keep the same models (lowest-risk migration: just adds ZDR), or take this opportunity to move document parsing to Claude Sonnet 4.5?
3. Pricing: gateway adds a small markup over provider rates per their docs — fine?

### Cost / risk

- Low engineering risk: no payload-shape changes if we keep OpenAI models, just URL + auth.
- One new vendor relationship (Vercel) — they become the only AI subprocessor.
- Single point of failure: gateway downtime = all AI features down. Mitigation: each helper call falls back to direct provider on 5xx. Optional, can add later.
