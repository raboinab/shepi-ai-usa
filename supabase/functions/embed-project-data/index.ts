import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ChunkInput {
  chunkKey: string;
  content: string;
  dataType: string;
  period: string | null;
  fsSection: string | null;
  metadata: Record<string, unknown>;
}

const EMBEDDING_BATCH_SIZE = 10;
const MAX_CHUNK_CHARS = 6000; // ~1500 tokens

// ─── Utility ────────────────────────────────────────────────

function fmt(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitIfLarge(items: unknown[], maxItems: number): unknown[][] {
  if (items.length <= maxItems) return [items];
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

// ─── Serializers ────────────────────────────────────────────

function serializeTrialBalance(
  projectName: string,
  record: any
): ChunkInput[] {
  const chunks: ChunkInput[] = [];
  const data = record.data;
  if (!data) return chunks;

  // Handle qbtojson monthlyReports structure
  if (data.monthlyReports && Array.isArray(data.monthlyReports)) {
    return serializeMonthlyReportsTB(projectName, record, data.monthlyReports);
  }

  // TB data can be an array of accounts or { accounts: [...] }
  const accounts: any[] = Array.isArray(data) ? data : (data.accounts || data.rows || []);
  if (accounts.length === 0) return chunks;

  const period = record.period_start
    ? new Date(record.period_start).toISOString().slice(0, 7)
    : record.period_end
      ? new Date(record.period_end).toISOString().slice(0, 7)
      : "unknown";

  // Group by FS section
  const sectionMap: Record<string, any[]> = {};
  for (const acct of accounts) {
    const section = (acct.fsType || acct.fs_type || acct.classification || acct.type || "other").toLowerCase();
    const normalized = normalizeFsSection(section);
    if (!sectionMap[normalized]) sectionMap[normalized] = [];
    sectionMap[normalized].push(acct);
  }

  for (const [section, accts] of Object.entries(sectionMap)) {
    const lines = accts.map((a: any) => {
      const num = a.accountNumber || a.account_number || a.number || "";
      const name = a.accountName || a.account_name || a.name || "Unknown";
      const balance = a.balance ?? a.amount ?? a.value ?? 0;
      return `${num} ${name}: ${fmt(balance)}`;
    });
    const total = accts.reduce((s: number, a: any) => s + Number(a.balance ?? a.amount ?? a.value ?? 0), 0);
    lines.push(`Section Total: ${fmt(total)}`);

    const header = `Project: ${projectName} | Data: Trial Balance | Period: ${period} | Section: ${section}`;
    const content = header + "\n" + lines.join("\n");

    chunks.push({
      chunkKey: `${record.project_id}:trial_balance:${period}:${section}:0`,
      content,
      dataType: "trial_balance",
      period,
      fsSection: section,
      metadata: { record_count: accts.length, source_type: record.source_type },
    });
  }

  return chunks;
}

/** Handle qbtojson monthlyReports TB format: data.monthlyReports[].report.rows.row[] with colData */
function serializeMonthlyReportsTB(
  projectName: string,
  record: any,
  monthlyReports: any[]
): ChunkInput[] {
  const chunks: ChunkInput[] = [];

  for (const mr of monthlyReports) {
    const rows = mr?.report?.rows?.row || mr?.report?.rows?.Row || [];
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const period = `${mr.year || 'unknown'}-${String(mr.month || 1).padStart(2, '0')}`;

    // Flatten nested rows (QB reports have hierarchical rows with sub-rows)
    const flatRows = flattenQBRows(rows);

    const lines = flatRows.map((r: any) => {
      return `${r.name}: ${fmt(r.amount)}`;
    });
    const total = flatRows.reduce((s: number, r: any) => s + r.amount, 0);
    lines.push(`Period Total: ${fmt(total)}`);

    const header = `Project: ${projectName} | Data: Trial Balance | Period: ${period}`;
    const content = (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS);

    chunks.push({
      chunkKey: `${record.project_id}:trial_balance:${period}::0`,
      content,
      dataType: "trial_balance",
      period,
      fsSection: null,
      metadata: { record_count: flatRows.length, source_type: record.source_type },
    });
  }

  return chunks;
}

function flattenQBRows(rows: any[], depth = 0): { name: string; amount: number }[] {
  const results: { name: string; amount: number }[] = [];
  if (depth > 5) return results; // prevent infinite recursion

  for (const row of rows) {
    const cols = row.colData || row.ColData || [];
    const name = cols[0]?.value;
    const amountStr = cols[1]?.value;

    if (name && amountStr && name !== '' && !name.startsWith('Total')) {
      const amount = Number(amountStr) || 0;
      if (amount !== 0) {
        results.push({ name, amount });
      }
    }

    // Recurse into sub-rows
    const subRows = row.rows?.row || row.rows?.Row || row.Rows?.Row || [];
    if (Array.isArray(subRows) && subRows.length > 0) {
      results.push(...flattenQBRows(subRows, depth + 1));
    }
  }

  return results;
}

function normalizeFsSection(raw: string): string {
  const lower = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (lower.includes("asset")) return "assets";
  if (lower.includes("liabilit")) return "liabilities";
  if (lower.includes("equity") || lower.includes("capital")) return "equity";
  if (lower.includes("revenue") || lower.includes("income") && !lower.includes("other")) return "revenue";
  if (lower.includes("cogs") || lower.includes("costof")) return "cogs";
  if (lower.includes("opex") || lower.includes("operating") || lower.includes("expense") && !lower.includes("other")) return "opex";
  if (lower.includes("otherexpense")) return "other_expense";
  if (lower.includes("otherincome")) return "other_income";
  return "other";
}

function serializeSimpleFinancialReport(
  projectName: string,
  record: any,
  dataType: string,
  label: string
): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const period = record.period_start
    ? new Date(record.period_start).toISOString().slice(0, 7)
    : record.period_end
      ? new Date(record.period_end).toISOString().slice(0, 7)
      : "unknown";

  const lines: string[] = [];
  const items = Array.isArray(data) ? data : (data.rows || data.lineItems || data.items || []);

  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      const name = item.name || item.label || item.account || "Item";
      const amount = item.amount ?? item.balance ?? item.value ?? 0;
      lines.push(`${name}: ${fmt(amount)}`);
    }
  } else if (typeof data === "object") {
    // Flat key-value structure
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === "number") {
        lines.push(`${key}: ${fmt(val)}`);
      } else if (typeof val === "string" && !key.startsWith("_")) {
        lines.push(`${key}: ${val}`);
      }
    }
  }

  if (lines.length === 0) {
    lines.push(JSON.stringify(data).slice(0, MAX_CHUNK_CHARS));
  }

  const header = `Project: ${projectName} | Data: ${label} | Period: ${period}`;
  const content = header + "\n" + lines.join("\n");

  return [{
    chunkKey: `${record.project_id}:${dataType}:${period}::0`,
    content: content.slice(0, MAX_CHUNK_CHARS),
    dataType,
    period,
    fsSection: null,
    metadata: { record_count: items.length || Object.keys(data).length, source_type: record.source_type },
  }];
}

