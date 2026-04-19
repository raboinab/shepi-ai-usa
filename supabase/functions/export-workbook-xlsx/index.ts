/**
 * export-workbook-xlsx Edge Function
 *
 * Accepts serialized DealData via POST and returns a multi-tab .xlsx binary.
 * Keeps proprietary grid-building + tab structure logic server-side.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";
import type { DealData, GridData, GridRow, GridColumn } from "../_shared/workbook/workbook-types.ts";
import { buildTbIndex } from "../_shared/workbook/calculations.ts";
import { TAB_GRID_BUILDERS, buildProofOfCashGrid } from "../_shared/workbook/workbook-grid-builders.ts";
import type { ProofOfCashBankData } from "../_shared/workbook/workbook-grid-builders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Tab definitions (server-side copy — mirrors src/lib/workbook-tabs.ts) ──

interface TabDef {
  id: string;
  label: string;
}

const WORKBOOK_TABS: TabDef[] = [
  { id: "setup", label: "Due Diligence Information" },
  { id: "trial-balance", label: "Trial Balance" },
  { id: "qoe-analysis", label: "QoE Analysis" },
  { id: "is-bs-reconciliation", label: "Reconciling IS & BS" },
  { id: "income-statement", label: "Income Statement" },
  { id: "is-detailed", label: "Income Statement - Detailed" },
  { id: "sales", label: "Sales" },
  { id: "cogs", label: "Cost of Goods Sold" },
  { id: "opex", label: "Operating Expenses" },
  { id: "other-expense", label: "Other Expense (Income)" },
  { id: "payroll", label: "Payroll & Related" },
  { id: "working-capital", label: "Working Capital" },
  { id: "nwc-analysis", label: "NWC Analysis" },
  { id: "balance-sheet", label: "Balance Sheet" },
  { id: "bs-detailed", label: "Balance Sheet - Detailed" },
  { id: "cash", label: "Cash" },
  { id: "ar-aging", label: "AR Aging" },
  { id: "other-current-assets", label: "Other Current Assets" },
  { id: "fixed-assets", label: "Fixed Assets" },
  { id: "ap-aging", label: "AP Aging" },
  { id: "other-current-liabilities", label: "Other Current Liabilities" },
  { id: "top-customers", label: "Top Customers by Year" },
  { id: "top-vendors", label: "Top Vendors by Year" },
  { id: "proof-of-cash", label: "Proof of Cash" },
  { id: "free-cash-flow", label: "Free Cash Flow" },
];

// ── Formatting utilities (server-side copy — mirrors src/lib/workbook-format.ts) ──

function formatCurrency(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined) return "";
  if (value === 0) return "-";
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return value < 0 ? `(${formatted})` : formatted;
}

function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return "";
  if (!isFinite(value)) return "N/M";
  const pct = value * 100;
  const formatted = Math.abs(pct).toFixed(decimals);
  return pct < 0 ? `(${formatted}%)` : `${formatted}%`;
}

// ── GridData → string[][] converter (mirrors src/lib/gridToRawData.ts) ──

function gridDataToRawData(gridData: GridData): string[][] {
  const { columns, rows } = gridData;
  if (columns.length === 0) return [];

  const headerRow = columns.map((c) => c.label);
  const result: string[][] = [headerRow];

  for (const row of rows) {
    if (row.type === "spacer") continue;

    const cells: string[] = columns.map((col) => {
      const val = row.cells[col.key];
      if (val === null || val === undefined) return "";
      if (typeof val === "string") return val;

      const fmt = row.format ?? col.format;
      if (fmt === "percent") return formatPercent(val);
      if (fmt === "currency") return formatCurrency(val);
      if (fmt === "number") return val.toLocaleString("en-US");
      return String(val);
    });

    if (row.indent) {
      cells[0] = "  ".repeat(row.indent) + cells[0];
    }

    result.push(cells);
  }

  return result;
}

// ── Excel helpers (mirrors src/lib/exportWorkbookXlsx.ts) ──

function safeSheetName(label: string, usedNames: Set<string>): string {
  let name = label.substring(0, 31).replace(/[/\\*?:[\]]/g, "");
  const base = name;
  let counter = 1;
  while (usedNames.has(name)) {
    name = `${base.substring(0, 28)}_${counter++}`;
  }
  usedNames.add(name);
  return name;
}

function applyFormatting(ws: XLSX.WorkSheet, gridData: GridData, rawData: string[][]): void {
  if (rawData.length === 0) return;

  const rowCount = rawData.length;
  const colCount = rawData[0].length;

  // Column widths
  ws["!cols"] = gridData.columns.map((col) => ({
    wch: Math.max(Math.ceil((col.width || 100) / 7), 8),
  }));

  // Freeze panes
  const frozenCols = gridData.frozenColumns || 0;
  ws["!freeze"] = { xSplit: frozenCols, ySplit: 1 };

  // Identify non-numeric columns
  const nonNumericColIndices = new Set<number>();
  gridData.columns.forEach((col, i) => {
    if (col.format === "text") nonNumericColIndices.add(i);
  });

  // Build row format map (skip spacers already filtered)
  const rowFormats: (string | undefined)[] = [undefined];
  for (const row of gridData.rows) {
    if (row.type === "spacer") continue;
    rowFormats.push(row.format);
  }

  // Parse formatted strings back to numbers for proper Excel handling
  for (let r = 1; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (nonNumericColIndices.has(c)) continue;
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell) continue;

      const raw = rawData[r][c];
      if (!raw || raw === "—" || raw === "n/a" || raw === "n/q") continue;

      // Zero-value dashes
      if (raw === "-") {
        const colFormat = gridData.columns[c]?.format;
        const rowFormat = rowFormats[r];
        const effectiveFormat = rowFormat || colFormat;
        cell.t = "n";
        cell.v = 0;
        cell.z = effectiveFormat === "percent" ? "0.0%" : "#,##0";
        continue;
      }

      // Parse formatted value back to number
      const cleaned = raw
        .replace(/[$,%\s()]/g, (match: string) =>
          match === "(" ? "-" : match === ")" ? "" : ""
        )
        .replace(/,/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && isFinite(num)) {
        cell.t = "n";
        const colFormat = gridData.columns[c]?.format;
        const rowFormat = rowFormats[r];
        const effectiveFormat = rowFormat || colFormat;
        if (effectiveFormat === "percent") {
          cell.v = num / 100;
          cell.z = "0.0%";
        } else if (effectiveFormat === "currency") {
          cell.v = num;
          cell.z = "#,##0";
        } else {
          cell.v = num;
        }
      }
    }
  }
}

// ── DealData deserialization (same as compute-workbook) ──

function deserializeDealData(raw: Record<string, unknown>): DealData {
  const deal = raw.deal as DealData["deal"];

  if (deal?.periods) {
    for (const p of deal.periods) {
      if (typeof p.date === "string") p.date = new Date(p.date);
    }
  }
  if (deal?.fiscalYears) {
    for (const fy of deal.fiscalYears) {
      for (const p of fy.periods) {
        if (typeof p.date === "string") p.date = new Date(p.date);
      }
    }
  }

  let monthDates: Date[] = [];
  if (Array.isArray(raw.monthDates)) {
    monthDates = (raw.monthDates as string[]).map((d) =>
      typeof d === "string" ? new Date(d) : d
    );
  }

  const trialBalance = (raw.trialBalance as DealData["trialBalance"]) || [];
  const tbIndex = buildTbIndex(trialBalance);

  return {
    deal,
    accounts: (raw.accounts as DealData["accounts"]) || [],
    trialBalance,
    adjustments: (raw.adjustments as DealData["adjustments"]) || [],
    reclassifications: (raw.reclassifications as DealData["reclassifications"]) || [],
    tbIndex,
    monthDates,
    arAging: (raw.arAging as DealData["arAging"]) || {},
    apAging: (raw.apAging as DealData["apAging"]) || {},
    fixedAssets: (raw.fixedAssets as DealData["fixedAssets"]) || [],
    topCustomers: (raw.topCustomers as DealData["topCustomers"]) || {},
    topVendors: (raw.topVendors as DealData["topVendors"]) || {},
    addbacks: (raw.addbacks as DealData["addbacks"]) || {
      interest: [],
      depreciation: [],
      taxes: [],
    },
    supplementary: raw.supplementary as DealData["supplementary"],
  };
}

// ── Main handler ──

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth validation ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Parse request body ---
    const body = await req.json();
    const dealData = deserializeDealData(body);
    const projectId = dealData.deal?.projectId || body.projectId;

    // --- Fetch bank data for Proof of Cash ---
    let pocBankData: ProofOfCashBankData | undefined;
    if (projectId) {
      try {
        const svcClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

        const { data: bankRows } = await svcClient
          .from("processed_data")
          .select("id, period_start, data")
          .eq("project_id", projectId)
          .eq("data_type", "bank_transactions")
          .order("period_start", { ascending: true })
          .limit(1000000);

        const bankByPeriod = new Map<string, { openingBalance: number; closingBalance: number; totalCredits: number; totalDebits: number }>();
        for (const item of bankRows || []) {
          if (!item.period_start) continue;
          const key = (item.period_start as string).substring(0, 7);
          const d = (item.data as Record<string, unknown>) || {};
          const s = (d.summary as { openingBalance?: number; closingBalance?: number; totalCredits?: number; totalDebits?: number }) || {};
          const existing = bankByPeriod.get(key);
          if (existing) {
            existing.openingBalance += s.openingBalance ?? 0;
            existing.closingBalance += s.closingBalance ?? 0;
            existing.totalCredits += s.totalCredits ?? 0;
            existing.totalDebits += s.totalDebits ?? 0;
          } else {
            bankByPeriod.set(key, {
              openingBalance: s.openingBalance ?? 0,
              closingBalance: s.closingBalance ?? 0,
              totalCredits: s.totalCredits ?? 0,
              totalDebits: s.totalDebits ?? 0,
            });
          }
        }

        const { data: classRow } = await svcClient
          .from("processed_data")
          .select("data")
          .eq("project_id", projectId)
          .eq("data_type", "transfer_classification")
          .maybeSingle();

        let classifications: ProofOfCashBankData["classifications"] = null;
        if (classRow?.data) {
          const raw = classRow.data as Record<string, { interbank?: number; owner?: number; transactions?: { category?: string; amount?: number }[] }>;
          const map = new Map<string, { interbank: number; interbankIn: number; interbankOut: number; owner: number; debt_service: number; capex: number; tax_payments: number }>();
          for (const [period, pd] of Object.entries(raw)) {
            if (period.startsWith("_")) continue;
            let interbankIn = 0;
            let interbankOut = 0;
            const txns = Array.isArray(pd?.transactions) ? pd.transactions : [];
            for (const txn of txns) {
              if (txn.category === "interbank") {
                const amt = txn.amount ?? 0;
                if (amt > 0) interbankIn += amt;
                else interbankOut += Math.abs(amt);
              }
            }
            map.set(period, { interbank: pd?.interbank ?? 0, interbankIn, interbankOut, owner: pd?.owner ?? 0, debt_service: 0, capex: 0, tax_payments: 0 });
          }
          if (map.size > 0) classifications = map;
        }

        if (bankByPeriod.size > 0 || classifications) {
          pocBankData = { bankByPeriod, classifications };
        }
      } catch (e) {
        console.warn("Failed to fetch PoC bank data:", e);
      }
    }

    // --- Build tabs list (including DD Adjustments after QoE) ---
    const tabsToExport: TabDef[] = [];
    for (const tab of WORKBOOK_TABS) {
      tabsToExport.push(tab);
      if (tab.id === "qoe-analysis") {
        tabsToExport.push({ id: "dd-adjustments-1", label: "DD Adjustments I" });
        tabsToExport.push({ id: "dd-adjustments-2", label: "DD Adjustments II" });
      }
    }

    // --- Build workbook ---
    const wb = XLSX.utils.book_new();
    const usedNames = new Set<string>();

    for (const tab of tabsToExport) {
      try {
        let gridData: GridData;
        if (tab.id === "proof-of-cash") {
          gridData = buildProofOfCashGrid(dealData, pocBankData);
        } else {
          const builder = TAB_GRID_BUILDERS[tab.id];
          if (!builder) continue;
          gridData = builder(dealData);
        }
        if (gridData.columns.length === 0) continue;

        const rawData = gridDataToRawData(gridData);
        if (rawData.length === 0) continue;

        const ws = XLSX.utils.aoa_to_sheet(rawData);
        applyFormatting(ws, gridData, rawData);

        const sheetName = safeSheetName(tab.label, usedNames);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      } catch (err) {
        console.warn(`Failed to build tab "${tab.label}":`, err);
      }
    }

    // --- Generate filename ---
    const companyName = dealData.deal.targetCompany || dealData.deal.projectName || "Company";
    const safeName = companyName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
    const outputFilename = `${safeName}_QoE_Workbook.xlsx`;

    // --- Write binary and return ---
    const xlsxBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
      },
    });
  } catch (err) {
    console.error("export-workbook-xlsx error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
