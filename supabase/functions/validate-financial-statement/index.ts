import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface TrialBalanceAccount {
  id: string;
  fsType: 'BS' | 'IS';
  accountNumber: string;
  accountName: string;
  accountType: string;
  monthlyValues: Record<string, number>;
}

interface DerivedTotals {
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalRevenue?: number;
  totalCogs?: number;
  grossProfit?: number;
  totalExpenses?: number;
  netIncome?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  netChangeInCash?: number;
}

interface ValidationLineItem {
  lineItem: string;
  uploadedValue: number | null;
  trialBalanceValue: number;
  variance: number | null;
  variancePercent: number | null;
  status: 'match' | 'minor' | 'significant' | 'extraction_failed';
}

// --- Period helpers ---

/** Sort period keys chronologically and return the latest one */
function getLatestPeriodKey(monthlyValues: Record<string, number>): string | null {
  const keys = Object.keys(monthlyValues).filter(k => monthlyValues[k] !== undefined);
  if (keys.length === 0) return null;
  // Period keys are typically like "2024-01", "2024-02", etc.
  keys.sort();
  return keys[keys.length - 1];
}

/** Filter period keys that fall within a date range */
function getPeriodKeysInRange(
  monthlyValues: Record<string, number>,
  periodStart?: string | null,
  periodEnd?: string | null
): string[] {
  const keys = Object.keys(monthlyValues);
  if (!periodStart && !periodEnd) return keys;

  return keys.filter(key => {
    // key format: "2024-01" or similar
    if (periodStart && key < periodStart.slice(0, 7)) return false;
    if (periodEnd && key > periodEnd.slice(0, 7)) return false;
    return true;
  });
}

// --- Trial Balance derivation logic ---

function deriveTotalsFromTrialBalance(
  accounts: TrialBalanceAccount[],
  documentType: string,
  periodStart?: string | null,
  periodEnd?: string | null
): DerivedTotals {
  let totalAssets = 0, totalLiabilities = 0, totalEquity = 0;
  let totalRevenue = 0, totalCogs = 0, totalExpenses = 0;

  for (const account of accounts) {
    let value = 0;
    const accountType = (account.accountType || '').toLowerCase();

    if (account.fsType === 'BS' && (documentType === 'balance_sheet' || documentType === 'cash_flow')) {
      // Balance Sheet accounts are point-in-time: use the LATEST period's ending balance
      // If periodEnd is specified, use that period; otherwise use the latest available
      if (periodEnd) {
        const targetKey = periodEnd.slice(0, 7); // "2024-12"
        // Find the closest period key <= targetKey
        const keys = Object.keys(account.monthlyValues).sort();
        const match = keys.filter(k => k <= targetKey).pop();
        value = match ? (account.monthlyValues[match] || 0) : 0;
      } else {
        const latestKey = getLatestPeriodKey(account.monthlyValues);
        value = latestKey ? (account.monthlyValues[latestKey] || 0) : 0;
      }
    } else if (account.fsType === 'IS') {
      // Income Statement accounts are activity-based: sum only the matching period range
      const filteredKeys = getPeriodKeysInRange(account.monthlyValues, periodStart, periodEnd);
      value = filteredKeys.reduce((sum, k) => sum + (account.monthlyValues[k] || 0), 0);
    } else {
      // Fallback: use latest for BS, sum for IS
      if (account.fsType === 'BS') {
        const latestKey = getLatestPeriodKey(account.monthlyValues);
        value = latestKey ? (account.monthlyValues[latestKey] || 0) : 0;
      } else {
        value = Object.values(account.monthlyValues).reduce((sum, v) => sum + v, 0);
      }
    }

    if (account.fsType === 'BS') {
      if (accountType.includes('asset') || accountType.includes('bank') || accountType.includes('receivable')) {
        totalAssets += value;
      } else if (accountType.includes('liability') || accountType.includes('payable') || accountType.includes('credit card')) {
        totalLiabilities += value;
      } else if (accountType.includes('equity')) {
        totalEquity += value;
      } else {
        if (value > 0) totalAssets += value; else totalLiabilities += Math.abs(value);
      }
    } else if (account.fsType === 'IS') {
      if (accountType.includes('income') || accountType.includes('revenue') || accountType.includes('sales')) {
        totalRevenue += value;
      } else if (accountType.includes('cost of goods') || accountType.includes('cogs')) {
        totalCogs += value;
      } else {
        totalExpenses += value;
      }
    }
  }

  const grossProfit = totalRevenue - totalCogs;
  const netIncome = grossProfit - totalExpenses;

  return {
    totalAssets, totalLiabilities, totalEquity,
    totalRevenue, totalCogs, grossProfit, totalExpenses, netIncome,
    operatingCashFlow: netIncome, investingCashFlow: 0, financingCashFlow: 0,
    netChangeInCash: netIncome,
  };
}