function serializeChartOfAccounts(projectName: string, record: any): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const accounts: any[] = Array.isArray(data) ? data : (data.accounts || []);
  if (accounts.length === 0) return [];

  const batches = splitIfLarge(accounts, 150);
  return batches.map((batch, idx) => {
    const lines = (batch as any[]).map((a: any) => {
      const num = a.accountNumber || a.number || "";
      const name = a.accountName || a.name || "Unknown";
      const type = a.fsType || a.type || "";
      const lineItem = a.fsLineItem || a.lineItem || "";
      return `${num} | ${name} | ${type} | ${lineItem}`;
    });
    const header = `Project: ${projectName} | Data: Chart of Accounts | Part: ${idx + 1}/${batches.length}`;
    return {
      chunkKey: `${record.project_id}:chart_of_accounts:::${idx}`,
      content: (header + "\nAcctNo | Name | FS Type | Line Item\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
      dataType: "chart_of_accounts",
      period: null,
      fsSection: null,
      metadata: { record_count: batch.length, source_type: record.source_type },
    };
  });
}

function serializeAgingReport(
  projectName: string,
  record: any,
  dataType: string,
  entityLabel: string
): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const period = record.period_start
    ? "as_of_" + new Date(record.period_start).toISOString().slice(0, 10)
    : record.period_end
      ? "as_of_" + new Date(record.period_end).toISOString().slice(0, 10)
      : "unknown";

  const entries: any[] = Array.isArray(data) ? data : (data.entries || data.rows || data.customers || data.vendors || []);
  if (entries.length === 0) return [];

  const batches = splitIfLarge(entries, 50);
  return batches.map((batch, idx) => {
    const lines = (batch as any[]).map((e: any) => {
      const name = e.name || e.customer || e.vendor || "Unknown";
      const total = e.total ?? e.balance ?? 0;
      const current = e.current ?? e["0-30"] ?? 0;
      const b1 = e["1-30"] ?? e["31-60"] ?? 0;
      const b2 = e["31-60"] ?? e["61-90"] ?? 0;
      const b3 = e["61-90"] ?? 0;
      const b4 = e["90+"] ?? e.over90 ?? 0;
      return `${name} | Total: ${fmt(total)} | Current: ${fmt(current)} | 1-30: ${fmt(b1)} | 31-60: ${fmt(b2)} | 61-90: ${fmt(b3)} | 90+: ${fmt(b4)}`;
    });
    const totalAR = (batch as any[]).reduce((s: number, e: any) => s + Number(e.total ?? e.balance ?? 0), 0);
    lines.push(`Total ${dataType.toUpperCase()}: ${fmt(totalAR)}`);

    const header = `Project: ${projectName} | Data: ${entityLabel} | ${period} | Part: ${idx + 1}/${batches.length}`;
    return {
      chunkKey: `${record.project_id}:${dataType}:${period}::${idx}`,
      content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
      dataType,
      period,
      fsSection: null,
      metadata: { record_count: batch.length, source_type: record.source_type },
    };
  });
}

