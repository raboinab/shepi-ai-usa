import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ProcessingMode = "image" | "pdf" | "text";

function classifyFile(fileName: string, fileType?: string | null): { mode: ProcessingMode; ext: string; mime: string } {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  const mime = (fileType || "").toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext) || mime.startsWith("image/")) {
    return { mode: "image", ext, mime };
  }
  if (ext === "pdf" || mime === "application/pdf") {
    return { mode: "pdf", ext, mime };
  }
  if (["csv", "tsv", "txt", "md", "json", "xml", "html", "htm", "xls", "xlsx", "doc", "docx"].includes(ext)) {
    return { mode: "text", ext, mime };
  }
  // Default: try text
  return { mode: "text", ext, mime };
}

function decodeBase64DataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    // Treat as raw base64
    const raw = dataUrl.replace(/^data:.*;base64,/, "");
    const bin = atob(raw);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { mime: "application/octet-stream", bytes };
  }
  const mime = match[1];
  const bin = atob(match[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime, bytes };
}

function extractTextFromBytes(ext: string, bytes: Uint8Array): string {
  if (["xls", "xlsx"].includes(ext)) {
    const wb = XLSX.read(bytes, { type: "array" });
    const out: string[] = [];
    for (const sheetName of wb.SheetNames.slice(0, 5)) {
      const sheet = wb.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      out.push(`=== Sheet: ${sheetName} ===\n${csv.slice(0, 50_000)}`);
    }
    return out.join("\n\n");
  }
  // CSV / TSV / TXT / JSON / XML / HTML / DOC(X) -- decode as UTF-8 best effort
  try {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return text.slice(0, 200_000);
  } catch {
    return "";
  }
}

const SYSTEM_PROMPT = `You are a financial analyst specializing in M&A due diligence. Your task is to extract key information from a supporting document that substantiates a financial adjustment.

Extract the following information and return as JSON:
{
  "documentType": "invoice" | "receipt" | "contract" | "letter" | "email" | "quote" | "statement" | "report" | "schedule" | "spreadsheet" | "other",
  "amounts": [{"description": "what this amount represents", "amount": 12345.67}],
  "dates": [{"label": "what this date represents", "date": "YYYY-MM-DD"}],
  "parties": [{"role": "vendor|buyer|landlord|tenant|employer|employee|counterparty|other", "name": "Party Name"}],
  "keyTerms": ["notable terms, obligations, conditions, or commitments"],
  "summary": "1-2 sentence plain-English summary of what this document evidences and how it could support a financial adjustment"
}

Guidelines:
- Extract ALL dollar amounts you can find, with context for each
- Capture all dates (document date, effective date, payment due date, period covered, etc.)
- Identify all named parties and their roles
- For key terms, focus on anything relevant to financial adjustments: recurring vs one-time, owner-related, personal expenses, non-operating items
- The summary should explain what this document PROVES or EVIDENCES
- If the document is unclear or low quality, still extract what you can and note limitations
- Return valid JSON only, no markdown wrapping`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let stage = "init";

  try {
    const { documentId, fileBase64, fileName, fileType, projectId, description } = await req.json();
    stage = "validate_input";

    if (!fileBase64 || !fileName) {
      return new Response(
        JSON.stringify({ success: false, stage, error: "Missing required fields: fileBase64, fileName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    stage = "classify";
    const { mode, ext, mime } = classifyFile(fileName, fileType);
    console.log(`[process-supporting-document] file=${fileName} ext=${ext} mime=${mime} mode=${mode}`);

    const userPromptBase = `Analyze this supporting document (${fileName})${description ? ` — described as: "${description}"` : ""} and extract all key information relevant to substantiating a financial adjustment.`;

    let messages: any[];

    if (mode === "image") {
      stage = "build_image_payload";
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: userPromptBase },
            { type: "image_url", image_url: { url: fileBase64 } },
          ],
        },
      ];
    } else if (mode === "text") {
      stage = "extract_text";
      const { bytes } = decodeBase64DataUrl(fileBase64);
      const text = extractTextFromBytes(ext, bytes);
      if (!text || text.trim().length < 5) {
        return new Response(
          JSON.stringify({
            success: false,
            stage,
            error: `Could not extract text content from ${ext.toUpperCase()} file. The file may be empty or corrupted.`,
            detectedMime: mime,
            detectedExt: ext,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      stage = "build_text_payload";
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${userPromptBase}\n\nDocument content (${ext.toUpperCase()}):\n\n${text}`,
        },
      ];
    } else {
      // pdf
      stage = "build_pdf_payload";
      // GPT-4o accepts PDFs only via images; for text-PDFs we'd need OCR.
      // Best-effort: send as image_url (works for many single-page PDFs in vision mode);
      // if it fails, return a clear error so the user sees actionable feedback.
      messages = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `${userPromptBase}\n\n(Note: this is a PDF document.)` },
            { type: "image_url", image_url: { url: fileBase64 } },
          ],
        },
      ];
    }

    stage = "openai_call";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          stage,
          error: `OpenAI API error: ${response.status}`,
          providerError: errorText.slice(0, 2000),
          detectedMime: mime,
          detectedExt: ext,
          mode,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    stage = "parse_response";
    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI model");
    }

    let extracted;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      extracted = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse extraction results");
    }

    const result = {
      success: true,
      documentType: extracted.documentType || "other",
      amounts: extracted.amounts || [],
      dates: extracted.dates || [],
      parties: extracted.parties || [],
      keyTerms: extracted.keyTerms || [],
      summary: extracted.summary || "",
      documentName: fileName,
      processingMode: mode,
      extractedAt: new Date().toISOString(),
    };

    stage = "persist";
    if (projectId && documentId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && supabaseKey) {
        const adminClient = createClient(supabaseUrl, supabaseKey);

        const { data: doc } = await adminClient
          .from("documents")
          .select("user_id")
          .eq("id", documentId)
          .maybeSingle();

        const userId = doc?.user_id;

        if (userId) {
          await adminClient.from("processed_data").insert({
            project_id: projectId,
            user_id: userId,
            source_document_id: documentId,
            source_type: "ai_extraction",
            data_type: "supporting_document",
            data: result,
            validation_status: "validated",
          });
        }

        await adminClient.from("documents").update({
          parsed_summary: result,
          processing_status: "completed",
        }).eq("id", documentId);
      }
    }

    console.log(`[process-supporting-document] OK type=${result.documentType} mode=${mode} amounts=${result.amounts.length} parties=${result.parties.length}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(`[process-supporting-document] failed at stage=${stage}:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        stage,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
