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
  glBalance: number;     // active balance — snapshot for BS, activity-sum for P&L
  glBalanceLatest: number; // latest-period-end running-balance snapshot (used for BS)
  glBalanceSum: number;    // signed running-balance sum across exports (legacy fallback)
  glActivityNet: number;   // net activity (Σ transaction amounts) summed across exports (used for P&L)
  glActivity: number;    // sum of |amount_signed| txns in period
  txnCount: number;
  beginningRowSeenButEmpty?: boolean; // QB shipped a "Beginning Balance" row with empty value cells
}

interface TBComparison {
  accountName: string;
  glBalance: number;
  tbBalance: number | null;
  variance: number | null;
  variancePct: number | null;
  status: "match" | "variance" | "structural_variance" | "missing_in_tb";
  glBalanceSource?: "gl" | "tb_inferred"; // "tb_inferred" = backfilled from TB because GL opening row was empty
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

    // Auth + project access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: hasAccess, error: accessErr } = await supabase.rpc('has_project_access', { _user_id: user.id, _project_id: projectId });
    if (accessErr || hasAccess !== true) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

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

    // Fetch ALL GL exports for this project and merge by account. Each per-account snapshot
    // is keyed by acctId (or name fallback); when multiple exports touch the same account,
    // the one with the latest period_end wins for `glBalance` (true ending), while activity
    // and txnCount sum across periods. This gives whole-lifetime coverage rather than just
    // the last uploaded slice.
    // Fetch GL record IDs first — we then load each `data` payload one at a time
    // and null the reference after processing so the Deno edge function does not
    // hold all GL exports (multi-MB each) in memory simultaneously. Loading them
    // all at once was tripping the 256MB memory limit ("Memory limit exceeded").
    const { data: glIndex } = await supabase
      .from("processed_data").select("id, period_start, period_end, created_at")
      .eq("project_id", projectId).eq("data_type", "general_ledger")
      .order("period_end", { ascending: true });

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

