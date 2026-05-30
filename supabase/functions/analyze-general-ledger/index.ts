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

    // ── Prefer parsing GL detail straight from processed_data (QuickBooks GeneralLedger JSON).
    //    The legacy canonical_transactions rows on some projects have txn_date stuck on the
    //    period-end and empty raw_payload, so they're unreliable for real period/date analysis.
    //    Fall back to canonical_transactions only when processed_data has no GL report. ──
    const acctMap = new Map<string, AccountInfo>();
    let periodStart: string | null = null, periodEnd: string | null = null;
    let txnCountTotal = 0;
    let glDetailSource: "processed_data" | "canonical_transactions" = "processed_data";

    const { data: glProcessed } = await supabase
      .from("processed_data").select("data, period_start, period_end, created_at")
      .eq("project_id", projectId).eq("data_type", "general_ledger")
      .order("created_at", { ascending: false }).limit(1);

    type ColData = { value?: string; id?: string | null };
    type GlRow = { type?: string; colData?: ColData[]; rows?: { row?: GlRow[] }; header?: { colData?: ColData[] }; summary?: { colData?: ColData[] } };

    const parseMoney = (v: string | undefined | null): number | null => {
      if (v === undefined || v === null) return null;
      const cleaned = String(v).replace(/[,$\s]/g, "");
      if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
      return parseFloat(cleaned);
    };
    const parseDate = (v: string | undefined | null): string | null => {
      if (!v) return null;
      const s = String(v).trim();
      const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m1) return `${m1[3]}-${m1[1]}-${m1[2]}`;
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      return null;
    };

    if (glProcessed && glProcessed.length > 0) {
      const gl = glProcessed[0].data as Record<string, unknown>;
      const sections = ((gl.rows as { row?: GlRow[] })?.row || []) as GlRow[];

      for (const section of sections) {
        if (section.type !== "SECTION") continue;
        const hdr = section.header?.colData || [];
        const acctName = (hdr[0]?.value || "").trim();
        const acctId = (hdr[0]?.id || "").toString().trim() || null;
        if (!acctName) continue;

        const childRows = section.rows?.row || [];
        let firstAmountColIdx = -1;
        let lastBalanceColIdx = -1;
        let beginningBalance = 0;
        let endingBalance = 0;
        let txnCount = 0;
        let activity = 0;

        // Convention: the last two money columns in each DATA row are [Amount, Balance].
        // Detect from the first row with two money cells.
        for (const r of childRows) {
          if (r.type !== "DATA") continue;
          const cd = r.colData || [];
          const moneyIdxs: number[] = [];
          for (let i = 0; i < cd.length; i++) {
            if (parseMoney(cd[i]?.value) !== null) moneyIdxs.push(i);
          }
          if (moneyIdxs.length >= 2) {
            lastBalanceColIdx = moneyIdxs[moneyIdxs.length - 1];
            firstAmountColIdx = moneyIdxs[moneyIdxs.length - 2];
            break;
          } else if (moneyIdxs.length === 1 && lastBalanceColIdx === -1) {
            lastBalanceColIdx = moneyIdxs[0];
          }
        }

        for (const r of childRows) {
          if (r.type !== "DATA") continue;
          const cd = r.colData || [];
          const label = (cd[0]?.value || "").trim().toLowerCase();
          const isBeginning = label === "beginning balance";

          if (lastBalanceColIdx >= 0) {
            const rb = parseMoney(cd[lastBalanceColIdx]?.value);
            if (rb !== null) {
              if (isBeginning) beginningBalance = rb;
              else endingBalance = rb;
            }
          }

          if (isBeginning) continue;

          let amt: number | null = null;
          if (firstAmountColIdx >= 0) amt = parseMoney(cd[firstAmountColIdx]?.value);

          let txnDate: string | null = null;
          for (const c of cd) {
            const d = parseDate(c?.value);
            if (d) { txnDate = d; break; }
          }
          if (txnDate) {
            if (!periodStart || txnDate < periodStart) periodStart = txnDate;
            if (!periodEnd || txnDate > periodEnd) periodEnd = txnDate;
          }

          if (amt !== null) activity += Math.abs(amt);
          txnCount += 1;
        }

        // Ending balance from QB running balance is the truth; fall back to net activity.
        const glBalance = endingBalance !== 0 ? endingBalance : (beginningBalance !== 0 ? beginningBalance : 0);

        const key = acctName.toLowerCase();
        const coa = coaByName.get(key) || coaByLeaf.get(normName(acctName)) ||
                    (acctId ? coaByAcctNum.get(acctId) : undefined);

        acctMap.set(key, {
          name: acctName,
          leaf: normName(acctName),
          acctNumber: acctId || coa?.acctNum || null,
          classification: (coa?.classification || "OTHER").toUpperCase(),
          glBalance,
          glActivity: activity,
          txnCount,
        });
        txnCountTotal += txnCount;
      }
      console.log(`[ANALYZE-GL] Parsed ${acctMap.size} accounts / ${txnCountTotal} txns from processed_data GL detail`);
    }

    // Fallback: legacy canonical_transactions path
    if (acctMap.size === 0) {
      glDetailSource = "canonical_transactions";
      type GlTxn = { account_name: string | null; account_number: string | null; amount_signed: number | null; amount_abs: number | null; txn_date: string | null };
      const PAGE = 1000;
      let from = 0;
      const txns: GlTxn[] = [];
      while (true) {
        const { data: page, error: pageErr } = await supabase
          .from("canonical_transactions")
          .select("account_name, account_number, amount_signed, amount_abs, txn_date")
          .eq("project_id", projectId).eq("source_type", "general_ledger")
          .order("txn_date", { ascending: true })
          .range(from, from + PAGE - 1);
        if (pageErr) { console.error("[ANALYZE-GL] GL txn fetch error:", pageErr); break; }
        if (!page || page.length === 0) break;
        txns.push(...(page as GlTxn[]));
        if (page.length < PAGE || txns.length >= 200000) break;
        from += PAGE;
      }
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
          acc = { name, leaf: normName(name), acctNumber: (t.account_number as string) || coa?.acctNum || null,
                  classification: coa?.classification || "OTHER", glBalance: 0, glActivity: 0, txnCount: 0 };
          acctMap.set(key, acc);
        }
        acc.glBalance += signed;
        acc.glActivity += abs;
        acc.txnCount += 1;
      }
      txnCountTotal = txns.length;
      console.log(`[ANALYZE-GL] Fallback: aggregated ${acctMap.size} accounts from ${txns.length} canonical_transactions rows`);
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

    let accounts = Array.from(acctMap.values());

    // ── Dedupe parent-rollup rows. If "X" and "X:Y" both exist with non-zero balances,
    //    "X" is the rollup (QuickBooks GL emits both header and detail rows) → drop it. ──
    {
      const fqByLeafCount = new Map<string, number>();
      for (const a of accounts) {
        if (a.name.includes(":")) {
          const leaf = a.name.split(":").pop()!.toLowerCase().trim();
          fqByLeafCount.set(leaf, (fqByLeafCount.get(leaf) || 0) + 1);
        }
      }
      const namesLower = new Set(accounts.map(a => a.name.toLowerCase()));
      accounts = accounts.filter(a => {
        // Drop bare "X" when a child "X:Y" exists
        const hasChild = !a.name.includes(":") && Array.from(namesLower).some(n => n.startsWith(a.name.toLowerCase() + ":"));
        return !hasChild;
      });
    }
    console.log(`[ANALYZE-GL] Aggregated ${accounts.length} unique accounts (post-rollup dedupe)`);

    // ── Pull latest TB and build CUMULATIVE YTD balance per account by summing
    //    across ALL monthly reports, so it aligns with GL YTD sums (not just last month). ──
    const { data: tbRecords } = await supabase
      .from("processed_data").select("data, created_at, period_end")
      .eq("project_id", projectId).eq("data_type", "trial_balance")
      .order("created_at", { ascending: false }).limit(1);

    type TBAcct = { name: string; debit: number; credit: number; balance: number };
    const tbByLeaf = new Map<string, TBAcct>();
    const tbByName = new Map<string, TBAcct>();
    const tbByAcctNum = new Map<string, TBAcct>();
    let tbHas = false;
    let monthlyReportCount = 0;

    if (tbRecords && tbRecords.length > 0) {
      const tbData = tbRecords[0].data as Record<string, unknown>;
      const monthly = (tbData.monthlyReports as Array<Record<string, unknown>>) || [];
      monthlyReportCount = monthly.length;

      // Build per-account series: for each report (chronological), the {debit, credit}.
      // Then collapse: BS accounts use LAST report's balance (point-in-time); P&L accounts
      // sum across ALL monthly reports (YTD). Classification comes from COA lookup.
      type Series = { name: string; acctId: string | null; perMonth: Array<{ debit: number; credit: number }> };
      const series = new Map<string, Series>();

      const walk = (rs: Array<Record<string, unknown>>, monthIdx: number) => {
        for (const r of rs) {
          const cd = (r.colData as Array<Record<string, unknown>>) || [];
          if (cd.length >= 2) {
            const name = String(cd[0]?.value || "").trim();
            const acctId = String(cd[0]?.id || "").trim();
            const debit = parseFloat(String(cd[1]?.value || "0").replace(/[,$]/g, "")) || 0;
            const credit = cd.length >= 3 ? (parseFloat(String(cd[2]?.value || "0").replace(/[,$]/g, "")) || 0) : 0;
            if (name && (debit !== 0 || credit !== 0)) {
              const key = name.toLowerCase();
              let s = series.get(key);
              if (!s) {
                s = { name, acctId: acctId || null, perMonth: [] };
                series.set(key, s);
              }
              while (s.perMonth.length <= monthIdx) s.perMonth.push({ debit: 0, credit: 0 });
              s.perMonth[monthIdx].debit += debit;
              s.perMonth[monthIdx].credit += credit;
              tbHas = true;
            }
          }
          const nested = (r.rows as Record<string, unknown>)?.row as Array<Record<string, unknown>>;
          if (nested) walk(nested, monthIdx);
        }
      };

      monthly.forEach((report, idx) => {
        const rows = (((report?.report as Record<string, unknown>)?.rows as Record<string, unknown>)?.row as Array<Record<string, unknown>>) || [];
        walk(rows, idx);
      });

      const isBSClass = (c: string) => c === "ASSET" || c === "LIABILITY" || c === "EQUITY";

      for (const [key, s] of series) {
        // Look up classification via COA (name → leaf → acctNum)
        const coa = coaByName.get(key) || coaByLeaf.get(normName(s.name)) ||
                    (s.acctId ? coaByAcctNum.get(s.acctId) : undefined);
        const cls = (coa?.classification || "OTHER").toUpperCase();
        let debit = 0, credit = 0;
        if (isBSClass(cls)) {
          // Point-in-time: take last non-empty monthly snapshot
          for (let i = s.perMonth.length - 1; i >= 0; i--) {
            if (s.perMonth[i].debit !== 0 || s.perMonth[i].credit !== 0) {
              debit = s.perMonth[i].debit;
              credit = s.perMonth[i].credit;
              break;
            }
          }
        } else {
          // P&L (or unknown): sum YTD
          for (const m of s.perMonth) { debit += m.debit; credit += m.credit; }
        }
        const t: TBAcct = { name: s.name, debit, credit, balance: debit - credit };
        tbByName.set(key, t);
        tbByLeaf.set(normName(s.name), t);
        if (s.acctId) tbByAcctNum.set(s.acctId, t);
      }
    }
    console.log(`[ANALYZE-GL] TB has ${tbByLeaf.size} accounts (BS=point-in-time, P&L=YTD-sum across ${monthlyReportCount} monthly reports)`);
    console.log(`[ANALYZE-GL] TB has ${tbByLeaf.size} accounts (cumulative YTD across ${monthlyReportCount} monthly reports)`);

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
        // Sign convention can differ between GL (debit-positive) and TB (credit-balance)
        // especially for revenue/liability/equity accounts. Compare magnitudes for the
        // match decision; preserve signed variance for display.
        const variance = acct.glBalance - tb.balance;
        const absDiffSigned = Math.abs(variance);
        const absDiffMag = Math.abs(Math.abs(acct.glBalance) - Math.abs(tb.balance));
        const absDiff = Math.min(absDiffSigned, absDiffMag);
        const denom = Math.max(Math.abs(acct.glBalance), Math.abs(tb.balance), 1);
        const variancePct = absDiff / denom;
        // Treat <$50 absolute or <0.5% relative as match; <$500 absolute as immaterial
        const isMatch = absDiff < 50 || variancePct < 0.005;
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
          if (absDiff > 1000 && variancePct > 0.05) materialVariances.push(cmp);
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

    // ── Accounting identity: Assets = Liabilities + Equity + (Revenue − Expense)
    //    Handle both sign conventions: detect whether revenues sum positive (debit-positive
    //    convention common in QB GL exports) or negative (true double-entry signed sum). ──
    let sumAssets = 0, sumLiab = 0, sumEquity = 0, sumRevenue = 0, sumExpense = 0;
    for (const a of accounts) {
      const c = a.classification;
      if (c === "ASSET") sumAssets += a.glBalance;
      else if (c === "LIABILITY") sumLiab += a.glBalance;
      else if (c === "EQUITY") sumEquity += a.glBalance;
      else if (c === "REVENUE" || c === "INCOME" || c === "OTHER_INCOME") sumRevenue += a.glBalance;
      else if (c === "EXPENSE" || c === "COST_OF_GOODS_SOLD" || c === "OTHER_EXPENSE") sumExpense += a.glBalance;
    }
    // Normalize to positive magnitudes (credit-balance accounts may be signed negative).
    const liabAbs = Math.abs(sumLiab);
    const equityAbs = Math.abs(sumEquity);
    const revenueAbs = Math.abs(sumRevenue);
    const expenseAbs = Math.abs(sumExpense);
    const netIncome = revenueAbs - expenseAbs;
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
    // Round-number balances — only flag on revenue/expense accounts where round numbers
    // suggest manual journal plugs. Skip assets, liabilities (loan principals), equity,
    // and any account whose name implies a loan/note/mortgage/LOC.
    const loanLike = /loan|note|mortgage|line of credit|capital lease/i;
    for (const a of accounts) {
      const abs = Math.abs(a.glBalance);
      const c = a.classification;
      const isPL = c === "REVENUE" || c === "INCOME" || c === "EXPENSE" || c === "COST_OF_GOODS_SOLD" || c === "OTHER_INCOME" || c === "OTHER_EXPENSE";
      if (isPL && !loanLike.test(a.name) && abs >= 10000 && abs % 1000 === 0) {
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
