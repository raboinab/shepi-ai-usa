import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import { mapAccountTypeToFSLineItem, mapAccountTypeToFsType, mapAccountTypeToCategory, mapAccountToFields } from "../_shared/qbAccountMappings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/**
 * Complete QB Sync - Triggered by database trigger or frontend polling
 * 
 * This function is called when QuickBooks data is inserted into processed_data.
 * It:
 * 1. Fetches all QB processed_data for the project
 * 2. Finds the active workflow
 * 3. Transforms data to wizard format
 * 4. Updates project wizard_data
 * 5. Marks workflow as complete
 */
Deno.serve(async (req) => {
  console.log("=== COMPLETE-QB-SYNC CALLED ===", {
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
    // Parse payload (from database trigger or direct call)
    const payload = await req.json();
    const { project_id, data_type, record_id } = payload;

    console.log("[complete-qb-sync] Received payload:", {
      project_id,
      data_type,
      record_id,
    });

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: project_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency check: skip if a recent completion is already in progress
    // This prevents parallel trigger invocations from all processing simultaneously
    const { data: recentCompletion } = await supabaseClient
      .from("workflows")
      .select("id, updated_at")
      .eq("project_id", project_id)
      .eq("workflow_type", "SYNC_TO_SHEET")
      .eq("status", "running")
      .gte("updated_at", new Date(Date.now() - 5000).toISOString()) // Updated in last 5 seconds
      .limit(1)
      .maybeSingle();

    if (recentCompletion) {
      console.log("[complete-qb-sync] Skipping - another instance is actively processing:", recentCompletion.id);
      return new Response(
        JSON.stringify({ message: "Another instance is processing", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Debounce: wait 3 seconds for other inserts to complete
    // Multiple data types may be inserted in quick succession
    console.log("[complete-qb-sync] Waiting 3 seconds for batch inserts to complete...");
    await new Promise(r => setTimeout(r, 3000));

    // Find active workflow for this project
    const { data: existingWorkflow, error: workflowError } = await supabaseClient
      .from("workflows")
      .select("*")
      .eq("project_id", project_id)
      .eq("workflow_type", "SYNC_TO_SHEET")
      .in("status", ["pending", "running"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (workflowError) {
      console.error("[complete-qb-sync] Error finding workflow:", workflowError);
    }

    // Fetch project to get user_id for potential recovery workflow
    const { data: projectForRecovery, error: projectLookupError } = await supabaseClient
      .from("projects")
      .select("user_id")
      .eq("id", project_id)
      .single();

    if (projectLookupError) {
      console.error("[complete-qb-sync] Error fetching project for recovery:", projectLookupError);
    }

    let workflow = existingWorkflow;

    // If no active workflow but data is arriving, create a recovery workflow
    if (!workflow) {
      if (!projectForRecovery) {
        console.error("[complete-qb-sync] No workflow and project not found:", project_id);
        return new Response(
          JSON.stringify({ error: "Project not found", skipped: true }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("[complete-qb-sync] No active workflow found, creating recovery workflow for project:", project_id);
      
      const recoveryWorkflowId = crypto.randomUUID();
      const now = new Date().toISOString();
      const recoverySteps = [
        { id: "validate", name: "Validating connection", status: "completed", completed_at: now },
        { id: "fetch_qb", name: "Fetching QuickBooks data", status: "completed", completed_at: now },
        { id: "transform", name: "Transforming data", status: "running", started_at: now },
        { id: "save_data", name: "Saving data", status: "pending" },
        { id: "update_wizard", name: "Updating wizard data", status: "pending" },
      ];

      const { data: newWorkflow, error: createError } = await supabaseClient
        .from("workflows")
        .insert({
          id: recoveryWorkflowId,
          project_id,
          user_id: projectForRecovery.user_id,
          workflow_type: "SYNC_TO_SHEET",
          status: "running",
          progress_percent: 35,
          current_step: "transform",
          steps: recoverySteps,
          input_payload: { 
            recovered: true, 
            triggered_by: "database_trigger", 
            original_data_type: data_type,
            recovery_timestamp: now 
          },
          started_at: now,
        })
        .select()
        .single();

      if (createError) {
        console.error("[complete-qb-sync] Failed to create recovery workflow:", createError);
        // Continue without workflow tracking - data will still be processed
      } else {
        workflow = newWorkflow;
        console.log("[complete-qb-sync] Recovery workflow created:", recoveryWorkflowId);
      }
    }

    // If still no workflow (creation failed), we still process data but can't track
    if (!workflow) {
      console.log("[complete-qb-sync] No workflow available, processing data without tracking");
    }

    // Check if workflow is already completed (idempotency)
    if (workflow?.status === "completed") {
      console.log("[complete-qb-sync] Workflow already completed:", workflow.id);
      return new Response(
        JSON.stringify({ message: "Workflow already completed", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (workflow) {
      console.log("[complete-qb-sync] Found active workflow:", workflow.id);
    }

    let workflowSteps = ((workflow?.steps || []) as Array<{
      id: string;
      name: string;
      status: string;
      started_at?: string;
      completed_at?: string;
      error_message?: string;
    }>);

    // Mark fetch_qb as completed if still running
    workflowSteps = updateStepStatus(workflowSteps, "fetch_qb", "completed");
    workflowSteps = updateStepStatus(workflowSteps, "transform", "running");
    
    if (workflow) {
      await supabaseClient
        .from("workflows")
        .update({
          status: "running",
          progress_percent: 35,
          current_step: "transform",
          steps: workflowSteps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflow.id);
    }

    // Fetch project data
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      console.error("[complete-qb-sync] Project not found:", projectError);
      if (workflow) {
        await markWorkflowFailed(supabaseClient, workflow.id, workflowSteps, "Project not found");
      }
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all processed_data records for this project (both quickbooks and quickbooks_api)
    const { data: processedRecords, error: pdError } = await supabaseClient
      .from("processed_data")
      .select("*")
      .eq("project_id", project_id)
      .in("source_type", ["quickbooks", "quickbooks_api"])
      .order("created_at", { ascending: false });

    if (pdError) {
      console.error("[complete-qb-sync] Failed to fetch processed_data:", pdError);
      if (workflow) {
        await markWorkflowFailed(supabaseClient, workflow.id, workflowSteps, "Failed to fetch QuickBooks data");
      }
      return new Response(
        JSON.stringify({ error: "Failed to fetch processed data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[complete-qb-sync] Found ${processedRecords?.length || 0} processed_data records`);

    // Transform processed_data into wizard_data format
    let wizardData = (project.wizard_data || {}) as Record<string, unknown>;
    const projectUpdates: Record<string, unknown> = {};

    // Aggregate trial_balance records across all periods
    const trialBalanceRecords = (processedRecords || [])
      .filter(r => r.data_type === "trial_balance")
      .sort((a, b) => new Date(a.period_start || 0).getTime() - new Date(b.period_start || 0).getTime());

    console.log(`[complete-qb-sync] Found ${trialBalanceRecords.length} trial_balance records to aggregate`);

    // Get latest record for each other data_type
    const latestByType = new Map<string, typeof processedRecords[0]>();
    for (const record of processedRecords || []) {
      if (record.data_type === "trial_balance") continue;
      if (!latestByType.has(record.data_type)) {
        latestByType.set(record.data_type, record);
      }
    }

    console.log("[complete-qb-sync] Data types found:", Array.from(latestByType.keys()));

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
      console.log("[complete-qb-sync] Processing chart_of_accounts...");
      wizardData.chartOfAccounts = withSyncMetadata(
        transformQBChartOfAccounts(chartOfAccountsRecord.data) as Record<string, unknown>
      );
      latestByType.delete("chart_of_accounts");
    }

    // Aggregate trial_balance records
    if (trialBalanceRecords.length > 0) {
      console.log(`[complete-qb-sync] Aggregating ${trialBalanceRecords.length} trial_balance periods...`);
      const aggregatedTB = aggregateTrialBalanceRecords(
        trialBalanceRecords,
        wizardData.chartOfAccounts as { accounts: unknown[] } | undefined
      );
      wizardData.trialBalance = withSyncMetadata(aggregatedTB as Record<string, unknown>);
    }

    // Process other data types
    for (const [dataType, record] of latestByType) {
      console.log(`[complete-qb-sync] Processing ${dataType}...`);
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
        case "journal_entries":
          wizardData.journalEntries = withSyncMetadata(transformQBJournalEntries(record.data) as Record<string, unknown>);
          break;
        default:
          wizardData[dataType] = withSyncMetadata(record.data as Record<string, unknown>);
      }
    }

    console.log("[complete-qb-sync] Merged wizardData keys:", Object.keys(wizardData));

    // Update workflow: transform complete, starting update_wizard
    workflowSteps = updateStepStatus(workflowSteps, "transform", "completed");
    workflowSteps = updateStepStatus(workflowSteps, "update_wizard", "running");
    
    if (workflow) {
      await supabaseClient
        .from("workflows")
        .update({
          progress_percent: 55,
          current_step: "update_wizard",
          steps: workflowSteps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflow.id);
    }

    // Save wizard_data to project
    console.log("[complete-qb-sync] Saving wizard_data to project...");
    
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
      console.error("[complete-qb-sync] Failed to save wizard_data:", updateError);
      // Continue anyway - data is in processed_data
    } else {
      console.log("[complete-qb-sync] wizard_data saved successfully");
    }

    // Update workflow: wizard saved, mark save_data step
    workflowSteps = updateStepStatus(workflowSteps, "update_wizard", "completed");
    workflowSteps = updateStepStatus(workflowSteps, "save_data", "running");
    
    if (workflow) {
      await supabaseClient
        .from("workflows")
        .update({
          progress_percent: 70,
          current_step: "save_data",
          steps: workflowSteps,
          updated_at: new Date().toISOString(),
        })
        .eq("id", workflow.id);
    }

    // Data already saved to wizard_data above — skip legacy sheet push
    console.log("[complete-qb-sync] Data saved to wizard_data, skipping legacy sheet push");

    // Mark workflow as completed
    workflowSteps = updateStepStatus(workflowSteps, "save_data", "completed");
    
    if (workflow) {
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
            synced_at: new Date().toISOString(),
            triggered_by: "database_trigger",
          },
        })
        .eq("id", workflow.id);
    }

    console.log("[complete-qb-sync] Sync completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        workflow_id: workflow?.id || null,
        wizard_data_keys: Object.keys(wizardData),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[complete-qb-sync] Unexpected error:", err);
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
// Transform Functions
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
      const accountSubtype = String(a.AccountSubType || a.accountSubType || "");
      
      // SIMPLIFIED: Direct lookup using 154-row mapping table
      // The table IS the source of truth - no fallback chain needed
      const mapped = mapAccountToFields(accountType, accountSubtype);
      
      accounts.push({
        accountNumber: acctNum || qbId,  // Fallback to QB ID if no account number
        accountName,
        accountId: qbId,
        fsType: mapAccountTypeToFsType(accountType),
        category: mapAccountTypeToCategory(accountType),
        accountType,
        accountSubtype,
        classification: String(a.Classification || a.classification || ""),  // Store for reference
        fsLineItem: mapped.fsLineItem,  // Direct lookup - no trust chain
        subAccount1: mapped.subAccount1,
        subAccount2: mapped.subAccount2,
        subAccount3: mapped.subAccount3,
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


// NOTE: Trust chain helper functions (normalizeClassification, normalizeCategoryToFsLineItem,
// isValidFsLineItem, VALID_FS_LINE_ITEMS) have been removed.
// The 154-row mapping table with _DEFAULT entries is now the single source of truth.
// See mapAccountToFields() in _shared/qbAccountMappings.ts

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
  
  // Build COA lookup maps (by accountNumber AND accountName for flexible matching)
  const coaByNumber = new Map<string, Record<string, unknown>>();
  const coaByName = new Map<string, Record<string, unknown>>();
  
  if (coaData?.accounts) {
    for (const acct of coaData.accounts as Array<Record<string, unknown>>) {
      const num = String(acct.accountNumber || acct.accountId || "");
      const name = String(acct.accountName || "").toLowerCase().trim();
      if (num) coaByNumber.set(num, acct);
      if (name) coaByName.set(name, acct);
    }
  }
  
  console.log(`[aggregateTrialBalance] Processing ${records.length} records, COA has ${coaByNumber.size} accounts by number, ${coaByName.size} by name`);
  
  for (const record of records) {
    // Generate period ID matching frontend format (YYYY-MM-DD for end of period)
    // Use period_end if available, otherwise period_start
    const periodDate = record.period_end || record.period_start || "";
    // Use YYYY-MM format to match frontend Period.id from periodUtils.ts
    const periodId = periodDate ? periodDate.substring(0, 7) : "unknown";
    
    const data = record.data as Record<string, unknown>;
    
    // FIRST: Try Java-enriched format: { accounts: [...] } with pre-computed fields
    const enrichedAccounts = (data.accounts || []) as Array<Record<string, unknown>>;
    if (enrichedAccounts.length > 0) {
      console.log(`[aggregateTrialBalance] Processing ${enrichedAccounts.length} Java-enriched accounts for period ${periodId}`);
      
      for (const acct of enrichedAccounts) {
        const accountNumber = String(acct.accountNumber || acct.accountId || acct.Id || "");
        const accountName = String(acct.accountName || acct.Name || "");
        if (!accountNumber && !accountName) continue;
        
        const key = accountNumber || accountName;
        const balance = Number(acct.balance ?? acct.currentBalance ?? acct.Amount ?? 0);
        
        if (accountMap.has(key)) {
          const existing = accountMap.get(key)!;
          (existing.monthlyValues as Record<string, number>)[periodId] = balance;
        } else {
          // COA cross-reference for enrichment
          const coaMatch = coaByNumber.get(accountNumber) || 
                          (accountName ? coaByName.get(accountName.toLowerCase().trim()) : undefined);
          
          // Determine account type and subtype - prefer Java-provided, fall back to COA
          const accountType = String(acct.accountType || coaMatch?.accountType || coaMatch?.category || "");
          const accountSubtype = String(acct.accountSubtype || coaMatch?.accountSubtype || "");
          
          // Use QB-provided enrichment fields directly, with mapping table as fallback
          const qbFsLineItem = String(acct.fsLineItem || "");
          const qbSubAccount1 = String(acct.subAccount1 || "");
          const qbSubAccount2 = String(acct.subAccount2 || "");
          const qbSubAccount3 = String(acct.subAccount3 || "");
          
          // Only fall back to mapping table if QB didn't provide values
          const mapped = (!qbFsLineItem) ? mapAccountToFields(accountType, accountSubtype) : null;
          
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
    
    // FALLBACK: Raw QB report format with Rows/Row/ColData structure
    const rows = (data.Rows as Record<string, unknown>)?.Row ||
                 (data.rows as Record<string, unknown>)?.row || [];
    
    if (!Array.isArray(rows)) continue;
    
    console.log(`[aggregateTrialBalance] Processing ${rows.length} raw QB rows for period ${periodId}`);
    
    for (const row of rows) {
      const r = row as Record<string, unknown>;
      if (r.type === "Section") continue;
      
      const colData = (r.ColData || r.colData || []) as Array<Record<string, unknown>>;
      if (colData.length < 2) continue;
      
      const accountName = (colData[0]?.value || "") as string;
      if (!accountName || accountName.toLowerCase().includes("total")) continue;
      
      const accountNumber = ((colData[0] as Record<string, unknown>)?.id || "") as string;
      
      // FIXED: Read both Debit (col 1) and Credit (col 2) columns
      // Net balance = Debit - Credit (standard accounting convention)
      // Assets/Expenses have normal debit balances (positive)
      // Liabilities/Equity/Revenue have normal credit balances (negative after this calc)
      const debit = parseFloat((colData[1]?.value || "0") as string) || 0;
      const credit = parseFloat((colData[2]?.value || "0") as string) || 0;
      const amount = debit - credit;
      
      const key = accountNumber || accountName;
      
      if (accountMap.has(key)) {
        const existing = accountMap.get(key)!;
        const monthlyValues = existing.monthlyValues as Record<string, number>;
        monthlyValues[periodId] = amount;
      } else {
        // Extract row-level data
        const rowAccountType = String(r.accountType || "");
        const rowAccountSubtype = String(r.accountSubtype || r.accountSubType || "");
        
        // COA cross-reference
        const coaMatch = coaByNumber.get(accountNumber) || 
                        coaByName.get(accountName.toLowerCase().trim());
        
        // Determine final account type and subtype
        const accountType = rowAccountType || String(coaMatch?.accountType || coaMatch?.category || "");
        const accountSubtype = rowAccountSubtype || String(coaMatch?.accountSubtype || "");
        
        // Use QB-provided enrichment fields directly, with mapping table as fallback
        const qbFsLineItem = String(r.fsLineItem || "");
        const qbSubAccount1 = String(r.subAccount1 || "");
        const qbSubAccount2 = String(r.subAccount2 || "");
        const qbSubAccount3 = String(r.subAccount3 || "");
        
        const mapped = (!qbFsLineItem) ? mapAccountToFields(accountType, accountSubtype) : null;
        
        accountMap.set(key, {
          accountName,
          accountNumber,
          fsType: String(r.fsType || "") || coaMatch?.fsType || mapAccountTypeToFsType(accountType),
          accountType,
          accountSubtype,
          fsLineItem: qbFsLineItem || mapped?.fsLineItem || "",
          subAccount1: qbSubAccount1 || mapped?.subAccount1 || "",
          subAccount2: qbSubAccount2 || mapped?.subAccount2 || "",
          subAccount3: qbSubAccount3 || mapped?.subAccount3 || "",
          _matchedFromCOA: !!coaMatch,
          monthlyValues: { [periodId]: amount },
        });
      }
    }
  }
  
  const accounts = Array.from(accountMap.values());
  const matchedCount = accounts.filter(a => a._matchedFromCOA).length;
  console.log(`[aggregateTrialBalance] Aggregated ${accounts.length} accounts, ${matchedCount} matched from COA`);
  
  return {
    accounts,
    periodCount: records.length,
    syncSource: "quickbooks",
  };
}

// ============================================
// Account Type to FS Line Item Mapping
// ============================================
// mapAccountTypeToFSLineItem is imported from ../_shared/qbAccountMappings.ts

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
        a.fsType || "BS",                              // Column B: FS Type
        String(a.accountNumber || a.accountId || ""),  // Column C: Account #
        a.accountName || "",                           // Column D: Account Name
        a.fsLineItem || "",                            // Column E: FS Line Item (FIXED)
        a.accountSubtype || "",                        // Column F: Sub-account 1
        "",                                            // Column G: Sub-account 2
        "",                                            // Column H: Sub-account 3
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

// ============================================
// Journal Entries Transform
// ============================================

function transformQBJournalEntries(qbData: unknown): Record<string, unknown> {
  const data = qbData as { data?: unknown[]; count?: number; period_start?: string; period_end?: string };
  const rawEntries = data.data || [];
  
  const entries = (rawEntries as Record<string, unknown>[]).map((je) => {
    const lines = ((je.line || []) as Record<string, unknown>[]).map((line) => {
      const detail = (line.journalEntryLineDetail || {}) as Record<string, unknown>;
      const accountRef = (detail.accountRef || {}) as Record<string, unknown>;
      return {
        accountName: String(accountRef.name || ""),
        accountId: String(accountRef.value || ""),
        amount: Number(line.amount) || 0,
        postingType: String(detail.postingType || ""),
      };
    });

    // Parse QB date format: "Dec 17, 2025, 12:00:00 AM" → "2025-12-17"
    let txnDate = String(je.txnDate || "");
    try {
      const parsed = new Date(txnDate);
      if (!isNaN(parsed.getTime())) {
        txnDate = parsed.toISOString().substring(0, 10);
      }
    } catch { /* keep original */ }

    const totalDebit = lines.filter(l => l.postingType === "DEBIT").reduce((s, l) => s + l.amount, 0);

    return {
      id: String(je.id || ""),
      txnDate,
      totalAmount: totalDebit,
      isAdjustment: !!(je.adjustment),
      memo: String((je as Record<string, unknown>).privateNote || (je as Record<string, unknown>).description || ""),
      lines,
    };
  });

  // Sort by date descending
  entries.sort((a, b) => b.txnDate.localeCompare(a.txnDate));

  return {
    entries,
    totalCount: entries.length,
  };
}
