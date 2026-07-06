import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as XLSX from "npm:xlsx@0.18.5";

import { aiFetch, ensureZdrEnabled } from "../_shared/zdrGuard.ts";
import { requireUser } from "../_shared/auth.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ValidationRequest {
  fileBase64: string;
  selectedType: string;
  fileName: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  detectedType: string;
  suggestedType: string | null;
  reason: string;
}

const TYPE_LABELS: Record<string, string> = {
  bank_statement: "Bank Statement",
  credit_card: "Credit Card Statement",
  tax_return: "Tax Return",
  chart_of_accounts: "Chart of Accounts",
  balance_sheet: "Balance Sheet",
  income_statement: "Income Statement (P&L)",
  trial_balance: "Trial Balance",
  cash_flow: "Cash Flow Statement",
  general_ledger: "General Ledger",
  journal_entries: "Journal Entries",
  accounts_payable: "Accounts Payable",
  accounts_receivable: "Accounts Receivable",
  customer_concentration: "Customer Concentration",
  vendor_concentration: "Vendor Concentration",
  payroll: "Payroll Report",
  cim: "Confidential Information Memorandum",
  lease_agreement: "Lease Agreement",
  inventory: "Inventory Report",
};

const DOCUCLIPPER_TYPES = ["bank_statement", "credit_card"];
const QUICKBOOKS_TYPES = [
  "chart_of_accounts", "balance_sheet", "income_statement", "trial_balance",
  "cash_flow", "general_ledger", "journal_entries", "accounts_payable",
  "accounts_receivable", "customer_concentration", "vendor_concentration"
];

// --- File type helpers ---

function getExt(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

function xlsxToText(bytes: Uint8Array): string {
  const wb = XLSX.read(bytes, { type: "array" });
  const parts: string[] = [];
  for (const name of wb.SheetNames.slice(0, 3)) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as unknown[][];
    parts.push(`Sheet: ${name}\n` + rows.slice(0, 120).map(r => (r as unknown[]).join("\t")).join("\n"));
  }
  return parts.join("\n\n");
}

// --- Heuristic classifier for accounting documents from text ---

const TEXT_SIGNATURES: { type: string; patterns: RegExp[] }[] = [
  { type: "trial_balance", patterns: [/\btrial\s+balance\b/i, /\btotal\s+debits?\b.*\btotal\s+credits?\b/is] },
  { type: "balance_sheet", patterns: [/\bbalance\s+sheet\b/i, /\btotal\s+assets\b/i, /\bliabilities\s*(and|&)\s*equity\b/i] },
  { type: "income_statement", patterns: [/\bprofit\s*(and|&)\s*loss\b/i, /\bincome\s+statement\b/i, /\bnet\s+(income|loss)\b/i, /\bgross\s+profit\b/i] },
  { type: "cash_flow", patterns: [/\bcash\s*flow\b/i, /\boperating\s+activities\b/i, /\binvesting\s+activities\b/i] },
  { type: "general_ledger", patterns: [/\bgeneral\s+ledger\b/i, /\brunning\s+balance\b/i] },
  { type: "journal_entries", patterns: [/\bjournal\s+entr(y|ies)\b/i, /\bjournal\s+no\.?\b/i] },
  { type: "chart_of_accounts", patterns: [/\bchart\s+of\s+accounts\b/i, /\baccount\s+number\b.*\baccount\s+name\b/is, /\baccount\s+type\b/i] },
  { type: "accounts_receivable", patterns: [/\ba\/?r\s+aging\b/i, /\baccounts\s+receivable\s+aging\b/i, /\b(current|1[\-\s]30|31[\-\s]60|61[\-\s]90)\b.*\bover\s*90\b/is] },
  { type: "accounts_payable", patterns: [/\ba\/?p\s+aging\b/i, /\baccounts\s+payable\s+aging\b/i] },
  { type: "payroll", patterns: [/\bgross\s+pay\b/i, /\bnet\s+pay\b/i, /\bpayroll\b/i] },
  { type: "tax_return", patterns: [/\bform\s+11(20|65)\b/i, /\bform\s+1040\b/i, /\binternal\s+revenue\s+service\b/i, /\bschedule\s+[c-k]\b/i] },
  { type: "bank_statement", patterns: [/\bbeginning\s+balance\b/i, /\bending\s+balance\b/i, /\bdeposits?\b.*\bwithdrawals?\b/is] },
  { type: "credit_card", patterns: [/\bminimum\s+payment\s+due\b/i, /\bcredit\s+limit\b/i, /\bavailable\s+credit\b/i] },
];