// --- Variance helpers ---

function getVarianceStatus(variance: number, baseValue: number): 'match' | 'minor' | 'significant' {
  if (variance === 0) return 'match';
  const absVariance = Math.abs(variance);
  const absBase = Math.abs(baseValue);
  if (absVariance <= 1 || (absBase > 0 && absVariance / absBase <= 0.001)) return 'match';
  if (absBase > 0 && absVariance / absBase <= 0.01) return 'minor';
  return 'significant';
}

const LINE_ITEM_DEFS: Record<string, { key: string; label: string }[]> = {
  balance_sheet: [
    { key: 'totalAssets', label: 'Total Assets' },
    { key: 'totalLiabilities', label: 'Total Liabilities' },
    { key: 'totalEquity', label: 'Total Equity' },
  ],
  income_statement: [
    { key: 'totalRevenue', label: 'Total Revenue' },
    { key: 'totalCogs', label: 'Cost of Goods Sold' },
    { key: 'grossProfit', label: 'Gross Profit' },
    { key: 'totalExpenses', label: 'Total Operating Expenses' },
    { key: 'netIncome', label: 'Net Income' },
  ],
  cash_flow: [
    { key: 'operatingCashFlow', label: 'Operating Cash Flow' },
    { key: 'investingCashFlow', label: 'Investing Cash Flow' },
    { key: 'financingCashFlow', label: 'Financing Cash Flow' },
    { key: 'netChangeInCash', label: 'Net Change in Cash' },
  ],
};

function buildLineItems(
  documentType: string,
  derivedTotals: DerivedTotals,
  uploadedTotals: DerivedTotals | undefined | null
): ValidationLineItem[] {
  const defs = LINE_ITEM_DEFS[documentType] || [];
  return defs.map(({ key, label }) => {
    const tbValue = (derivedTotals as Record<string, number>)[key] || 0;
    const rawUploaded = uploadedTotals?.[key as keyof DerivedTotals];
    
    if (rawUploaded === null || rawUploaded === undefined) {
      return { lineItem: label, uploadedValue: null, trialBalanceValue: tbValue, variance: null, variancePercent: null, status: 'extraction_failed' as const };
    }

    const uploadedValue = rawUploaded as number;
    const variance = uploadedValue - tbValue;
    const variancePercent = tbValue !== 0 ? (variance / Math.abs(tbValue)) * 100 : 0;
    return { lineItem: label, uploadedValue, trialBalanceValue: tbValue, variance, variancePercent, status: getVarianceStatus(variance, tbValue) };
  });
}

// --- XLSX parsing: download file from storage and convert to text for AI ---

