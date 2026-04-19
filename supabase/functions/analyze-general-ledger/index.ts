import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Normalize an account name for hierarchical leaf matching:
// "Operating Expenses:Marketing:Ads" → "ads"
const normName = (s: string): string =>
  (s || "").split(":").pop()!.toLowerCase().trim().replace(/\s+/g, " ").replace(/[^\w\s]/g, "");

interface AccountInfo {
  name: string;          // fully qualified (e.g. "Landscaping Services:Job Materials")
  leaf: string;          // normalized leaf name
  acctNumber: string | null;
  classification: string; // ASSET/LIABILITY/EQUITY/INCOME/EXPENSE/OTHER
  glBalance: number;
  glActivity: number;    // sum of |amount_signed| txns in period
  txnCount: number;
}

interface TBComparison {
  accountName: string;
  glBalance: number;
  tbBalance: number | null;
  variance: number | null;
  variancePct: number | null;
  status: "match" | "variance" | "missing_in_tb";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId } = await req.json() as { projectId: string };
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ANALYZE-GL] Starting analysis for project: ${projectId}`);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Pull COA (preferred classification source) ──
    const { data: coaRecords } = await supabase
      .from("processed_data").select("data, created_at")
      .eq("project_id", projectId).eq("data_type", "chart_of_accounts")
      .order("created_at", { ascending: false }).limit(1);

    type CoaEntry = { name: string; classification: string; acctNum: string | null; balance: number };
    const coaByName = new Map<string, CoaEntry>();   // fullyQualified.toLowerCase()
    const coaByLeaf = new Map<string, CoaEntry>();   // normalized leaf
    const coaByAcctNum = new Map<string, CoaEntry>();

    if (coaRecords && coaRecords.length > 0) {
      const arr = coaRecords[0].data as Array<Record<string, unknown>>;
      if (Array.isArray(arr)) {
        for (const a of arr) {
          const name = (a.fullyQualifiedName || a.name || "") as string;
          if (!name) continue;
          const e: CoaEntry = {
            name,
            classification: ((a.classification || "OTHER") as string).toUpperCase(),
            acctNum: (a.acctNum as string) || null,
            balance: Number(a.currentBalance || 0),
          };
          coaByName.set(name.toLowerCase(), e);
          coaByLeaf.set(normName(name), e);
          if (e.acctNum) coaByAcctNum.set(e.acctNum, e);
        }
      }
    }

    // ── Pull canonical GL transactions for the period ──
    const { data: glTxns, error: glErr } = await supabase
      .from("canonical_transactions")
      .select("account_name, account_number, amount_signed, amount_abs, txn_date")
      .eq("project_id", projectId)
      .eq("source_type", "general_ledger")
      .limit(50000);

    if (glErr) console.error("[ANALYZE-GL] GL txn fetch error:", glErr);
    const txns = glTxns || [];
    console.log(`[ANALYZE-GL] Found ${txns.length} GL transactions`);

    // ── Aggregate by account ──
    const acctMap = new Map<string, AccountInfo>();
    let periodStart: string | null = null, periodEnd: string | null = null;

    for (const t of txns) {
      const name = (t.account_name || "Unknown").trim();
      const key = name.toLowerCase();
      const signed = Number(t.amount_signed || 0);
      const abs = Number(t.amount_abs || Math.abs(signed));
      const date = (t.txn_date || "").substring(0, 10);
      if (date) {
        if (!periodStart || date < periodStart) periodStart = date;
        if (!periodEnd || date > periodEnd) periodEnd = date;
      }
      const coa = coaByName.get(key) || coaByLeaf.get(normName(name)) ||
                  (t.account_number ? coaByAcctNum.get(String(t.account_number)) : undefined);
      let acc = acctMap.get(key);
      if (!acc) {
        acc = {
          name,
          leaf: normName(name),
          acctNumber: (t.account_number as string) || coa?.acctNum || null,
          classification: coa?.classification || "OTHER",
          glBalance: 0, glActivity: 0, txnCount: 0,
        };
        acctMap.set(key, acc);
      }
      acc.glBalance += signed;
      acc.glActivity += abs;
      acc.txnCount += 1;
    }

    // Add COA accounts that have no GL activity but have a current balance
    for (const [, coa] of coaByName) {
      const k = coa.name.toLowerCase();
      if (!acctMap.has(k) && Math.abs(coa.balance) > 0.01) {
        acctMap.set(k, {
          name: coa.name, leaf: normName(coa.name),
          acctNumber: coa.acctNum, classification: coa.classification,
          glBalance: coa.balance, glActivity: 0, txnCount: 0,
        });
      }
    }

    const accounts = Array.from(acctMap.values());
    console.log(`[ANALYZE-GL] Aggregated ${accounts.length} unique accounts`);

    // ── Pull latest TB (monthly reports) and build leaf-name index from latest period ──
    const { data: tbRecords } = await supabase
      .from("processed_data").select("data, created_at, period_end")
      .eq("project_id", projectId).eq("data_type", "trial_balance")
      .order("created_at", { ascending: false }).limit(1);

    type TBAcct = { name: string; debit: number; credit: number; balance: number };
    const tbByLeaf = new Map<string, TBAcct>();
    const tbByName = new Map<string, TBAcct>();
    const tbByAcctNum = new Map<string, TBAcct>();
    let tbHas = false;

    if (tbRecords && tbRecords.length > 0) {
      const tbData = tbRecords[0].data as Record<string, unknown>;
      const monthly = (tbData.monthlyReports as Array<Record<string, unknown>>) || [];
      // Use the LAST monthly report (most recent period)
      const lastReport = monthly[monthly.length - 1];
      const rows = (((lastReport?.report as Record<string, unknown>)?.rows as Record<string, unknown>)?.row as Array<Record<string, unknown>>) || [];

      const walk = (rs: Array<Record<string, unknown>>) => {
        for (const r of rs) {
          const cd = (r.colData as Array<Record<string, unknown>>) || [];
          if (cd.length >= 2) {
            const name = String(cd[0]?.value || "").trim();
            const acctId = String(cd[0]?.id || "").trim();
            const debit = parseFloat(String(cd[1]?.value || "0").replace(/[,$]/g, "")) || 0;
            const credit = cd.length >= 3 ? (parseFloat(String(cd[2]?.value || "0").replace(/[,$]/g, "")) || 0) : 0;
            if (name && (debit !== 0 || credit !== 0)) {
              const balance = debit - credit;
              const t: TBAcct = { name, debit, credit, balance };
              tbByName.set(name.toLowerCase(), t);
              tbByLeaf.set(normName(name), t);
              if (acctId) tbByAcctNum.set(acctId, t);
              tbHas = true;
            }
          }
          const nested = (r.rows as Record<string, unknown>)?.row as Array<Record<string, unknown>>;
          if (nested) walk(nested);
        }
      };
      walk(rows);
    }
    console.log(`[ANALYZE-GL] TB has ${tbByLeaf.size} accounts`);

    // ── Reconciliation ──
    const reconciliation: TBComparison[] = [];
    const matchedTbKeys = new Set<string>();
    let matchCount = 0, varianceCount = 0, missingInTB = 0;
    const materialVariances: TBComparison[] = [];

    for (const acct of accounts) {
      // Skip zero-balance, zero-activity accounts
      if (Math.abs(acct.glBalance) < 0.01 && acct.glActivity < 0.01) continue;

      let tb: TBAcct | undefined;
      if (acct.acctNumber) tb = tbByAcctNum.get(acct.acctNumber);
      if (!tb) tb = tbByName.get(acct.name.toLowerCase());
      if (!tb) tb = tbByLeaf.get(acct.leaf);

      if (tb) {
        matchedTbKeys.add(tb.name.toLowerCase());
        const variance = acct.glBalance - tb.balance;
        const absVar = Math.abs(variance);
        const denom = Math.max(Math.abs(acct.glBalance), Math.abs(tb.balance), 1);
        const variancePct = absVar / denom;
        const isMatch = absVar < 1 || variancePct < 0.005;
        const cmp: TBComparison = {
          accountName: acct.name,
          glBalance: acct.glBalance,
          tbBalance: tb.balance,
          variance, variancePct,
          status: isMatch ? "match" : "variance",
        };
        reconciliation.push(cmp);
        if (isMatch) matchCount++;
        else {
          varianceCount++;
          if (absVar > 1000 || variancePct > 0.05) materialVariances.push(cmp);
        }
      } else if (tbHas) {
        missingInTB++;
        reconciliation.push({
          accountName: acct.name, glBalance: acct.glBalance,
          tbBalance: null, variance: null, variancePct: null, status: "missing_in_tb",
        });
      }
    }

    // Accounts in TB but not in GL
    const missingInGL: { name: string; balance: number }[] = [];
    if (tbHas) {
      for (const [k, t] of tbByName) {
        if (!matchedTbKeys.has(k)) {
          // also check leaf match against accounts already covered
          const leaf = normName(t.name);
          const covered = accounts.some(a => a.leaf === leaf || a.name.toLowerCase() === k);
          if (!covered) missingInGL.push({ name: t.name, balance: t.balance });
        }
      }
    }

    // ── Account-type breakdown ──
    const accountTypeBreakdown: Record<string, number> = {};
    for (const a of accounts) accountTypeBreakdown[a.classification] = (accountTypeBreakdown[a.classification] || 0) + 1;

    // ── Accounting identity: Assets − Liabilities − Equity = 0 ──
    let sumAssets = 0, sumLiab = 0, sumEquity = 0, sumIncome = 0, sumExpense = 0;
    for (const a of accounts) {
      switch (a.classification) {
        case "ASSET": sumAssets += a.glBalance; break;
        case "LIABILITY": sumLiab += a.glBalance; break;
        case "EQUITY": sumEquity += a.glBalance; break;
        case "INCOME": sumIncome += a.glBalance; break;
        case "EXPENSE": sumExpense += a.glBalance; break;
      }
    }
    // Liabilities & Equity are typically credit-balances (negative in signed sum) → flip
    const liabAbs = Math.abs(sumLiab);
    const equityAbs = Math.abs(sumEquity);
    const netIncome = Math.abs(sumIncome) - Math.abs(sumExpense);
    const accountingEquationDiff = sumAssets - liabAbs - equityAbs - netIncome;

    // ── Largest accounts by |balance| ──
    const largestAccounts = [...accounts]
      .sort((a, b) => Math.abs(b.glBalance) - Math.abs(a.glBalance))
      .slice(0, 8)
      .map(a => ({ name: a.name, type: a.classification, balance: a.glBalance }));

    // ── Flags ──
    const flags: string[] = [];
    if (!tbHas) flags.push("No Trial Balance loaded — GL↔TB reconciliation skipped");
    if (varianceCount > 0) flags.push(`${varianceCount} account(s) have GL↔TB variances`);
    if (missingInTB > 5) flags.push(`${missingInTB} GL account(s) missing from Trial Balance`);
    if (missingInGL.length > 5) flags.push(`${missingInGL.length} TB account(s) have no GL activity in canonical ledger`);
    if (Math.abs(accountingEquationDiff) > 1000 && tbHas) {
      flags.push(`Accounting equation (A − L − E − NI) off by ${new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(accountingEquationDiff))}`);
    }

    // Suspense / clearing accounts with non-zero balance
    for (const a of accounts) {
      if (/suspense|ask my accountant|clearing/i.test(a.name) && Math.abs(a.glBalance) > 100) {
        flags.push(`Suspense/clearing account "${a.name}" has non-zero balance (${a.glBalance.toFixed(2)})`);
      }
    }
    // Round-number balances on large accounts (potential plug)
    for (const a of accounts) {
      const abs = Math.abs(a.glBalance);
      if (abs >= 10000 && abs % 1000 === 0 && a.classification !== "ASSET") {
        flags.push(`Round-number balance on ${a.name}: ${a.glBalance.toFixed(0)} — possible plug entry`);
      }
    }

    const comparable = matchCount + varianceCount;
    const overallScore = comparable > 0 ? Math.round((matchCount / comparable) * 100) : -1;

    const analysisResult = {
      accountCount: accounts.length,
      txnCount: txns.length,
      accountTypeBreakdown,
      identityCheck: {
        assets: sumAssets,
        liabilities: liabAbs,
        equity: equityAbs,
        netIncome,
        difference: accountingEquationDiff,
        balanced: Math.abs(accountingEquationDiff) <= 1000,
      },
      largestAccounts,
      reconciliation: reconciliation.slice(0, 60),
      reconciliationSummary: {
        matched: matchCount,
        variances: varianceCount,
        missingInTB,
        missingInGL: missingInGL.length,
      },
      materialVariances: materialVariances.sort((a, b) => Math.abs(b.variance!) - Math.abs(a.variance!)).slice(0, 20),
      missingInTBList: reconciliation.filter(r => r.status === "missing_in_tb").slice(0, 30).map(r => ({ name: r.accountName, balance: r.glBalance })),
      missingInGLList: missingInGL.slice(0, 30),
      flags: [...new Set(flags)].slice(0, 25),
      overallScore,
      analyzedAt: new Date().toISOString(),
      sourceUpdatedAt: tbRecords?.[0]?.created_at || null,
      periodStart, periodEnd,
    };

    const { data: projectData } = await supabase
      .from("projects").select("user_id").eq("id", projectId).single();

    const { error: insertError } = await supabase.from("processed_data").insert({
      project_id: projectId,
      user_id: projectData?.user_id || "",
      source_type: "gl_analysis",
      data_type: "general_ledger_analysis",
      data: analysisResult,
      record_count: accounts.length,
      validation_status: "validated",
    });
    if (insertError) console.error("[ANALYZE-GL] Failed to store:", insertError);

    console.log(`[ANALYZE-GL] Complete: ${accounts.length} accounts, ${analysisResult.flags.length} flags, score=${overallScore}, matched=${matchCount}/${comparable}`);

    return new Response(JSON.stringify({ success: true, ...analysisResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ANALYZE-GL] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
