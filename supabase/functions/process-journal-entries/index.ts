import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Header aliases (lowercase). First match wins.
const COL_ALIASES: Record<string, string[]> = {
  id: ["je #", "je#", "je no", "je number", "entry #", "entry no", "entry number", "num", "doc num", "journal #", "journal no", "transaction id", "txn id", "ref no", "ref #"],
  date: ["date", "txn date", "transaction date", "entry date", "posting date"],
  accountName: ["account", "account name", "acct name", "acct"],
  accountId: ["account id", "account no", "account number", "acct id", "acct no", "acct #", "account #"],
  debit: ["debit", "debit amount", "dr", "dr amount"],
  credit: ["credit", "credit amount", "cr", "cr amount"],
  amount: ["amount"],
  postingType: ["type", "posting type", "dr/cr", "debit/credit"],
  memo: ["memo", "description", "memo/description", "narration", "note"],
  adjustment: ["adj", "adjustment", "is adjustment", "adjusting"],
};

function normalizeHeader(h: string): string {
  return String(h ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const norm = headers.map(normalizeHeader);
  for (const [field, aliases] of Object.entries(COL_ALIASES)) {
    const idx = norm.findIndex((h) => aliases.includes(h));
    if (idx >= 0) map[field] = idx;
  }
  return map;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function toDateISO(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().substring(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  }
  const s = String(v).trim();
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().substring(0, 10);
  return s;
}

// Simple CSV parser (RFC-4180-ish, handles quoted commas/newlines)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c === "\r") { /* skip */ }
      else cell += c;
    }
  }
  if (cell.length > 0 || row.length > 0) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim() !== ""));
}

function findHeaderRow(rows: unknown[][]): number {
  // Look in first 10 rows for one that contains a date column + account column
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const norm = rows[i].map((c) => normalizeHeader(String(c)));
    const hasDate = COL_ALIASES.date.some((a) => norm.includes(a));
    const hasAccount = COL_ALIASES.accountName.some((a) => norm.includes(a));
    if (hasDate && hasAccount) return i;
  }
  return 0;
}

interface QBLine {
  amount: number;
  journalEntryLineDetail: {
    accountRef: { name: string; value: string };
    postingType: "DEBIT" | "CREDIT";
  };
}

interface QBEntry {
  id: string;
  txnDate: string;
  privateNote: string;
  adjustment: boolean;
  line: QBLine[];
}