function serializeConcentration(
  projectName: string,
  record: any,
  dataType: string,
  entityLabel: string
): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const entries: any[] = Array.isArray(data) ? data : (data.customers || data.vendors || data.entries || []);
  if (entries.length === 0) return [];

  // Group by year if possible
  const period = record.period_start
    ? new Date(record.period_start).getFullYear().toString()
    : record.period_end
      ? new Date(record.period_end).getFullYear().toString()
      : "all";

  const lines = entries.map((e: any) => {
    const name = e.name || e.customer || e.vendor || "Unknown";
    const revenue = e.revenue ?? e.amount ?? e.spend ?? 0;
    const pct = e.percentage ?? e.pct ?? 0;
    return `${name}: ${fmt(revenue)} (${Number(pct).toFixed(1)}%)`;
  });

  const header = `Project: ${projectName} | Data: ${entityLabel} | Year: ${period}`;
  return [{
    chunkKey: `${record.project_id}:${dataType}:${period}::0`,
    content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
    dataType,
    period,
    fsSection: null,
    metadata: { record_count: entries.length, source_type: record.source_type },
  }];
}

function serializePayroll(projectName: string, record: any): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const extracted = data.extractedData || data;
  const categories = ["salaryWages", "payrollTaxes", "benefits", "ownerCompensation"];
  const lines: string[] = [];

  for (const cat of categories) {
    const items = extracted[cat] || [];
    if (items.length > 0) {
      lines.push(`\n--- ${cat} ---`);
      for (const item of items) {
        const name = item.name || "Unknown";
        const vals = item.monthlyValues || {};
        const total = Object.values(vals).reduce((s: number, v: any) => s + Number(v || 0), 0);
        lines.push(`${name}: Total ${fmt(total)}`);
      }
    }
  }

  if (lines.length === 0) return [];

  const header = `Project: ${projectName} | Data: Payroll`;
  return [{
    chunkKey: `${record.project_id}:payroll:::0`,
    content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
    dataType: "payroll",
    period: null,
    fsSection: null,
    metadata: { source_type: record.source_type },
  }];
}

function serializeFixedAssets(projectName: string, record: any): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const extracted = data.extractedData || data;
  const assets: any[] = extracted.assets || [];
  if (assets.length === 0) return [];

  const batches = splitIfLarge(assets, 50);
  return batches.map((batch, idx) => {
    const lines = (batch as any[]).map((a: any) => {
      const desc = a.description || "Unknown";
      const cat = a.category || "";
      const cost = a.cost ?? 0;
      const dep = a.accumDepreciation ?? 0;
      const nbv = cost - dep;
      return `${desc} (${cat}): Cost ${fmt(cost)} | Dep ${fmt(dep)} | NBV ${fmt(nbv)}`;
    });
    const totalNBV = (batch as any[]).reduce((s: number, a: any) => s + Number(a.cost ?? 0) - Number(a.accumDepreciation ?? 0), 0);
    lines.push(`Total NBV: ${fmt(totalNBV)}`);

    const header = `Project: ${projectName} | Data: Fixed Assets | Part: ${idx + 1}/${batches.length}`;
    return {
      chunkKey: `${record.project_id}:fixed_assets:::${idx}`,
      content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
      dataType: "fixed_assets",
      period: null,
      fsSection: null,
      metadata: { record_count: batch.length, source_type: record.source_type },
    };
  });
}

