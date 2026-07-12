import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function pad2(n: number) { return String(n).padStart(2, "0"); }
function iso(y: number, m: number, d: number) { return `${y}-${pad2(m)}-${pad2(d)}`; }
function endOfMonth(y: number, m: number) {
  const d = new Date(Date.UTC(y, m, 0)); // day 0 of next month = last day of month m
  return iso(y, m, d.getUTCDate());
}
function startOfMonth(y: number, m: number) { return iso(y, m, 1); }

interface Detection {
  period_start: string | null;
  period_end: string | null;
  confidence: number; // 0..1
  reason: string;
}

/** Regex-based detection over the first page/sheet text. */
function detectByRegex(text: string): Detection {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return { period_start: null, period_end: null, confidence: 0, reason: "empty text" };

  // 1. "For the Year Ended December 31, 2024" or "Year Ended Dec 31, 2024"
  const yrEnd = t.match(/(?:for the )?year(?:s)? ended\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (yrEnd) {
    const m = MONTHS[yrEnd[1].toLowerCase()];
    const d = parseInt(yrEnd[2], 10);
    const y = parseInt(yrEnd[3], 10);
    if (m) {
      const end = iso(y, m, d);
      const startY = m === 12 && d >= 28 ? y : y - 1;
      const startM = m === 12 && d >= 28 ? 1 : m + 1 > 12 ? 1 : m;
      // Standard fiscal year = 12 months back
      const start = startOfMonth(y, 1) === iso(y, 1, 1) && m === 12
        ? iso(y, 1, 1)
        : (() => {
            const dt = new Date(Date.UTC(y, m - 1, d));
            dt.setUTCFullYear(dt.getUTCFullYear() - 1);
            dt.setUTCDate(dt.getUTCDate() + 1);
            return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
          })();
      return { period_start: start, period_end: end, confidence: 0.95, reason: "year ended <date>" };
    }
  }

  // 2. "For the Month Ended <Month> <DD>, <YYYY>"
  const moEnd = t.match(/month(?:s)? ended\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (moEnd) {
    const m = MONTHS[moEnd[1].toLowerCase()];
    const y = parseInt(moEnd[3], 10);
    if (m) {
      return { period_start: startOfMonth(y, m), period_end: endOfMonth(y, m), confidence: 0.95, reason: "month ended <date>" };
    }
  }

  // 3. "For the <N> Months Ended <Month> <DD>, <YYYY>"
  const nMoEnd = t.match(/(\d{1,2})\s+months? ended\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (nMoEnd) {
    const n = parseInt(nMoEnd[1], 10);
    const m = MONTHS[nMoEnd[2].toLowerCase()];
    const y = parseInt(nMoEnd[4], 10);
    if (m && n >= 1 && n <= 24) {
      const end = endOfMonth(y, m);
      // Start = m - n + 1 months
      let sm = m - n + 1;
      let sy = y;
      while (sm <= 0) { sm += 12; sy -= 1; }
      return { period_start: startOfMonth(sy, sm), period_end: end, confidence: 0.9, reason: `${n} months ended` };
    }
  }

  // 4. "As of <Month> <DD>, <YYYY>" (Balance Sheet snapshot)
  const asOf = t.match(/as of\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (asOf) {
    const m = MONTHS[asOf[1].toLowerCase()];
    const y = parseInt(asOf[3], 10);
    if (m) {
      // Snapshot: use that month as the reporting period
      return { period_start: startOfMonth(y, m), period_end: endOfMonth(y, m), confidence: 0.85, reason: "as of <date>" };
    }
  }

  // 5. "<Month> <YYYY> - <Month> <YYYY>" or "<Month> <YYYY> to <Month> <YYYY>"
  const range = t.match(/([A-Za-z]{3,9})\.?\s+(\d{4})\s*(?:-|–|—|to|through|thru)\s*([A-Za-z]{3,9})\.?\s+(\d{4})/i);
  if (range) {
    const m1 = MONTHS[range[1].toLowerCase()];
    const y1 = parseInt(range[2], 10);
    const m2 = MONTHS[range[3].toLowerCase()];
    const y2 = parseInt(range[4], 10);
    if (m1 && m2) {
      return { period_start: startOfMonth(y1, m1), period_end: endOfMonth(y2, m2), confidence: 0.9, reason: "month range" };
    }
  }

  // 6. "<Month> <YYYY>" alone (single month)
  const singleMo = t.match(/\b([A-Za-z]{3,9})\.?\s+(\d{4})\b/);
  if (singleMo) {
    const m = MONTHS[singleMo[1].toLowerCase()];
    const y = parseInt(singleMo[2], 10);
    if (m) {
      return { period_start: startOfMonth(y, m), period_end: endOfMonth(y, m), confidence: 0.6, reason: "single month/year" };
    }
  }

  // 7. Bare year "For 2024" / "FY 2024" / "Fiscal Year 2024"
  const fy = t.match(/(?:fy|fiscal year|for the year|for)\s*(\d{4})/i);
  if (fy) {
    const y = parseInt(fy[1], 10);
    return { period_start: `${y}-01-01`, period_end: `${y}-12-31`, confidence: 0.7, reason: "fiscal year" };
  }

  return { period_start: null, period_end: null, confidence: 0, reason: "no pattern matched" };
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return typeof text === "string" ? text : Array.isArray(text) ? text.join("\n") : "";
  } catch (e) {
    console.warn("PDF text extract failed:", e);
    return "";
  }
}

function extractXlsxText(bytes: Uint8Array): string {
  try {
    const wb = XLSX.read(bytes, { type: "array" });
    const first = wb.SheetNames[0];
    if (!first) return "";
    const sheet = wb.Sheets[first];
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
    // Take top 20 rows — headers usually live there
    return rows.slice(0, 20).map((r) => (Array.isArray(r) ? r.join(" ") : "")).join("\n");
  } catch (e) {
    console.warn("XLSX text extract failed:", e);
    return "";
  }
}

/** LLM fallback via Lovable AI Gateway. */
async function detectByLLM(sampleText: string, docType: string, fileName: string): Promise<Detection> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || !sampleText.trim()) {
    return { period_start: null, period_end: null, confidence: 0, reason: "no LLM key or empty text" };
  }

  const prompt = `You are analyzing the first page of a ${docType} financial statement file named "${fileName}".

Return ONLY a JSON object with fields:
- "period_start": "YYYY-MM-DD" or null
- "period_end": "YYYY-MM-DD" or null
- "confidence": number between 0 and 1
- "reason": short string explaining what you found

Rules:
- Balance Sheet "As of DATE" → period_start = start of that month, period_end = that DATE.
- Income Statement / Cash Flow "For the Year Ended DATE" → period_start = one year earlier + 1 day, period_end = that DATE.
- "For the N Months Ended DATE" → period_start = start of the (m - N + 1) month.
- If comparative columns show multiple years, use the LATEST reporting period.
- If you cannot find a period, return nulls with confidence 0.

Text to analyze (truncated):
"""
${sampleText.slice(0, 4000)}
"""`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.warn("LLM fallback failed:", res.status, errText);
      return { period_start: null, period_end: null, confidence: 0, reason: `llm ${res.status}` };
    }
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return {
      period_start: parsed.period_start ?? null,
      period_end: parsed.period_end ?? null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
      reason: parsed.reason ? `llm: ${parsed.reason}` : "llm",
    };
  } catch (e) {
    console.warn("LLM detection error:", e);
    return { period_start: null, period_end: null, confidence: 0, reason: "llm exception" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const documentId = body?.documentId as string | undefined;
    if (!documentId || typeof documentId !== "string") {
      return new Response(JSON.stringify({ error: "documentId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch doc + verify access
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("id, name, file_path, file_type, account_type, project_id, period_start, period_end")
      .eq("id", documentId)
      .single();
    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Project access check
    const { data: accessOk } = await userClient.rpc("has_project_access", { _project_id: doc.project_id });
    if (!accessOk) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!doc.file_path) {
      return new Response(JSON.stringify({ error: "Document has no file" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download bytes
    const { data: fileBlob, error: dlErr } = await supabase.storage.from("documents").download(doc.file_path);
    if (dlErr || !fileBlob) {
      return new Response(JSON.stringify({ error: "Failed to download file", details: dlErr?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const bytes = new Uint8Array(await fileBlob.arrayBuffer());

    const ext = (doc.file_type || doc.name?.split(".").pop() || "").toLowerCase();
    let text = "";
    if (ext === "pdf") {
      text = await extractPdfText(bytes);
    } else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      text = extractXlsxText(bytes);
    } else {
      text = new TextDecoder().decode(bytes.slice(0, 8000));
    }

    // Prefer file name hint as extra signal
    const combined = `${doc.name}\n${text}`.slice(0, 8000);

    let detection = detectByRegex(combined);
    let usedLlm = false;
    if (detection.confidence < 0.7) {
      const llm = await detectByLLM(text.slice(0, 4000), doc.account_type || "financial statement", doc.name);
      usedLlm = true;
      if (llm.confidence > detection.confidence) detection = llm;
    }

    const APPLY_THRESHOLD = 0.7;
    let applied = false;
    if (
      detection.confidence >= APPLY_THRESHOLD &&
      detection.period_start &&
      detection.period_end
    ) {
      const { error: updErr } = await supabase
        .from("documents")
        .update({
          period_start: detection.period_start,
          period_end: detection.period_end,
        })
        .eq("id", documentId);
      if (updErr) {
        console.error("Failed to update doc period:", updErr);
      } else {
        applied = true;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        applied,
        detection,
        usedLlm,
        textLength: text.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("detect-financial-statement-period error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
