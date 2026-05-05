// Generates AI narrative content (Kyle/AKB style) for a single PDF slide.
// Calls Anthropic Claude with structured tool-calling, verifies every number
// against the source rawData, and persists the result to project_narratives.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MODEL = "claude-sonnet-4-5";

type Style = "bullets" | "paragraphs";

interface RequestBody {
  projectId: string;
  slideKey: string;
  slideTitle: string;
  rawData: string; // human-readable serialization of grids/metrics for this slide
  style: Style;
  managementNotes?: string; // reserved for future; v1 is empty
  skipPersist?: boolean; // demo/script mode: don't write to project_narratives
}

interface Bullet { text: string }
interface Callout { label: string; text: string }
interface Paragraph { topic: string; observation: string; recommendation?: string }
interface NarrativeContent {
  bullets?: string[];
  callouts?: Callout[];
  paragraphs?: Paragraph[];
}

// ── Tool schemas (style-specific) ────────────────────────────────────────
const bulletsTool = {
  name: "emit_narrative",
  description: "Emit short scannable bullets and bold-labeled callouts for an analysis slide.",
  input_schema: {
    type: "object",
    properties: {
      bullets: {
        type: "array", minItems: 3, maxItems: 5,
        items: { type: "string", maxLength: 220 },
        description: "Concise observations grounded in the source data. Each <= ~200 chars.",
      },
      callouts: {
        type: "array", minItems: 0, maxItems: 3,
        items: {
          type: "object",
          properties: {
            label: { type: "string", maxLength: 36 },
            text: { type: "string", maxLength: 220 },
          },
          required: ["label", "text"],
        },
      },
    },
    required: ["bullets"],
  },
};

const paragraphsTool = {
  name: "emit_narrative",
  description: "Emit multi-paragraph Observation / Recommendation prose for an Attention Areas item.",
  input_schema: {
    type: "object",
    properties: {
      paragraphs: {
        type: "array", minItems: 1, maxItems: 6,
        items: {
          type: "object",
          properties: {
            topic: { type: "string", maxLength: 120 },
            observation: { type: "string", maxLength: 800 },
            recommendation: { type: "string", maxLength: 500 },
          },
          required: ["topic", "observation"],
        },
      },
    },
    required: ["paragraphs"],
  },
};

// ── Number-verification guard ────────────────────────────────────────────
const NUM_RE = /\$?-?\d{1,3}(?:,\d{3})*(?:\.\d+)?[KkMmBb%]?|\$?-?\d+(?:\.\d+)?[KkMmBb%]?/g;

function parseNum(s: string): number | null {
  const cleaned = s.replace(/[\$,]/g, "");
  const m = cleaned.match(/^(-?\d+(?:\.\d+)?)([KkMmBb%]?)$/);
  if (!m) return null;
  const base = parseFloat(m[1]);
  const suffix = m[2];
  switch (suffix) {
    case "K": case "k": return base * 1_000;
    case "M": case "m": return base * 1_000_000;
    case "B": case "b": return base * 1_000_000_000;
    case "%": return base;
    default: return base;
  }
}

function extractNumbers(text: string): number[] {
  const matches = text.match(NUM_RE) || [];
  return matches.map(parseNum).filter((n): n is number => n !== null);
}

/** Returns true if `n` is found in `sourceNums` within ±2% tolerance (or ±0.5 for tiny values). */
function numberInSource(n: number, sourceNums: number[]): boolean {
  const tol = Math.max(Math.abs(n) * 0.02, 0.5);
  return sourceNums.some((s) => Math.abs(s - n) <= tol);
}

/** Strip any string whose extracted numbers don't all appear in the source. */
function verifyNumbers(content: NarrativeContent, rawData: string): { content: NarrativeContent; stripped: number; total: number } {
  const sourceNums = extractNumbers(rawData);
  let stripped = 0;
  let total = 0;
  const ok = (text: string): boolean => {
    const nums = extractNumbers(text);
    total += nums.length > 0 ? 1 : 0;
    if (nums.length === 0) return true; // text with no numbers is allowed
    const allFound = nums.every((n) => numberInSource(n, sourceNums));
    if (!allFound) stripped += 1;
    return allFound;
  };

  const out: NarrativeContent = {};
  if (content.bullets) out.bullets = content.bullets.filter(ok);
  if (content.callouts) {
    out.callouts = content.callouts.filter((c) => ok(c.text) && ok(c.label));
  }
  if (content.paragraphs) {
    out.paragraphs = content.paragraphs
      .map((p) => ({
        topic: p.topic,
        observation: ok(p.observation) ? p.observation : "",
        recommendation: p.recommendation && ok(p.recommendation) ? p.recommendation : undefined,
      }))
      .filter((p) => p.observation.length > 0);
  }
  return { content: out, stripped, total };
}

