import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import { mapAccountTypeToFsType, mapAccountTypeToCategory, mapAccountToFields, mapAccountTypeToFSLineItem } from "../_shared/qbAccountMappings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * QB Sync Complete - Webhook Callback Handler
 * 
 * Called by the Java QuickBooks service when sync completes.
 * This function:
 * 1. Validates the API key from the Java service
 * 2. Fetches processed_data from the database
 * 3. Transforms to wizard_data format
 * 4. Updates wizard_data
 * 5. Updates the workflow status
 */
Deno.serve(async (req) => {
  console.log("=== QB-SYNC-COMPLETE CALLED ===", {
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Validate API key from Java service
    // Accept the same API keys as db-proxy for consistency
    const apiKey = req.headers.get("X-API-Key") || req.headers.get("x-api-key");
    const validApiKeys = [
      Deno.env.get("QUICKBOOKS_API_KEY"),
      Deno.env.get("QB_AUTH_API_KEY"),
      Deno.env.get("QBTOJSON_API_KEY"),
    ].filter(Boolean) as string[];
    
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      console.error("[qb-sync-complete] Invalid or missing API key. Received:", 
        apiKey ? `${apiKey.substring(0, 8)}...` : "none",
        "| Valid keys configured:", validApiKeys.length);
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("[qb-sync-complete] Authenticated successfully");

    // Parse callback payload
    const payload = await req.json();
    const { 
      workflow_id, 
      project_id, 
      status, 
      records_synced, 
      duration_ms, 
      error_message 
    } = payload;

    console.log("[qb-sync-complete] Received callback:", {
      workflow_id,
      project_id,
      status,
      records_synced,
      duration_ms,
      error_message: error_message?.substring(0, 100),
    });

    if (!workflow_id || !project_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: workflow_id, project_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UUID validation regex
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUUID = UUID_REGEX.test(workflow_id);
    
    // Determine if this is a test mode callback (non-UUID workflow_id)
    let isTestMode = !isValidUUID;
    let workflow: Record<string, unknown> | null = null;

    if (isValidUUID) {
      // Fetch current workflow state only if valid UUID
      const { data: workflowData, error: workflowError } = await supabaseClient
        .from("workflows")
        .select("*")
        .eq("id", workflow_id)
        .single();

      if (workflowError || !workflowData) {
        console.warn("[qb-sync-complete] Workflow not found for UUID:", workflow_id, workflowError);
        isTestMode = true; // Valid UUID format but doesn't exist - treat as test
      } else {
        workflow = workflowData;
      }
    } else {
      console.warn(`[qb-sync-complete] Invalid workflow_id format: ${workflow_id} - treating as test callback`);
    }

    if (isTestMode) {
      console.log("[qb-sync-complete] TEST MODE: Processing data without workflow tracking");
    }

    let workflowSteps = ((workflow?.steps as unknown[]) || []) as Array<{
      id: string;
      name: string;
      status: string;
      started_at?: string;
      completed_at?: string;
      error_message?: string;
    }>;

    // Handle error status from Java service
    if (status === "error") {
      console.error("[qb-sync-complete] QB sync failed:", error_message);
      
      if (!isTestMode) {
        workflowSteps = updateStepStatus(workflowSteps, "fetch_qb", "failed", error_message);
        
        await supabaseClient
          .from("workflows")
          .update({
            status: "failed",
            error_message: error_message || "QuickBooks sync failed",
            error_details: { code: "QB_SYNC_FAILED", duration_ms },
            steps: workflowSteps,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", workflow_id);
      } else {
        console.log("[qb-sync-complete] TEST MODE: Skipping workflow failure update");
      }

      return new Response(
        JSON.stringify({ success: false, error: error_message, test_mode: isTestMode }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Success path: Continue with transform and push
    console.log("[qb-sync-complete] QB fetch completed, starting transform...");

    // Mark fetch_qb as completed, start transform (only if not test mode)
    if (!isTestMode) {
      workflowSteps = updateStepStatus(workflowSteps, "fetch_qb", "completed");
      workflowSteps = updateStepStatus(workflowSteps, "transform", "running");
      
      await supabaseClient
        .from("workflows")
        .update({
          progress_percent: 35,
          current_step: "transform",
          steps: workflowSteps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflow_id);
    }

    // Fetch project data
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      console.error("[qb-sync-complete] Project not found:", projectError);
      if (!isTestMode) {
        await markWorkflowFailed(supabaseClient, workflow_id, workflowSteps, "Project not found");
      }
      return new Response(
        JSON.stringify({ error: "Project not found", test_mode: isTestMode }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all processed_data records for this project
    const { data: processedRecords, error: pdError } = await supabaseClient
      .from("processed_data")
      .select("*")
      .eq("project_id", project_id)
      .eq("source_type", "quickbooks_api")
      .order("created_at", { ascending: false })
      .limit(1000000);

    if (pdError) {
      console.error("[qb-sync-complete] Failed to fetch processed_data:", pdError);
      if (!isTestMode) {
        await markWorkflowFailed(supabaseClient, workflow_id, workflowSteps, "Failed to fetch QuickBooks data");
      }
      return new Response(
        JSON.stringify({ error: "Failed to fetch processed data", test_mode: isTestMode }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[qb-sync-complete] Found ${processedRecords?.length || 0} processed_data records`);

    // Transform processed_data into wizard_data format
    let wizardData = (project.wizard_data || {}) as Record<string, unknown>;
    const projectUpdates: Record<string, unknown> = {};

    // Aggregate trial_balance records across all periods
    const trialBalanceRecords = (processedRecords || [])
      .filter(r => r.data_type === "trial_balance")
      .sort((a, b) => new Date(a.period_start || 0).getTime() - new Date(b.period_start || 0).getTime());

    console.log(`[qb-sync-complete] Found ${trialBalanceRecords.length} trial_balance records to aggregate`);

    // Get latest record for each other data_type
    const latestByType = new Map<string, typeof processedRecords[0]>();
    for (const record of processedRecords || []) {
      if (record.data_type === "trial_balance") continue;
      if (!latestByType.has(record.data_type)) {
        latestByType.set(record.data_type, record);
      }
    }

    console.log("[qb-sync-complete] Data types found:", Array.from(latestByType.keys()));

    // Helper to add sync metadata
    const syncTimestamp = new Date().toISOString();
    const withSyncMetadata = <T extends Record<string, unknown>>(data: T): T & { syncSource: string; lastSyncDate: string } => ({
      ...data,
      syncSource: "quickbooks",
      lastSyncDate: syncTimestamp,
    });

    // Process chart_of_accounts first (needed for trial_balance enrichment)
    const chartOfAccountsRecord = latestByType.get("chart_of_accounts");
    if (chartOfAccountsRecord) {
      console.log("[qb-sync-complete] Processing chart_of_accounts...");
      wizardData.chartOfAccounts = withSyncMetadata(
        transformQBChartOfAccounts(chartOfAccountsRecord.data) as Record<string, unknown>
      );
      latestByType.delete("chart_of_accounts");
    }

    // Aggregate trial_balance records
    if (trialBalanceRecords.length > 0) {
      console.log(`[qb-sync-complete] Aggregating ${trialBalanceRecords.length} trial_balance periods...`);
      const aggregatedTB = aggregateTrialBalanceRecords(
        trialBalanceRecords,
        wizardData.chartOfAccounts as { accounts: unknown[] } | undefined
      );
      wizardData.trialBalance = withSyncMetadata(aggregatedTB as Record<string, unknown>);
    }

    // Process other data types
    for (const [dataType, record] of latestByType) {
      console.log(`[qb-sync-complete] Processing ${dataType}...`);
      switch (dataType) {
        case "balance_sheet":
          wizardData.balanceSheet = withSyncMetadata(record.data as Record<string, unknown>);
          break;
        case "income_statement":
          wizardData.incomeStatement = withSyncMetadata(record.data as Record<string, unknown>);
          break;
        case "cash_flow":
          wizardData.cashFlow = withSyncMetadata(transformQBCashFlow(record.data) as Record<string, unknown>);
          break;
        case "general_ledger":
          wizardData.generalLedger = withSyncMetadata(transformQBGeneralLedger(record.data) as Record<string, unknown>);
          break;
        case "ar_aging":
          wizardData.arAging = withSyncMetadata(transformQBARAging(record.data) as Record<string, unknown>);
          break;
        case "ap_aging":
          wizardData.apAging = withSyncMetadata(transformQBAPAging(record.data) as Record<string, unknown>);
          break;
        case "customer_concentration":
          wizardData.topCustomers = withSyncMetadata(transformQBCustomers(record.data) as Record<string, unknown>);
          break;
        case "vendor_concentration":
          wizardData.topVendors = withSyncMetadata(transformQBVendors(record.data) as Record<string, unknown>);
          break;
        case "employees":
          wizardData.employees = withSyncMetadata(transformQBEmployees(record.data) as Record<string, unknown>);
          break;
        case "company_info":
          wizardData.companyInfo = withSyncMetadata(transformQBCompanyInfo(record.data) as Record<string, unknown>);
          const companyInfo = wizardData.companyInfo as Record<string, unknown>;
          if (companyInfo.companyName && !project.target_company) {
            projectUpdates.target_company = companyInfo.companyName;
          }
          if (companyInfo.industry && !project.industry) {
            projectUpdates.industry = companyInfo.industry;
          }
          break;
        case "fixed_assets":
          wizardData.fixedAssets = withSyncMetadata(transformQBFixedAssets(record.data) as Record<string, unknown>);
          break;
        case "inventory":
          wizardData.inventory = withSyncMetadata(transformQBInventory(record.data) as Record<string, unknown>);
          break;
        default:
          wizardData[dataType] = withSyncMetadata(record.data as Record<string, unknown>);
      }
    }

    console.log("[qb-sync-complete] Merged wizardData keys:", Object.keys(wizardData));

    // Update workflow: transform complete, starting update_wizard (only if not test mode)
    if (!isTestMode) {
      workflowSteps = updateStepStatus(workflowSteps, "transform", "completed");
      workflowSteps = updateStepStatus(workflowSteps, "update_wizard", "running");
      
      await supabaseClient
        .from("workflows")
        .update({
          progress_percent: 55,
          current_step: "update_wizard",
          steps: workflowSteps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflow_id);
    }

    // Save wizard_data to project
    console.log("[qb-sync-complete] Saving wizard_data to project...");
    
    // Add root-level sync timestamp for UI display
    wizardData._lastSyncedAt = syncTimestamp;
    
    const updatePayload: Record<string, unknown> = {
      wizard_data: wizardData,
      updated_at: new Date().toISOString(),
    };

    if (projectUpdates.target_company) updatePayload.target_company = projectUpdates.target_company;
    if (projectUpdates.industry) updatePayload.industry = projectUpdates.industry;

    const { error: updateError } = await supabaseClient
      .from("projects")
      .update(updatePayload)
      .eq("id", project_id);

    if (updateError) {
      console.error("[qb-sync-complete] Failed to save wizard_data:", updateError);
      // Continue anyway - data is in processed_data
    } else {
      console.log("[qb-sync-complete] wizard_data saved successfully");
    }

    // Update workflow: wizard saved, starting sheets push (only if not test mode)
    if (!isTestMode) {
      workflowSteps = updateStepStatus(workflowSteps, "update_wizard", "completed");
      workflowSteps = updateStepStatus(workflowSteps, "save_data", "running");
      
      await supabaseClient
        .from("workflows")
        .update({
          progress_percent: 70,
          current_step: "save_data",
          steps: workflowSteps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflow_id);
    }

    // Data is already saved to wizard_data above — mark save_data step complete
    console.log("[qb-sync-complete] Data saved to wizard_data, skipping legacy sheet push");

    // Mark workflow as completed (only if not test mode)
    if (!isTestMode) {
      workflowSteps = updateStepStatus(workflowSteps, "save_data", "completed");
      
      await supabaseClient
        .from("workflows")
        .update({
          status: "completed",
          progress_percent: 100,
          current_step: null,
          steps: workflowSteps,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          output_payload: {
          wizard_data_keys: Object.keys(wizardData),
            records_synced: records_synced || 0,
            duration_ms: duration_ms || 0,
            synced_at: new Date().toISOString(),
          },
        })
        .eq("id", workflow_id);
    }

    console.log(`[qb-sync-complete] ${isTestMode ? 'TEST MODE: ' : ''}Processing completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        test_mode: isTestMode,
        workflow_id,
        wizard_data_keys: Object.keys(wizardData),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[qb-sync-complete] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================
// Helper Functions
// ============================================

function updateStepStatus(
  steps: Array<{ id: string; name: string; status: string; started_at?: string; completed_at?: string; error_message?: string }>,
  stepId: string,
  status: "pending" | "running" | "completed" | "failed" | "skipped",
  errorMessage?: string
): Array<{ id: string; name: string; status: string; started_at?: string; completed_at?: string; error_message?: string }> {
  return steps.map((step) => {
    if (step.id === stepId) {
      return {
        ...step,
        status,
        ...(status === "running" ? { started_at: new Date().toISOString() } : {}),
        ...(status === "completed" || status === "failed" ? { completed_at: new Date().toISOString() } : {}),
        ...(errorMessage ? { error_message: errorMessage } : {}),
      };
    }
    return step;
  });
}

// deno-lint-ignore no-explicit-any
async function markWorkflowFailed(
  supabaseClient: any,
  workflowId: string,
  steps: Array<{ id: string; name: string; status: string }>,
  errorMessage: string
) {
  await supabaseClient
    .from("workflows")
    .update({
      status: "failed",
      error_message: errorMessage,
      steps,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", workflowId);
}

// ============================================
// Transform Functions (copied from sync-sheet)
// ============================================

function transformQBChartOfAccounts(qbData: unknown): Record<string, unknown> {
  const data = qbData as Record<string, unknown>;
  const accounts: unknown[] = [];
  
  const queryResponse = data.QueryResponse || data.queryResponse || {};
  const rawAccounts = (queryResponse as Record<string, unknown>).Account || 
                      (data.accounts || data.Accounts || []);
  
  if (Array.isArray(rawAccounts)) {
    for (const acct of rawAccounts) {
      const a = acct as Record<string, unknown>;
      
      // Extract QB ID and account number with proper fallbacks
      // This matches the logic in chartOfAccountsUtils.ts for consistency
      const qbId = String(a.Id || a.id || "");
      const acctNum = String(a.AcctNum || a.acctNum || a.accountNumber || a.number || "");
      
      // Use fullyQualifiedName as fallback for hierarchical account names
      const accountName = String(
        a.Name || a.name || a.accountName || a.FullyQualifiedName || a.fullyQualifiedName || ""
      );
      
      const accountType = String(a.AccountType || a.accountType || "");
      accounts.push({
        accountNumber: acctNum || qbId,  // Fallback to QB ID if no account number
        accountName,
        accountId: qbId,
        fsType: mapAccountTypeToFsType(accountType),
        category: mapAccountTypeToCategory(accountType),
        accountType,
        accountSubtype: a.AccountSubType || a.accountSubType || "",
        balance: a.CurrentBalance || a.currentBalance || 0,
        active: a.Active !== false && a.active !== false,
      });
    }
  }
  
  return {
    accounts,
    lastSyncDate: new Date().toISOString(),
    syncSource: "quickbooks",
  };
}

function transformQBCashFlow(qbData: unknown): Record<string, unknown> {
  return { ...(qbData as Record<string, unknown>), syncSource: "quickbooks" };
}

function transformQBGeneralLedger(qbData: unknown): Record<string, unknown> {
  return { ...(qbData as Record<string, unknown>), syncSource: "quickbooks" };
}

function transformQBARAging(qbData: unknown): Record<string, unknown> {
  const data = qbData as Record<string, unknown>;
  const entries: unknown[] = [];
  
  const rows = (data.Rows as Record<string, unknown>)?.Row ||
               (data.rows as Record<string, unknown>)?.row || [];
  const header = (data.header || data.Header || {}) as Record<string, unknown>;
  
  const endPeriod = header.endPeriod || header.EndPeriod || header.reportDate;
  const periodId = endPeriod ? `as_of_${(endPeriod as string).substring(0, 7)}` : "current";
  
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      if (r.type === "Section") continue;
      
      const colData = (r.ColData || r.colData || []) as Array<Record<string, unknown>>;
      if (colData.length < 3) continue;
      
      const customerName = (colData[0]?.value || "") as string;
      if (!customerName || customerName.toLowerCase().includes("total")) continue;
      
      entries.push({
        customer: customerName,
        current: parseFloat((colData[1]?.value || "0") as string) || 0,
        days1to30: parseFloat((colData[2]?.value || "0") as string) || 0,
        days31to60: parseFloat((colData[3]?.value || "0") as string) || 0,
        days61to90: parseFloat((colData[4]?.value || "0") as string) || 0,
        days90plus: parseFloat((colData[5]?.value || "0") as string) || 0,
        total: parseFloat((colData[6]?.value || "0") as string) || 0,
      });
    }
  }
  
  return { periodData: [{ periodId, entries }], syncSource: "quickbooks" };
}

function transformQBAPAging(qbData: unknown): Record<string, unknown> {
  const data = qbData as Record<string, unknown>;
  const entries: unknown[] = [];
  
  const rows = (data.Rows as Record<string, unknown>)?.Row ||
               (data.rows as Record<string, unknown>)?.row || [];
  const header = (data.header || data.Header || {}) as Record<string, unknown>;
  
  const endPeriod = header.endPeriod || header.EndPeriod || header.reportDate;
  const periodId = endPeriod ? `as_of_${(endPeriod as string).substring(0, 7)}` : "current";
  
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      if (r.type === "Section") continue;
      
      const colData = (r.ColData || r.colData || []) as Array<Record<string, unknown>>;
      if (colData.length < 3) continue;
      
      const vendorName = (colData[0]?.value || "") as string;
      if (!vendorName || vendorName.toLowerCase().includes("total")) continue;
      
      entries.push({
        vendor: vendorName,
        current: parseFloat((colData[1]?.value || "0") as string) || 0,
        days1to30: parseFloat((colData[2]?.value || "0") as string) || 0,
        days31to60: parseFloat((colData[3]?.value || "0") as string) || 0,
        days61to90: parseFloat((colData[4]?.value || "0") as string) || 0,
        days90plus: parseFloat((colData[5]?.value || "0") as string) || 0,
        total: parseFloat((colData[6]?.value || "0") as string) || 0,
      });
    }
  }
  
  return { periodData: [{ periodId, entries }], syncSource: "quickbooks" };
}

function transformQBCustomers(qbData: unknown): Record<string, unknown> {
  const data = qbData as Record<string, unknown>;
  const customers: Array<Record<string, unknown>> = [];
  
  const rawCustomers = (data.customers || data.Customers || []) as unknown[];
  for (const cust of rawCustomers) {
    const c = cust as Record<string, unknown>;
    customers.push({
      name: c.name || c.CustomerName || c.Name || "",
      yearlyRevenue: c.yearlyRevenue || { [new Date().getFullYear()]: c.revenue || 0 },
    });
  }
  
  return { customers: customers.slice(0, 10), syncSource: "quickbooks" };
}

function transformQBVendors(qbData: unknown): Record<string, unknown> {
  const data = qbData as Record<string, unknown>;
  const vendors: Array<Record<string, unknown>> = [];
  
  const rawVendors = (data.vendors || data.Vendors || []) as unknown[];
  for (const vend of rawVendors) {
    const v = vend as Record<string, unknown>;
    vendors.push({
      name: v.name || v.VendorName || v.Name || "",
      yearlySpend: v.yearlySpend || { [new Date().getFullYear()]: v.spend || 0 },
    });
  }
  
  return { vendors: vendors.slice(0, 10), syncSource: "quickbooks" };
}

function transformQBEmployees(qbData: unknown): Record<string, unknown> {
  return { ...(qbData as Record<string, unknown>), syncSource: "quickbooks" };
}

function transformQBCompanyInfo(qbData: unknown): Record<string, unknown> {
  const data = qbData as Record<string, unknown>;
  return {
    companyName: data.CompanyName || data.companyName || "",
    legalName: data.LegalName || data.legalName || "",
    industry: data.IndustryType || data.industryType || "",
    fiscalYearStartMonth: data.FiscalYearStartMonth || data.fiscalYearStartMonth || "",
    syncSource: "quickbooks",
  };
}

function transformQBFixedAssets(qbData: unknown): Record<string, unknown> {
  return { ...(qbData as Record<string, unknown>), syncSource: "quickbooks" };
}

function transformQBInventory(qbData: unknown): Record<string, unknown> {
  return { ...(qbData as Record<string, unknown>), syncSource: "quickbooks" };
}

function aggregateTrialBalanceRecords(
  records: Array<{ data: unknown; period_start?: string; period_end?: string }>,
  coaData?: { accounts: unknown[] }
): Record<string, unknown> {
  const accountMap = new Map<string, Record<string, unknown>>();
  
  // Build COA lookup map
  const coaLookup = new Map<string, Record<string, unknown>>();
  if (coaData?.accounts) {
    for (const acct of coaData.accounts as Array<Record<string, unknown>>) {
      const key = String(acct.accountNumber || acct.accountId || "");
      if (key) coaLookup.set(key, acct);
    }
  }
  
  for (const record of records) {
    const periodDate = record.period_end || record.period_start || "";
    // Use YYYY-MM format to match frontend Period.id from periodUtils.ts
    const periodId = periodDate ? periodDate.substring(0, 7) : "unknown";
    const data = record.data as Record<string, unknown>;
    
    // FIRST: Try Java-enriched format with accounts array
    const enrichedAccounts = (data.accounts || []) as Array<Record<string, unknown>>;
    if (enrichedAccounts.length > 0) {
      for (const acct of enrichedAccounts) {
        const accountNumber = String(acct.accountNumber || acct.accountId || "");
        const accountName = String(acct.accountName || acct.name || "");
        if (!accountNumber || !accountName) continue;
        
        const key = accountNumber;
        const balance = parseFloat(String(acct.balance || acct.amount || 0)) || 0;
        const coaMatch = coaLookup.get(accountNumber);
        const accountType = String(acct.accountType || coaMatch?.accountType || "");
        const accountSubtype = String(acct.accountSubtype || coaMatch?.accountSubtype || "");
        
        // Use QB-provided enrichment fields directly, with mapping table as fallback
        const qbFsLineItem = String(acct.fsLineItem || "");
        const qbSubAccount1 = String(acct.subAccount1 || "");
        const qbSubAccount2 = String(acct.subAccount2 || "");
        const qbSubAccount3 = String(acct.subAccount3 || "");
        
        const mapped = (!qbFsLineItem) ? mapAccountToFields(accountType, accountSubtype) : null;
        
        if (accountMap.has(key)) {
          const existing = accountMap.get(key)!;
          (existing.monthlyValues as Record<string, number>)[periodId] = balance;
        } else {
          accountMap.set(key, {
            accountNumber,
            accountName,
            fsType: String(acct.fsType || "") || coaMatch?.fsType || mapAccountTypeToFsType(accountType),
            accountType,
            accountSubtype,
            fsLineItem: qbFsLineItem || mapped?.fsLineItem || "",
            subAccount1: qbSubAccount1 || mapped?.subAccount1 || "",
            subAccount2: qbSubAccount2 || mapped?.subAccount2 || "",
            subAccount3: qbSubAccount3 || mapped?.subAccount3 || "",
            _matchedFromCOA: !!coaMatch,
            monthlyValues: { [periodId]: balance },
          });
        }
      }
      continue;
    }
    
    // FALLBACK: Raw format with rows.row
    const rows = (data.Rows as Record<string, unknown>)?.Row ||
                 (data.rows as Record<string, unknown>)?.row || [];
    if (!Array.isArray(rows)) continue;
    
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      if (r.type === "Section") continue;
      
      const colData = (r.ColData || r.colData || []) as Array<Record<string, unknown>>;
      if (colData.length < 2) continue;
      
      const accountName = (colData[0]?.value || "") as string;
      if (!accountName || accountName.toLowerCase().includes("total")) continue;
      
      const accountNumber = ((colData[0] as Record<string, unknown>)?.id || "") as string;
      const debit = parseFloat((colData[1]?.value || "0") as string) || 0;
      const credit = parseFloat((colData[2]?.value || "0") as string) || 0;
      const amount = debit - credit;
      
      const key = accountNumber;
      const coaEntry = coaLookup.get(accountNumber);
      const accountType = String(r.accountType || coaEntry?.accountType || "");
      const accountSubtype = String(r.accountSubtype || coaEntry?.accountSubtype || "");
      
      // Use QB-provided enrichment fields directly, with mapping table as fallback
      const qbFsLineItem = String(r.fsLineItem || "");
      const qbSubAccount1 = String(r.subAccount1 || "");
      const qbSubAccount2 = String(r.subAccount2 || "");
      const qbSubAccount3 = String(r.subAccount3 || "");
      
      const mapped = (!qbFsLineItem) ? mapAccountToFields(accountType, accountSubtype) : null;
      
      if (accountMap.has(key)) {
        const existing = accountMap.get(key)!;
        (existing.monthlyValues as Record<string, number>)[periodId] = amount;
      } else {
        accountMap.set(key, {
          accountName,
          accountNumber,
          fsType: String(r.fsType || "") || coaEntry?.fsType || mapAccountTypeToFsType(accountType),
          accountType,
          accountSubtype,
          fsLineItem: qbFsLineItem || mapped?.fsLineItem || "",
          subAccount1: qbSubAccount1 || mapped?.subAccount1 || "",
          subAccount2: qbSubAccount2 || mapped?.subAccount2 || "",
          subAccount3: qbSubAccount3 || mapped?.subAccount3 || "",
          _matchedFromCOA: !!coaEntry,
          monthlyValues: { [periodId]: amount },
        });
      }
    }
  }
  
  return {
    accounts: Array.from(accountMap.values()),
    periodCount: records.length,
    syncSource: "quickbooks",
  };
}

// ============================================
// Sheet Transform Functions
// ============================================

type CellUpdate = { range: string; values: unknown[][] };

function isCellBasedUpdate(data: unknown): data is CellUpdate[] {
  return Array.isArray(data) && data.length > 0 && 
         typeof data[0] === "object" && data[0] !== null && "range" in data[0];
}

function getStartRowForTab(tabName: string): number {
  const startRows: Record<string, number> = {
    "Due Diligence Information": 10,
    "Trial Balance": 8,
    "AR Aging": 5,
    "AP Aging": 5,
    "Fixed Assets": 2,
    "Top Customers by Year": 2,
    "Top Vendors by Year": 2,
  };
  return startRows[tabName] || 2;
}

function getColumnLetter(colNum: number): string {
  let letter = "";
  let num = colNum;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    num = Math.floor((num - 1) / 26);
  }
  return letter || "A";
}

function transformWizardToSheetFormat(
  wizardData: Record<string, unknown>,
  project: Record<string, unknown>
): Record<string, unknown[][] | CellUpdate[]> {
  const result: Record<string, unknown[][] | CellUpdate[]> = {};

  // Due Diligence Information
  if (project) {
    result["Due Diligence Information"] = dueDiligenceToUpdates(project);
  }

  // Trial Balance
  if (wizardData.trialBalance) {
    result["Trial Balance"] = trialBalanceToUpdates(
      wizardData.trialBalance,
      (project.periods || []) as unknown[]
    );
  }

  // AR Aging
  if (wizardData.arAging) {
    result["AR Aging"] = arAgingToSheet(wizardData.arAging);
  }

  // AP Aging
  if (wizardData.apAging) {
    result["AP Aging"] = apAgingToSheet(wizardData.apAging);
  }

  // Fixed Assets
  if (wizardData.fixedAssets) {
    result["Fixed Assets"] = fixedAssetsToSheet(wizardData.fixedAssets);
  }

  // Top Customers
  if (wizardData.topCustomers) {
    result["Top Customers by Year"] = topCustomersToSheet(wizardData.topCustomers);
  }

  // Top Vendors
  if (wizardData.topVendors) {
    result["Top Vendors by Year"] = topVendorsToSheet(wizardData.topVendors);
  }

  return result;
}

function dueDiligenceToUpdates(project: Record<string, unknown>): CellUpdate[] {
  const updates: CellUpdate[] = [];
  const tabName = "Due Diligence Information";
  
  updates.push({ range: `'${tabName}'!C5`, values: [[project.client_name || ""]] });
  updates.push({ range: `'${tabName}'!C6`, values: [[project.target_company || project.name || ""]] });
  updates.push({ range: `'${tabName}'!C7`, values: [[project.transaction_type || ""]] });
  updates.push({ range: `'${tabName}'!C8`, values: [[project.industry || ""]] });
  updates.push({ range: `'${tabName}'!C22`, values: [["USD $"]] });
  
  return updates;
}

function trialBalanceToUpdates(data: unknown, periods: unknown[]): CellUpdate[] {
  const updates: CellUpdate[] = [];
  const tabName = "Trial Balance";
  
  const accounts = (data as { accounts?: unknown[] })?.accounts || [];
  const regularPeriods = (periods as Array<Record<string, unknown>>)
    .filter(p => !p.isStub)
    .sort((a, b) => {
      const yearDiff = Number(a.year || 0) - Number(b.year || 0);
      if (yearDiff !== 0) return yearDiff;
      return Number(a.month || 0) - Number(b.month || 0);
    });
  
  if (regularPeriods.length === 0 || accounts.length === 0) return updates;
  
  const startYear = Number(regularPeriods[0].year);
  const startMonth = Number(regularPeriods[0].month);
  const dateToCol = buildDateToColumnMap(startYear, startMonth);
  const periodIdToDate = buildPeriodIdToDateMap(regularPeriods);
  
  accounts.forEach((acct: unknown, idx: number) => {
    const a = acct as Record<string, unknown>;
    const row = 8 + idx;
    
    updates.push({
      range: `'${tabName}'!B${row}:H${row}`,
      values: [[
        a.fsType || "BS",
        String(a.accountNumber || a.accountId || ""),
        a.accountName || "",
        String(a.fsLineItem || "") || mapAccountTypeToFSLineItem(String(a.accountType || "")) || "",
        String(a.subAccount1 || a.accountSubtype || ""),
        String(a.subAccount2 || ""),
        String(a.subAccount3 || ""),
      ]],
    });
    
    const monthlyValues = (a.monthlyValues || {}) as Record<string, number>;
    for (const [periodId, amount] of Object.entries(monthlyValues)) {
      const dateStr = periodIdToDate.get(periodId) || periodId;
      const col = dateToCol.get(dateStr);
      if (col) {
        updates.push({ range: `'${tabName}'!${col}${row}`, values: [[amount]] });
      }
    }
  });
  
  return updates;
}

function buildDateToColumnMap(startYear: number, startMonth: number): Map<string, string> {
  const map = new Map<string, string>();
  let year = startYear;
  let month = startMonth;
  
  for (let i = 0; i < 47; i++) {
    const lastDay = new Date(year, month, 0).getDate();
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const colNum = 9 + i;
    map.set(dateStr, getColumnLetter(colNum));
    
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return map;
}

function buildPeriodIdToDateMap(periods: Array<Record<string, unknown>>): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of periods) {
    const year = Number(p.year);
    const month = Number(p.month);
    const lastDay = new Date(year, month, 0).getDate();
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    
    const periodId = String(p.id || `${year}-${String(month).padStart(2, "0")}`);
    map.set(periodId, dateStr);
    
    const yearMonthKey = `${year}-${String(month).padStart(2, "0")}`;
    if (!map.has(yearMonthKey)) map.set(yearMonthKey, dateStr);
    if (!map.has(dateStr)) map.set(dateStr, dateStr);
  }
  return map;
}

function arAgingToSheet(data: unknown): unknown[][] {
  const periodData = (data as { periodData?: unknown[] })?.periodData || [];
  const rows: unknown[][] = [];
  
  for (const period of periodData) {
    const p = period as { periodId?: string; entries?: unknown[] };
    for (const entry of p.entries || []) {
      const e = entry as Record<string, unknown>;
      rows.push([
        e.customer || "",
        e.current || 0,
        e.days1to30 || 0,
        e.days31to60 || 0,
        e.days61to90 || 0,
        e.days90plus || 0,
        e.total || 0,
      ]);
    }
  }
  
  return rows;
}

function apAgingToSheet(data: unknown): unknown[][] {
  const periodData = (data as { periodData?: unknown[] })?.periodData || [];
  const rows: unknown[][] = [];
  
  for (const period of periodData) {
    const p = period as { periodId?: string; entries?: unknown[] };
    for (const entry of p.entries || []) {
      const e = entry as Record<string, unknown>;
      rows.push([
        e.vendor || "",
        e.current || 0,
        e.days1to30 || 0,
        e.days31to60 || 0,
        e.days61to90 || 0,
        e.days90plus || 0,
        e.total || 0,
      ]);
    }
  }
  
  return rows;
}

function fixedAssetsToSheet(data: unknown): unknown[][] {
  const assets = (data as { assets?: unknown[] })?.assets || [];
  return assets.map((asset: unknown) => {
    const a = asset as Record<string, unknown>;
    return [
      a.description || "",
      a.category || "",
      a.acquisitionDate || "",
      a.cost || 0,
      a.accumDepreciation || 0,
      a.netBookValue || 0,
    ];
  });
}

function topCustomersToSheet(data: unknown): unknown[][] {
  const customers = (data as { customers?: unknown[] })?.customers || [];
  if (customers.length === 0) return [];
  
  const firstCustomer = customers[0] as Record<string, unknown>;
  const yearlyRevenue = (firstCustomer.yearlyRevenue || {}) as Record<string, number>;
  const years = Object.keys(yearlyRevenue).sort();
  
  return customers.map((cust: unknown) => {
    const c = cust as Record<string, unknown>;
    const revenue = (c.yearlyRevenue || {}) as Record<string, number>;
    return [c.name || "", ...years.map(y => revenue[y] || 0)];
  });
}

function topVendorsToSheet(data: unknown): unknown[][] {
  const vendors = (data as { vendors?: unknown[] })?.vendors || [];
  if (vendors.length === 0) return [];
  
  const firstVendor = vendors[0] as Record<string, unknown>;
  const yearlySpend = (firstVendor.yearlySpend || {}) as Record<string, number>;
  const years = Object.keys(yearlySpend).sort();
  
  return vendors.map((vend: unknown) => {
    const v = vend as Record<string, unknown>;
    const spend = (v.yearlySpend || {}) as Record<string, number>;
    return [v.name || "", ...years.map(y => spend[y] || 0)];
  });
}