function serializeDebtSchedule(projectName: string, record: any): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const debts: any[] = data.debts || [];
  if (debts.length === 0) return [];

  const lines = debts.map((d: any) => {
    const lender = d.lender || "Unknown";
    const type = d.facilityType || "";
    const balance = d.currentBalance ?? 0;
    const rate = d.interestRate ?? 0;
    const maturity = d.maturityDate || "N/A";
    return `${lender} (${type}): Balance ${fmt(balance)} | Rate ${rate}% | Maturity ${maturity}`;
  });
  const totalOutstanding = debts.reduce((s: number, d: any) => s + Number(d.currentBalance ?? 0), 0);
  lines.push(`Total Outstanding: ${fmt(totalOutstanding)}`);

  const header = `Project: ${projectName} | Data: Debt Schedule`;
  return [{
    chunkKey: `${record.project_id}:debt_schedule:::0`,
    content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
    dataType: "debt_schedule",
    period: null,
    fsSection: null,
    metadata: { record_count: debts.length, source_type: record.source_type },
  }];
}

function serializeMaterialContract(projectName: string, record: any): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const contracts: any[] = data.contracts || [data];
  return contracts.map((c: any, idx: number) => {
    const counterparty = c.counterparty || "Unknown";
    const type = c.contractType || "";
    const desc = c.description || "";
    const expiration = c.expirationDate || "N/A";
    const value = c.contractValue ?? c.annualValue ?? null;
    const changeOfControl = c.changeOfControl || "None";

    const lines = [
      `Counterparty: ${counterparty}`,
      `Type: ${type}`,
      `Description: ${desc}`,
      `Expiration: ${expiration}`,
      value != null ? `Value: ${fmt(value)}` : null,
      `Change of Control: ${changeOfControl}`,
      c.terminationTerms ? `Termination: ${c.terminationTerms}` : null,
      c.keyObligations?.length ? `Obligations: ${c.keyObligations.join("; ")}` : null,
      c.concerns?.length ? `Concerns: ${c.concerns.join("; ")}` : null,
    ].filter(Boolean);

    const header = `Project: ${projectName} | Data: Material Contract | Contract: ${counterparty}`;
    return {
      chunkKey: `${record.project_id}:material_contract:${counterparty.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40)}::${idx}`,
      content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
      dataType: "material_contract",
      period: null,
      fsSection: null,
      metadata: { source_type: record.source_type },
    };
  });
}

function serializeTransactionSummary(
  projectName: string,
  record: any,
  dataType: string
): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const label = dataType === 'credit_card_transactions' ? 'Credit Card Transactions' : 'Bank Transactions';
  const period = record.period_start
    ? new Date(record.period_start).toISOString().slice(0, 7)
    : record.period_end
      ? new Date(record.period_end).toISOString().slice(0, 7)
      : "unknown";

  // Transaction data can be huge arrays — summarize instead of serializing everything
  const transactions: any[] = Array.isArray(data) ? data : (data.transactions || data.rows || data.entries || []);

  if (transactions.length === 0) {
    // Fallback: serialize as generic but truncated
    const content = JSON.stringify(data).slice(0, MAX_CHUNK_CHARS);
    const header = `Project: ${projectName} | Data: ${label} | Period: ${period}`;
    return [{
      chunkKey: `${record.project_id}:${dataType}:${period}::0`,
      content: (header + "\n" + content).slice(0, MAX_CHUNK_CHARS),
      dataType: dataType === 'bank_statement' ? 'bank_transactions' : dataType,
      period,
      fsSection: null,
      metadata: { source_type: record.source_type },
    }];
  }

  // Build summary: aggregate by payee/vendor, identify top amounts, and sample transactions
  const payeeSummary: Record<string, { count: number; total: number; amounts: number[] }> = {};
  let totalAmount = 0;
  let txnCount = 0;

  for (const txn of transactions) {
    const payee = txn.payee || txn.vendor || txn.name || txn.description || txn.memo || 'Unknown';
    const amount = Math.abs(Number(txn.amount || txn.value || 0));
    if (!payeeSummary[payee]) payeeSummary[payee] = { count: 0, total: 0, amounts: [] };
    payeeSummary[payee].count++;
    payeeSummary[payee].total += amount;
    if (payeeSummary[payee].amounts.length < 5) payeeSummary[payee].amounts.push(amount);
    totalAmount += amount;
    txnCount++;
  }

  // Sort payees by total amount descending
  const topPayees = Object.entries(payeeSummary)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 40);

  const lines: string[] = [
    `Total Transactions: ${txnCount}`,
    `Total Amount: ${fmt(totalAmount)}`,
    `\nTop Payees/Vendors by Amount:`,
  ];

  for (const [payee, info] of topPayees) {
    const avgAmount = info.total / info.count;
    lines.push(`• ${payee}: ${info.count} txns, Total ${fmt(info.total)}, Avg ${fmt(avgAmount)}`);
  }

  // Add sample of largest individual transactions
  const sortedTxns = transactions
    .map(t => ({
      payee: t.payee || t.vendor || t.name || t.description || t.memo || 'Unknown',
      amount: Number(t.amount || t.value || 0),
      date: t.date || t.txn_date || t.transaction_date || '',
      account: t.account_name || t.account || '',
    }))
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    .slice(0, 20);

  lines.push(`\nLargest Individual Transactions:`);
  for (const t of sortedTxns) {
    lines.push(`• ${t.date} | ${t.payee} | ${fmt(t.amount)}${t.account ? ` | ${t.account}` : ''}`);
  }

  const header = `Project: ${projectName} | Data: ${label} | Period: ${period}`;
  const content = (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS);

  return [{
    chunkKey: `${record.project_id}:${dataType === 'bank_statement' ? 'bank_transactions' : dataType}:${period}::0`,
    content,
    dataType: dataType === 'bank_statement' ? 'bank_transactions' : dataType,
    period,
    fsSection: null,
    metadata: { record_count: txnCount, source_type: record.source_type },
  }];
}

