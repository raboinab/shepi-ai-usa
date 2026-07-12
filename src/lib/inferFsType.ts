/**
 * Shared fsType / category inference used by both the client-side CoA transform
 * and edge-function ingestion. Extracted so plain-CSV / non-QB CoA uploads
 * don't blindly default every account to "BS" (which used to poison downstream
 * P&L / Trial Balance validation).
 */

export type FsType = "BS" | "IS";

// QuickBooks classification / subtype hints (case-insensitive substrings)
const IS_HINTS = [
  "revenue",
  "income",
  "sales",
  "cost of goods",
  "cogs",
  "cost of sales",
  "expense",
  "other income",
  "other expense",
];

const BS_HINTS = [
  "bank",
  "checking",
  "savings",
  "receivable",
  "current asset",
  "fixed asset",
  "other asset",
  "payable",
  "credit card",
  "current liability",
  "long term liability",
  "long-term liability",
  "equity",
];

/** Numeric prefix (e.g. "4000-Sales", "5000 COGS", "1200:Cash") → fsType. */
function inferFromAccountNumber(raw: string): FsType | null {
  const s = (raw || "").trim();
  if (!s) return null;
  const m = s.match(/^(\d{4,5})/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  if (!Number.isFinite(n)) return null;
  // Standard chart-of-accounts numbering:
  //   1xxx assets, 2xxx liabilities, 3xxx equity  → BS
  //   4xxx revenue, 5xxx COGS, 6xxx-9xxx expenses → IS
  if (n >= 1000 && n < 4000) return "BS";
  if (n >= 4000 && n < 10000) return "IS";
  return null;
}

/** Broad name-based keyword classifier. Runs after account-number and QB metadata checks. */
function inferFromName(name: string): FsType | null {
  const n = (name || "").toLowerCase();
  if (!n) return null;
  // IS keywords first — otherwise things like "Sales Tax Payable" would match BS.
  // Guard: "payable" / "receivable" always win for BS even if the row also mentions "tax".
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

/**
 * Determine fsType from every hint we've got.
 * Order: explicit → QB accountType → QB classification/subtype → number prefix → name.
 * Only returns null when nothing matches (caller decides default).
 */
export function inferFsType(input: {
  fsType?: string | null;
  accountType?: string | null;
  classification?: string | null;
  accountSubtype?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  fullyQualifiedName?: string | null;
}): FsType | null {
  const explicit = (input.fsType || "").toUpperCase();
  if (explicit === "BS" || explicit === "IS") return explicit;

  const meta = [input.accountType, input.classification, input.accountSubtype]
    .map((v) => (v || "").toLowerCase())
    .join(" | ");
  if (meta.trim()) {
    if (IS_HINTS.some((h) => meta.includes(h))) return "IS";
    if (BS_HINTS.some((h) => meta.includes(h))) return "BS";
  }

  const fromNumber = inferFromAccountNumber(input.accountNumber || "");
  if (fromNumber) return fromNumber;

  const nameForInfer = input.fullyQualifiedName || input.accountName || "";
  const fromName = inferFromName(nameForInfer);
  if (fromName) return fromName;

  return null;
}

/**
 * Infer a workbook category from name + fsType. Mirrors the buckets used by
 * `validate-financial-statement` and the QoE workbook grouping.
 */
export function inferCategory(name: string, fsType: FsType): string {
  const n = (name || "").toLowerCase();
  if (fsType === "BS") {
    if (/cash|bank|checking|savings|undeposited/.test(n)) return "Cash and Equivalents";
    if (/receivable|a\/r/.test(n)) return "Accounts Receivable";
    if (/inventory/.test(n)) return "Inventory";
    if (/prepaid|deposit/.test(n)) return "Prepaid Expenses";
    if (/fixed asset|equipment|furniture|vehicle|property|building|land|leasehold/.test(n)) return "Fixed Assets";
    if (/accumulated (depreciation|amortization)/.test(n)) return "Accumulated Depreciation";
    if (/payable|a\/p/.test(n)) return "Accounts Payable";
    if (/credit card/.test(n)) return "Credit Cards";
    if (/loan|note|debt|mortgage|line of credit/.test(n)) return "Long-term Debt";
    if (/equity|capital|retained|owner|drawing|distributions|contributions|treasury|common stock|preferred stock/.test(n)) return "Equity";
    return "Other Assets";
  }
  if (/cost of goods|cogs|cost of sales/.test(n)) return "Cost of Goods Sold";
  if (/sales|revenue|income|fees earned/.test(n)) return "Revenue";
  if (/payroll|salary|wage|benefit|compensation/.test(n)) return "Payroll Expenses";
  if (/rent|lease/.test(n)) return "Rent & Occupancy";
  if (/depreciation|amortization/.test(n)) return "Depreciation";
  if (/interest/.test(n)) return "Interest Expense";
  if (/\btax(es)?\b/.test(n)) return "Taxes";
  return "Operating Expenses";
}
