// Runtime check that the Vercel AI Gateway key has Zero Data Retention enforced.
// Cached for the lifetime of the edge-function instance (cold-start probe only).
//
// Strategy: send a 1-token chat completion with providerOptions.gateway.zeroDataRetention=true.
// - If team-wide OR per-request ZDR works, the gateway returns 200 and we cache success.
// - If no ZDR-compliant provider can serve the request, the gateway returns 400
//   with type=no_providers_available. We throw, blocking every downstream AI call.
//
// Usage: `await ensureZdrEnabled()` before any AI request, or wrap fetch with `aiFetch`.

const GATEWAY_BASE = "https://ai-gateway.vercel.sh/v1";

let cached: Promise<void> | null = null;

export function resetZdrCache() {
  cached = null;
}

export async function ensureZdrEnabled(): Promise<void> {
  if (cached) return cached;
  cached = (async () => {
    const key = Deno.env.get("VERCEL_AI_GATEWAY_KEY");
    if (!key) throw new Error("[ZDR] VERCEL_AI_GATEWAY_KEY is not configured");

    const res = await fetch(`${GATEWAY_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 1,
        messages: [{ role: "user", content: "ok" }],
        providerOptions: { gateway: { zeroDataRetention: true } },
      }),
    });

    if (res.status === 401 || res.status === 403) {
      throw new Error(`[ZDR] Gateway rejected key (${res.status}). Check VERCEL_AI_GATEWAY_KEY.`);
    }

    const text = await res.text();
    let body: any = null;
    try { body = JSON.parse(text); } catch { /* keep raw */ }

    if (!res.ok) {
      if (body?.type === "no_providers_available" || /ZDR/i.test(text)) {
        throw new Error(
          "[ZDR] Zero Data Retention is NOT enabled for this Vercel AI Gateway key. " +
          "Enable team-wide ZDR in the Vercel AI Gateway Settings tab. " +
          `Gateway response: ${text.slice(0, 300)}`
        );
      }
      throw new Error(`[ZDR] Gateway probe failed (${res.status}): ${text.slice(0, 300)}`);
    }

    // Success — ZDR enforced for at least this request, so the key is ZDR-capable.
    // Optional: look at planning metadata for a stronger team-wide signal.
    const planning = body?.gateway?.routing?.planningReasoning ?? "";
    console.log(`[ZDR] Verified. Planning: ${planning.slice(0, 200)}`);
  })().catch((err) => {
    // Reset on failure so the next request retries instead of permanently caching the error.
    cached = null;
    throw err;
  });
  return cached;
}

/** Drop-in fetch replacement that ensures ZDR is enforced before issuing the call. */
export async function aiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  await ensureZdrEnabled();
  return fetch(input, init);
}