function buildEntries(rows: unknown[][], headerIdx: number) {
  const headers = rows[headerIdx].map((c) => String(c ?? ""));
  const colMap = mapHeaders(headers);
  if (colMap.date === undefined || colMap.accountName === undefined) {
    throw new Error("Could not detect Date and Account columns in file. Required headers: Date, Account, plus either Debit/Credit columns or Amount+Type.");
  }
  if (colMap.debit === undefined && colMap.credit === undefined && colMap.amount === undefined) {
    throw new Error("Could not detect amount columns. Provide Debit + Credit columns, or Amount + Type.");
  }

  const groups = new Map<string, QBEntry>();
  let autoId = 0;
  let lastId = "";
  let lastDate = "";

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => String(c ?? "").trim() === "")) continue;

    const rawId = colMap.id !== undefined ? String(row[colMap.id] ?? "").trim() : "";
    const dateStr = toDateISO(row[colMap.date]);

    // Carry-forward: many JE exports leave id/date blank on continuation lines
    const id = rawId || lastId || (dateStr ? `${dateStr}-${++autoId}` : `row-${++autoId}`);
    const txnDate = dateStr || lastDate;
    if (rawId) lastId = rawId;
    if (dateStr) lastDate = dateStr;

    const accountName = String(row[colMap.accountName] ?? "").trim();
    if (!accountName) continue;
    const accountId = colMap.accountId !== undefined ? String(row[colMap.accountId] ?? "").trim() : "";

    let amount = 0;
    let postingType: "DEBIT" | "CREDIT" = "DEBIT";
    if (colMap.debit !== undefined || colMap.credit !== undefined) {
      const dr = colMap.debit !== undefined ? toNumber(row[colMap.debit]) : 0;
      const cr = colMap.credit !== undefined ? toNumber(row[colMap.credit]) : 0;
      if (dr !== 0) { amount = Math.abs(dr); postingType = "DEBIT"; }
      else if (cr !== 0) { amount = Math.abs(cr); postingType = "CREDIT"; }
      else continue;
    } else {
      const amt = toNumber(row[colMap.amount!]);
      const typeStr = colMap.postingType !== undefined ? String(row[colMap.postingType] ?? "").trim().toUpperCase() : "";
      if (typeStr.startsWith("CR") || amt < 0) { postingType = "CREDIT"; amount = Math.abs(amt); }
      else { postingType = "DEBIT"; amount = Math.abs(amt); }
      if (amount === 0) continue;
    }

    const memo = colMap.memo !== undefined ? String(row[colMap.memo] ?? "").trim() : "";
    const isAdj = colMap.adjustment !== undefined
      ? /^(y|yes|true|1|adj)/i.test(String(row[colMap.adjustment] ?? "").trim())
      : false;

    let entry = groups.get(id);
    if (!entry) {
      entry = {
        id,
        txnDate,
        privateNote: memo,
        adjustment: isAdj,
        line: [],
      };
      groups.set(id, entry);
    } else {
      if (memo && !entry.privateNote) entry.privateNote = memo;
      if (isAdj) entry.adjustment = true;
    }

    entry.line.push({
      amount,
      journalEntryLineDetail: {
        accountRef: { name: accountName, value: accountId },
        postingType,
      },
    });
  }

  return Array.from(groups.values());
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { documentId, projectId } = await req.json();
    if (!documentId || !projectId) {
      return new Response(JSON.stringify({ error: "documentId and projectId are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: document, error: docError } = await supabase
      .from("documents").select("*").eq("id", documentId).maybeSingle();
    if (docError || !document) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("documents").update({ processing_status: "processing" }).eq("id", documentId);

    const { data: fileData, error: dlError } = await supabase.storage
      .from("documents").download(document.file_path);
    if (dlError || !fileData) {
      await supabase.from("documents").update({ processing_status: "failed" }).eq("id", documentId);
      return new Response(JSON.stringify({ error: "Failed to download file" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fileType = (document.file_type || (document.name?.split(".").pop() || "")).toLowerCase();
    const arrayBuffer = await fileData.arrayBuffer();

    let rows: unknown[][] = [];
    if (fileType === "csv" || fileType === "txt" || fileType === "tsv") {
      const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
      rows = parseCSV(text);
    } else if (fileType === "xlsx" || fileType === "xls") {
      const wb = XLSX.read(new Uint8Array(arrayBuffer), { type: "array", cellDates: false });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
    } else {
      await supabase.from("documents").update({ processing_status: "failed" }).eq("id", documentId);
      return new Response(JSON.stringify({ error: `Unsupported file type: ${fileType}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (rows.length < 2) {
      throw new Error("File appears to be empty");
    }

    const headerIdx = findHeaderRow(rows);
    const entries = buildEntries(rows, headerIdx);

    if (entries.length === 0) {
      throw new Error("No journal entries could be parsed from the file");
    }

    // Sort newest first
    entries.sort((a, b) => b.txnDate.localeCompare(a.txnDate));

    // Insert in QB shape so transformQBJournalEntriesToWizard can consume it unchanged
    const payload = {
      data: entries,
      count: entries.length,
      source: "upload_parse",
      documentName: document.name,
      extractedAt: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("processed_data").insert({
      project_id: projectId,
      user_id: document.user_id,
      source_document_id: documentId,
      source_type: "upload_parse",
      data_type: "journal_entries",
      data: payload,
      validation_status: "pending",
    });

    if (insertError) {
      console.error("[process-journal-entries] insert error:", insertError);
      await supabase.from("documents").update({ processing_status: "failed" }).eq("id", documentId);
      throw insertError;
    }

    await supabase.from("documents").update({
      processing_status: "completed",
      parsed_summary: { entries: entries.length, lines: entries.reduce((s, e) => s + e.line.length, 0) },
    }).eq("id", documentId);

    // Fire-and-forget embedding
    try {
      fetch(`${supabaseUrl}/functions/v1/embed-project-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
        body: JSON.stringify({ project_id: projectId, data_types: ["journal_entries"], source: "upload" }),
      }).catch((e) => console.error("[process-journal-entries] embed error:", e));
    } catch (e) { console.error("[process-journal-entries] embed trigger error:", e); }

    return new Response(
      JSON.stringify({ success: true, entriesCount: entries.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-journal-entries:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
