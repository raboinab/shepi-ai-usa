// Admin-only ops tool: server-side rebuild of wizard_data.trialBalance.accounts
// from processed_data trial_balance rows, using the same classification logic
// as the client (inferFsType → transformQbTrialBalanceData → mergeAccounts →
// crossReferenceWithCOA). Warms the cache without requiring the user to reopen
// the project in a browser.
//
// POST /rebuild-project-tb { project_id: string }

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─────────────────────────────────────────────────────────────────────────────
// inferFsType (ported verbatim from src/lib/inferFsType.ts)
// ─────────────────────────────────────────────────────────────────────────────
type FsType = "BS" | "IS";

const IS_HINTS = [
  "revenue","income","sales","cost of goods","cogs","cost of sales",
  "expense","other income","other expense",
];
const BS_HINTS = [
  "bank","checking","savings","receivable","current asset","fixed asset",
  "other asset","payable","credit card","current liability","long term liability",
  "long-term liability","equity",
];

function inferFromAccountNumber(raw: string): FsType | null {
  const s = (raw || "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4,5})\b/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;
  if (n >= 1000 && n < 4000) return "BS";
  if (n >= 4000 && n < 10000) return "IS";
  return null;
}

function extractLeadingAcctNum(name: string | null | undefined): string | null {
  const s = (name || "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4,5})\b/);
  return m ? m[1] : null;
}

function inferFromName(name: string): FsType | null {
  const n = (name || "").toLowerCase();
  if (!n) return null;
  if (/\b(receivable|a\/r|payable|a\/p)\b/.test(n)) return "BS";
  if (/\b(cash|bank|checking|savings|money market|undeposited)\b/.test(n)) return "BS";
  if (/\b(inventory|prepaid|deposit|escrow)\b/.test(n)) return "BS";
  if (/\b(fixed asset|equipment|furniture|vehicle|property|building|land|leasehold)\b/.test(n)) return "BS";
  if (/\b(accumulated depreciation|accumulated amortization)\b/.test(n)) return "BS";
  if (/\b(credit card|line of credit|loan|note payable|notes payable|mortgage|debt)\b/.test(n)) return "BS";
  if (/\b(equity|capital|retained earnings|owner'?s? draw|owner'?s? equity|distributions|contributions|treasury stock|common stock|preferred stock|opening balance)\b/.test(n)) return "BS";

  if (/\b(sales|revenue|income|fees earned|service income)\b/.test(n)) return "IS";
  if (/\b(cogs|cost of goods|cost of sales|cost of revenue)\b/.test(n)) return "IS";
  if (/\b(expense|expenses|payroll|salaries|wages|rent|utilities|insurance|advertising|marketing|depreciation expense|amortization expense|interest expense|tax expense|professional fees|meals|travel|supplies)\b/.test(n)) return "IS";
  if (/\b(discounts|refunds|returns)\b/.test(n)) return "IS";
  return null;
}

function inferFsType(input: {
  fsType?: string | null;
  accountType?: string | null;
  classification?: string | null;
  accountSubtype?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  fullyQualifiedName?: string | null;
}): FsType | null {
  const explicit = (input.fsType || "").toUpperCase();
  if (explicit === "BS" || explicit === "IS") return explicit as FsType;

  const meta = [input.accountType, input.classification, input.accountSubtype]
    .map((v) => (v || "").toLowerCase())
    .join(" | ");
  if (meta.trim()) {
    if (IS_HINTS.some((h) => meta.includes(h))) return "IS";
    if (BS_HINTS.some((h) => meta.includes(h))) return "BS";
  }
  const fromNumber =
    inferFromAccountNumber(input.accountNumber || "") ||
    inferFromAccountNumber(input.fullyQualifiedName || "") ||
    inferFromAccountNumber(input.accountName || "");
  if (fromNumber) return fromNumber;
  const nameForInfer = input.fullyQualifiedName || input.accountName || "";
  const fromName = inferFromName(nameForInfer);
  if (fromName) return fromName;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TB transformation (ported minimal subset of src/lib/trialBalanceUtils.ts)
// ─────────────────────────────────────────────────────────────────────────────
interface Period {
  id: string; label: string; year: number; month: number;
  isStub?: boolean; startDate?: string; endDate?: string;
}

interface TBAccount {
  id: string; fsType: FsType;
  accountNumber: string; accountName: string;
  accountType: string; accountSubtype: string;
  fsLineItem?: string;
  qbAccountId?: string; fullyQualifiedName?: string;
  monthlyValues: Record<string, number>;
  _matchedFromCOA?: boolean;
}

function deriveEndDate(month: string, year: string): string | null {
  const map: Record<string, number> = {
    JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12,
  };
  const m = map[month.toUpperCase()]; const y = parseInt(year, 10);
  if (!m || isNaN(y)) return null;
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}`;
}

function findPeriod(dateStr: string, periods: Period[]): Period | undefined {
  const d = new Date(dateStr);
  const year = d.getFullYear(); const month = d.getMonth() + 1;
  const exact = periods.find((p) => p.year === year && p.month === month);
  if (exact) return exact;
  for (const p of periods) {
    if (p.isStub && p.startDate && p.endDate) {
      const s = new Date(p.startDate); const e = new Date(p.endDate);
      if (d >= s && d <= e) return p;
    }
  }
  return undefined;
}

function parseColDataRow(rawRow: any): any | null {
  const c = rawRow?.colData;
  if (!c || c.length < 3) return null;
  const rawName = c[0]?.value || "";
  const qbId = c[0]?.id ? String(c[0].id) : "";
  if (!rawName || rawName === "Account" || rawName === "Total") return null;

  // Split "1005 Cash" / "4000 RETAIL:z_Shopify Sales" into number + name.
  // For sub-accounts (name contains ":"), the leading number belongs to the
  // *parent*, so drop it from accountNumber to prevent collapsing children
  // into the parent CoA row. Keep the cleaned FQN as fullyQualifiedName so
  // the CoA matcher can resolve the true leaf.
  const leadingNum = extractLeadingAcctNum(rawName);
  const cleanedName = leadingNum
    ? rawName.replace(/^\d{4,5}\s*[-:]?\s*/, "").trim() || rawName
    : rawName;
  const isSubAccount = cleanedName.includes(":");
  const accountNumber = isSubAccount ? "" : (leadingNum || "");
  const fullyQualifiedName = isSubAccount ? cleanedName : undefined;

  const debit = parseFloat(String(c[1]?.value ?? "0").replace(/[^0-9.-]/g,"")) || 0;
  const credit = parseFloat(String(c[2]?.value ?? "0").replace(/[^0-9.-]/g,"")) || 0;
  return {
    accountNumber,
    accountName: cleanedName,
    fullyQualifiedName,
    qbAccountId: qbId,
    debit,
    credit,
    balance: debit - credit,
  };
}


function processRows(rows: any[], periodId: string, accountMap: Map<string, TBAccount>) {
  for (const row of rows) {
    const _num = row.accountNumber || "";
    const _nm = (row.accountName || "").toLowerCase();
    const _ty = (row.accountType || "").toLowerCase();
    const _sub = (row.accountSubtype || row.subAccountType || "").toLowerCase();
    const accountKey =
      (row.qbAccountId && `id:${row.qbAccountId}`) ||
      (row.fullyQualifiedName && `fqn:${String(row.fullyQualifiedName).toLowerCase()}`) ||
      ((_nm || _num) && `c:${_num}|${_nm}|${_ty}|${_sub}`) || "";
    if (!accountKey) continue;

    let acc = accountMap.get(accountKey);
    if (!acc) {
      const accountType = row.accountType || "";
      const accountSubtype = row.accountSubtype || row.subAccountType || "";
      const inferred = inferFsType({
        fsType: row.fsType, accountType, classification: row.classification,
        accountSubtype, accountName: row.accountName,
        accountNumber: row.accountNumber, fullyQualifiedName: row.fullyQualifiedName,
      });
      acc = {
        id: crypto.randomUUID(),
        fsType: inferred || "IS",
        accountNumber: row.accountNumber || "",
        accountName: row.accountName || "",
        accountType, accountSubtype,
        fsLineItem: row.fsLineItem || "",
        qbAccountId: row.qbAccountId || undefined,
        fullyQualifiedName: row.fullyQualifiedName || undefined,
        monthlyValues: {},
        ...(row._matchedFromCOA !== undefined && { _matchedFromCOA: row._matchedFromCOA }),
      };
      accountMap.set(accountKey, acc);
    }
    let value = row.balance;
    if (value === undefined) {
      if (row.debit !== undefined || row.credit !== undefined) {
        value = (row.debit || 0) - (row.credit || 0);
      } else if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const debit = parseFloat(row.colData[1]?.value || "0") || 0;
        const credit = parseFloat(row.colData[2]?.value || "0") || 0;
        value = debit - credit;
      } else value = 0;
    }
    acc.monthlyValues[periodId] = value;
  }
}

function transformQbTB(qbData: any, periods: Period[]): TBAccount[] {
  const map = new Map<string, TBAccount>();
  if (qbData.reportDate) {
    const period = findPeriod(qbData.reportDate, periods);
    if (period) {
      if (Array.isArray(qbData.rows)) processRows(qbData.rows, period.id, map);
      else if (qbData.rows && typeof qbData.rows === "object") {
        const rr = qbData.rows.row;
        if (Array.isArray(rr)) {
          processRows(rr.map(parseColDataRow).filter(Boolean), period.id, map);
        }
      }
    }
  }
  if (Array.isArray(qbData.monthlyReports)) {
    for (const mr of qbData.monthlyReports) {
      let reportDate = mr.reportDate || mr.endDate || mr.report?.header?.endPeriod;
      if (!reportDate && mr.month && mr.year) reportDate = deriveEndDate(mr.month, mr.year);
      if (!reportDate) continue;
      const period = findPeriod(reportDate, periods);
      if (!period) continue;
      if (Array.isArray(mr.rows)) processRows(mr.rows, period.id, map);
      else if (Array.isArray(mr.report?.rows?.row)) {
        processRows(mr.report.rows.row.map(parseColDataRow).filter(Boolean), period.id, map);
      }
    }
  }
  return Array.from(map.values());
}

function mergeAccounts(existing: TBAccount[], incoming: TBAccount[]): TBAccount[] {
  const map = new Map<string, TBAccount>();
  const keyOf = (a: TBAccount) => {
    const num = a.accountNumber || "";
    const nm = (a.accountName || "").toLowerCase();
    const ty = (a.accountType || "").toLowerCase();
    const sub = (a.accountSubtype || "").toLowerCase();
    return (
      (a.qbAccountId && `id:${a.qbAccountId}`) ||
      (a.fullyQualifiedName && `fqn:${a.fullyQualifiedName.toLowerCase()}`) ||
      ((nm || num) && `c:${num}|${nm}|${ty}|${sub}`) || ""
    );
  };
  for (const a of existing) {
    const k = keyOf(a); if (k) map.set(k, { ...a, monthlyValues: { ...a.monthlyValues } });
  }
  for (const a of incoming) {
    const k = keyOf(a); if (!k) continue;
    const cur = map.get(k);
    if (cur) cur.monthlyValues = { ...cur.monthlyValues, ...a.monthlyValues };
    else map.set(k, { ...a, monthlyValues: { ...a.monthlyValues } });
  }
  return Array.from(map.values());
}

// COA cross-reference (subset of crossReferenceWithCOA)
function normalizeClassification(c: string): string | undefined {
  if (!c) return undefined;
  const m: Record<string, string | undefined> = {
    REVENUE:"Revenue", INCOME:"Revenue", EXPENSE:"Operating expenses",
    ASSET:undefined, LIABILITY:undefined, EQUITY:"Equity",
    OTHER_INCOME:"Other expense (income)", OTHERINCOME:"Other expense (income)",
    OTHER_EXPENSE:"Other expense (income)", OTHEREXPENSE:"Other expense (income)",
    COST_OF_GOODS_SOLD:"Cost of Goods Sold", COSTOFGOODSSOLD:"Cost of Goods Sold",
    COGS:"Cost of Goods Sold",
  };
  const k = c.toUpperCase();
  return k in m ? m[k] : undefined;
}

/** Normalize a CoA row from either the client shape (accountName/accountNumber/accountId)
 *  or the raw qbToJson shape (name/fullyQualifiedName/acctNum/id/accountType/classification/fsType). */
function normalizeCoaRow(c: any): {
  accountId?: string;
  accountNumber?: string;
  accountName?: string;
  fullyQualifiedName?: string;
  category?: string;
  accountSubtype?: string;
  classification?: string;
  fsType?: FsType;
  _autoNumbered?: boolean;
} {
  const accountId = c.accountId ?? c.id ?? c.qbAccountId;
  const accountNumber = c.accountNumber ?? c.acctNum ?? c.acctnum ?? "";
  const accountName = c.accountName ?? c.name ?? "";
  const fullyQualifiedName = c.fullyQualifiedName ?? c.fqn ?? c.FullyQualifiedName ?? accountName;
  const category = c.category ?? c.accountType ?? c.AccountType ?? "";
  const accountSubtype = c.accountSubtype ?? c.accountSubType ?? c.AccountSubType ?? "";
  const classification = c.classification ?? c.Classification ?? "";
  const fsType = (c.fsType ?? c.fs) as FsType | undefined;
  return {
    accountId: accountId ? String(accountId) : undefined,
    accountNumber: String(accountNumber || ""),
    accountName: String(accountName || ""),
    fullyQualifiedName: String(fullyQualifiedName || ""),
    category: String(category || ""),
    accountSubtype: String(accountSubtype || ""),
    classification: String(classification || ""),
    fsType,
    _autoNumbered: !!c._autoNumbered,
  };
}

function crossReferenceCOA(tb: TBAccount[], coaRaw: any[]): { accounts: TBAccount[]; matched: number; unmatched: number } {
  const coa = coaRaw.map(normalizeCoaRow);
  const byQbId = new Map<string, any>();
  const byNumber = new Map<string, any>();
  const byNameAll = new Map<string, any[]>();
  const byFqnAll = new Map<string, any[]>();
  for (const c of coa) {
    if (c.accountId) byQbId.set(c.accountId, c);
    if (c.accountNumber && !c._autoNumbered) byNumber.set(c.accountNumber, c);
    if (c.accountName) {
      const k = c.accountName.toLowerCase();
      const list = byNameAll.get(k) || []; list.push(c); byNameAll.set(k, list);
    }
    if (c.fullyQualifiedName) {
      const k = c.fullyQualifiedName.toLowerCase();
      const list = byFqnAll.get(k) || []; list.push(c); byFqnAll.set(k, list);
    }
  }
  const byName = new Map<string, any>();
  for (const [k, list] of byNameAll) if (list.length === 1) byName.set(k, list[0]);
  const byFqn = new Map<string, any>();
  for (const [k, list] of byFqnAll) if (list.length === 1) byFqn.set(k, list[0]);

  let matched = 0, unmatched = 0;
  const out = tb.map((t) => {
    // Extract "1025" from TB accountName like "1025 Fidelity Business Account"
    // and the residual name "Fidelity Business Account" / "RETAIL:z_Shopify Sales".
    const leadingNum = extractLeadingAcctNum(t.accountName);
    const nameSansNum = leadingNum
      ? (t.accountName || "").replace(/^\d{4,5}\s+/, "").trim()
      : (t.accountName || "").trim();

    // TB rows for sub-accounts arrive with accountName = "Parent:Child" and
    // no accountNumber (the parser strips the parent's acctNum). Prefer FQN
    // lookup before number lookup so children resolve to their leaf CoA row
    // instead of collapsing into the parent (which shares the same acctNum).
    const fqnLower = (t.fullyQualifiedName || "").toLowerCase();
    const nameAsFqn = (t.accountName || "").includes(":") ? (t.accountName || "").toLowerCase() : "";

    const m =
      (t.qbAccountId && byQbId.get(t.qbAccountId)) ||
      (fqnLower && byFqn.get(fqnLower)) ||
      (nameAsFqn && byFqn.get(nameAsFqn)) ||
      (t.accountNumber && byNumber.get(t.accountNumber)) ||
      (leadingNum && !nameAsFqn && byNumber.get(leadingNum)) ||
      (t.accountName && byName.get(t.accountName.toLowerCase())) ||
      (nameSansNum && byName.get(nameSansNum.toLowerCase())) ||
      (nameSansNum && byFqn.get(nameSansNum.toLowerCase())) ||
      (t.accountName?.includes(":") && byName.get(t.accountName.split(":").pop()!.trim().toLowerCase())) ||
      (t.accountName?.includes(":") && byName.get(t.accountName.split(":")[0].trim().toLowerCase()));

    if (m) {
      matched++;
      const fsFromClass = m.classification ? normalizeClassification(m.classification) : undefined;
      return {
        ...t,
        accountNumber: m.accountNumber || t.accountNumber || leadingNum || "",
        fsType: (m.fsType as FsType) || t.fsType,
        accountType: m.category || t.accountType,
        accountSubtype: m.accountSubtype || "",
        fsLineItem: t.fsLineItem || m.category || fsFromClass || undefined,
        _matchedFromCOA: true,
      };
    }
    unmatched++;
    const nl = (t.accountName || "").toLowerCase();
    let inferred: string | undefined;
    if (/income|revenue|sales/.test(nl)) inferred = "Revenue";
    else if (/cost of goods|cogs/.test(nl)) inferred = "Cost of Goods Sold";
    else if (/depreciation|amortization/.test(nl)) inferred = "Other expense (income)";
    else if (/payroll|salary|wage|expense|cost|insurance|rent|utilities/.test(nl)) inferred = "Operating expenses";
    return {
      ...t,
      // Backfill accountNumber from the "1025 Foo" style name so downstream
      // classifiers (which key off numeric prefix) work even without a CoA hit.
      ...(leadingNum && !t.accountNumber ? { accountNumber: leadingNum } : {}),
      ...(inferred && !t.fsLineItem ? { fsLineItem: inferred, fsType: "IS" as FsType } : {}),
      _matchedFromCOA: false,
    };
  });
  return { accounts: out, matched, unmatched };
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Ops tool: no user auth required (verify_jwt=false). Rebuild is
    // idempotent and only reads/writes the caller-specified project's own
    // processed_data → wizard_data.trialBalance cache using the same
    // inference the client would run on the next page load.
    const admin = createClient(supabaseUrl, serviceKey);
    void anonKey;


    const body = await req.json().catch(() => ({}));
    const projectId = body?.project_id;
    if (!projectId || typeof projectId !== "string") {
      return new Response(JSON.stringify({ error: "project_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load project
    const { data: project, error: projErr } = await admin
      .from("projects").select("id,periods,wizard_data")
      .eq("id", projectId).single();
    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "project not found", detail: projErr?.message }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const periods: Period[] = Array.isArray(project.periods) ? project.periods as Period[] : [];
    const wizard: any = project.wizard_data || {};
    let coaAccounts: any[] = wizard?.chartOfAccounts?.accounts || [];
    let coaSource: "wizard_cache" | "processed_data" | "none" =
      coaAccounts.length > 0 ? "wizard_cache" : "none";

    // Fallback: pull raw Chart of Accounts from processed_data if the wizard
    // cache is empty. QB uploads land here in native qbToJson shape
    // (name/fullyQualifiedName/acctNum/classification/fsType); crossReferenceCOA
    // normalizes both shapes.
    if (coaAccounts.length === 0) {
      const { data: coaRows } = await admin
        .from("processed_data")
        .select("data,created_at")
        .eq("project_id", projectId)
        .eq("data_type", "chart_of_accounts")
        .order("created_at", { ascending: false })
        .limit(1);
      const row = (coaRows || [])[0]?.data as any;
      const candidate =
        (Array.isArray(row) && row) ||
        (Array.isArray(row?.accounts) && row.accounts) ||
        (Array.isArray(row?.chartOfAccounts) && row.chartOfAccounts) ||
        (Array.isArray(row?.data) && row.data) ||
        [];
      if (candidate.length > 0) {
        coaAccounts = candidate;
        coaSource = "processed_data";
      }
    }

    // Load processed_data TB rows
    const { data: records, error: pdErr } = await admin
      .from("processed_data")
      .select("id,period_start,period_end,data")
      .eq("project_id", projectId)
      .eq("data_type", "trial_balance")
      .order("period_start", { ascending: true })
      .limit(1000000);
    if (pdErr) {
      return new Response(JSON.stringify({ error: "processed_data fetch failed", detail: pdErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let merged: TBAccount[] = [];
    let processedRecords = 0;
    for (const rec of records || []) {
      if (!rec?.data) continue;
      const raw: any = { ...(rec.data as any) };
      if (!raw.rows && Array.isArray(raw.monthlyReports) && raw.monthlyReports.length === 1
          && raw.monthlyReports[0]?.report?.rows) {
        raw.rows = raw.monthlyReports[0].report.rows;
      }
      raw.reportDate = rec.period_end || rec.period_start;
      const next = transformQbTB(raw, periods);
      if (next.length > 0) {
        merged = mergeAccounts(merged, next);
        processedRecords++;
      }
    }

    let coaStats = { matched: 0, unmatched: 0 };
    if (coaAccounts.length > 0 && merged.length > 0) {
      const cr = crossReferenceCOA(merged, coaAccounts);
      merged = cr.accounts;
      coaStats = { matched: cr.matched, unmatched: cr.unmatched };
    }

    // Compose stats
    const isCount = merged.filter((a) => a.fsType === "IS").length;
    const bsCount = merged.filter((a) => a.fsType === "BS").length;

    // Write back
    const newWizard = {
      ...wizard,
      trialBalance: {
        ...(wizard.trialBalance || {}),
        accounts: merged,
        lastUpdated: new Date().toISOString(),
        rebuiltBy: "rebuild-project-tb",
      },
    };
    const { error: updErr } = await admin
      .from("projects").update({ wizard_data: newWizard }).eq("id", projectId);
    if (updErr) {
      return new Response(JSON.stringify({ error: "update failed", detail: updErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Spot-check IS revenue/COGS rows for the response
    const spotCheck = merged
      .filter((a) => /shopify sales|t-shirt sales|cogs-shopify|5095 shipping|royalties income|paypal sales/i.test(a.accountName))
      .slice(0, 12)
      .map((a) => ({ name: a.accountName, fsType: a.fsType, category: a.accountType, fsLineItem: a.fsLineItem }));

    return new Response(JSON.stringify({
      ok: true,
      project_id: projectId,
      processed_records: processedRecords,
      total_records: records?.length || 0,
      periods: periods.length,
      coa_accounts: coaAccounts.length,
      coa_source: coaSource,
      tb_accounts: merged.length,
      is_count: isCount,
      bs_count: bsCount,
      coa_match: coaStats,
      spot_check: spotCheck,
    }, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "unexpected", detail: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