async function parseXlsxFromStorage(
  supabase: ReturnType<typeof createClient>,
  filePath: string
): Promise<string | null> {
  try {
    console.log(`[validate-fs] Downloading xlsx from storage: ${filePath}`);
    const { data: fileData, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error || !fileData) {
      console.warn(`[validate-fs] Failed to download file:`, error?.message);
      return null;
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    const sheets: string[] = [];
    for (const sheetName of workbook.SheetNames.slice(0, 3)) { // max 3 sheets
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
      // Limit to 200 rows
      const rows = json.slice(0, 200);
      if (rows.length > 0) {
        sheets.push(`Sheet: ${sheetName}\n` + rows.map(r => (r as unknown[]).join('\t')).join('\n'));
      }
    }

    const text = sheets.join('\n\n');
    console.log(`[validate-fs] Parsed xlsx: ${text.length} chars from ${workbook.SheetNames.length} sheets`);
    return text.length > 0 ? text : null;
  } catch (e) {
    console.warn(`[validate-fs] xlsx parse error:`, e);
    return null;
  }
}

// --- AI extraction from text content ---

async function extractTotalsViaAI(
  textContent: string,
  documentType: string
): Promise<DerivedTotals | null> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  if (!OPENAI_API_KEY) return null;

  let prompt = '';
  if (documentType === 'balance_sheet') {
    prompt = `Extract the following totals from this Balance Sheet spreadsheet data. Look for rows labeled "Total Assets", "Total Liabilities", "Total Equity" or similar. If there are monthly columns, use the LAST (most recent) month's value OR find a "Total" column. Return ONLY valid JSON:
      { "totalAssets": number or null, "totalLiabilities": number or null, "totalEquity": number or null }
      
      Spreadsheet data:\n${textContent.slice(0, 12000)}`;
  } else if (documentType === 'income_statement') {
    prompt = `Extract the following totals from this Income Statement / Profit & Loss spreadsheet data. 
IMPORTANT: This spreadsheet may have monthly columns (Jan, Feb, Mar... or 2024-01, 2024-02, etc.) with a "Total" column at the end. 
- If there is a "Total" column, use those values.
- If there is NO "Total" column, SUM all the monthly values for each row.
- Look for rows like "Total Revenue", "Total Income", "Gross Profit", "Total Expenses", "Total Operating Expenses", "Net Income", "Net Operating Income", "Cost of Goods Sold", "Cost of Sales".
- Revenue/Income values are typically positive. Expense and COGS values may be positive or negative depending on convention.

Return ONLY valid JSON (use null if a value cannot be found):
{ "totalRevenue": number or null, "totalCogs": number or null, "grossProfit": number or null, "totalExpenses": number or null, "netIncome": number or null }
      
Spreadsheet data:\n${textContent.slice(0, 12000)}`;
  } else if (documentType === 'cash_flow') {
    prompt = `Extract the following totals from this Cash Flow Statement spreadsheet data. If there are monthly columns, use the "Total" column or sum all months. Return ONLY valid JSON:
      { "operatingCashFlow": number or null, "investingCashFlow": number or null, "financingCashFlow": number or null, "netChangeInCash": number or null }
      
      Spreadsheet data:\n${textContent.slice(0, 12000)}`;
  }

  if (!prompt) return null;

  try {
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a financial data extraction specialist. Extract exact numerical values from spreadsheet data. When data has monthly columns, sum them or use the Total column. Return only valid JSON, no markdown." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`[validate-fs] AI extracted totals:`, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch (aiError) {
    console.warn("[validate-fs] AI extraction failed:", aiError);
  }
  return null;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, documentId, documentType, extractedTotals, periodStart, periodEnd } = await req.json();

    if (!projectId || !documentType) {
      return new Response(
        JSON.stringify({ error: "projectId and documentType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project TB data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("wizard_data, periods")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wizardData = project.wizard_data as Record<string, unknown> | null;
    const trialBalanceData = wizardData?.trialBalance as { accounts?: TrialBalanceAccount[] } | undefined;
    const accounts = trialBalanceData?.accounts || [];

    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No Trial Balance data found. Please upload and process a Trial Balance first.", code: "NO_TRIAL_BALANCE" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine period context: prefer explicit params, then fetch from document record
    let effectivePeriodStart = periodStart || null;
    let effectivePeriodEnd = periodEnd || null;

    if (!effectivePeriodStart && !effectivePeriodEnd && documentId) {
      const { data: docPeriod } = await supabase
        .from("documents")
        .select("period_start, period_end")
        .eq("id", documentId)
        .single();
      if (docPeriod) {
        effectivePeriodStart = docPeriod.period_start;
        effectivePeriodEnd = docPeriod.period_end;
      }
    }

    console.log(`[validate-fs] Deriving totals for ${documentType}, periodStart=${effectivePeriodStart}, periodEnd=${effectivePeriodEnd}, accounts=${accounts.length}`);

    const derivedTotals = deriveTotalsFromTrialBalance(accounts, documentType, effectivePeriodStart, effectivePeriodEnd);
    let uploadedTotals = extractedTotals as DerivedTotals | undefined;

    // --- Extraction pipeline: try multiple sources ---
    if (!uploadedTotals && documentId) {
      const { data: doc } = await supabase
        .from("documents")
        .select("name, file_path, file_type, parsed_summary")
        .eq("id", documentId)
        .single();

      // Step 1: Try AI extraction from parsed_summary (works for PDFs with real parsed data)
      if (!uploadedTotals && doc?.parsed_summary) {
        const summary = doc.parsed_summary as Record<string, unknown>;
        // Only use parsed_summary if it has actual financial data (not just metadata)
        const hasFinancialData = summary && !summary.note && !summary.source;
        if (hasFinancialData) {
          console.log(`[validate-fs] Attempting AI extraction from parsed_summary`);
          uploadedTotals = await extractTotalsViaAI(JSON.stringify(summary), documentType);
        } else {
          console.log(`[validate-fs] parsed_summary is metadata-only, skipping`);
        }
      }

      // Step 2: Try downloading and parsing the xlsx file directly
      if (!uploadedTotals && doc?.file_path) {
        const ext = (doc.file_type || doc.name || '').toLowerCase();
        const isSpreadsheet = ext.includes('xlsx') || ext.includes('xls') || ext.includes('csv') ||
          ext.includes('spreadsheet') || ext.includes('excel');
        
        if (isSpreadsheet) {
          console.log(`[validate-fs] Attempting xlsx parse from storage: ${doc.file_path}`);
          const xlsxText = await parseXlsxFromStorage(supabase, doc.file_path);
          if (xlsxText) {
            uploadedTotals = await extractTotalsViaAI(xlsxText, documentType);
          }
        }
      }
    }

    // Get document name
    let documentName = "Uploaded Document";
    if (documentId) {
      const { data: docInfo } = await supabase
        .from("documents")
        .select("name")
        .eq("id", documentId)
        .single();
      if (docInfo?.name) documentName = docInfo.name;
    }

    // If uploadedTotals is entirely missing, return extraction failed
    if (!uploadedTotals) {
      const failedResult = {
        documentType,
        documentName,
        overallScore: null,
        lineItems: [],
        validatedAt: new Date().toISOString(),
        extractionFailed: true,
        summary: "Could not extract totals from the uploaded document. Please verify the file contains readable financial data.",
        derivedTotals,
      };

      if (documentId) {
        await supabase
          .from("documents")
          .update({ validation_result: failedResult, validated_at: new Date().toISOString() })
          .eq("id", documentId);
      }

      return new Response(JSON.stringify(failedResult), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Build comparison
    const lineItems = buildLineItems(documentType, derivedTotals, uploadedTotals);

    const scorableItems = lineItems.filter(l => l.status !== 'extraction_failed');
    const matchCount = scorableItems.filter(l => l.status === 'match').length;
    const minorCount = scorableItems.filter(l => l.status === 'minor').length;
    const overallScore = scorableItems.length > 0
      ? Math.round(((matchCount * 100) + (minorCount * 50)) / scorableItems.length)
      : null;

    // Balance checks
    let isBalanced: boolean | undefined;
    let tbIsBalanced: boolean | undefined;

    if (documentType === 'balance_sheet') {
      tbIsBalanced = Math.abs((derivedTotals.totalAssets || 0) - ((derivedTotals.totalLiabilities || 0) + (derivedTotals.totalEquity || 0))) < 1;
      const uAssets = uploadedTotals.totalAssets;
      const uLiab = uploadedTotals.totalLiabilities;
      const uEquity = uploadedTotals.totalEquity;
      if (uAssets != null && uLiab != null && uEquity != null) {
        isBalanced = Math.abs(uAssets - (uLiab + uEquity)) < 1;
      }
    }

    // Summary
    const significantCount = lineItems.filter(l => l.status === 'significant').length;
    const failedCount = lineItems.filter(l => l.status === 'extraction_failed').length;
    let summary = '';
    if (failedCount > 0 && failedCount === lineItems.length) {
      summary = 'Could not extract any totals from the uploaded document.';
    } else if (significantCount > 0) {
      summary = `Found ${significantCount} significant variance(s). Review the discrepancies and investigate the differences.`;
    } else if (minorCount > 0) {
      summary = `Good match with ${minorCount} minor variance(s). These may be due to rounding differences.`;
    } else if (failedCount > 0) {
      summary = `${matchCount} line items match. ${failedCount} could not be extracted from the document.`;
    } else {
      summary = 'Perfect match! The uploaded document aligns with Trial Balance-derived values.';
    }

    const result = {
      documentType,
      documentName,
      overallScore,
      lineItems,
      validatedAt: new Date().toISOString(),
      isBalanced,
      tbIsBalanced,
      extractionFailed: false,
      summary,
      derivedTotals,
    };

    if (documentId) {
      await supabase
        .from("documents")
        .update({ validation_result: result, validated_at: new Date().toISOString() })
        .eq("id", documentId);
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
