/**
 * compute-workbook Edge Function
 *
 * Accepts serialized DealData via POST and returns pre-computed GridData
 * for all 28 workbook tabs. Keeps proprietary calculation logic server-side.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { DealData, GridData } from "../_shared/workbook/workbook-types.ts";
import { buildTbIndex } from "../_shared/workbook/calculations.ts";
import { TAB_GRID_BUILDERS } from "../_shared/workbook/workbook-grid-builders.ts";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Deserialize the incoming JSON payload into a proper DealData object.
 * - Rebuilds `tbIndex` Map from the `trialBalance` array
 * - Parses ISO date strings back to Date objects on `periods[].date` and `monthDates`
 */
function deserializeDealData(raw: Record<string, unknown>): DealData {
  const deal = raw.deal as DealData["deal"];

  // Parse period dates (sent as ISO strings)
  if (deal?.periods) {
    for (const p of deal.periods) {
      if (typeof p.date === "string") {
        p.date = new Date(p.date);
      }
    }
  }
  if (deal?.fiscalYears) {
    for (const fy of deal.fiscalYears) {
      for (const p of fy.periods) {
        if (typeof p.date === "string") {
          p.date = new Date(p.date);
        }
      }
    }
  }

  // Parse monthDates
  let monthDates: Date[] = [];
  if (Array.isArray(raw.monthDates)) {
    monthDates = (raw.monthDates as string[]).map((d) =>
      typeof d === "string" ? new Date(d) : d
    );
  }

  // Rebuild tbIndex from trialBalance array (Map doesn't survive JSON)
  const trialBalance = (raw.trialBalance as DealData["trialBalance"]) || [];
  const tbIndex = buildTbIndex(trialBalance);

  return {
    deal,
    accounts: (raw.accounts as DealData["accounts"]) || [],
    trialBalance,
    adjustments: (raw.adjustments as DealData["adjustments"]) || [],
    reclassifications:
      (raw.reclassifications as DealData["reclassifications"]) || [],
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

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Parse request body ---
    const body = await req.json();
    const dealData = deserializeDealData(body);

    // --- Compute all workbook grids ---
    const grids: Record<string, GridData> = {};
    for (const [tabId, builderFn] of Object.entries(TAB_GRID_BUILDERS)) {
      try {
        grids[tabId] = builderFn(dealData);
      } catch (err) {
        console.error(`Error building grid for tab "${tabId}":`, err);
        grids[tabId] = { columns: [], rows: [], frozenColumns: 0 };
      }
    }

    // --- Compute wizard report grids (reuse workbook builders) ---
    const WIZARD_TAB_IDS = [
      "income-statement", "balance-sheet", "is-detailed", "bs-detailed",
      "sales", "cogs", "opex", "other-expense", "qoe-analysis",
      "working-capital", "nwc-analysis", "cash", "other-current-assets",
      "other-current-liabilities", "free-cash-flow",
    ];
    const wizardGrids: Record<string, GridData> = {};
    for (const tabId of WIZARD_TAB_IDS) {
      const builderFn = TAB_GRID_BUILDERS[tabId];
      if (!builderFn) continue;
      try {
        wizardGrids[tabId] = builderFn(dealData);
      } catch (err) {
        console.error(`Error building wizard grid for "${tabId}":`, err);
        wizardGrids[tabId] = { columns: [], rows: [], frozenColumns: 0 };
      }
    }

    return new Response(
      JSON.stringify({ grids, wizardGrids }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("compute-workbook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      {
        status: 200, // Error masking pattern per project convention
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
