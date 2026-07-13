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

/** Collect ALL period matches in the text and return the widest span. */
function detectByRegex(text: string, accountType?: string, headerText?: string): Detection {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return { period_start: null, period_end: null, confidence: 0, reason: "empty text" };

  const starts: string[] = [];
  const ends: string[] = [];
  const reasons: string[] = [];

  const pushRange = (s: string | null, e: string | null, why: string) => {
    if (s) starts.push(s);
    if (e) ends.push(e);
    if (s || e) reasons.push(why);
  };

  // 1. "For the Year Ended <Month> <DD>, <YYYY>" — all matches
  for (const m of t.matchAll(/(?:for the )?year(?:s)? ended\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/gi)) {
    const mo = MONTHS[m[1].toLowerCase()]; const d = parseInt(m[2], 10); const y = parseInt(m[3], 10);
    if (!mo) continue;
    const end = iso(y, mo, d);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    dt.setUTCFullYear(dt.getUTCFullYear() - 1);
    dt.setUTCDate(dt.getUTCDate() + 1);
    pushRange(iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()), end, "year ended");
  }

  // 2. "For the Month Ended ..." — all
  for (const m of t.matchAll(/month(?:s)? ended\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/gi)) {
    const mo = MONTHS[m[1].toLowerCase()]; const y = parseInt(m[3], 10);
    if (!mo) continue;
    pushRange(startOfMonth(y, mo), endOfMonth(y, mo), "month ended");
  }

  // 3. "For the N Months Ended ..." — all
  for (const m of t.matchAll(/(\d{1,2})\s+months? ended\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/gi)) {
    const n = parseInt(m[1], 10); const mo = MONTHS[m[2].toLowerCase()]; const y = parseInt(m[4], 10);
    if (!mo || n < 1 || n > 24) continue;
    let sm = mo - n + 1; let sy = y;
    while (sm <= 0) { sm += 12; sy -= 1; }
    pushRange(startOfMonth(sy, sm), endOfMonth(y, mo), `${n} months ended`);
  }

  // 4. "As of <Month> <DD>, <YYYY>" — all (comparative BS columns)
  for (const m of t.matchAll(/as of\s+([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/gi)) {
    const mo = MONTHS[m[1].toLowerCase()]; const y = parseInt(m[3], 10);
    if (!mo) continue;
    pushRange(startOfMonth(y, mo), endOfMonth(y, mo), "as of");
  }

  // 5. "<Month> <YYYY> - <Month> <YYYY>" — all
  for (const m of t.matchAll(/([A-Za-z]{3,9})\.?\s+(\d{4})\s*(?:-|–|—|to|through|thru)\s*([A-Za-z]{3,9})\.?\s+(\d{4})/gi)) {
    const m1 = MONTHS[m[1].toLowerCase()]; const y1 = parseInt(m[2], 10);
    const m2 = MONTHS[m[3].toLowerCase()]; const y2 = parseInt(m[4], 10);
    if (!m1 || !m2) continue;
    pushRange(startOfMonth(y1, m1), endOfMonth(y2, m2), "month range");
  }

  // 6. Numeric date ranges "01/2023 - 05/2026" or "1/2023-5/2026"
  for (const m of t.matchAll(/\b(\d{1,2})[\/\-](\d{4})\s*(?:-|–|—|to|through|thru)\s*(\d{1,2})[\/\-](\d{4})\b/g)) {
    const m1 = parseInt(m[1], 10); const y1 = parseInt(m[2], 10);
    const m2 = parseInt(m[3], 10); const y2 = parseInt(m[4], 10);
    if (m1 < 1 || m1 > 12 || m2 < 1 || m2 > 12) continue;
    pushRange(startOfMonth(y1, m1), endOfMonth(y2, m2), "numeric range");
  }

  // 6b. Balance Sheet: scan HEADER region for bare column-header dates like
  // "May 31, 2026", "May 31 2025", "12/31/2024", or ISO "2026-05-31".
  // Comparative BS often only prefixes the FIRST column with "As of", so
  // subsequent columns are missed by the "as of" regex above.
  if (accountType === "balance_sheet" && headerText) {
    const h = headerText.replace(/\s+/g, " ");
    for (const m of h.matchAll(/\b([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})\b/g)) {
      const mo = MONTHS[m[1].toLowerCase()]; const y = parseInt(m[3], 10);
      if (!mo || y < 1990 || y > 2100) continue;
      pushRange(startOfMonth(y, mo), endOfMonth(y, mo), "bs header date");
    }
    for (const m of h.matchAll(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g)) {
      const mo = parseInt(m[1], 10); const y = parseInt(m[3], 10);
      if (mo < 1 || mo > 12 || y < 1990 || y > 2100) continue;
      pushRange(startOfMonth(y, mo), endOfMonth(y, mo), "bs header numeric date");
    }
    for (const m of h.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
      const y = parseInt(m[1], 10); const mo = parseInt(m[2], 10);
      if (y < 1990 || y > 2100 || mo < 1 || mo > 12) continue;
      pushRange(startOfMonth(y, mo), endOfMonth(y, mo), "bs header iso date");
    }
  }

  // 6c. Universal ISO date scan (IS/CF/BS): "2023-01-31", "2026-05-31" etc.
  // XLSX headers with formatted date cells often stringify as ISO.
  {
    const isoDates: Array<{ y: number; m: number; d: number }> = [];
    for (const m of t.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
      const y = parseInt(m[1], 10); const mo = parseInt(m[2], 10); const d = parseInt(m[3], 10);
      if (y < 1990 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) continue;
      isoDates.push({ y, m: mo, d });
    }
    if (isoDates.length >= 2) {
      isoDates.sort((a, b) => a.y - b.y || a.m - b.m || a.d - b.d);
      const first = isoDates[0];
      const last = isoDates[isoDates.length - 1];
      pushRange(startOfMonth(first.y, first.m), endOfMonth(last.y, last.m), `iso date columns (${isoDates.length})`);
    }
  }

  if (starts.length || ends.length) {
    const start = starts.length ? starts.slice().sort()[0] : null;
    const end = ends.length ? ends.slice().sort().slice(-1)[0] : null;
    const uniqReasons = Array.from(new Set(reasons)).join(", ");
    const spanCount = Math.max(starts.length, ends.length);
    return {
      period_start: start,
      period_end: end,
      confidence: spanCount > 1 ? 0.95 : 0.9,
      reason: `${uniqReasons} (${spanCount} match${spanCount === 1 ? "" : "es"})`,
    };
  }

  // 7. Single "<Month> <YYYY>" occurrences — take earliest & latest
  const singleMatches: Array<{ y: number; m: number }> = [];
  for (const m of t.matchAll(/\b([A-Za-z]{3,9})\.?\s+(\d{4})\b/g)) {
    const mo = MONTHS[m[1].toLowerCase()]; const y = parseInt(m[2], 10);
    if (mo && y >= 1990 && y <= 2100) singleMatches.push({ y, m: mo });
  }
  if (singleMatches.length) {
    singleMatches.sort((a, b) => a.y - b.y || a.m - b.m);
    const first = singleMatches[0]; const last = singleMatches[singleMatches.length - 1];
    return {
      period_start: startOfMonth(first.y, first.m),
      period_end: endOfMonth(last.y, last.m),
      confidence: singleMatches.length > 1 ? 0.75 : 0.6,
      reason: `single months (${singleMatches.length})`,
    };
  }

  // 8. Fiscal year
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

function extractXlsxText(bytes: Uint8Array): { text: string; header: string } {
  try {
    const wb = XLSX.read(bytes, { type: "array" });
    const chunks: string[] = [];
    const headerChunks: string[] = [];
    // Scan every sheet — comparative periods often live across sheets or in the header of each.
    for (const name of wb.SheetNames) {
      const sheet = wb.Sheets[name];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, blankrows: false });
      chunks.push(`# ${name}`);
      chunks.push(rows.slice(0, 60).map((r) => (Array.isArray(r) ? r.join(" ") : "")).join("\n"));
      // Header region — first 15 rows only, used for BS bare-date detection.
      headerChunks.push(rows.slice(0, 15).map((r) => (Array.isArray(r) ? r.join(" ") : "")).join("\n"));
    }
    return { text: chunks.join("\n"), header: headerChunks.join("\n") };
  } catch (e) {
    console.warn("XLSX text extract failed:", e);
    return { text: "", header: "" };
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
- Return the FULL span the file covers: period_start = the EARLIEST date/column shown, period_end = the LATEST date/column shown.
- Balance Sheet: COMPARATIVE BS often only prints "As of" once (above the first column). EVERY date in the header row is an "As of" date. Treat each such date as a period column and span from the earliest to the latest.
- Income Statement / Cash Flow spanning multiple months or years → period_start = start of the earliest period, period_end = end of the latest period.
- File names or headers like "01/2023 - 05/2026" or "Jan 2023 to May 2026" mean period_start = 2023-01-01 and period_end = 2026-05-31.
- Do NOT collapse a multi-period file down to a single month.
- If you cannot find any period, return nulls with confidence 0.

Text to analyze (truncated):
"""
${sampleText.slice(0, 8000)}
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
    let headerText = "";
    if (ext === "pdf") {
      text = await extractPdfText(bytes);
      // For PDFs, the "header" is roughly the first 2000 chars.
      headerText = text.slice(0, 2000);
    } else if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      const extracted = extractXlsxText(bytes);
      text = extracted.text;
      headerText = extracted.header;
    } else {
      text = new TextDecoder().decode(bytes.slice(0, 8000));
      headerText = text.slice(0, 2000);
    }

    // Prefer file name hint as extra signal
    const combined = `${doc.name}\n${text}`.slice(0, 8000);
    const headerCombined = `${doc.name}\n${headerText}`;

    let detection = detectByRegex(combined, doc.account_type, headerCombined);
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