function serializeGenericRecord(
  projectName: string,
  record: any,
  dataType: string,
  label: string
): ChunkInput[] {
  const data = record.data;
  if (!data) return [];

  const period = record.period_start
    ? new Date(record.period_start).toISOString().slice(0, 7)
    : record.period_end
      ? new Date(record.period_end).toISOString().slice(0, 7)
      : null;

  let content: string;
  if (typeof data === "string") {
    content = data;
  } else {
    content = JSON.stringify(data, null, 1);
  }

  const header = `Project: ${projectName} | Data: ${label}` + (period ? ` | Period: ${period}` : "");
  return [{
    chunkKey: `${record.project_id}:${dataType}:${period || ""}::0`,
    content: (header + "\n" + content).slice(0, MAX_CHUNK_CHARS),
    dataType,
    period,
    fsSection: null,
    metadata: { source_type: record.source_type },
  }];
}

// ─── Wizard Data Serializers ────────────────────────────────

function serializeWizardAdjustments(projectId: string, projectName: string, wizardData: any): ChunkInput[] {
  const adjustments = wizardData?.adjustments;
  if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) return [];

  const batches = adjustments.length > 30
    ? splitIfLarge(adjustments, 30)
    : [adjustments];

  return batches.map((batch, idx) => {
    const lines = (batch as any[]).map((a: any) => {
      const desc = a.description || a.name || "Unknown adjustment";
      const amount = a.amount ?? a.value ?? 0;
      const type = a.type || a.adjustmentType || "";
      const category = a.category || "";
      return `${desc}: ${fmt(amount)} (${type}${category ? ", " + category : ""})`;
    });

    const header = `Project: ${projectName} | Data: DD Adjustments | Part: ${idx + 1}/${batches.length}`;
    return {
      chunkKey: `${projectId}:adjustments:::${idx}`,
      content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
      dataType: "adjustments",
      period: null,
      fsSection: null,
      metadata: { record_count: (batch as any[]).length, source_type: "wizard" },
    };
  });
}

function serializeWizardReclassifications(projectId: string, projectName: string, wizardData: any): ChunkInput[] {
  const reclasses = wizardData?.reclassifications;
  if (!reclasses || !Array.isArray(reclasses) || reclasses.length === 0) return [];

  const lines = reclasses.map((r: any) => {
    const desc = r.description || r.name || "Reclass";
    const amount = r.amount ?? 0;
    const from = r.fromLine || r.from || "";
    const to = r.toLine || r.to || "";
    return `${desc}: ${fmt(amount)} (${from} → ${to})`;
  });

  const header = `Project: ${projectName} | Data: Reclassifications`;
  return [{
    chunkKey: `${projectId}:reclassifications:::0`,
    content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
    dataType: "reclassifications",
    period: null,
    fsSection: null,
    metadata: { record_count: reclasses.length, source_type: "wizard" },
  }];
}