// ── Anthropic call ───────────────────────────────────────────────────────
async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  tool: typeof bulletsTool | typeof paragraphsTool,
): Promise<NarrativeContent> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      tools: [tool],
      tool_choice: { type: "tool", name: "emit_narrative" },
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 500)}`);
  }
  const data = await res.json();
  const block = (data.content || []).find((b: any) => b.type === "tool_use");
  if (!block) throw new Error("Claude did not return a tool_use block");
  return block.input as NarrativeContent;
}

// ── Hash for staleness detection ─────────────────────────────────────────
async function sha256(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Main handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestBody;
    if (!body.projectId || !body.slideKey || !body.rawData) {
      return new Response(JSON.stringify({ error: "Missing projectId/slideKey/rawData" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth: validate caller has access to the project.
    // Demo/script bypass: callers with the service role key + skipPersist=true
    // can generate narratives without a user session (used by demo asset pipeline).
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const isServiceRole = token === SERVICE_ROLE_KEY;
    let userId: string | null = null;

    if (isServiceRole && body.skipPersist) {
      // Demo mode — skip user/project access checks entirely.
    } else {
      const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !user) {
        return new Response(JSON.stringify({ error: "Invalid auth token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
      const { data: hasAccess, error: accessErr } = await supabase.rpc("has_project_access", {
        _user_id: user.id, _project_id: body.projectId,
      });
      if (accessErr || !hasAccess) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const tool = body.style === "paragraphs" ? paragraphsTool : bulletsTool;
    const styleGuide = body.style === "paragraphs"
      ? "Write 1-3 paragraphs per topic. Each paragraph: a clear Observation (what the numbers show, with figures), then a brief Recommendation for the buyer when warranted. Mirror the tone of a professional QoE attention-areas write-up: precise, dispassionate, action-oriented."
      : "Return 3-5 short scannable bullets and up to 3 bold-labeled callouts. Bullets describe what the numbers show; callouts highlight a single metric or risk with a short label (e.g., 'Margin compression', 'Customer concentration').";

    const systemPrompt = [
      "You are a senior Quality of Earnings analyst writing the narrative layer for a buyer-facing diligence report.",
      "Strict rules:",
      "• Only reference numbers, accounts, periods, and entities that appear in the SOURCE DATA below. Never invent figures.",
      "• Never attribute statements to management, the seller, or any human source. No 'management indicated', 'per the seller', etc.",
      "• Never speculate about causes you cannot derive from the numbers. Describe what the data shows, not why it happened, unless the data itself implies it (e.g. a one-time gain line item).",
      "• Use plain US English, active voice, no marketing language.",
      styleGuide,
      "Always return your answer by calling the emit_narrative tool.",
    ].join("\n");

    const userPrompt = [
      `SLIDE: ${body.slideTitle} (${body.slideKey})`,
      "",
      "SOURCE DATA:",
      body.rawData.slice(0, 16000),
    ].join("\n");

    // First attempt
    let raw = await callClaude(systemPrompt, userPrompt, tool);
    let { content, stripped, total } = verifyNumbers(raw, body.rawData);

    // Retry once if >50% of numeric items were stripped
    if (total > 0 && stripped / total > 0.5) {
      const stricter = systemPrompt + "\nIMPORTANT: Your previous attempt referenced numbers not present in the source data. Use ONLY exact figures from SOURCE DATA. When in doubt, omit the number.";
      raw = await callClaude(stricter, userPrompt, tool);
      ({ content } = verifyNumbers(raw, body.rawData));
    }

    const sourceHash = await sha256(body.rawData);

    if (!body.skipPersist) {
      const { error: upsertErr } = await supabase
        .from("project_narratives")
        .upsert({
          project_id: body.projectId,
          slide_key: body.slideKey,
          content,
          source_hash: sourceHash,
          model: MODEL,
          generated_by: userId,
          generated_at: new Date().toISOString(),
        }, { onConflict: "project_id,slide_key" });

      if (upsertErr) {
        return new Response(JSON.stringify({ error: upsertErr.message }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ content, sourceHash, model: MODEL }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-narrative error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