function classifyText(text: string): { type: string; score: number } | null {
  let best: { type: string; score: number } | null = null;
  for (const sig of TEXT_SIGNATURES) {
    const hits = sig.patterns.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
    if (hits > 0 && (!best || hits > best.score)) best = { type: sig.type, score: hits };
  }
  return best;
}

function validateFromText(text: string, selectedType: string, fileName: string): ValidationResult {
  const detection = classifyText(text);

  if (!detection) {
    return {
      isValid: false,
      confidence: 0.3,
      detectedType: "unknown",
      suggestedType: null,
      reason: `Could not identify a clear ${TYPE_LABELS[selectedType] || selectedType} signature in "${fileName}". Please confirm the file contents.`,
    };
  }

  // Hard guardrail: COA slot must never accept TB/BS/IS/GL by mistake — these are the costly confusions.
  if (selectedType === "chart_of_accounts" && detection.type !== "chart_of_accounts") {
    return {
      isValid: false,
      confidence: Math.min(1, 0.55 + detection.score * 0.15),
      detectedType: detection.type,
      suggestedType: detection.type,
      reason: `This file looks like a ${TYPE_LABELS[detection.type] || detection.type}, not a Chart of Accounts. Uploading it to the Chart of Accounts slot would break account classification.`,
    };
  }

  if (detection.type === selectedType) {
    return {
      isValid: true,
      confidence: Math.min(1, 0.6 + detection.score * 0.15),
      detectedType: detection.type,
      suggestedType: null,
      reason: `Detected ${TYPE_LABELS[detection.type] || detection.type} signatures in the file.`,
    };
  }

  return {
    isValid: false,
    confidence: Math.min(1, 0.5 + detection.score * 0.15),
    detectedType: detection.type,
    suggestedType: detection.type,
    reason: `Selected slot is ${TYPE_LABELS[selectedType] || selectedType} but the file looks like a ${TYPE_LABELS[detection.type] || detection.type}.`,
  };
}

// --- Vision prompt for images ---

function buildImagePrompt(selectedType: string): string {
  const typeLabel = TYPE_LABELS[selectedType] || selectedType;
  if (DOCUCLIPPER_TYPES.includes(selectedType)) {
    return `You are a document classification expert. Determine if this image is a "${typeLabel}". Respond with JSON: {"isValid":boolean,"confidence":0-1,"detectedType":"...","suggestedType":"key or null","reason":"..."}. Keys may be: bank_statement, credit_card, tax_return.`;
  }
  if (QUICKBOOKS_TYPES.includes(selectedType)) {
    return `You are a document classification expert. Determine if this image is a "${typeLabel}". Respond with JSON: {"isValid":boolean,"confidence":0-1,"detectedType":"...","suggestedType":"key or null","reason":"..."}. Keys may be: chart_of_accounts, balance_sheet, income_statement, trial_balance, cash_flow, general_ledger, journal_entries, accounts_payable, accounts_receivable.`;
  }
  return `You are a document classification expert. Determine if this image is a "${typeLabel}". Respond with JSON: {"isValid":boolean,"confidence":0-1,"detectedType":"...","suggestedType":null,"reason":"..."}.`;
}

async function validateImageWithAI(
  base64: string,
  mimeType: string,
  selectedType: string,
  fileName: string,
  apiKey: string,
): Promise<ValidationResult> {
  const prompt = buildImagePrompt(selectedType);
  const response = await aiFetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }],
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI gateway ${response.status}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in AI response");
  const parsed = JSON.parse(jsonMatch[0]) as ValidationResult;
  return parsed;
}