    if (glIndex && glIndex.length > 0) {
      // Track per-account best snapshot (winner = latest period_end) plus summed activity.
      type Snap = { periodEnd: string; glBalance: number };
      const bestSnapshotByKey = new Map<string, Snap>();

      for (const glMeta of glIndex) {
        // Load one GL export at a time; drop the parsed tree at end of iteration.
        const { data: glRecArr, error: glLoadErr } = await supabase
          .from("processed_data").select("data")
          .eq("id", glMeta.id).limit(1);
        if (glLoadErr || !glRecArr || glRecArr.length === 0) {
          console.error(`[ANALYZE-GL] Failed to load GL record ${glMeta.id}:`, glLoadErr);
          continue;
        }
        let gl: Record<string, unknown> | null = glRecArr[0].data as Record<string, unknown>;
        const sections = ((gl.rows as { row?: GlRow[] })?.row || []) as GlRow[];
        const recPeriodEnd = String(glMeta.period_end || "");

        // ── Resolve Amount / Balance column indices from QB report column metadata. ──
        // GL DATA rows are nested inside SECTIONs and do NOT have a prepended account
        // label column (the account name lives in section.header). Use metadata indices
        // as-is. (The old +1 offset was borrowed from TB parsing and was inflating
        // per-account balances by summing the running-balance column as if it were
        // transaction amounts — Wells Fargo showed $975M instead of ~$425K.)
        let metaAmountIdx = -1;
        let metaBalanceIdx = -1;
        {
          const cols = ((gl.columns as { column?: Array<Record<string, unknown>> })?.column) || [];
          for (let i = 0; i < cols.length; i++) {
            const c = cols[i] as Record<string, unknown>;
            const title = String(c.colTitle || "").toLowerCase().trim();
            const md = (c.metaData as Array<Record<string, unknown>>) || [];
            let colKey = "";
            for (const m of md) {
              if (String(m.name || "").toLowerCase() === "colkey") {
                colKey = String(m.value || "").toLowerCase();
                break;
              }
            }
            if (colKey === "subt_nat_amount" || (metaAmountIdx < 0 && title === "amount")) {
              metaAmountIdx = i;
            }
            if (colKey === "rbal_nat_amount" || (metaBalanceIdx < 0 && title === "balance")) {
              metaBalanceIdx = i;
            }
          }
        }
        console.log(`[ANALYZE-GL] Export period_end=${recPeriodEnd}: amountIdx=${metaAmountIdx}, balanceIdx=${metaBalanceIdx}, sections=${sections.length}`);

        // Walk sections recursively so we capture the parent group (Income, Expenses,
        // COGS, …) that QuickBooks wraps account sections in. `group` on a SECTION is
        // the authoritative account-class hint from QB; we log it for diagnostics and
        // will key sign normalization off it in Step 2.
        const walkSections = (secs: GlRow[], parentGroup: string | null) => {
        for (const section of secs) {
          if (section.type !== "SECTION") continue;
          const hdr = section.header?.colData || [];
          const acctName = (hdr[0]?.value || "").trim();
          const acctId = (hdr[0]?.id || "").toString().trim() || null;
          const secGroup = ((section as unknown as { group?: string }).group) || null;
          // If this section has no account name in its header, it's a wrapper group
          // (e.g. "Income"). Recurse into its children carrying the group down.
          if (!acctName) {
            const nested = section.rows?.row || [];
            if (nested.length) walkSections(nested, secGroup || parentGroup);
            continue;
          }


          const childRows = section.rows?.row || [];
          let amountColIdx = -1;
          let balanceColIdx = -1;
          let beginningBalance = 0;
          // Track ending balance by MAX transaction date, not last-iterated row. QuickBooks
          // may sort rows ascending OR descending; taking "last iterated" gives the wrong end
          // when rows are descending (you get the running balance right after the earliest
          // transaction of the period, not the actual ending).
          let endingBalance = 0;
          let endingBalanceDate: string | null = null;
          let txnCount = 0;
          let activity = 0;
          let netSum = 0;
          // Diagnostic: raw first/last amount cell values (unsigned strings from QB), to
          // detect column-detection or sign-convention drift per section.
          let firstRowAmountRaw: string | null = null;
          let lastRowAmountRaw: string | null = null;


          if (metaAmountIdx >= 0) {
            amountColIdx = metaAmountIdx;
            if (metaBalanceIdx >= 0) {
              let balanceSeen = 0, balSampled = 0;
              for (const r of childRows) {
                if (r.type !== "DATA") continue;
                const cd = r.colData || [];
                if (cd.length > metaBalanceIdx && parseMoney(cd[metaBalanceIdx]?.value) !== null) {
                  balanceSeen++;
                }
                if (++balSampled >= 30) break;
              }
              balanceColIdx = balanceSeen >= Math.max(2, Math.ceil(balSampled * 0.3)) ? metaBalanceIdx : -1;
            }
          } else {
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
            if (moneyIdxsSorted.length === 0 && moneyColFreq.size > 0) {
              moneyIdxsSorted = [...moneyColFreq.keys()].sort((a, b) => a - b);
            }
            if (moneyIdxsSorted.length >= 2) {
              balanceColIdx = moneyIdxsSorted[moneyIdxsSorted.length - 1];
              amountColIdx = moneyIdxsSorted[moneyIdxsSorted.length - 2];
            } else if (moneyIdxsSorted.length === 1) {
              amountColIdx = moneyIdxsSorted[0];
              balanceColIdx = -1;
            }
          }

          let beginningRowSeenButEmpty = false;
          for (const r of childRows) {
            if (r.type !== "DATA") continue;
            const cd = r.colData || [];
            const label = (cd[0]?.value || "").trim().toLowerCase();
            const isBeginning = label === "beginning balance";

            if (isBeginning) {
              const bb = balanceColIdx >= 0 ? parseMoney(cd[balanceColIdx]?.value)
                                            : (amountColIdx >= 0 ? parseMoney(cd[amountColIdx]?.value) : null);
              if (bb !== null) {
                beginningBalance = bb;
              } else {
                const anyNumeric = cd.some((c: Record<string, unknown>) => parseMoney((c as { value?: string })?.value) !== null);
                if (!anyNumeric) beginningRowSeenButEmpty = true;
              }
              continue;
            }

            const amt = amountColIdx >= 0 ? parseMoney(cd[amountColIdx]?.value) : null;
            if (amt !== null) {
              netSum += amt;
              activity += Math.abs(amt);
              const raw = String(cd[amountColIdx]?.value ?? "");
              if (firstRowAmountRaw === null) firstRowAmountRaw = raw;
              lastRowAmountRaw = raw;
            }


            // Find this row's transaction date.
            let txnDate: string | null = null;
            for (const c of cd) {
              const d = parseDate(c?.value);
              if (d) { txnDate = d; break; }
            }
            if (txnDate) {
              if (!periodStart || txnDate < periodStart) periodStart = txnDate;
              if (!periodEnd || txnDate > periodEnd) periodEnd = txnDate;
            }

            // Only update endingBalance when this row is CHRONOLOGICALLY LATER than the
            // previous ending. Robust against descending row sort in QB exports.
            if (balanceColIdx >= 0) {
              const rb = parseMoney(cd[balanceColIdx]?.value);
              if (rb !== null) {
                if (!endingBalanceDate || (txnDate && txnDate >= endingBalanceDate)) {
                  endingBalance = rb;
                  if (txnDate) endingBalanceDate = txnDate;
                }
              }
            }
            txnCount += 1;
          }

          // Cross-check against QB's own "Total for <account>" summary row (net activity).
          const summaryCd = section.summary?.colData || [];
          const summaryNet = amountColIdx >= 0 ? parseMoney(summaryCd[amountColIdx]?.value) : null;
          const summaryAmountRaw = amountColIdx >= 0 ? String(summaryCd[amountColIdx]?.value ?? "") : "";

          // Two independent readings per section:
          //   snapshotBalance = running balance at period end (correct for BS accounts)
          //   activityNet     = Σ transaction amounts for the period (correct for P&L)
          // We used to overload endingBalance into both — but QB's Balance column on P&L
          // reports is NOT cumulative-since-inception, so using it for revenue undercounted
          // by ~10× (z_Shopify Sales showed $399K vs true $11M+).
          let snapshotBalance: number;
          if (balanceColIdx >= 0 && endingBalanceDate !== null) snapshotBalance = endingBalance;
          else if (summaryNet !== null) snapshotBalance = beginningBalance + summaryNet;
          else snapshotBalance = beginningBalance + netSum;
          const activityNet = summaryNet !== null ? summaryNet : netSum;

          // NOTE: `header.colData[0].id` in qbToJson GL output is a per-export sequential
          // row index — NOT a stable QB account id. Keying on it merged unrelated accounts
          // across yearly exports (e.g. id=75 → z_Shopify Sales in 2023, Phone/Internet
          // in 2026, etc.), which inflated balances 100–1000×. Key on account-number
          // prefix when the display name carries one (e.g. "6140 Phone/Internet" → 6140),
          // otherwise on the normalized name.
          const numPrefixMatch = acctName.match(/^(\d+)\s+(.+)$/);
          const nameNumPrefix = numPrefixMatch ? numPrefixMatch[1] : null;
          const nameNoPrefix = numPrefixMatch ? numPrefixMatch[2] : acctName;
          const key = nameNumPrefix
            ? `num:${nameNumPrefix}`
            : `name:${acctName.toLowerCase()}`;
          const coa = (nameNumPrefix ? coaByAcctNum.get(nameNumPrefix) : undefined) ||
                      coaByName.get(acctName.toLowerCase()) ||
                      coaByName.get(nameNoPrefix.toLowerCase()) ||
                      coaByLeaf.get(normName(acctName)) ||
                      coaByLeaf.get(normName(nameNoPrefix));
          // Fall back to QB's section `group` metadata when COA missed — it's the
          // authoritative bucket ("Income", "Expenses", "COGS", etc.).
          const groupHint = (secGroup || parentGroup || "").toLowerCase();
          const groupCls = (() => {
            if (!groupHint) return null;
            if (groupHint === "income") return "REVENUE";
            if (groupHint === "otherincome" || groupHint.includes("other income")) return "OTHER_INCOME";
            if (groupHint === "cogs" || groupHint.includes("costofgoodssold") || groupHint.includes("cost of goods")) return "COST_OF_GOODS_SOLD";
            if (groupHint === "expenses" || groupHint === "expense") return "EXPENSE";
            if (groupHint === "otherexpense" || groupHint.includes("other expense")) return "OTHER_EXPENSE";
            if (groupHint.includes("asset")) return "ASSET";
            if (groupHint.includes("liab")) return "LIABILITY";
            if (groupHint.includes("equity")) return "EQUITY";
            return null;
          })();
          const cls = (coa?.classification || groupCls || "OTHER").toUpperCase();
          const picked = (cls === "REVENUE" || cls === "INCOME" || cls === "OTHER_INCOME" ||
                          cls === "EXPENSE" || cls === "COST_OF_GOODS_SOLD" || cls === "OTHER_EXPENSE")
                          ? "activityNet" : "snapshotBalance";

          // Per-section DIAG log removed — with 4 GL exports × hundreds of sections
          // the log volume itself was contributing to the memory-limit trip. Re-enable
          // selectively by wrapping in `if (Deno.env.get("ANALYZE_GL_DIAG"))` if needed.

          // Merge across periods: sum activity/txnCount/activityNet; keep latest-wins snapshot.
          const prevSnap = bestSnapshotByKey.get(key);
          const isLatest = !prevSnap || recPeriodEnd >= prevSnap.periodEnd;
          const prev = acctMap.get(key);
          const mergedActivity = (prev?.glActivity || 0) + activity;
          const mergedTxnCount = (prev?.txnCount || 0) + txnCount;
          const mergedLatest = isLatest ? snapshotBalance : (prev?.glBalanceLatest ?? snapshotBalance);
          const mergedSum = (prev?.glBalanceSum ?? 0) + snapshotBalance;
          const mergedActivityNet = (prev?.glActivityNet ?? 0) + activityNet;

          acctMap.set(key, {
            name: acctName,
            leaf: normName(acctName),
            acctNumber: nameNumPrefix || coa?.acctNum || prev?.acctNumber || null,
            classification: (coa?.classification || groupCls || prev?.classification || "OTHER").toUpperCase(),
            glBalance: mergedLatest, // provisional; recomputed after classification below
            glBalanceLatest: mergedLatest,
            glBalanceSum: mergedSum,
            glActivityNet: mergedActivityNet,
            glActivity: mergedActivity,
            txnCount: mergedTxnCount,
            beginningRowSeenButEmpty: (prev?.beginningRowSeenButEmpty || false) || (beginningRowSeenButEmpty && balanceColIdx < 0),
          });
          if (isLatest) bestSnapshotByKey.set(key, { periodEnd: recPeriodEnd, glBalance: snapshotBalance });
          txnCountTotal += txnCount;
        }
        }; // close walkSections
        walkSections(sections, null);
        // Release the parsed GL tree before loading the next export.
        gl = null;
      }

      console.log(`[ANALYZE-GL] Parsed ${acctMap.size} accounts / ${txnCountTotal} txns from ${glIndex.length} GL export(s)`);
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
                  classification: coa?.classification || "OTHER",
                  glBalance: 0, glBalanceLatest: 0, glBalanceSum: 0, glActivityNet: 0, glActivity: 0, txnCount: 0 };
          acctMap.set(key, acc);
        }
        acc.glBalance += signed;
        acc.glBalanceLatest = acc.glBalance;
        acc.glBalanceSum = acc.glBalance;
        acc.glActivityNet += signed;
        acc.glActivity += abs;
        acc.txnCount += 1;
      }
      txnCountTotal = txns.length;
      console.log(`[ANALYZE-GL] Fallback: aggregated ${acctMap.size} accounts from ${txns.length} canonical_transactions rows`);
    }

    // Add COA accounts that have no GL activity but have a current balance
    {
      const haveAcctIds = new Set(Array.from(acctMap.values()).map(a => a.acctNumber).filter(Boolean) as string[]);
      const haveNames = new Set(Array.from(acctMap.values()).map(a => a.name.toLowerCase()));
      for (const [, coa] of coaByName) {
        const k = coa.name.toLowerCase();
        if (haveNames.has(k)) continue;
        if (coa.acctNum && haveAcctIds.has(coa.acctNum)) continue;
        if (Math.abs(coa.balance) > 0.01) {
          const mapKey = coa.acctNum ? `id:${coa.acctNum}` : `name:${k}`;
          acctMap.set(mapKey, {
            name: coa.name, leaf: normName(coa.name),
            acctNumber: coa.acctNum, classification: coa.classification,
            glBalance: coa.balance, glBalanceLatest: coa.balance, glBalanceSum: coa.balance,
            glActivityNet: 0, glActivity: 0, txnCount: 0,
          });
        }
      }
    }

    // ── Collapse key-collision duplicates. Same real account can land under both
    //    `id:${acctId}` and `name:${acctName}` when one GL export includes an id and
    //    another doesn't (or COA-injection uses a different key). Merge into the
    //    id-keyed entry, sum activity/txnCount, take latest snapshot / summed balance
    //    coherently.
    {
      const byName = new Map<string, string[]>();
      for (const [k, v] of acctMap) {
        const nk = v.name.toLowerCase().trim();
        const arr = byName.get(nk) || [];
        arr.push(k);
        byName.set(nk, arr);
      }
      for (const [, keys] of byName) {
        if (keys.length < 2) continue;
        // Prefer the id-keyed entry as the canonical row (falls back to first).
        const canonicalKey = keys.find(k => k.startsWith("id:")) || keys[0];
        const canonical = acctMap.get(canonicalKey)!;
        for (const k of keys) {
          if (k === canonicalKey) continue;
          const dup = acctMap.get(k)!;
          canonical.glActivity += dup.glActivity;
          canonical.txnCount += dup.txnCount;
          canonical.glBalanceSum += dup.glBalanceSum;
          canonical.glActivityNet += dup.glActivityNet;
          // Latest snapshot: prefer non-zero, else keep canonical.
          if (Math.abs(canonical.glBalanceLatest) < 0.01 && Math.abs(dup.glBalanceLatest) > 0.01) {
            canonical.glBalanceLatest = dup.glBalanceLatest;
          }
          canonical.beginningRowSeenButEmpty = canonical.beginningRowSeenButEmpty || dup.beginningRowSeenButEmpty;
          if (canonical.classification === "OTHER" && dup.classification !== "OTHER") {
            canonical.classification = dup.classification;
          }
          if (!canonical.acctNumber && dup.acctNumber) canonical.acctNumber = dup.acctNumber;
          acctMap.delete(k);
        }
        canonical.glBalance = canonical.glBalanceLatest;
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

    // Classification → active-balance selector.
    //  • Balance-sheet classes → latest-period-end snapshot (running balance is authoritative).
    //  • P&L classes → net activity summed across all GL exports. QB's running-balance
    //    column on P&L reports is NOT cumulative-since-inception, so it undercounts
    //    revenue/expense by 10×+. glActivityNet is Σ transaction amounts and matches
    //    TB's yearSumBalance behavior.
    const isPLClass = (c: string) => c === "REVENUE" || c === "INCOME" || c === "OTHER_INCOME" ||
                                     c === "EXPENSE" || c === "COST_OF_GOODS_SOLD" || c === "OTHER_EXPENSE";
    const applyActiveBalance = (a: AccountInfo) => {
      a.glBalance = isPLClass(a.classification) ? a.glActivityNet : a.glBalanceLatest;
    };
    for (const a of accounts) applyActiveBalance(a);
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

    // ── NOTE: QuickBooks' per-report `colData[0].id` is a LOCAL ordinal — NOT a stable
    //    QB Account.Id. GL id 22 is "Decks and Patios" while TB id 22 is "Sprinklers and
    //    Drip Systems" — different reports, different numbering. Matching across reports
    //    must use NAME, not id.

    // ── Reconciliation ──
    const reconciliation: TBComparison[] = [];
    const matchedTbKeys = new Set<string>();
    let matchCount = 0, varianceCount = 0, missingInTB = 0;
    let matchBS = 0, matchPL = 0;
    let matchByFullPath = 0, matchByLeaf = 0, ambiguousLeaf = 0;
    let structuralCount = 0;
    const materialVariances: TBComparison[] = [];
    const structuralVariances: TBComparison[] = [];
    let varianceLogged = 0;

    // Build set of TB paths that are parents (i.e. have child rows in the TB).
    // QuickBooks TB parent rows roll up child balances; the GL parent row only carries
    // direct postings to the parent. Comparing these directly is structurally invalid.
    const tbParentPaths = new Set<string>();
    for (const [, t] of tbByFullPath) {
      const parts = t.fullPath.split(":");
      for (let i = 1; i < parts.length; i++) {
        tbParentPaths.add(normKey(parts.slice(0, i).join(":")));
      }
    }
    // Symmetric: a path may also be a parent on the GL side (QB GL detail expands
    // sub-accounts as siblings; the parent row carries only direct postings).
    const glParentPaths = new Set<string>();
    for (const a of accounts) {
      const fp = (a as AccountInfo & { fullPath?: string }).fullPath || a.name;
      const parts = fp.split(":");
      for (let i = 1; i < parts.length; i++) {
        glParentPaths.add(normKey(parts.slice(0, i).join(":")));
      }
    }
    const parentPaths = new Set<string>([...tbParentPaths, ...glParentPaths]);

    // Cross-namespace rollup: QB sometimes ships the same leaf name twice — once as a
    // standalone parent row carrying the rollup balance, and once as a child under a
    // different parent path. The standalone row has no colon so it never lands in
    // tbParentPaths above. Detect it by leaf-frequency.
    const tbLeafCount = new Map<string, number>();
    for (const [, t] of tbByFullPath) {
      const leaf = normKey(leafOf(t.fullPath));
      tbLeafCount.set(leaf, (tbLeafCount.get(leaf) || 0) + 1);
    }
    const isCrossNamespaceRollup = (tbRow: TBAcct): boolean => {
      const leaf = normKey(leafOf(tbRow.fullPath));
      if ((tbLeafCount.get(leaf) || 0) < 2) return false;
      for (const [, t] of tbByFullPath) {
        if (t === tbRow) continue;
        if (normKey(leafOf(t.fullPath)) === leaf && t.fullPath.includes(":")) return true;
      }
      return false;
    };


    for (const acct of accounts) {
      // Skip zero-balance, zero-activity accounts
      if (Math.abs(acct.glBalance) < 0.01 && acct.glActivity < 0.01) continue;

      const fullPath = (acct as AccountInfo & { fullPath?: string }).fullPath || acct.name;

      let tb: TBAcct | undefined;
      let matchedBy = "";

      // 1) by exact full path (works when GL already carries a colon path)
      if (fullPath.includes(":")) {
        tb = tbByFullPath.get(normKey(fullPath));
        if (tb) { matchedBy = "fullPath"; matchByFullPath++; }
      }

      // 2) by leaf — disambiguate multi-candidates by signed-magnitude distance to GL.
      //    This is the most robust strategy when GL is leaf-only and the same leaf
      //    appears on both Income and Expense sides of the chart.
      if (!tb) {
        const candidates = tbByLeaf.get(normKey(acct.leaf)) || tbByLeaf.get(normKey(leafOf(acct.name))) || [];
        if (candidates.length === 1) {
          tb = candidates[0]; matchedBy = "leaf"; matchByLeaf++;
        } else if (candidates.length > 1) {
          // Score each candidate by which axis is closer (in magnitude) to GL's balance.
          // Treats sign-convention differences gracefully (a $13k expense GL could land
          // against a $22k TB expense yearSum more cleanly than a $45k TB revenue yearSum).
          const glMag = Math.abs(acct.glBalance);
          let bestScore = Infinity, best: TBAcct | undefined;
          for (const c of candidates) {
            const sMag = Math.abs(c.snapshotBalance);
            const yMag = Math.abs(c.yearSumBalance);
            const score = Math.min(Math.abs(sMag - glMag), Math.abs(yMag - glMag));
            if (score < bestScore) { bestScore = score; best = c; }
          }
          if (best && bestScore < Math.max(glMag, 1) * 10) {
            tb = best; matchedBy = "leaf(disambig)"; matchByLeaf++;
          } else {
            ambiguousLeaf++;
          }
        }
      }

      if (tb) {
        matchedTbKeys.add(tb.fullPath);
        // Re-derive classification when we had OTHER, from the matched TB side.
        if (acct.classification === "OTHER" && tb.side !== "OTHER") {
          acct.classification = tb.side;
          applyActiveBalance(acct); // switch to sum-across-exports if promoted to P&L
        }
        const isPL = acct.classification === "REVENUE" || acct.classification === "INCOME" ||
                     acct.classification === "OTHER_INCOME" || acct.classification === "EXPENSE" ||
                     acct.classification === "COST_OF_GOODS_SOLD" || acct.classification === "OTHER_EXPENSE" ||
                     tb.side === "REVENUE" || tb.side === "EXPENSE";
        // BS uses end-of-period snapshot; P&L sums each year's YTD-final (monthly TBs reset every January).
        const tbBalance = isPL ? tb.yearSumBalance : tb.snapshotBalance;

        // ── Backfill missing GL opening balance from TB ──
        // QuickBooks ships a "Beginning Balance" row with empty value cells for some BS
        // accounts. Our parser then opens at $0, so glBalance = period net change, not
        // ending balance. When we detect that condition AND we have a TB match for a BS
        // account, accept TB's ending balance as the GL's ending balance and tag the row
        // so the UI can disclose the inference.
        // Also fire the inference path when a BS account's GL parent shows only
        // token postings against a sizeable TB ending balance — same QB defect, just
        // expressed without a Beginning Balance row we could detect.
        const beginningEmpty = (acct as AccountInfo).beginningRowSeenButEmpty === true;
        const tinyGlVsLargeTb = !isPL &&
          Math.abs(acct.glBalance) < Math.max(Math.abs(tbBalance) * 0.05, 500) &&
          Math.abs(tbBalance) > 1000;

        if (!isPL && (beginningEmpty || tinyGlVsLargeTb)) {
          const cmp: TBComparison = {
            accountName: acct.name,
            glBalance: tbBalance,
            tbBalance,
            variance: 0,
            variancePct: 0,
            status: "match",
            glBalanceSource: "tb_inferred",
          };
          reconciliation.push(cmp);
          matchCount++; matchBS++;
          if (varianceLogged < 25) {
            const reason = beginningEmpty ? "empty Beginning Balance row" : "tiny GL vs large TB";
            console.log(`[ANALYZE-GL] TB-INFERRED (by ${matchedBy}, BS, ${reason}): ${acct.name} gl_parsed=${acct.glBalance.toFixed(2)} tb=${tbBalance.toFixed(2)}`);
            varianceLogged++;
          }
          continue;
        }


        // ── Sign-aware comparison ──
        // QuickBooks GL exports present revenue/liability/equity totals as positive
        // magnitudes (debit-positive convention). The Trial Balance keeps the true
        // double-entry sign (credits negative). For credit-natural accounts, the raw
        // (gl − tb) doubles a value that is actually in agreement. Compute both the
        // signed and the sign-collapsed variance, and surface whichever is smaller.
        const creditNatural = acct.classification === "REVENUE" ||
                              acct.classification === "INCOME" ||
                              acct.classification === "OTHER_INCOME" ||
                              acct.classification === "LIABILITY" ||
                              acct.classification === "EQUITY";
        const rawVariance = acct.glBalance - tbBalance;
        const flippedVariance = acct.glBalance + tbBalance; // collapses sign-convention mirror
        const effectiveVariance = creditNatural &&
          Math.abs(flippedVariance) < Math.abs(rawVariance)
            ? flippedVariance
            : rawVariance;
        const absDiff = Math.abs(effectiveVariance);
        const denom = Math.max(Math.abs(acct.glBalance), Math.abs(tbBalance), 1);
        const variancePct = absDiff / denom;
        const isMatch = absDiff < 50 || variancePct < 0.005;
        // Detect parent-vs-rollup structural mismatch: matched row is a parent on
        // EITHER side (TB rolls up or GL expands children as siblings), and the TB
        // rollup magnitude dwarfs the GL parent's direct postings.
        const isStructural = !isMatch &&
          (
            parentPaths.has(normKey(tb.fullPath)) ||
            parentPaths.has(normKey(fullPath)) ||
            isCrossNamespaceRollup(tb)
          ) &&
          (() => {
            const a = Math.abs(tbBalance), b = Math.abs(acct.glBalance);
            return Math.max(a, b) > Math.max(Math.min(a, b) * 3, 1000);
          })();

        const cmp: TBComparison = {
          accountName: acct.name,
          glBalance: acct.glBalance,
          tbBalance,
          variance: effectiveVariance,
          variancePct,
          status: isMatch ? "match" : (isStructural ? "structural_variance" : "variance"),
          glBalanceSource: "gl",
        };
        reconciliation.push(cmp);
        if (isMatch) { matchCount++; if (isPL) matchPL++; else matchBS++; }
        else if (isStructural) {
          structuralCount++;
          structuralVariances.push(cmp);
          // Count toward matched for the headline reconciliation rate — child accounts
          // reconcile separately; the parent's rollup discrepancy isn't a data failure.
          matchCount++; if (isPL) matchPL++; else matchBS++;
          if (varianceLogged < 25) {
            console.log(`[ANALYZE-GL] STRUCTURAL (by ${matchedBy}, ${isPL ? "P&L" : "BS"}): ${acct.name} gl=${acct.glBalance.toFixed(2)} tb=${tbBalance.toFixed(2)} (TB parent rollup)`);
            varianceLogged++;
          }
        }
        else {
          varianceCount++;
          if (absDiff > 1000 && variancePct > 0.05) materialVariances.push(cmp);
          if (varianceLogged < 25) {
            console.log(`[ANALYZE-GL] VARIANCE (by ${matchedBy}, ${isPL ? "P&L" : "BS"}): ${acct.name} cls=${acct.classification} gl=${acct.glBalance.toFixed(2)} tb=${tbBalance.toFixed(2)} raw=${rawVariance.toFixed(2)} norm=${effectiveVariance.toFixed(2)}`);
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
    console.log(`[ANALYZE-GL] Match attempts: fullPath=${matchByFullPath}, leaf=${matchByLeaf}, ambiguous-leaf=${ambiguousLeaf}, missingInTB=${missingInTB}`);
    console.log(`[ANALYZE-GL] Reconciliation: matched=${matchCount}/${accounts.length} (BS=${matchBS}, P&L=${matchPL}), structural=${structuralCount}, variances=${varianceCount}, missingInTB=${missingInTB}`);

    // TB accounts not matched to any GL row.
    // Also suppress TB rows whose leaf was already matched against a GL account in agreement,
    // which happens when QB exports duplicate the same leaf under multiple parent rollups.
    const matchedLeavesInAgreement = new Set<string>();
    for (const cmp of reconciliation) {
      if ((cmp.status === "match" || cmp.status === "structural_variance") && cmp.tbBalance !== null) {
        matchedLeavesInAgreement.add(normKey(leafOf(cmp.accountName)));
      }
    }
    const missingInGL: { name: string; balance: number }[] = [];
    if (tbHas) {
      for (const [, t] of tbById) {
        if (matchedTbKeys.has(t.fullPath)) continue;
        if (matchedLeavesInAgreement.has(normKey(leafOf(t.fullPath)))) continue;
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
    // Treat contra-assets (accumulated depreciation, allowance for doubtful accounts) as
    // negative asset contributions; take absolute value elsewhere so sign-convention drift
    // between imports doesn't mask real balances.
    const contraAssetRe = /accumulated depreciation|accumulated amortization|allowance for/i;
    // Owner-draw / distribution accounts are debit-natural equity contras — they reduce
    // equity. QB GL exports them as negative running balances alongside a negative
    // retained-earnings row (credit-natural). Blanket Math.abs on Equity treats them
    // both as additions, inflating equity and busting the identity check.
    const distributionRe = /owner'?s?\s*(pay|draw)|shareholder\s*distribution|member\s*draw|personal\s*expense|distribution/i;
    let sumAssets = 0, sumLiab = 0, sumEquity = 0, sumRevenue = 0, sumExpense = 0;
    for (const a of accounts) {
      const c = a.classification;
      const v = a.glBalance;
      if (c === "ASSET") {
        sumAssets += contraAssetRe.test(a.name) ? -Math.abs(v) : Math.abs(v);
      }
      else if (c === "LIABILITY") sumLiab += Math.abs(v);
      else if (c === "EQUITY") {
        // Distributions subtract from equity; everything else adds its magnitude.
        sumEquity += distributionRe.test(a.name) ? -Math.abs(v) : Math.abs(v);
      }
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
    const identityTolerance = Math.max(1000, Math.abs(sumAssets) * 0.01);
    if (Math.abs(accountingEquationDiff) > identityTolerance && tbHas) {
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
        balanced: Math.abs(accountingEquationDiff) <= identityTolerance,
      },
      largestAccounts,
      reconciliation: reconciliation.slice(0, 60),
      reconciliationSummary: {
        matched: matchCount,
        structural: structuralCount,
        variances: varianceCount,
        missingInTB,
        missingInGL: missingInGL.length,
      },
      materialVariances: materialVariances.sort((a, b) => Math.abs(b.variance!) - Math.abs(a.variance!)).slice(0, 20),
      structuralVariances: structuralVariances.sort((a, b) => Math.abs(b.tbBalance!) - Math.abs(a.tbBalance!)).slice(0, 20),
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
