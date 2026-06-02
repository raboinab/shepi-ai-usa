import * as XLSX from "xlsx";

export type MonthlyEntityType = "customer" | "vendor";

export interface MonthlyEntityRow {
  name: string;
  monthly: Record<string, number>; // key: "YYYY-MM"
  total: number;
}

export interface ParsedMonthlySummary {
  entityType: MonthlyEntityType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  months: string[];    // sorted YYYY-MM
  rows: MonthlyEntityRow[];
  grandTotal: number;
  source: "xlsx" | "csv";
}

const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

function parseMonthHeader(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const m = s.trim().toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
  if (!m) return null;
  const mo = MONTHS[m[1]];
  if (!mo) return null;
  return `${m[2]}-${String(mo).padStart(2, "0")}`;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,$\s]/g, "").replace(/^\((.*)\)$/, "-$1");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function endOfMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${yyyymm}-${String(last).padStart(2, "0")}`;
}

/**
 * Parse a QuickBooks "Sales by Customer Summary" or "Expenses by Vendor Summary"
 * Excel/CSV export where columns are months (e.g. "January 2023") and the final
 * column is "Total". Rows are entities; the last row is "TOTAL".
 */
export async function parseMonthlySummary(file: File): Promise<ParsedMonthlySummary> {
  const buf = await file.arrayBuffer();
  const isCsv = /\.csv$/i.test(file.name);
  const wb = XLSX.read(buf, { type: "array", raw: false, cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null });
  return parseMonthlySummaryRows(rows, isCsv ? "csv" : "xlsx");
}

export function parseMonthlySummaryRows(
  rows: unknown[][],
  source: "xlsx" | "csv" = "xlsx"
): ParsedMonthlySummary {
  // Find header row: first row whose A cell is "Customer" or "Vendor"
  let headerIdx = -1;
  let entityType: MonthlyEntityType = "customer";
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const a = rows[i]?.[0];
    if (typeof a !== "string") continue;
    const v = a.trim().toLowerCase();
    if (v === "customer") { headerIdx = i; entityType = "customer"; break; }
    if (v === "vendor") { headerIdx = i; entityType = "vendor"; break; }
  }
  if (headerIdx < 0) {
    throw new Error('Could not find header row — expected first column to be "Customer" or "Vendor".');
  }

  const header = rows[headerIdx] as unknown[];
  const months: string[] = [];
  const monthColIdx: number[] = [];
  let totalColIdx = -1;
  for (let c = 1; c < header.length; c++) {
    const h = header[c];
    if (typeof h === "string" && h.trim().toLowerCase() === "total") {
      totalColIdx = c;
      continue;
    }
    const ym = parseMonthHeader(h);
    if (ym) {
      months.push(ym);
      monthColIdx.push(c);
    }
  }
  if (months.length === 0) {
    throw new Error("Could not detect monthly columns (e.g. 'January 2023').");
  }
  months.sort();

  const entityRows: MonthlyEntityRow[] = [];
  let grandTotal = 0;
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const nameRaw = row[0];
    if (typeof nameRaw === "string" && /^accrual\s+basis/i.test(nameRaw.trim())) continue;
    let name = (nameRaw == null ? "" : String(nameRaw)).trim();
    // Last row is TOTAL — capture grandTotal and skip
    if (name.toLowerCase() === "total") {
      grandTotal = totalColIdx >= 0 ? toNumber(row[totalColIdx]) : monthColIdx.reduce((s, c) => s + toNumber(row[c]), 0);
      continue;
    }
    if (!name) {
      // QB sometimes includes an unnamed leading row (no vendor/customer on the transaction).
      // Keep it as "(Unassigned)" so totals reconcile.
      const hasValue = monthColIdx.some((c) => toNumber(row[c]) !== 0) || (totalColIdx >= 0 && toNumber(row[totalColIdx]) !== 0);
      if (!hasValue) continue;
      name = entityType === "customer" ? "(Unassigned customer)" : "(Unassigned vendor)";
    }
    const monthly: Record<string, number> = {};
    let total = 0;
    for (let k = 0; k < months.length; k++) {
      const v = toNumber(row[monthColIdx[k]]);
      monthly[months[k]] = v;
      total += v;
    }
    if (totalColIdx >= 0) {
      const t = toNumber(row[totalColIdx]);
      if (Number.isFinite(t)) total = t;
    }
    entityRows.push({ name, monthly, total });
  }

  if (grandTotal === 0) {
    grandTotal = entityRows.reduce((s, r) => s + r.total, 0);
  }

  const periodStart = `${months[0]}-01`;
  const periodEnd = endOfMonth(months[months.length - 1]);

  return { entityType, periodStart, periodEnd, months, rows: entityRows, grandTotal, source };
}
