import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch COA data
    const { data: coaRecords } = await supabase
      .from("processed_data")
      .select("data")
      .eq("project_id", project_id)
      .eq("data_type", "chart_of_accounts")
      .order("created_at", { ascending: false })
      .limit(1);

    // Fetch Trial Balance data
    const { data: tbRecords } = await supabase
      .from("processed_data")
      .select("data, period_start, period_end")
      .eq("project_id", project_id)
      .eq("data_type", "trial_balance")
      .order("period_start", { ascending: true })
      .limit(1000000);

    if ((!coaRecords || coaRecords.length === 0) && (!tbRecords || tbRecords.length === 0)) {
      return new Response(JSON.stringify({
        flagged_count: 0,
        message: "No Chart of Accounts or Trial Balance data found. Please sync QuickBooks data first.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract COA accounts
    const coaData = coaRecords?.[0]?.data;
    let coaAccounts: any[] = [];
    if (coaData) {
      if (Array.isArray(coaData)) {
        coaAccounts = coaData;
      } else if (typeof coaData === "object") {
        coaAccounts = (coaData as any).accounts || (coaData as any).Accounts || [];
      }
    }

    // Extract TB accounts with balances
    interface TBAccount {
      accountName: string;
      accountNumber?: string;
      fsType?: string;
      category?: string;
      classification?: string;
      accountSubtype?: string;
      balances: Record<string, number>;
    }

    const tbAccountMap = new Map<string, TBAccount>();

    // Helper to parse a colData row into account name + balance
    function parseColDataRow(colData: any[]): { name: string; balance: number } | null {
      if (!colData || colData.length < 2) return null;
      const accountName = colData[0]?.value || "";
      if (!accountName || accountName === "Total" || accountName.startsWith("Total ") || accountName === "Account") return null;

      let balance: number;
      if (colData.length >= 3) {
        // 3-column format: [name, debit, credit] — balance = debit - credit
        const debit = parseFloat(String(colData[1]?.value || "0").replace(/[^0-9.-]/g, "")) || 0;
        const credit = parseFloat(String(colData[2]?.value || "0").replace(/[^0-9.-]/g, "")) || 0;
        balance = debit - credit;
      } else {
        // 2-column format: [name, balance]
        balance = parseFloat(colData[colData.length - 1]?.value || "0");
      }
      if (isNaN(balance) || balance === 0) return null;
      return { name: accountName, balance };
    }

    // Helper to upsert a parsed row into tbAccountMap
    function addToMap(accountName: string, balance: number, periodLabel: string) {
      const key = accountName.toLowerCase().trim();
      if (!tbAccountMap.has(key)) {
        tbAccountMap.set(key, { accountName, balances: {} });
      }
      tbAccountMap.get(key)!.balances[String(periodLabel)] = balance;
    }

    // Helper to process QB API nested rows (Rows.Row with ColData)
    function processApiRows(rowList: any[], periodLabel: string, parentAccount?: string) {
      for (const row of rowList) {
        if (row.Rows?.Row) {
          processApiRows(row.Rows.Row, periodLabel, row.Header?.ColData?.[0]?.value || parentAccount);
        }
        const colData = row.ColData || row.colData;
        const parsed = parseColDataRow(colData);
        if (parsed) addToMap(parsed.name, parsed.balance, periodLabel);
      }
    }

    for (const record of tbRecords || []) {
      const data = record.data as any;
      if (!data) continue;

      const periodLabel = record.period_end || record.period_start || "unknown";

      // Format 1: qbToJson monthlyReports array
      if (data.monthlyReports && Array.isArray(data.monthlyReports)) {
        for (const mr of data.monthlyReports) {
          const mrPeriod = mr.reportDate || mr.endDate || mr.report?.header?.endPeriod || periodLabel;
          // Normalized rows (array of objects with accountName/debit/credit)
          if (mr.rows && Array.isArray(mr.rows)) {
            for (const row of mr.rows) {
              const name = row.accountName || row.name || "";
              const balance = (row.debit || 0) - (row.credit || 0);
              if (name && balance !== 0) addToMap(name, balance, mrPeriod);
            }
          }
          // Raw QB colData format (report.rows.row)
          else if (mr.report?.rows?.row && Array.isArray(mr.report.rows.row)) {
            for (const rawRow of mr.report.rows.row) {
              const colData = rawRow.colData || rawRow.ColData;
              const parsed = parseColDataRow(colData);
              if (parsed) addToMap(parsed.name, parsed.balance, mrPeriod);
            }
          }
        }
        continue;
      }

      // Format 2: QB API format (Rows.Row with nested ColData)
      const rows = data.Rows?.Row || data.rows || data.accounts || [];
      if (Array.isArray(rows)) processApiRows(rows, periodLabel);
    }

    // Merge COA metadata into TB accounts
    for (const coa of coaAccounts) {
      const name = (coa.Name || coa.name || coa.accountName || "").toLowerCase().trim();
      if (!name) continue;

      const existing = tbAccountMap.get(name);
      if (existing) {
        existing.fsType = coa.fsType || coa.accountType || "";
        existing.category = coa.category || "";
        existing.classification = coa.classification || coa.Classification || "";
        existing.accountSubtype = coa.accountSubType || coa.accountSubtype || "";
        existing.accountNumber = coa.AcctNum || coa.acctNum || coa.accountNumber || "";
      } else {
        tbAccountMap.set(name, {
          accountName: coa.Name || coa.name || coa.accountName || "",
          accountNumber: coa.AcctNum || coa.acctNum || coa.accountNumber || "",
          fsType: coa.fsType || coa.accountType || "",
          category: coa.category || "",
          classification: coa.classification || coa.Classification || "",
          accountSubtype: coa.accountSubType || coa.accountSubtype || "",
          balances: {},
        });
      }
    }

    const accountList = Array.from(tbAccountMap.values());
    if (accountList.length === 0) {
      return new Response(JSON.stringify({
        flagged_count: 0,
        message: "No accounts found to analyze.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build account summary payload
    // IS accounts: sum all periods (cumulative activity)
    // BS accounts: use latest period ending balance (not cumulative)
    const accountSummary = accountList.map((a) => {
      const periodKeys = Object.keys(a.balances).sort();
      // Always use latest period balance — TB data is cumulative YTD,
      // so summing all months would massively overstate the amount
      const representativeBalance = periodKeys.length > 0
        ? a.balances[periodKeys[periodKeys.length - 1]]
        : 0;

      return {
        name: a.accountName,
        number: a.accountNumber || "",
        fsType: a.fsType || "",
        category: a.category || "",
        classification: a.classification || "",
        subtype: a.accountSubtype || "",
        totalBalance: Math.round(representativeBalance),
        periodCount: periodKeys.length,
      };
    });

    // Get user_id from project
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", project_id)
      .single();

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for existing active job to prevent duplicates
    const { data: existingJobs } = await supabase
      .from("reclassification_jobs")
      .select("id, status")
      .eq("project_id", project_id)
      .in("status", ["pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingJobs && existingJobs.length > 0) {
      const existingJob = existingJobs[0];

      // Check staleness — if job hasn't been updated in 10 minutes, mark it failed and allow re-run
      const STALE_THRESHOLD_MS = 10 * 60 * 1000;
      const { data: jobDetail } = await supabase
        .from("reclassification_jobs")
        .select("updated_at")
        .eq("id", existingJob.id)
        .single();

      const jobAge = Date.now() - new Date(jobDetail?.updated_at || 0).getTime();

      if (jobAge > STALE_THRESHOLD_MS) {
        console.log(`Marking stale job ${existingJob.id} as failed (age: ${Math.round(jobAge / 1000)}s)`);
        await supabase
          .from("reclassification_jobs")
          .update({ status: "failed", error_message: "Timed out (stale)", updated_at: new Date().toISOString() })
          .eq("id", existingJob.id);
        // Fall through to create a new job below
      } else {
        console.log(`Returning existing active job ${existingJob.id} (status: ${existingJob.status}) for project ${project_id}`);
        return new Response(JSON.stringify({
          job_id: existingJob.id,
          status: existingJob.status,
          accounts_count: accountSummary.length,
          message: `Analysis already in progress. Reconnecting to existing job.`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get project industry info for enhanced context
    const { data: projectInfo } = await supabase
      .from("projects")
      .select("industry")
      .eq("id", project_id)
      .single();

    // Enqueue the job instead of calling AI directly
    const { data: job, error: jobError } = await supabase
      .from("reclassification_jobs")
      .insert({
        project_id,
        user_id: project.user_id,
        status: "pending",
        input_payload: {
          account_summary: accountSummary,
          accounts_count: accountSummary.length,
          industry: projectInfo?.industry || 'general',
          has_coa_data: coaData && Object.keys(coaData).length > 0,
          has_tb_data: tbRecords && tbRecords.length > 0,
        },
      })
      .select("id")
      .single();

    if (jobError) {
      console.error("Failed to create reclassification job:", jobError.message);
      return new Response(JSON.stringify({ error: "Failed to enqueue analysis job" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enqueued reclassification job ${job.id} for project ${project_id} with ${accountSummary.length} accounts`);

    return new Response(JSON.stringify({
      job_id: job.id,
      status: "pending",
      accounts_count: accountSummary.length,
      message: `Analysis queued for ${accountSummary.length} accounts. Results will appear shortly.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-reclassifications error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