function serializeWizardAgingPeriods(
  projectId: string,
  projectName: string,
  wizardData: any,
  key: string,
  dataType: string,
  label: string
): ChunkInput[] {
  const agingData = wizardData?.[key];
  if (!agingData?.periodData) return [];

  const chunks: ChunkInput[] = [];
  const periodData = agingData.periodData;

  for (const [periodId, entries] of Object.entries(periodData)) {
    if (!Array.isArray(entries) || entries.length === 0) continue;
    const lines = (entries as any[]).map((e: any) => {
      const name = e.name || "Unknown";
      const total = e.total ?? 0;
      return `${name}: ${fmt(total)}`;
    });

    const header = `Project: ${projectName} | Data: ${label} | Period: ${periodId}`;
    chunks.push({
      chunkKey: `${projectId}:${dataType}:${periodId}::0`,
      content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
      dataType,
      period: periodId,
      fsSection: null,
      metadata: { record_count: entries.length, source_type: "wizard" },
    });
  }

  return chunks;
}

function serializeWizardConcentration(
  projectId: string,
  projectName: string,
  wizardData: any,
  key: string,
  dataType: string,
  label: string,
  entryKey: string
): ChunkInput[] {
  const concData = wizardData?.[key];
  if (!concData) return [];

  const entries: any[] = concData[entryKey] || [];
  if (entries.length === 0) return [];

  const lines = entries.map((e: any) => {
    const name = e.name || "Unknown";
    const yearlyVals = e.yearlyRevenue || e.yearlySpend || {};
    const parts = Object.entries(yearlyVals).map(([yr, val]) => `${yr}: ${fmt(val as number)}`);
    return `${name}: ${parts.join(", ")}`;
  });

  const header = `Project: ${projectName} | Data: ${label}`;
  return [{
    chunkKey: `${projectId}:${dataType}:::0`,
    content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
    dataType,
    period: null,
    fsSection: null,
    metadata: { record_count: entries.length, source_type: "wizard" },
  }];
}

function serializeWizardDealParameters(projectId: string, projectName: string, wizardData: any): ChunkInput[] {
  const deal = wizardData?.dealParameters;
  if (!deal || typeof deal !== "object") return [];

  const lines = Object.entries(deal)
    .filter(([k]) => !k.startsWith("_") && k !== "syncSource" && k !== "lastSyncDate")
    .map(([k, v]) => `${k}: ${typeof v === "number" ? fmt(v) : String(v)}`);

  if (lines.length === 0) return [];

  const header = `Project: ${projectName} | Data: Deal Parameters`;
  return [{
    chunkKey: `${projectId}:deal_parameters:::0`,
    content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
    dataType: "deal_parameters",
    period: null,
    fsSection: null,
    metadata: { source_type: "wizard" },
  }];
}

function serializeWizardLabels(projectId: string, projectName: string, wizardData: any): ChunkInput[] {
  const labels = wizardData?.financialCategoryLabels;
  if (!labels || typeof labels !== "object") return [];

  const lines = Object.entries(labels)
    .filter(([k]) => !k.startsWith("_"))
    .map(([k, v]) => `${k}: ${String(v)}`);

  if (lines.length === 0) return [];

  const header = `Project: ${projectName} | Data: Financial Category Labels`;
  return [{
    chunkKey: `${projectId}:financial_category_labels:::0`,
    content: (header + "\n" + lines.join("\n")).slice(0, MAX_CHUNK_CHARS),
    dataType: "financial_category_labels",
    period: null,
    fsSection: null,
    metadata: { source_type: "wizard" },
  }];
}

function serializeWizardGeneric(
  projectId: string,
  projectName: string,
  wizardData: any,
  key: string,
  dataType: string,
  label: string
): ChunkInput[] {
  const val = wizardData?.[key];
  if (!val || typeof val !== "object") return [];

  const content = JSON.stringify(val, null, 1);
  if (content.length < 20) return [];

  const header = `Project: ${projectName} | Data: ${label}`;
  return [{
    chunkKey: `${projectId}:${dataType}:::0`,
    content: (header + "\n" + content).slice(0, MAX_CHUNK_CHARS),
    dataType,
    period: null,
    fsSection: null,
    metadata: { source_type: "wizard" },
  }];
}

