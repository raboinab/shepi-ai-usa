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
        let amountColIdx = -1;
        let balanceColIdx = -1;
        let beginningBalance = 0;
        let endingBalance = 0;
        let txnCount = 0;
        let activity = 0;
        let netSum = 0;

        // Detect column layout. QB GL detail uses one of two shapes:
        //   (a) [..., Amount, Balance] — two trailing dense money columns
        //   (b) [..., Amount]          — one dense money column; derive balance from running sum
        // Require columns to be DENSE (>=50% of sampled DATA rows numeric) before treating them as
        // money. Otherwise stray numerics in doc-num / memo string columns get picked, and the
        // real Amount column ends up mis-classified as Balance — in which case glBalance becomes
        // the LAST transaction's amount instead of the period total.
        const moneyColFreq = new Map<number, number>();
        let sampled = 0;
        for (const r of childRows) {
          if (r.type !== "DATA") continue;
          const cd = r.colData || [];
          for (let i = 0; i < cd.length; i++) {
            if (parseMoney(cd[i]?.value) !== null) {
              moneyColFreq.set(i, (moneyColFreq.get(i) || 0) + 1);
            }
          }
          if (++sampled >= 30) break;
        }
        const minHits = Math.max(3, Math.ceil(sampled * 0.5));
        let moneyIdxsSorted = [...moneyColFreq.entries()]
          .filter(([, n]) => n >= minHits)
          .map(([i]) => i)
          .sort((a, b) => a - b);
        // Tiny sections (<3 DATA rows) can't meet the density floor — fall back to any numeric col.
        if (moneyIdxsSorted.length === 0 && moneyColFreq.size > 0) {
          moneyIdxsSorted = [...moneyColFreq.keys()].sort((a, b) => a - b);
        }
        if (moneyIdxsSorted.length >= 2) {
          balanceColIdx = moneyIdxsSorted[moneyIdxsSorted.length - 1];
          amountColIdx = moneyIdxsSorted[moneyIdxsSorted.length - 2];
        } else if (moneyIdxsSorted.length === 1) {
          amountColIdx = moneyIdxsSorted[0];
          balanceColIdx = -1; // no running balance — derive via sum
        }

        for (const r of childRows) {
          if (r.type !== "DATA") continue;
          const cd = r.colData || [];
          const label = (cd[0]?.value || "").trim().toLowerCase();
          const isBeginning = label === "beginning balance";

          if (isBeginning) {
            // Beginning balance row: the running balance sits in whichever money col it can find
            const bb = balanceColIdx >= 0 ? parseMoney(cd[balanceColIdx]?.value)
                                          : (amountColIdx >= 0 ? parseMoney(cd[amountColIdx]?.value) : null);
            if (bb !== null) beginningBalance = bb;
            continue;
          }

          const amt = amountColIdx >= 0 ? parseMoney(cd[amountColIdx]?.value) : null;
          if (amt !== null) {
            netSum += amt;
            activity += Math.abs(amt);
          }
          if (balanceColIdx >= 0) {
            const rb = parseMoney(cd[balanceColIdx]?.value);
            if (rb !== null) endingBalance = rb;
          }

          let txnDate: string | null = null;
          for (const c of cd) {
            const d = parseDate(c?.value);
            if (d) { txnDate = d; break; }
          }
          if (txnDate) {
            if (!periodStart || txnDate < periodStart) periodStart = txnDate;
            if (!periodEnd || txnDate > periodEnd) periodEnd = txnDate;
          }
          txnCount += 1;
        }

        // glBalance preference: explicit running balance > beginning + net > net alone
        let glBalance: number;
        if (balanceColIdx >= 0 && endingBalance !== 0) glBalance = endingBalance;
        else glBalance = beginningBalance + netSum;

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

    // ── Pull latest TB. Each entry in `monthlyReports` is a single-MONTH QuickBooks TB
    //    (startDate = first of month, endDate = last of month). The values inside behave
    //    differently by account class:
    //      • Balance Sheet (asset/liability/equity): true end-of-month balance →
    //        use the LAST populated month overall ("snapshot").
    //      • Revenue / Expense: YTD-cumulative within a calendar year, RESETS each
    //        January. For a multi-year period we sum the LAST populated month of EACH
    //        calendar year touched ("yearSum").
    //
    //    TB rows are flat with QB stable account `id` and a FULLY-QUALIFIED `value`
    //    (e.g. "Landscaping Services:Job Materials:Decks and Patios"). The same leaf
    //    name often appears under both Income and Expense sections with DIFFERENT ids.
    //    We MUST key series on `acctId` (or full path) — keying on leaf collapses
    //    revenue + expense halves into one bucket and contaminates every match. ──
    const { data: tbRecords } = await supabase
      .from("processed_data").select("data, created_at, period_end")
      .eq("project_id", projectId).eq("data_type", "trial_balance")
      .order("created_at", { ascending: false }).limit(1);

    type TBAcct = {
      id: string;
      fullPath: string;
      leaf: string;
      snapshotDebit: number; snapshotCredit: number;
      yearSumDebit: number;  yearSumCredit: number;
      snapshotBalance: number;
      yearSumBalance: number;
      side: "REVENUE" | "EXPENSE" | "ASSET" | "LIABILITY" | "EQUITY" | "OTHER";
    };
    const tbById = new Map<string, TBAcct>();
    const tbByFullPath = new Map<string, TBAcct>();
    const tbByLeaf = new Map<string, TBAcct[]>();   // multi-value — collisions kept separate
    let tbHas = false;
    let monthlyReportCount = 0;

    // Symmetric normalizer for matching: strip parenthetical suffixes like "(A/R)",
    // lowercase, collapse non-alphanumerics to single spaces, trim.
    const normKey = (s: string): string =>
      (s || "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    const leafOf = (s: string): string => (s || "").split(":").pop()!.trim();

    // Infer which side of the chart a TB account lives on from its root segment.
    // Pure heuristic — gets refined by COA lookup below.
    const inferSide = (fullPath: string): TBAcct["side"] => {
      const root = (fullPath.split(":")[0] || "").toLowerCase();
      if (/^(income|revenue|sales|service|landscaping services|fees|other income)/i.test(root)) return "REVENUE";
      if (/^(cost of (goods sold|labor|sales)|cogs|expense|job expenses|operating|payroll|advertis|insurance|rent|utilit|office|professional|legal|repair|maintenance|depreciation|amortization|interest expense|tax|other expense)/i.test(root)) return "EXPENSE";
      if (/(payable|liabilit|loan|note|credit card|mastercard|visa|line of credit|accrued)/i.test(root)) return "LIABILITY";
      if (/(equity|retained earnings|opening balance|capital|owner|distribut)/i.test(root)) return "EQUITY";
      if (/(checking|savings|cash|bank|receivable|inventory|asset|undeposited|prepaid|fixed|truck|equipment|original cost|accumulated depreciation)/i.test(root)) return "ASSET";
      return "OTHER";
    };

    if (tbRecords && tbRecords.length > 0) {
      const tbData = tbRecords[0].data as Record<string, unknown>;
      const monthly = (tbData.monthlyReports as Array<Record<string, unknown>>) || [];
      monthlyReportCount = monthly.length;

      // Map each monthIdx → calendar year (from monthly[idx].year, fall back to endDate).
      const monthYear: number[] = monthly.map((m) => {
        const y = Number((m as Record<string, unknown>).year);
        if (Number.isFinite(y) && y > 1900) return y;
        const ed = String((m as Record<string, unknown>).endDate || "");
        const ey = parseInt(ed.slice(0, 4), 10);
        return Number.isFinite(ey) ? ey : 0;
      });

      // Build per-account series keyed by stable QB acctId. Different leaves under
      // different parents always have different ids.
      type Series = { id: string; fullPath: string; perMonth: Array<{ debit: number; credit: number }> };
      const series = new Map<string, Series>();

      const walk = (rs: Array<Record<string, unknown>>, monthIdx: number) => {
        for (const r of rs) {
          const cd = (r.colData as Array<Record<string, unknown>>) || [];
          if (cd.length >= 2) {
            const fullPath = String(cd[0]?.value || "").trim();
            const acctId = String(cd[0]?.id || "").trim();
            const debit = parseFloat(String(cd[1]?.value || "0").replace(/[,$]/g, "")) || 0;
            const credit = cd.length >= 3 ? (parseFloat(String(cd[2]?.value || "0").replace(/[,$]/g, "")) || 0) : 0;
            if (fullPath && (debit !== 0 || credit !== 0)) {
              // Prefer id; if QB omitted id, fall back to a path-based synthetic key.
              const key = acctId ? `id:${acctId}` : `path:${fullPath.toLowerCase()}`;
              let s = series.get(key);
              if (!s) {
                s = { id: acctId || key, fullPath, perMonth: [] };
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

      const populatedReportIdxs: number[] = [];
      monthly.forEach((report, idx) => {
        const rows = (((report?.report as Record<string, unknown>)?.rows as Record<string, unknown>)?.row as Array<Record<string, unknown>>) || [];
        if (rows.length > 0) populatedReportIdxs.push(idx);
        walk(rows, idx);
      });
      const lastPopulatedIdx = populatedReportIdxs.length > 0
        ? populatedReportIdxs[populatedReportIdxs.length - 1]
        : -1;

      // Distinct years across the period, ordered.
      const yearsPresent = [...new Set(monthYear.filter((y) => y > 0))].sort((a, b) => a - b);

      for (const [, s] of series) {
        // ── snapshot: value at lastPopulatedIdx, walk back if empty for this account.
        let sDebit = 0, sCredit = 0;
        if (lastPopulatedIdx >= 0 && lastPopulatedIdx < s.perMonth.length) {
          sDebit = s.perMonth[lastPopulatedIdx].debit;
          sCredit = s.perMonth[lastPopulatedIdx].credit;
        }
        if (sDebit === 0 && sCredit === 0) {
          for (let i = Math.min(lastPopulatedIdx, s.perMonth.length - 1); i >= 0; i--) {
            const slot = s.perMonth[i];
            if (slot && (slot.debit !== 0 || slot.credit !== 0)) {
              sDebit = slot.debit; sCredit = slot.credit; break;
            }
          }
        }

        // ── yearSum: for each calendar year, take the highest monthIdx in that year
        //    where this series has any value (the YTD-final for the year), and sum.
        let ySumDr = 0, ySumCr = 0;
        for (const yr of yearsPresent) {
          let bestIdx = -1;
          for (let i = 0; i < s.perMonth.length; i++) {
            if (monthYear[i] !== yr) continue;
            const slot = s.perMonth[i];
            if (slot && (slot.debit !== 0 || slot.credit !== 0)) bestIdx = i;
          }
          if (bestIdx >= 0) {
            ySumDr += s.perMonth[bestIdx].debit;
            ySumCr += s.perMonth[bestIdx].credit;
          }
        }

        const leaf = leafOf(s.fullPath);
        const t: TBAcct = {
          id: s.id,
          fullPath: s.fullPath,
          leaf,
          snapshotDebit: sDebit, snapshotCredit: sCredit,
          yearSumDebit: ySumDr,  yearSumCredit: ySumCr,
          snapshotBalance: sDebit - sCredit,
          yearSumBalance:  ySumDr - ySumCr,
          side: inferSide(s.fullPath),
        };
        tbById.set(s.id, t);
        tbByFullPath.set(normKey(s.fullPath), t);
        const lk = normKey(leaf);
        if (lk) {
          const arr = tbByLeaf.get(lk) || [];
          arr.push(t);
          tbByLeaf.set(lk, arr);
        }
      }
    }
    console.log(`[ANALYZE-GL] TB ingested: ${monthlyReportCount} monthly reports, ${tbById.size} series (by acctId), ${tbByLeaf.size} unique leaves`);

    // ── Enrich GL accounts with TB's fullPath + re-classify via COA when possible.
    //    GL detail gives us leaf-only names with stable ids; TB has the same ids with
    //    full paths. Lifting the full path lets COA-by-fullyQualifiedName work, which
    //    fixes wrong classifications for leaves that exist on both sides of the chart
    //    (Labor: Revenue vs Cost of Labor: Expense, Decks and Patios under both, etc.).
    for (const acct of accounts) {
      const tb = acct.acctNumber ? tbById.get(acct.acctNumber) : undefined;
      if (tb && tb.fullPath && tb.fullPath !== acct.name) {
        (acct as AccountInfo & { fullPath?: string }).fullPath = tb.fullPath;
        // Re-classify via COA fullPath if we now have one and it differs from current.
        const coaFP = coaByName.get(tb.fullPath.toLowerCase());
        if (coaFP) acct.classification = coaFP.classification.toUpperCase();
        else {
          // Heuristic from TB side as a last resort.
          if (acct.classification === "OTHER" && tb.side !== "OTHER") {
            acct.classification = tb.side;
          }
        }
      }
    }

    // ── Reconciliation ──
    const reconciliation: TBComparison[] = [];
    const matchedTbIds = new Set<string>();
    let matchCount = 0, varianceCount = 0, missingInTB = 0;
    let matchBS = 0, matchPL = 0;
    let matchById = 0, matchByFullPath = 0, matchByLeaf = 0, ambiguousLeaf = 0;
    const materialVariances: TBComparison[] = [];
    let varianceLogged = 0;

    for (const acct of accounts) {
      // Skip zero-balance, zero-activity accounts
      if (Math.abs(acct.glBalance) < 0.01 && acct.glActivity < 0.01) continue;

      const isPL = acct.classification === "REVENUE" || acct.classification === "INCOME" ||
                   acct.classification === "OTHER_INCOME" || acct.classification === "EXPENSE" ||
                   acct.classification === "COST_OF_GOODS_SOLD" || acct.classification === "OTHER_EXPENSE";
      const glSide: TBAcct["side"] = (acct.classification === "REVENUE" || acct.classification === "INCOME" || acct.classification === "OTHER_INCOME")
        ? "REVENUE"
        : (acct.classification === "EXPENSE" || acct.classification === "COST_OF_GOODS_SOLD" || acct.classification === "OTHER_EXPENSE")
        ? "EXPENSE"
        : (acct.classification as TBAcct["side"]);

      const fullPath = (acct as AccountInfo & { fullPath?: string }).fullPath || acct.name;

      let tb: TBAcct | undefined;
      let matchedBy = "";

      // 1) by stable id
      if (acct.acctNumber) {
        tb = tbById.get(acct.acctNumber);
        if (tb) { matchedBy = "id"; matchById++; }
      }
      // 2) by full path
      if (!tb && fullPath) {
        tb = tbByFullPath.get(normKey(fullPath));
        if (tb) { matchedBy = "fullPath"; matchByFullPath++; }
      }
      // 3) by leaf — only when exactly one TB candidate sits on the same side of the chart
      if (!tb) {
        const candidates = tbByLeaf.get(normKey(acct.leaf)) || tbByLeaf.get(normKey(leafOf(acct.name))) || [];
        if (candidates.length === 1) {
          tb = candidates[0]; matchedBy = "leaf"; matchByLeaf++;
        } else if (candidates.length > 1) {
          // Filter to candidates compatible with the GL row's side. Treat unknown as compatible.
          const compatible = candidates.filter(c => c.side === "OTHER" || glSide === "OTHER" || c.side === glSide);
          if (compatible.length === 1) {
            tb = compatible[0]; matchedBy = "leaf"; matchByLeaf++;
          } else {
            ambiguousLeaf++;
          }
        }
      }

      if (tb) {
        matchedTbIds.add(tb.id);
        // Pick TB axis by classification: BS uses end-of-period snapshot, P&L sums each
        // year's YTD-final because monthly TBs reset every January.
        const tbBalance = isPL ? tb.yearSumBalance : tb.snapshotBalance;
        const variance = acct.glBalance - tbBalance;
        const absDiffSigned = Math.abs(variance);
        const absDiffMag = Math.abs(Math.abs(acct.glBalance) - Math.abs(tbBalance));
        const absDiff = Math.min(absDiffSigned, absDiffMag);
        const denom = Math.max(Math.abs(acct.glBalance), Math.abs(tbBalance), 1);
        const variancePct = absDiff / denom;
        const isMatch = absDiff < 50 || variancePct < 0.005;
        const cmp: TBComparison = {
          accountName: acct.name,
          glBalance: acct.glBalance,
          tbBalance,
          variance, variancePct,
          status: isMatch ? "match" : "variance",
        };
        reconciliation.push(cmp);
        if (isMatch) { matchCount++; if (isPL) matchPL++; else matchBS++; }
        else {
          varianceCount++;
          if (absDiff > 1000 && variancePct > 0.05) materialVariances.push(cmp);
          if (varianceLogged < 25) {
            console.log(`[ANALYZE-GL] VARIANCE (by ${matchedBy}, ${isPL ? "P&L" : "BS"}): ${acct.name} cls=${acct.classification} gl=${acct.glBalance.toFixed(2)} tb=${tbBalance.toFixed(2)}`);
            varianceLogged++;
          }
        }
      } else if (tbHas) {
        missingInTB++;
        reconciliation.push({
          accountName: acct.name, glBalance: acct.glBalance,
          tbBalance: null, variance: null, variancePct: null, status: "missing_in_tb",
        });
      }
    }
    console.log(`[ANALYZE-GL] Match attempts: id=${matchById}, fullPath=${matchByFullPath}, leaf=${matchByLeaf}, ambiguous-leaf=${ambiguousLeaf}, missingInTB=${missingInTB}`);
    console.log(`[ANALYZE-GL] Reconciliation: matched=${matchCount}/${accounts.length} (BS=${matchBS}, P&L=${matchPL}), variances=${varianceCount}, missingInTB=${missingInTB}`);

    // Accounts in TB but not matched to any GL row (by stable id).
    const missingInGL: { name: string; balance: number }[] = [];
    if (tbHas) {
      for (const [, t] of tbById) {
        if (matchedTbIds.has(t.id)) continue;
        const bal = Math.abs(t.snapshotBalance) > 0.01 ? t.snapshotBalance : t.yearSumBalance;
        if (Math.abs(bal) > 0.01) missingInGL.push({ name: t.fullPath, balance: bal });
      }
    }

    // ── Account-type breakdown ──
    const accountTypeBreakdown: Record<string, number> = {};
    for (const a of accounts) accountTypeBreakdown[a.classification] = (accountTypeBreakdown[a.classification] || 0) + 1;

    // ── Accounting identity: Assets = Liabilities + Equity + (Revenue − Expense)
    //    Handle both sign conventions: detect whether revenues sum positive (debit-positive
    //    convention common in QB GL exports) or negative (true double-entry signed sum). ──
    // Apply Math.abs per-account *before* summing so sign-convention drift between
    // imports (one liability +500, another −300) doesn't net to 200 and mask the real $800.
    let sumAssets = 0, sumLiab = 0, sumEquity = 0, sumRevenue = 0, sumExpense = 0;
    for (const a of accounts) {
      const c = a.classification;
      const v = a.glBalance;
      if (c === "ASSET") sumAssets += v; // assets keep sign so contra-assets net correctly
      else if (c === "LIABILITY") sumLiab += Math.abs(v);
      else if (c === "EQUITY") sumEquity += Math.abs(v);
      else if (c === "REVENUE" || c === "INCOME" || c === "OTHER_INCOME") sumRevenue += Math.abs(v);
      else if (c === "EXPENSE" || c === "COST_OF_GOODS_SOLD" || c === "OTHER_EXPENSE") sumExpense += Math.abs(v);
    }
    const liabAbs = sumLiab;
    const equityAbs = sumEquity;
    const revenueAbs = sumRevenue;
    const expenseAbs = sumExpense;
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
      txnCount: txnCountTotal,
      glDetailSource,
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