// --- Validate using AI on extracted text (PDFs go through AI text classification too) ---

async function validateTextWithAI(
  text: string,
  selectedType: string,
  fileName: string,
  apiKey: string,
): Promise<ValidationResult | null> {
  const typeLabel = TYPE_LABELS[selectedType] || selectedType;
  const allowedKeys = Object.keys(TYPE_LABELS).join(", ");
  const prompt = `You are a document classification expert.
The user is uploading a file for the "${typeLabel}" slot.
Classify the following document text and decide if it matches.
Respond ONLY with JSON: {"isValid":boolean,"confidence":0-1,"detectedType":"<key>","suggestedType":"<key or null>","reason":"short"}.
Allowed keys: ${allowedKeys}.
If the file is clearly a different financial document, set isValid=false and suggestedType to the correct key.

File name: ${fileName}

--- BEGIN TEXT ---
${text.slice(0, 9000)}
--- END TEXT ---`;

  const response = await aiFetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [
        { role: "system", content: "You are a strict document classifier. Output JSON only." },
        { role: "user", content: prompt },
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as ValidationResult;
  } catch {
    return null;
  }
}

// --- Handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const { fileBase64, selectedType, fileName } = (await req.json()) as ValidationRequest;

    if (!fileBase64 || !selectedType || !fileName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileBase64, selectedType, fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }


    const apiKey = Deno.env.get("VERCEL_AI_GATEWAY_KEY");
    const ext = getExt(fileName);
    const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(ext);
    const isCsv = ext === "csv" || ext === "txt" || ext === "tsv";
    const isXlsx = ext === "xlsx" || ext === "xls";
    const isPdf = ext === "pdf";

    console.log(`[validate-document-type] ${fileName} as ${selectedType} (ext=${ext})`);

    // ---- Text-based files: heuristic first, AI second ----
    if (isCsv || isXlsx) {
      let text = "";
      try {
        const bytes = base64ToBytes(fileBase64);
        text = isXlsx ? xlsxToText(bytes) : bytesToText(bytes);
      } catch (e) {
        console.warn("[validate-document-type] text extraction failed:", e);
      }

      if (text.length > 20) {
        const heuristic = validateFromText(text, selectedType, fileName);

        // If heuristic is confident (matched or hard COA guardrail), short-circuit.
        if (heuristic.isValid || selectedType === "chart_of_accounts" || heuristic.confidence >= 0.7) {
          return new Response(JSON.stringify(heuristic), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Otherwise ask AI to second-guess.
        if (apiKey) {
          const aiResult = await validateTextWithAI(text, selectedType, fileName, apiKey);
          if (aiResult) {
            return new Response(JSON.stringify(aiResult), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        return new Response(JSON.stringify(heuristic), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Could not read text at all — fail closed for COA, otherwise inconclusive (allow).
      const fallback: ValidationResult = {
        isValid: selectedType !== "chart_of_accounts",
        confidence: 0,
        detectedType: "unknown",
        suggestedType: null,
        reason: "Could not read file contents for validation.",
      };
      return new Response(JSON.stringify(fallback), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Image files: existing vision path ----
    if (isImage && apiKey) {
      try {
        const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        const result = await validateImageWithAI(fileBase64, mime, selectedType, fileName, apiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        console.warn("[validate-document-type] image AI failed:", e);
      }
    }

    // ---- PDFs and everything else: vision API does NOT reliably accept PDFs.
    // Return an inconclusive result instead of falsely claiming success.
    const inconclusive: ValidationResult = {
      isValid: selectedType !== "chart_of_accounts",
      confidence: 0,
      detectedType: "unknown",
      suggestedType: null,
      reason: isPdf
        ? "Pre-upload validation is not available for PDFs. The file will still be parsed after upload."
        : "Validation unavailable for this file type.",
    };
    return new Response(JSON.stringify(inconclusive), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({
        isValid: false,
        confidence: 0,
        detectedType: "unknown",
        suggestedType: null,
        reason: error instanceof Error ? error.message : "Validation error",
      } as ValidationResult),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