// ─── Main ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { project_id, data_types, source } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[embed-project-data] Starting for project ${project_id}, data_types: ${data_types || "all"}, source: ${source}`);

    // Fetch project name
    const { data: project } = await supabase
      .from("projects")
      .select("name, target_company, wizard_data")
      .eq("id", project_id)
      .single();

    const projectName = project?.target_company || project?.name || project_id;
    const wizardData = project?.wizard_data || {};

    // Fetch processed_data IDs and metadata first (lightweight query)
    const LARGE_DATA_TYPES = ['bank_transactions', 'bank_statement', 'credit_card_transactions'];

    let idQuery = supabase
      .from("processed_data")
      .select("id, data_type, period_start, period_end, source_type")
      .eq("project_id", project_id)
      .limit(500);

    if (data_types && data_types.length > 0) {
      idQuery = idQuery.in("data_type", data_types);
    }

    const { data: recordIds, error: idError } = await idQuery;
    if (idError) {
      console.error("[embed-project-data] Failed to fetch record IDs:", idError);
      throw new Error("Failed to fetch record IDs");
    }

    console.log(`[embed-project-data] Found ${recordIds?.length || 0} processed_data records`);

    // ─── Build all chunks by processing records ONE AT A TIME ───
    const allChunks: ChunkInput[] = [];
    let embeddedCount = 0;

    // Helper to embed and upsert a batch of chunks
    async function embedBatch(chunks: ChunkInput[], apiKey: string, sb: any, projId: string): Promise<number> {
      let count = 0;
      for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
        const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
        try {
          const embRes = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "text-embedding-3-small", input: batch.map(c => c.content) }),
          });
          if (!embRes.ok) {
            console.error(`[embed-project-data] Embedding API error:`, await embRes.text());
            continue;
          }
          const embData = await embRes.json();
          const rows = batch.map((chunk, idx) => ({
            project_id: projId,
            data_type: chunk.dataType,
            period: chunk.period,
            fs_section: chunk.fsSection,
            chunk_key: chunk.chunkKey,
            content: chunk.content,
            embedding: JSON.stringify(embData.data[idx].embedding),
            token_count: estimateTokens(chunk.content),
            metadata: { ...chunk.metadata, embedded_at: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          }));
          const { error } = await sb.from("project_data_chunks").upsert(rows, { onConflict: "chunk_key" });
          if (error) console.error(`[embed-project-data] Upsert error:`, error);
          else count += batch.length;
        } catch (err) {
          console.error(`[embed-project-data] embedBatch error:`, err);
        }
      }
      return count;
    }

    // Process each record ONE AT A TIME (fetch full data only when needed)
    for (const meta of recordIds || []) {
      const dt = meta.data_type;
      try {
        // Fetch full record data
        const { data: fullRecord, error: fetchErr } = await supabase
          .from("processed_data")
          .select("*")
          .eq("id", meta.id)
          .single();

        if (fetchErr || !fullRecord) {
          console.error(`[embed-project-data] Error fetching record ${meta.id} (${dt}):`, fetchErr);
          continue;
        }

        // Use transaction summary serializer for large types
        if (LARGE_DATA_TYPES.includes(dt)) {
          allChunks.push(...serializeTransactionSummary(projectName, fullRecord, dt));
        } else {
          switch (dt) {
            case "trial_balance":
              allChunks.push(...serializeTrialBalance(projectName, fullRecord));
              break;
            case "chart_of_accounts":
              allChunks.push(...serializeChartOfAccounts(projectName, fullRecord));
              break;
            case "income_statement":
            case "profit_loss":
              allChunks.push(...serializeSimpleFinancialReport(projectName, fullRecord, "income_statement", "Income Statement"));
              break;
            case "balance_sheet":
              allChunks.push(...serializeSimpleFinancialReport(projectName, fullRecord, "balance_sheet", "Balance Sheet"));
              break;
            case "cash_flow":
              allChunks.push(...serializeSimpleFinancialReport(projectName, fullRecord, "cash_flow", "Cash Flow"));
              break;
            case "general_ledger":
              allChunks.push(...serializeSimpleFinancialReport(projectName, fullRecord, "general_ledger", "General Ledger Summary"));
              break;
            case "ar_aging":
              allChunks.push(...serializeAgingReport(projectName, fullRecord, "ar_aging", "AR Aging"));
              break;
            case "ap_aging":
              allChunks.push(...serializeAgingReport(projectName, fullRecord, "ap_aging", "AP Aging"));
              break;
            case "customer_concentration":
              allChunks.push(...serializeConcentration(projectName, fullRecord, "customer_concentration", "Customer Concentration"));
              break;
            case "vendor_concentration":
              allChunks.push(...serializeConcentration(projectName, fullRecord, "vendor_concentration", "Vendor Concentration"));
              break;
            case "payroll":
              allChunks.push(...serializePayroll(projectName, fullRecord));
              break;
            case "fixed_assets":
              allChunks.push(...serializeFixedAssets(projectName, fullRecord));
              break;
            case "debt_schedule":
              allChunks.push(...serializeDebtSchedule(projectName, fullRecord));
              break;
            case "material_contract":
              allChunks.push(...serializeMaterialContract(projectName, fullRecord));
              break;
            case "inventory":
              allChunks.push(...serializeGenericRecord(projectName, fullRecord, "inventory", "Inventory"));
              break;
            case "proof_of_cash":
              allChunks.push(...serializeSimpleFinancialReport(projectName, fullRecord, "proof_of_cash", "Proof of Cash"));
              break;
            case "cim_insights":
              allChunks.push(...serializeGenericRecord(projectName, fullRecord, "cim_insights", "CIM Insights"));
              break;
            case "tax_return":
              allChunks.push(...serializeGenericRecord(projectName, fullRecord, "tax_return", "Tax Return"));
              break;
            default:
              allChunks.push(...serializeGenericRecord(projectName, fullRecord, dt, dt));
              break;
          }
        }

        // Embed chunks in batches as we go to keep memory low
        if (allChunks.length >= EMBEDDING_BATCH_SIZE * 3) {
          const toEmbed = allChunks.splice(0, EMBEDDING_BATCH_SIZE * 2);
          embeddedCount += await embedBatch(toEmbed, openaiApiKey, supabase, project_id);
        }
      } catch (err) {
        console.error(`[embed-project-data] Error processing ${dt} (${meta.id}):`, err);
      }
    }

    // Process wizardData chunks (only if not filtering to specific processed_data types)
    const shouldProcessWizard = !data_types || data_types.length === 0 ||
      data_types.some((t: string) => ["adjustments", "reclassifications", "deal_parameters", "financial_category_labels"].includes(t));

    if (shouldProcessWizard && wizardData && typeof wizardData === "object") {
      allChunks.push(...serializeWizardAdjustments(project_id, projectName, wizardData));
      allChunks.push(...serializeWizardReclassifications(project_id, projectName, wizardData));
      allChunks.push(...serializeWizardAgingPeriods(project_id, projectName, wizardData, "arAging", "wizard_ar_aging", "AR Aging (Wizard)"));
      allChunks.push(...serializeWizardAgingPeriods(project_id, projectName, wizardData, "apAging", "wizard_ap_aging", "AP Aging (Wizard)"));
      allChunks.push(...serializeWizardConcentration(project_id, projectName, wizardData, "topCustomers", "wizard_customer_concentration", "Customer Concentration (Wizard)", "customers"));
      allChunks.push(...serializeWizardConcentration(project_id, projectName, wizardData, "topVendors", "wizard_vendor_concentration", "Vendor Concentration (Wizard)", "vendors"));
      allChunks.push(...serializeWizardDealParameters(project_id, projectName, wizardData));
      allChunks.push(...serializeWizardLabels(project_id, projectName, wizardData));
      // Generic wizard keys
      for (const [key, dt, label] of [
        ["fixedAssets", "wizard_fixed_assets", "Fixed Assets (Wizard)"],
        ["debtSchedule", "wizard_debt_schedule", "Debt Schedule (Wizard)"],
        ["proofOfCash", "wizard_proof_of_cash", "Proof of Cash (Wizard)"],
        ["inventory", "wizard_inventory", "Inventory (Wizard)"],
        ["cimInsights", "wizard_cim_insights", "CIM Insights (Wizard)"],
      ] as const) {
        allChunks.push(...serializeWizardGeneric(project_id, projectName, wizardData, key, dt, label));
      }
    }

    console.log(`[embed-project-data] Generated ${allChunks.length} remaining chunks to embed`);

    if (allChunks.length === 0 && embeddedCount === 0) {
      return new Response(
        JSON.stringify({ success: true, chunks_embedded: 0, message: "No data to embed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Embed remaining chunks ─────────────────────────────
    if (allChunks.length > 0) {
      embeddedCount += await embedBatch(allChunks, openaiApiKey, supabase, project_id);
    }

    console.log(`[embed-project-data] Successfully embedded ${embeddedCount} chunks total`);

    return new Response(
      JSON.stringify({
        success: true,
        chunks_embedded: embeddedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[embed-project-data] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
