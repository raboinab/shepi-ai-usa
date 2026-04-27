import { s as supabase } from "../main.mjs";
import { useState, useRef, useCallback, useEffect } from "react";
const SALES_ALIASES = /* @__PURE__ */ new Set([
  "revenue",
  "sales",
  "income",
  "service revenue",
  "service income",
  "product revenue",
  "product sales",
  "net revenue",
  "net sales",
  "gross revenue",
  "total revenue",
  "total sales"
]);
const COGS_ALIASES = /* @__PURE__ */ new Set([
  "cost of goods sold",
  "cogs",
  "cost of sales",
  "cos",
  "cost of revenue",
  "direct costs",
  "cost of services",
  "materials",
  "direct labor",
  "manufacturing costs"
]);
const OPEX_ALIASES = /* @__PURE__ */ new Set([
  "operating expenses",
  "opex",
  "operating expense",
  "expense",
  "general and administrative",
  "g&a",
  "selling expenses",
  "sg&a",
  "selling, general & administrative",
  "administrative expenses",
  "admin expenses"
]);
const OTHER_EXPENSE_ALIASES = /* @__PURE__ */ new Set([
  "other expense (income)",
  "other income",
  "other expense",
  "other income/expense",
  "non-operating income",
  "interest income",
  "interest expense",
  "gain on sale",
  "loss on sale",
  "miscellaneous income",
  "miscellaneous expense"
]);
const PAYROLL_ALIASES = /* @__PURE__ */ new Set([
  "payroll & related",
  "payroll",
  "salaries",
  "wages",
  "payroll expenses",
  "salaries & wages",
  "compensation",
  "employee benefits",
  "payroll taxes"
]);
const CASH_ALIASES = /* @__PURE__ */ new Set([
  "cash and cash equivalents",
  "cash",
  "bank",
  "checking",
  "savings",
  "money market",
  "petty cash",
  "cash in bank"
]);
const AR_ALIASES = /* @__PURE__ */ new Set([
  "accounts receivable",
  "a/r",
  "ar",
  "trade receivables",
  "receivables",
  "accts receivable"
]);
const AP_ALIASES = /* @__PURE__ */ new Set([
  "accounts payable",
  "a/p",
  "ap",
  "trade payables",
  "payables",
  "accts payable",
  "current liabilities"
]);
const FIXED_ASSET_ALIASES = /* @__PURE__ */ new Set([
  "fixed assets",
  "property plant and equipment",
  "pp&e",
  "ppe",
  "property and equipment",
  "capital assets",
  "tangible assets",
  "long-term assets"
]);
const EQUITY_ALIASES = /* @__PURE__ */ new Set([
  "equity",
  "stockholders equity",
  "shareholders equity",
  "owner's equity",
  "retained earnings",
  "capital stock",
  "common stock",
  "additional paid-in capital"
]);
const OCA_ALIASES = /* @__PURE__ */ new Set([
  "other current assets",
  "oca",
  "prepaid expenses",
  "inventory",
  "other receivables",
  "deposits"
]);
const OCL_ALIASES = /* @__PURE__ */ new Set([
  "other current liabilities",
  "ocl",
  "accrued expenses",
  "accrued liabilities",
  "deferred revenue",
  "credit cards",
  "other payables"
]);
const LONG_TERM_LIABILITIES_ALIASES = /* @__PURE__ */ new Set([
  "long term liabilities",
  "long-term debt",
  "notes payable",
  "mortgages",
  "bonds payable",
  "term loans"
]);
const OTHER_ASSETS_ALIASES = /* @__PURE__ */ new Set([
  "other assets",
  "intangible assets",
  "goodwill",
  "deposits",
  "long-term investments"
]);
const LABEL_GROUPS = {
  "Revenue": SALES_ALIASES,
  "Cost of Goods Sold": COGS_ALIASES,
  "Operating expenses": OPEX_ALIASES,
  "Other expense (income)": OTHER_EXPENSE_ALIASES,
  "Payroll & Related": PAYROLL_ALIASES,
  "Cash and cash equivalents": CASH_ALIASES,
  "Accounts receivable": AR_ALIASES,
  "Other current assets": OCA_ALIASES,
  "Fixed assets": FIXED_ASSET_ALIASES,
  "Other assets": OTHER_ASSETS_ALIASES,
  "Current liabilities": AP_ALIASES,
  "Other current liabilities": OCL_ALIASES,
  "Long term liabilities": LONG_TERM_LIABILITIES_ALIASES,
  "Equity": EQUITY_ALIASES
};
function resolveLabel(lineItem) {
  const lower = (lineItem || "").toLowerCase().trim();
  if (!lower) return lineItem;
  for (const [canonical, aliases] of Object.entries(LABEL_GROUPS)) {
    if (aliases.has(lower) || lower === canonical.toLowerCase()) {
      return canonical;
    }
  }
  for (const [canonical, aliases] of Object.entries(LABEL_GROUPS)) {
    if (lower.startsWith(canonical.toLowerCase())) return canonical;
    for (const alias of aliases) {
      if (lower.startsWith(alias) || lower.includes(alias)) {
        return canonical;
      }
    }
  }
  return lineItem;
}
function matchesCategory(lineItem, category) {
  const aliases = LABEL_GROUPS[category];
  if (!aliases) return false;
  const lower = (lineItem || "").toLowerCase().trim();
  if (aliases.has(lower) || lower === category.toLowerCase()) return true;
  if (lower.startsWith(category.toLowerCase())) return true;
  for (const alias of aliases) {
    if (lower.startsWith(alias) || lower.includes(alias)) return true;
  }
  return false;
}
function buildTbIndex(entries) {
  const index = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    index.set(entry.accountId, entry);
  }
  return index;
}
function sumByLineItem(entries, lineItem, periodId) {
  let total = 0;
  for (const entry of entries) {
    if (matchesCategory(entry.fsLineItem, lineItem) || resolveLabel(entry.fsLineItem) === lineItem) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}
function sumByFsType(entries, fsType, periodId) {
  let total = 0;
  for (const entry of entries) {
    if (entry.fsType === fsType) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}
function getSubAccounts(entries, lineItem) {
  const subs = /* @__PURE__ */ new Set();
  for (const entry of entries) {
    if (matchesCategory(entry.fsLineItem, lineItem) || resolveLabel(entry.fsLineItem) === lineItem) {
      if (entry.subAccount1) subs.add(entry.subAccount1);
    }
  }
  return Array.from(subs).sort();
}
function getEntriesByLineItem(entries, lineItem) {
  return entries.filter((e) => {
    const directMatch = matchesCategory(e.fsLineItem, lineItem) || resolveLabel(e.fsLineItem) === lineItem;
    if (lineItem === "Operating expenses" && directMatch) {
      return e.subAccount1?.toLowerCase() !== "payroll & related";
    }
    if (directMatch) return true;
    if (lineItem === "Payroll & Related") {
      const isOpEx = matchesCategory(e.fsLineItem, "Operating expenses") || resolveLabel(e.fsLineItem) === "Operating expenses";
      if (isOpEx && e.subAccount1?.toLowerCase() === "payroll & related") return true;
    }
    return false;
  });
}
function calcRevenue(entries, periodId) {
  return sumByLineItem(entries, "Revenue", periodId);
}
function calcCOGS(entries, periodId) {
  return sumByLineItem(entries, "Cost of Goods Sold", periodId);
}
function calcGrossProfit(entries, periodId) {
  return calcRevenue(entries, periodId) + calcCOGS(entries, periodId);
}
function calcOpEx(entries, periodId) {
  let total = 0;
  for (const entry of entries) {
    if (matchesCategory(entry.fsLineItem, "Operating expenses") || resolveLabel(entry.fsLineItem) === "Operating expenses") {
      if (entry.subAccount1?.toLowerCase() === "payroll & related") continue;
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}
function calcPayroll(entries, periodId) {
  let total = 0;
  for (const entry of entries) {
    const isDirectPayroll = matchesCategory(entry.fsLineItem, "Payroll & Related") || resolveLabel(entry.fsLineItem) === "Payroll & Related";
    const isOpExPayroll = (matchesCategory(entry.fsLineItem, "Operating expenses") || resolveLabel(entry.fsLineItem) === "Operating expenses") && entry.subAccount1?.toLowerCase() === "payroll & related";
    if (isDirectPayroll || isOpExPayroll) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}
function calcOtherExpense(entries, periodId) {
  return sumByLineItem(entries, "Other expense (income)", periodId);
}
function calcOperatingIncome(entries, periodId) {
  return calcGrossProfit(entries, periodId) + calcOpEx(entries, periodId) + calcPayroll(entries, periodId);
}
function calcNetIncome(entries, periodId) {
  return sumByFsType(entries, "IS", periodId);
}
function calcInterestExpense(entries, periodId, addbackAccountIds) {
  if (!addbackAccountIds || addbackAccountIds.length === 0) return 0;
  let total = 0;
  for (const entry of entries) {
    if (addbackAccountIds.includes(entry.accountId)) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}
function calcDepreciationExpense(entries, periodId, addbackAccountIds) {
  if (!addbackAccountIds || addbackAccountIds.length === 0) return 0;
  let total = 0;
  for (const entry of entries) {
    if (addbackAccountIds.includes(entry.accountId)) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}
function calcIncomeTaxExpense(entries, periodId, addbackAccountIds) {
  if (!addbackAccountIds || addbackAccountIds.length === 0) return 0;
  let total = 0;
  for (const entry of entries) {
    if (addbackAccountIds.includes(entry.accountId)) {
      total += entry.balances[periodId] || 0;
    }
  }
  return total;
}
function calcReportedEBITDA(entries, periodId, addbacks) {
  return calcNetIncome(entries, periodId) - calcInterestExpense(entries, periodId, addbacks?.interest) - calcDepreciationExpense(entries, periodId, addbacks?.depreciation) - calcIncomeTaxExpense(entries, periodId, addbacks?.taxes);
}
function calcEBITDA(entries, periodId) {
  return calcRevenue(entries, periodId) + calcCOGS(entries, periodId) + calcOpEx(entries, periodId) + calcPayroll(entries, periodId);
}
function calcAdjustmentTotal(adjustments, type, periodId, excludeNonQoE = true) {
  let total = 0;
  for (const adj of adjustments) {
    if (excludeNonQoE && adj.effectType === "NonQoE") continue;
    if (type === "all" || adj.type === type) {
      total += adj.amounts[periodId] || 0;
    }
  }
  return total;
}
function calcAdjustmentByLineItem(adjustments, tbIndex, lineItemCategory, lineItemAliases, type, periodId) {
  let total = 0;
  for (const adj of adjustments) {
    const entry = tbIndex.get(adj.tbAccountNumber);
    if (!entry) continue;
    const resolved = resolveLabel(entry.fsLineItem);
    if (resolved === lineItemCategory || lineItemAliases.has((entry.fsLineItem || "").toLowerCase().trim())) {
      total += adj.amounts[periodId] || 0;
    }
  }
  return total;
}
function calcRevenueAdjustments(adjustments, tbIndex, type, periodId) {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Revenue", SALES_ALIASES, type, periodId);
}
function calcCOGSAdjustments(adjustments, tbIndex, type, periodId) {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Cost of Goods Sold", COGS_ALIASES, type, periodId);
}
function calcOpExAdjustments(adjustments, tbIndex, type, periodId) {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Operating expenses", OPEX_ALIASES, type, periodId) + calcAdjustmentByLineItem(adjustments, tbIndex, "Payroll & Related", PAYROLL_ALIASES, type, periodId);
}
function calcOtherExpenseAdjustments(adjustments, tbIndex, type, periodId) {
  return calcAdjustmentByLineItem(adjustments, tbIndex, "Other expense (income)", OTHER_EXPENSE_ALIASES, type, periodId);
}
function calcAdjustedEBITDA(entries, adjustments, periodId, addbacks) {
  return calcReportedEBITDA(entries, periodId, addbacks) - calcAdjustmentTotal(adjustments, "all", periodId);
}
function calcTotalCurrentAssets(entries, periodId) {
  return sumByLineItem(entries, "Cash and cash equivalents", periodId) + sumByLineItem(entries, "Accounts receivable", periodId) + sumByLineItem(entries, "Other current assets", periodId);
}
function calcTotalAssets(entries, periodId) {
  return calcTotalCurrentAssets(entries, periodId) + sumByLineItem(entries, "Fixed assets", periodId) + sumByLineItem(entries, "Other assets", periodId);
}
function calcTotalCurrentLiabilities(entries, periodId) {
  return sumByLineItem(entries, "Current liabilities", periodId) + sumByLineItem(entries, "Other current liabilities", periodId);
}
function calcTotalLiabilities(entries, periodId) {
  return calcTotalCurrentLiabilities(entries, periodId) + sumByLineItem(entries, "Long term liabilities", periodId);
}
function calcTotalEquity(entries, periodId) {
  return sumByLineItem(entries, "Equity", periodId);
}
function calcTotalLiabilitiesAndEquity(entries, periodId) {
  return calcTotalLiabilities(entries, periodId) + calcTotalEquity(entries, periodId);
}
function bsCheckPasses(entries, periodId) {
  const assets = calcTotalAssets(entries, periodId);
  const liabEquity = calcTotalLiabilitiesAndEquity(entries, periodId);
  return Math.abs(assets + liabEquity) < 0.01;
}
function calcNetWorkingCapital(entries, periodId) {
  return calcTotalCurrentAssets(entries, periodId) + calcTotalCurrentLiabilities(entries, periodId);
}
function calcNWCExCash(entries, periodId) {
  const currentAssetsExCash = sumByLineItem(entries, "Accounts receivable", periodId) + sumByLineItem(entries, "Other current assets", periodId);
  return currentAssetsExCash + calcTotalCurrentLiabilities(entries, periodId);
}
function buildAggregatePeriods(periods, fiscalYears, fiscalYearEnd) {
  const aggs = [];
  for (const fy of fiscalYears) {
    aggs.push({
      id: `agg-${fy.label}`,
      label: fy.label,
      shortLabel: fy.label,
      monthPeriodIds: fy.periods.map((p) => p.id)
    });
  }
  if (periods.length > 0) {
    const latest = periods[periods.length - 1];
    const latestDate = latest.date;
    const ltmPeriods = periods.filter((p) => {
      const diff = (latestDate.getFullYear() - p.date.getFullYear()) * 12 + (latestDate.getMonth() - p.date.getMonth());
      return diff >= 0 && diff < 12;
    });
    if (ltmPeriods.length > 0) {
      const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const ltmLabel = `LTM ${SHORT_MONTHS[latest.month - 1]}-${String(latest.year).slice(-2)}`;
      aggs.push({
        id: `agg-ltm-${latest.id}`,
        label: ltmLabel,
        shortLabel: ltmLabel,
        monthPeriodIds: ltmPeriods.map((p) => p.id)
      });
    }
    const fyeMonth = fiscalYearEnd;
    let fyStartMonth = fyeMonth + 1;
    let fyStartYear = latest.year;
    if (fyStartMonth > 12) {
      fyStartMonth = 1;
    }
    if (latest.month < fyeMonth) {
      fyStartYear -= 1;
    }
    const ytdPeriods = periods.filter((p) => {
      const pDate = p.date;
      const fyStart = new Date(fyStartYear, fyStartMonth - 1, 1);
      return pDate >= fyStart && pDate <= latestDate;
    });
    if (ytdPeriods.length > 0 && ytdPeriods.length < 12) {
      const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const ytdLabel = `YTD ${SHORT_MONTHS[latest.month - 1]}-${String(latest.year).slice(-2)}`;
      aggs.push({
        id: `agg-ytd-${latest.id}`,
        label: ytdLabel,
        shortLabel: ytdLabel,
        monthPeriodIds: ytdPeriods.map((p) => p.id)
      });
    }
  }
  return aggs;
}
function groupByFiscalYear(periods, fiscalYearEnd) {
  if (periods.length === 0) return [];
  const years = [];
  let currentYear = [];
  for (const period of periods) {
    currentYear.push(period);
    if (period.month === fiscalYearEnd) {
      const shortYear = String(period.year).slice(-2);
      years.push({
        label: `FY ${shortYear}`,
        periods: [...currentYear]
      });
      currentYear = [];
    }
  }
  if (currentYear.length > 0) {
    const lastPeriod = currentYear[currentYear.length - 1];
    const shortYear = String(lastPeriod.year).slice(-2);
    years.push({
      label: `FY ${shortYear}`,
      periods: currentYear
    });
  }
  return years;
}
function calcUndepositedFunds(entries, periodId) {
  let total = 0;
  const CLEARING_KEYWORDS = ["undeposited", "unapplied cash"];
  for (const entry of entries) {
    if (matchesCategory(entry.fsLineItem, "Cash and cash equivalents") || resolveLabel(entry.fsLineItem) === "Cash and cash equivalents") {
      const sub = (entry.subAccount1 || "").toLowerCase().trim();
      const name = (entry.accountName || "").toLowerCase().trim();
      const isClearing = CLEARING_KEYWORDS.some((k) => sub.includes(k) || name.includes(k));
      if (isClearing) {
        total += entry.balances[periodId] || 0;
      }
    }
  }
  return total;
}
function sumReclassImpact(reclassifications, lineItem, periodId) {
  let total = 0;
  for (const r of reclassifications) {
    const amt = r.amounts[periodId] ?? r.amounts["_flat"] ?? 0;
    if (amt === 0) continue;
    if (matchesCategory(r.toAccount, lineItem) || resolveLabel(r.toAccount) === lineItem) {
      total += amt;
    }
    if (matchesCategory(r.fromAccount, lineItem) || resolveLabel(r.fromAccount) === lineItem) {
      total -= amt;
    }
  }
  return total;
}
function sumByLineItemWithReclass(entries, reclassifications, lineItem, periodId) {
  return sumByLineItem(entries, lineItem, periodId) + sumReclassImpact(reclassifications, lineItem, periodId);
}
const INTENT_TO_SIGN = {
  remove_expense: 1,
  // Adds to EBITDA
  remove_revenue: -1,
  // Subtracts from EBITDA
  add_expense: -1,
  // Subtracts from EBITDA
  add_revenue: 1,
  // Adds to EBITDA
  normalize_up_expense: -1,
  // Expense goes up → -EBITDA
  normalize_down_expense: 1,
  // Expense goes down → +EBITDA
  other: 0
  // User specifies manually
};
const INTENT_LABELS = {
  remove_expense: {
    label: "Remove one-time expense",
    description: "Add back a non-recurring expense to increase Adjusted EBITDA"
  },
  remove_revenue: {
    label: "Remove non-recurring revenue",
    description: "Remove one-time revenue to decrease Adjusted EBITDA"
  },
  add_expense: {
    label: "Add missing expense",
    description: "Recognize an expense that was understated, decreasing Adjusted EBITDA"
  },
  add_revenue: {
    label: "Add missing revenue",
    description: "Recognize revenue that was understated, increasing Adjusted EBITDA"
  },
  normalize_up_expense: {
    label: "Normalize expense upward",
    description: "Increase an expense to market rate, decreasing Adjusted EBITDA"
  },
  normalize_down_expense: {
    label: "Normalize expense downward",
    description: "Decrease an expense to market rate, increasing Adjusted EBITDA"
  },
  other: {
    label: "Other adjustment",
    description: "Custom adjustment with manually specified sign"
  }
};
const ITDA_ANCHORS = /* @__PURE__ */ new Set([
  "interest",
  "interest expense",
  "interest income",
  "tax",
  "taxes",
  "income tax",
  "income taxes",
  "tax expense",
  "depreciation",
  "depreciation expense",
  "amortization",
  "amortization expense"
]);
function isITDAAnchor(name) {
  const lower = (name || "").toLowerCase().trim();
  if (!lower) return false;
  if (ITDA_ANCHORS.has(lower)) return true;
  for (const anchor of ITDA_ANCHORS) {
    if (lower.includes(anchor)) return true;
  }
  return false;
}
const ADJUSTMENT_TEMPLATES = [
  // MA - Management Adjustments
  {
    id: "ma-owner-comp",
    type: "MA",
    adjustmentClass: "normalization",
    label: "Owner compensation normalization",
    description: "Normalize owner/officer compensation to market rate",
    defaultIntent: "remove_expense",
    typicalAnchor: "payroll"
  },
  {
    id: "ma-related-party-exp",
    type: "MA",
    adjustmentClass: "normalization",
    label: "Related-party expense removal",
    description: "Remove personal or non-business related-party expenses",
    defaultIntent: "remove_expense",
    typicalAnchor: "operating expenses"
  },
  {
    id: "ma-rent-normalization",
    type: "MA",
    adjustmentClass: "normalization",
    label: "Related-party rent normalization",
    description: "Adjust related-party rent to fair market value",
    defaultIntent: "normalize_down_expense",
    typicalAnchor: "rent expense"
  },
  // DD - Due Diligence Adjustments
  {
    id: "dd-legal-settlement",
    type: "DD",
    adjustmentClass: "nonrecurring",
    label: "One-time legal settlement",
    description: "Remove non-recurring legal fees or settlement costs",
    defaultIntent: "remove_expense",
    typicalAnchor: "legal expense"
  },
  {
    id: "dd-restructuring",
    type: "DD",
    adjustmentClass: "nonrecurring",
    label: "Restructuring / severance",
    description: "Remove one-time restructuring or severance costs",
    defaultIntent: "remove_expense",
    typicalAnchor: "operating expenses"
  },
  {
    id: "dd-consulting",
    type: "DD",
    adjustmentClass: "nonrecurring",
    label: "One-time consulting / due diligence",
    description: "Remove transaction-related consulting or DD fees",
    defaultIntent: "remove_expense",
    typicalAnchor: "professional fees"
  },
  {
    id: "dd-asset-sale",
    type: "DD",
    adjustmentClass: "nonrecurring",
    label: "Asset sale gain/loss",
    description: "Remove non-operating gain or loss from asset disposition",
    defaultIntent: "remove_expense",
    typicalAnchor: "other income/expense"
  },
  {
    id: "dd-ppp-grant",
    type: "DD",
    adjustmentClass: "nonrecurring",
    label: "PPP / grant income removal",
    description: "Remove one-time government grants or PPP forgiveness",
    defaultIntent: "remove_revenue",
    typicalAnchor: "other income"
  },
  {
    id: "dd-revenue-cutoff",
    type: "DD",
    adjustmentClass: "timing",
    label: "Revenue cut-off adjustment",
    description: "Shift revenue to the period earned",
    defaultIntent: "add_revenue",
    typicalAnchor: "sales"
  },
  {
    id: "dd-returns-allowance",
    type: "DD",
    adjustmentClass: "timing",
    label: "Returns / allowance true-up",
    description: "Normalize reserves for expected returns or allowances",
    defaultIntent: "add_expense",
    typicalAnchor: "contra revenue"
  },
  {
    id: "dd-inventory-obsolescence",
    type: "DD",
    adjustmentClass: "policy",
    label: "Inventory obsolescence reserve",
    description: "Normalize inventory reserve to appropriate level",
    defaultIntent: "add_expense",
    typicalAnchor: "cost of goods sold"
  },
  {
    id: "dd-capitalize-expense",
    type: "DD",
    adjustmentClass: "policy",
    label: "Capitalize vs expense correction",
    description: "Correct capitalization vs expense treatment",
    defaultIntent: "remove_expense",
    typicalAnchor: "operating expenses / fixed assets"
  },
  {
    id: "dd-accrual-timing",
    type: "DD",
    adjustmentClass: "timing",
    label: "Accrual timing adjustment",
    description: "Accrue or defer expenses to match revenue period",
    defaultIntent: "add_expense",
    typicalAnchor: "operating expenses"
  },
  {
    id: "dd-fx-hedging",
    type: "DD",
    adjustmentClass: "nonrecurring",
    label: "FX / fair value swings",
    description: "Remove non-operating FX or mark-to-market volatility",
    defaultIntent: "remove_expense",
    typicalAnchor: "other expense/income"
  },
  // PF - Pro Forma Adjustments
  {
    id: "pf-synergy-savings",
    type: "PF",
    adjustmentClass: "proforma",
    label: "Synergy savings",
    description: "Recognize post-close operational synergies",
    defaultIntent: "remove_expense",
    typicalAnchor: "operating expenses"
  },
  {
    id: "pf-cost-reduction",
    type: "PF",
    adjustmentClass: "proforma",
    label: "Planned cost reduction",
    description: "Recognize planned cost savings initiatives",
    defaultIntent: "remove_expense",
    typicalAnchor: "operating expenses"
  },
  // New detector templates
  {
    id: "dd-bad-debt-reserve",
    type: "DD",
    adjustmentClass: "policy",
    label: "Bad debt reserve normalization",
    description: "Normalize bad debt reserve to appropriate level",
    defaultIntent: "add_expense",
    typicalAnchor: "bad debt expense"
  },
  {
    id: "dd-warranty-reserve",
    type: "DD",
    adjustmentClass: "policy",
    label: "Warranty reserve adjustment",
    description: "Normalize warranty reserve accrual to expected claims",
    defaultIntent: "add_expense",
    typicalAnchor: "warranty expense"
  },
  {
    id: "dd-insurance-proceeds",
    type: "DD",
    adjustmentClass: "nonrecurring",
    label: "Insurance proceeds removal",
    description: "Remove non-recurring insurance proceeds or settlements",
    defaultIntent: "remove_revenue",
    typicalAnchor: "other income"
  },
  {
    id: "ma-personal-auto",
    type: "MA",
    adjustmentClass: "normalization",
    label: "Personal vehicle expense",
    description: "Remove personal vehicle expenses run through the business",
    defaultIntent: "remove_expense",
    typicalAnchor: "vehicle expense"
  },
  {
    id: "ma-family-payroll",
    type: "MA",
    adjustmentClass: "normalization",
    label: "Family member payroll normalization",
    description: "Normalize family member compensation to market rate or remove",
    defaultIntent: "remove_expense",
    typicalAnchor: "payroll"
  },
  // Buyer-side detector templates
  {
    id: "dd-revenue-sustainability",
    type: "DD",
    adjustmentClass: "timing",
    label: "Revenue sustainability analysis",
    description: "Analyze revenue quality, recurring vs one-time mix, and sustainability risk",
    defaultIntent: "other",
    typicalAnchor: "sales"
  },
  {
    id: "dd-customer-concentration",
    type: "DD",
    adjustmentClass: "normalization",
    label: "Customer concentration risk",
    description: "Flag revenue concentration risk from top customers",
    defaultIntent: "other",
    typicalAnchor: "sales"
  },
  {
    id: "dd-run-rate-expense",
    type: "DD",
    adjustmentClass: "normalization",
    label: "Run-rate expense normalization",
    description: "Normalize understated expenses to sustainable run-rate levels",
    defaultIntent: "add_expense",
    typicalAnchor: "operating expenses"
  },
  {
    id: "dd-below-market-rent",
    type: "DD",
    adjustmentClass: "normalization",
    label: "Below-market rent adjustment",
    description: "Adjust related-party or legacy rent to fair market value",
    defaultIntent: "normalize_up_expense",
    typicalAnchor: "rent expense"
  },
  {
    id: "dd-missing-insurance",
    type: "DD",
    adjustmentClass: "policy",
    label: "Missing insurance coverage",
    description: "Add cost for insurance coverage gaps (D&O, cyber, key-person)",
    defaultIntent: "add_expense",
    typicalAnchor: "insurance expense"
  },
  {
    id: "dd-cogs-normalization",
    type: "DD",
    adjustmentClass: "policy",
    label: "COGS normalization",
    description: "Normalize cost of goods sold for capitalization or allocation issues",
    defaultIntent: "normalize_up_expense",
    typicalAnchor: "cost of goods sold"
  }
];
const TEMPLATES_BY_TYPE = {
  MA: ADJUSTMENT_TEMPLATES.filter((t) => t.type === "MA"),
  DD: ADJUSTMENT_TEMPLATES.filter((t) => t.type === "DD"),
  PF: ADJUSTMENT_TEMPLATES.filter((t) => t.type === "PF")
};
const PROOF_HINTS = {
  "owner compensation": {
    hint: "Owner compensation adjustments benefit from payroll records or employment agreements",
    docTypes: ["payroll_record", "employment_agreement"]
  },
  "family member payroll": {
    hint: "Family payroll adjustments are stronger with W-2s, pay stubs, or employment contracts",
    docTypes: ["payroll_record", "employment_agreement"]
  },
  "rent": {
    hint: "Attach lease agreements or market rent comparables to support this adjustment",
    docTypes: ["lease_agreement", "market_comp"]
  },
  "legal": {
    hint: "Legal settlement adjustments benefit from settlement agreements or court filings",
    docTypes: ["legal_settlement"]
  },
  "insurance": {
    hint: "Attach insurance policies or claim documentation to verify this adjustment",
    docTypes: ["insurance_policy"]
  },
  "restructuring": {
    hint: "Restructuring adjustments are stronger with board resolutions or severance agreements",
    docTypes: ["restructuring_plan"]
  },
  "depreciation": {
    hint: "Attach fixed asset schedules or appraisals to support depreciation adjustments",
    docTypes: ["fixed_asset_schedule"]
  },
  "personal": {
    hint: "Personal expense adjustments benefit from credit card statements or expense reports identifying personal use",
    docTypes: ["bank_statement", "expense_report"]
  }
};
function getProofHint(description) {
  const lower = (description || "").toLowerCase();
  for (const [keyword, hintData] of Object.entries(PROOF_HINTS)) {
    if (lower.includes(keyword)) return hintData;
  }
  return {
    hint: "Attach supporting documents (invoices, contracts, receipts) to strengthen the audit trail",
    docTypes: []
  };
}
function computeSign(intent) {
  const sign = INTENT_TO_SIGN[intent];
  return sign === 0 ? 1 : sign;
}
function getTemplateById(id) {
  return ADJUSTMENT_TEMPLATES.find((t) => t.id === id);
}
async function derivePriorBalances(projectId, trialBalance, periods) {
  if (!projectId || trialBalance.length === 0 || periods.length === 0) {
    return {};
  }
  const firstPeriod = periods[0];
  const firstPeriodId = firstPeriod.id;
  const postingPeriod = `${firstPeriod.year}-${String(firstPeriod.month).padStart(2, "0")}`;
  const { data: txns } = await supabase.from("canonical_transactions").select("account_number, amount_signed").eq("project_id", projectId).eq("posting_period", postingPeriod).in("source_type", ["general_ledger", "journal_entries"]);
  if (!txns || txns.length === 0) return {};
  const activityByAccount = {};
  for (const t of txns) {
    if (!t.account_number) continue;
    activityByAccount[t.account_number] = (activityByAccount[t.account_number] || 0) + (t.amount_signed || 0);
  }
  const derived = {};
  for (const entry of trialBalance) {
    if (entry.fsType !== "BS") continue;
    const endingBalance = entry.balances[firstPeriodId] ?? 0;
    const glActivity = activityByAccount[entry.accountId] ?? 0;
    derived[entry.accountId] = endingBalance - glActivity;
  }
  return derived;
}
function projectToDealData(project) {
  const wd = project.wizard_data || {};
  const periods = adaptPeriods(project.periods || []);
  const fiscalYearEnd = parseFiscalYearEnd(project.fiscal_year_end);
  const nonStubPeriods = periods.filter((p) => !p.isStub);
  const fiscalYears = groupByFiscalYear(nonStubPeriods, fiscalYearEnd);
  const aggregatePeriods = buildAggregatePeriods(periods, fiscalYears, fiscalYearEnd);
  let priorPeriodId;
  if (periods.length > 0) {
    const first = periods[0];
    const priorMonth = first.month === 1 ? 12 : first.month - 1;
    const priorYear = first.month === 1 ? first.year - 1 : first.year;
    priorPeriodId = `${priorYear}-${String(priorMonth).padStart(2, "0")}`;
  }
  const accounts = adaptAccounts(wd.chartOfAccounts);
  const trialBalance = adaptTrialBalance(wd.trialBalance, accounts, periods.map((p) => p.id), fiscalYearEnd);
  const EQUITY_NAME_PATTERNS = [
    /retained\s+earnings/i,
    /owner['']?s?\s+equity/i,
    /members?\s+equity/i,
    /partners?\s+equity/i,
    /shareholders?\s+equity/i,
    /stockholders?\s+equity/i,
    /opening\s+balance\s+equity/i
  ];
  for (const entry of trialBalance) {
    if (entry.fsLineItem === "Equity") continue;
    const nameMatch = EQUITY_NAME_PATTERNS.some((pat) => pat.test(entry.accountName));
    if (nameMatch) {
      entry.fsType = "BS";
      entry.fsLineItem = "Equity";
    }
  }
  const accountMap = new Map(accounts.map((a) => [a.accountId, a]));
  for (const entry of trialBalance) {
    if (entry.fsLineItem === "Equity") {
      const acct = accountMap.get(entry.accountId);
      if (acct && acct.fsLineItem !== "Equity") {
        acct.fsType = "BS";
        acct.fsLineItem = "Equity";
      }
    }
  }
  const ddAdj = wd.ddAdjustments;
  const adjustments = adaptAdjustments(ddAdj?.adjustments ?? wd.adjustments);
  const reclassData = wd.reclassifications;
  const reclassifications = adaptReclassifications(
    reclassData?.reclassifications ?? wd.reclassifications,
    trialBalance
  );
  const addbacks = adaptAddbacks(wd.dealSetup || wd.ebitdaAddbacks);
  if (addbacks.interest.length === 0 && addbacks.depreciation.length === 0 && addbacks.taxes.length === 0) {
    for (const entry of trialBalance) {
      if (entry.fsLineItem !== "Other expense (income)") continue;
      const nameLower = entry.accountName.toLowerCase();
      if (nameLower.includes("interest")) {
        addbacks.interest.push(entry.accountId);
      } else if (nameLower.includes("depreciation") || nameLower.includes("amortization")) {
        addbacks.depreciation.push(entry.accountId);
      } else if (nameLower.includes("tax")) {
        addbacks.taxes.push(entry.accountId);
      }
    }
  }
  const tbIndex = buildTbIndex(trialBalance);
  const monthDates = buildMonthDates(periods);
  const arAging = adaptAgingData(wd.arAging);
  const apAging = adaptAgingData(wd.apAging);
  const fixedAssets = adaptFixedAssets(wd.fixedAssets);
  const topCustomers = adaptCustomers(wd.topCustomers);
  const topVendors = adaptVendors(wd.topVendors);
  const supplementary = adaptSupplementary(wd.supplementary);
  const dd = wd.dueDiligence || {};
  const wipAccountMapping = dd.wipAccountMapping || void 0;
  return {
    deal: {
      projectId: project.id,
      projectName: project.name,
      clientName: project.client_name || "",
      targetCompany: project.target_company || "",
      industry: project.industry || "",
      transactionType: project.transaction_type || "",
      fiscalYearEnd,
      periods,
      fiscalYears,
      aggregatePeriods,
      priorPeriodId
    },
    accounts,
    trialBalance,
    adjustments,
    reclassifications,
    tbIndex,
    monthDates,
    arAging,
    apAging,
    fixedAssets,
    topCustomers,
    topVendors,
    addbacks,
    supplementary,
    wipAccountMapping
  };
}
async function loadDealDataWithPriorBalances(project) {
  const dealData = projectToDealData(project);
  const priorBalances = await derivePriorBalances(
    project.id,
    dealData.trialBalance,
    dealData.deal.periods
  );
  if (Object.keys(priorBalances).length > 0) {
    dealData.deal.priorBalances = priorBalances;
  }
  return dealData;
}
function adaptPeriods(periods) {
  const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return periods.map((p) => {
    const shortLabel = p.isStub ? p.label || `Stub ${SHORT_MONTHS[p.month - 1]}-${String(p.year).slice(-2)}` : `${SHORT_MONTHS[p.month - 1]}-${String(p.year).slice(-2)}`;
    return {
      id: p.id,
      label: shortLabel,
      shortLabel,
      year: p.year,
      month: p.month,
      isStub: p.isStub,
      startDate: p.startDate,
      endDate: p.endDate,
      date: new Date(p.year, p.month - 1, 1)
    };
  });
}
function parseFiscalYearEnd(fye) {
  if (!fye) return 12;
  const month = parseInt(fye, 10);
  return isNaN(month) ? 12 : Math.max(1, Math.min(12, month));
}
function buildMonthDates(periods) {
  return periods.map((p) => p.date).sort((a, b) => a.getTime() - b.getTime());
}
function adaptAccounts(coa) {
  if (!coa) return [];
  const arr = Array.isArray(coa) ? coa : Array.isArray(coa?.accounts) ? coa.accounts : null;
  if (!arr) return [];
  return arr.map((acc) => ({
    accountId: String(acc.accountNumber || acc.id || ""),
    accountName: String(acc.accountName || acc.name || ""),
    fsType: acc.fsType === "IS" ? "IS" : "BS",
    fsLineItem: String(acc.category || acc.fsLineItem || ""),
    subAccount1: String(acc.subAccount1 || acc.accountSubtype || ""),
    subAccount2: String(acc.subAccount2 || ""),
    subAccount3: String(acc.subAccount3 || "")
  }));
}
function adaptTrialBalance(tbData, accounts, sortedPeriodIds, fiscalYearEnd) {
  if (!tbData || typeof tbData !== "object") return [];
  const tb = tbData;
  const tbAccounts = tb.accounts;
  if (!Array.isArray(tbAccounts)) return [];
  const accountMap = new Map(accounts.map((a) => [a.accountId, a]));
  return tbAccounts.map((acc) => {
    const accountId = String(acc.accountNumber || acc.accountId || acc.id || "");
    const enrichment = accountMap.get(accountId);
    const balances = {};
    const monthlyBalances = acc.monthlyValues || acc.monthlyBalances || acc.balances;
    if (monthlyBalances && typeof monthlyBalances === "object") {
      for (const [key, val] of Object.entries(monthlyBalances)) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          balances[key] = numVal;
        }
      }
    }
    const fsType = enrichment?.fsType || acc.fsType || "BS";
    if (fsType === "IS" && sortedPeriodIds.length > 0) {
      const orderedIds = sortedPeriodIds.filter((id) => id in balances);
      for (let i = orderedIds.length - 1; i > 0; i--) {
        const curMonth = parsePeriodMonth(orderedIds[i]);
        const prevMonth = parsePeriodMonth(orderedIds[i - 1]);
        const fyStartMonth = fiscalYearEnd % 12 + 1;
        const curYear = parsePeriodYear(orderedIds[i]);
        const prevYear = parsePeriodYear(orderedIds[i - 1]);
        if (curYear !== void 0 && prevYear !== void 0 && curMonth !== void 0 && prevMonth !== void 0) {
          const curFY = getFiscalYear(curYear, curMonth, fyStartMonth);
          const prevFY = getFiscalYear(prevYear, prevMonth, fyStartMonth);
          if (curFY !== prevFY) continue;
        }
        if (prevMonth !== void 0 && curMonth !== void 0) {
          balances[orderedIds[i]] -= balances[orderedIds[i - 1]];
        }
      }
    }
    return {
      accountId,
      accountName: String(acc.accountName || acc.name || ""),
      fsType,
      fsLineItem: String(enrichment?.fsLineItem || acc.fsLineItem || acc.category || ""),
      subAccount1: String(enrichment?.subAccount1 || acc.subAccount1 || ""),
      subAccount2: String(enrichment?.subAccount2 || acc.subAccount2 || ""),
      subAccount3: String(enrichment?.subAccount3 || acc.subAccount3 || ""),
      balances
    };
  });
}
function parsePeriodYear(periodId) {
  const match4 = periodId.match(/(\d{4})-\d{2}/);
  if (match4) return parseInt(match4[1], 10);
  const match2 = periodId.match(/[a-zA-Z]+-(\d{2})/);
  if (match2) return 2e3 + parseInt(match2[1], 10);
  return void 0;
}
function getFiscalYear(year, month, fyStartMonth) {
  return month >= fyStartMonth ? year : year - 1;
}
function parsePeriodMonth(periodId) {
  const match = periodId.match(/(\d{4})-(\d{2})/);
  if (match) return parseInt(match[2], 10);
  const SHORT_MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const lower = periodId.toLowerCase();
  for (let i = 0; i < SHORT_MONTHS.length; i++) {
    if (lower.startsWith(SHORT_MONTHS[i])) return i + 1;
  }
  return void 0;
}
function adaptAdjustments(adjData) {
  if (!adjData || !Array.isArray(adjData)) return [];
  const ACCEPTED_STATUSES = /* @__PURE__ */ new Set(["accepted", "accepted_with_edits"]);
  const accepted = adjData.filter((adj) => {
    const status = adj.status;
    return !status || ACCEPTED_STATUSES.has(status);
  });
  return accepted.map((adj) => {
    const amounts = {};
    const periodAmounts = adj.periodValues || adj.periodAmounts || adj.amounts;
    const intent = String(adj.intent || "other");
    const sign = computeSign(intent);
    if (periodAmounts && typeof periodAmounts === "object") {
      for (const [key, val] of Object.entries(periodAmounts)) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          amounts[key] = numVal * sign;
        }
      }
    }
    return {
      id: String(adj.id || ""),
      type: adj.block || adj.type || adj.adjustmentType || "DD",
      label: String(adj.description || adj.label || adj.name || ""),
      tbAccountNumber: String(adj.linkedAccountNumber || adj.tbAccountNumber || adj.accountNumber || ""),
      intent: String(adj.intent || "other"),
      notes: String(adj.evidenceNotes || adj.notes || ""),
      amounts
    };
  });
}
function adaptReclassifications(reclassData, tb = []) {
  if (!reclassData || !Array.isArray(reclassData)) return [];
  return reclassData.map((r) => {
    const amounts = {};
    const periodAmounts = r.periodAmounts || r.amounts;
    if (periodAmounts && typeof periodAmounts === "object") {
      for (const [key, val] of Object.entries(periodAmounts)) {
        const numVal = Number(val);
        if (!isNaN(numVal)) {
          amounts[key] = numVal;
        }
      }
    }
    if (Object.keys(amounts).length === 0 && r.amount != null) {
      const singleAmt = Number(r.amount);
      if (!isNaN(singleAmt) && singleAmt !== 0) {
        amounts["_flat"] = singleAmt;
      }
    }
    let tbEntry;
    if (tb.length > 0) {
      const acctNum = String(r.accountNumber || r.fromAccountNumber || "");
      const acctName = String(r.accountName || r.accountDescription || r.description || "");
      const acctNameTail = acctName.toLowerCase().split(":").pop()?.trim() || "";
      tbEntry = tb.find(
        (e) => (
          // 1. Exact accountId match (numeric IDs)
          acctNum && acctNum.length > 1 && e.accountId === acctNum || // 2. accountName substring match (full or last segment of hierarchy)
          acctName && acctName.length > 2 && e.accountName.toLowerCase().includes(acctName.toLowerCase()) || acctNameTail && acctNameTail.length > 2 && e.accountName.toLowerCase().includes(acctNameTail) || // 3. accountName startsWith acctNum (when acctNum is a text label like "Landscaping")
          acctNum && acctNum.length > 1 && e.accountName.toLowerCase().startsWith(acctNum.toLowerCase())
        )
      );
    }
    if (amounts["_flat"] && tbEntry && Object.keys(tbEntry.balances).length > 0) {
      const flatAmt = amounts["_flat"];
      delete amounts["_flat"];
      const absBalances = {};
      let totalAbs = 0;
      for (const [periodId, balance] of Object.entries(tbEntry.balances)) {
        const abs = Math.abs(balance);
        absBalances[periodId] = abs;
        totalAbs += abs;
      }
      if (totalAbs > 0) {
        for (const [periodId, abs] of Object.entries(absBalances)) {
          amounts[periodId] = flatAmt * (abs / totalAbs);
        }
      } else {
        const count = Object.keys(tbEntry.balances).length;
        for (const periodId of Object.keys(tbEntry.balances)) {
          amounts[periodId] = flatAmt / count;
        }
      }
    }
    let fromAccount = String(r.fromFsLineItem || r.fromAccountNumber || r.fromAccount || "");
    if (fromAccount.toLowerCase().includes("unclassified") && tbEntry?.fsLineItem) {
      fromAccount = tbEntry.fsLineItem;
    }
    return {
      id: String(r.id || ""),
      label: String(r.description || r.label || ""),
      fromAccount,
      toAccount: String(r.toFsLineItem || r.toAccountNumber || r.toAccount || ""),
      amounts
    };
  });
}
function adaptAddbacks(setupData) {
  const empty = { interest: [], depreciation: [], taxes: [] };
  if (!setupData || typeof setupData !== "object") return empty;
  const setup = setupData;
  const toArray = (val) => {
    if (Array.isArray(val)) return val.map(String);
    return [];
  };
  return {
    interest: toArray(setup.interestAccounts || setup.interest),
    depreciation: toArray(setup.depreciationAccounts || setup.depreciation),
    taxes: toArray(setup.taxAccounts || setup.taxes)
  };
}
function adaptAgingData(data) {
  if (!data || typeof data !== "object") return {};
  const result = {};
  const obj = data;
  if (Array.isArray(obj.periodData)) {
    for (const period of obj.periodData) {
      const periodId = String(period.periodId || "");
      const entries = period.entries;
      if (!periodId || !Array.isArray(entries)) continue;
      result[periodId] = mapAgingEntries(entries);
    }
    return result;
  }
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = mapAgingEntries(entries);
  }
  return result;
}
function mapAgingEntries(entries) {
  return entries.map((e) => ({
    name: String(e.name || e.customer || e.vendor || ""),
    current: Number(e.current || 0),
    days1to30: Number(e.days1to30 || e["1-30"] || 0),
    days31to60: Number(e.days31to60 || e["31-60"] || 0),
    days61to90: Number(e.days61to90 || e["61-90"] || 0),
    days90plus: Number(e.days90plus || e["90+"] || 0),
    total: Number(e.total || 0)
  }));
}
function adaptFixedAssets(data) {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : Array.isArray(data.assets) ? data.assets : null;
  if (!arr) return [];
  return arr.map((fa) => ({
    category: String(fa.category || ""),
    description: String(fa.description || fa.name || ""),
    acquisitionDate: String(fa.acquisitionDate || fa.dateAcquired || ""),
    cost: Number(fa.cost || fa.originalCost || 0),
    accumulatedDepreciation: Number(fa.accumulatedDepreciation || fa.accumDepr || 0),
    netBookValue: Number(fa.netBookValue || fa.nbv || 0)
  }));
}
function adaptCustomers(data) {
  if (!data || typeof data !== "object") return {};
  const obj = data;
  if (Array.isArray(obj.customers)) {
    const result2 = {};
    for (const c of obj.customers) {
      const name = String(c.name || "");
      const yearlyRevenue = c.yearlyRevenue;
      if (yearlyRevenue && typeof yearlyRevenue === "object") {
        for (const [year, val] of Object.entries(yearlyRevenue)) {
          const key = `annual-${year}`;
          if (!result2[key]) result2[key] = [];
          result2[key].push({ name, revenue: Number(val || 0), percentage: 0 });
        }
      }
    }
    return result2;
  }
  const result = {};
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = entries.map((e) => ({
      name: String(e.name || e.customer || ""),
      revenue: Number(e.revenue || e.amount || 0),
      percentage: Number(e.percentage || e.pct || 0)
    }));
  }
  return result;
}
function adaptVendors(data) {
  if (!data || typeof data !== "object") return {};
  const obj = data;
  if (Array.isArray(obj.vendors)) {
    const result2 = {};
    for (const v of obj.vendors) {
      const name = String(v.name || "");
      const yearlySpend = v.yearlySpend || v.yearlyRevenue;
      if (yearlySpend && typeof yearlySpend === "object") {
        for (const [year, val] of Object.entries(yearlySpend)) {
          const key = `annual-${year}`;
          if (!result2[key]) result2[key] = [];
          result2[key].push({ name, spend: Number(val || 0), percentage: 0 });
        }
      }
    }
    return result2;
  }
  const result = {};
  for (const [periodId, entries] of Object.entries(obj)) {
    if (!Array.isArray(entries)) continue;
    result[periodId] = entries.map((e) => ({
      name: String(e.name || e.vendor || ""),
      spend: Number(e.spend || e.amount || 0),
      percentage: Number(e.percentage || e.pct || 0)
    }));
  }
  return result;
}
function adaptSupplementary(data) {
  if (!data || typeof data !== "object") return void 0;
  const obj = data;
  const debtRaw = obj.debtSchedule;
  const leaseRaw = obj.leaseObligations;
  const debtItems = [];
  const rawDebtArr = Array.isArray(debtRaw?.items) ? debtRaw.items : Array.isArray(debtRaw) ? debtRaw : [];
  for (const d of rawDebtArr) {
    debtItems.push({
      lender: String(d.lender || ""),
      balance: Number(d.balance || d.currentBalance || 0),
      interestRate: Number(d.interestRate || 0),
      maturityDate: String(d.maturityDate || ""),
      type: d.type ? String(d.type) : void 0
    });
  }
  const leaseItems = [];
  const rawLeaseArr = Array.isArray(leaseRaw?.items) ? leaseRaw.items : Array.isArray(leaseRaw) ? leaseRaw : [];
  for (const l of rawLeaseArr) {
    leaseItems.push({
      description: String(l.description || ""),
      leaseType: String(l.leaseType || l.type || "Operating"),
      annualPayment: Number(l.annualPayment || 0),
      remainingTerm: l.remainingTerm !== void 0 ? Number(l.remainingTerm) : void 0,
      expirationDate: l.expirationDate ? String(l.expirationDate) : void 0
    });
  }
  if (debtItems.length === 0 && leaseItems.length === 0) return void 0;
  return { debtSchedule: debtItems, leaseObligations: leaseItems };
}
function formatCurrency(value, decimals = 0) {
  if (value === null || value === void 0) return "";
  if (value === 0) return "-";
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return value < 0 ? `(${formatted})` : formatted;
}
function formatPercent(value, decimals = 1) {
  if (value === null || value === void 0) return "";
  if (!isFinite(value)) return "N/M";
  const pct = value * 100;
  const formatted = Math.abs(pct).toFixed(decimals);
  return pct < 0 ? `(${formatted}%)` : `${formatted}%`;
}
function formatCell(value, format) {
  if (value === null || value === void 0) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && isNaN(value)) return "N/M";
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "number":
      return value.toLocaleString("en-US");
    default:
      return String(value);
  }
}
function gridDataToRawData(gridData) {
  const { columns, rows } = gridData;
  if (columns.length === 0) return [];
  const headerRow = columns.map((c) => c.label);
  const result = [headerRow];
  for (const row of rows) {
    if (row.type === "spacer") continue;
    const cells = columns.map((col) => {
      const val = row.cells[col.key];
      if (val === null || val === void 0) return "";
      if (typeof val === "string") return val;
      const fmt = row.format ?? col.format;
      if (fmt === "percent") return formatPercent(val);
      if (fmt === "currency") return formatCurrency(val);
      if (fmt === "number") return val.toLocaleString("en-US");
      return String(val);
    });
    if (row.type === "section-header") ;
    else if (row.indent) {
      cells[0] = "  ".repeat(row.indent) + cells[0];
    }
    result.push(cells);
  }
  return result;
}
const BASE_PARAGRAPHS = [
  "IMPORTANT DISCLAIMER",
  "",
  'This Quality of Earnings Report (the "Report") has been prepared solely for the use and benefit of the intended recipient identified herein. This Report is confidential and proprietary, and its contents may not be disclosed, reproduced, or distributed without prior written consent.',
  "",
  "The information contained in this Report is based on data provided by the Company and its management, as well as publicly available information. We have not independently verified the accuracy or completeness of the information provided, and we make no representation or warranty, express or implied, as to the accuracy, completeness, or reliability of the information contained herein.",
  "",
  "This Report does not constitute an audit, review, or compilation of financial statements in accordance with generally accepted auditing standards. Our procedures were limited to those described herein and do not provide assurance on the financial statements or internal controls of the Company.",
  "",
  "The analyses, opinions, and conclusions expressed in this Report are based on conditions and information available at the time of preparation. We undertake no obligation to update or revise this Report based on circumstances or events occurring after the date hereof.",
  "",
  "This Report is not intended to be, and should not be construed as, investment advice, a recommendation, or an offer to buy or sell any security. Recipients should conduct their own due diligence and consult with their own legal, tax, and financial advisors.",
  "",
  "The scope and reliability of this analysis are directly dependent on the documents and data provided. Sections of this report may be limited or omitted where supporting documentation was not available. A complete list of documents provided is included in the Data Sources appendix."
];
const AI_PARAGRAPHS = [
  "",
  "This Report was generated using AI-assisted analytical tools. It has not been prepared, reviewed, or certified by a licensed Certified Public Accountant (CPA), auditor, or other credentialed financial professional. The methodologies employed are automated and pattern-based.",
  "",
  "Analysis Methodology: Financial data was uploaded by the report preparer and processed using automated normalization, trend analysis, and adjustment identification algorithms. AI models were used to suggest potential adjustments, which were reviewed and accepted or modified by the preparer. All figures in this report reflect the preparer's final selections."
];
const THIRD_PARTY_PARAGRAPH = [
  "",
  "If this Report is shared with or relied upon by any third party, including but not limited to lenders, investors, or regulatory bodies, such reliance is at the sole risk of the recipient. The preparer and the platform provider accept no liability for any decisions made or actions taken by third parties based on the contents of this Report."
];
function buildDisclaimerGrid() {
  const allParagraphs = [
    ...BASE_PARAGRAPHS,
    ...AI_PARAGRAPHS,
    ...THIRD_PARTY_PARAGRAPH
  ];
  return {
    columns: [
      { key: "text", label: "", width: 800, align: "left", format: "text" }
    ],
    rows: allParagraphs.map((text, i) => ({
      id: `disclaimer-${i}`,
      type: i === 0 ? "section-header" : text === "" ? "spacer" : "data",
      label: i === 0 ? text : void 0,
      cells: { text: i === 0 ? "" : text }
    })),
    frozenColumns: 0
  };
}
function buildWIPScheduleGrid(dealData) {
  const jobs = dealData.wipSchedule?.jobs ?? [];
  const columns = [
    { key: "label", label: "Job / Project", width: 220, frozen: true, format: "text" },
    { key: "status", label: "Status", width: 80, format: "text" },
    { key: "contractValue", label: "Contract Value", width: 120, format: "currency" },
    { key: "costsToDate", label: "Costs to Date", width: 120, format: "currency" },
    { key: "billingsToDate", label: "Billings to Date", width: 120, format: "currency" },
    { key: "pctComplete", label: "% Complete", width: 90, format: "percent" },
    { key: "overUnder", label: "Over/(Under) Billing", width: 140, format: "currency" }
  ];
  const calcPctComplete = (contractValue, costsToDate) => contractValue > 0 ? costsToDate / contractValue : 0;
  const calcOverUnder = (contractValue, costsToDate, billingsToDate) => {
    const pct = calcPctComplete(contractValue, costsToDate);
    const earnedRevenue = contractValue * pct;
    return billingsToDate - earnedRevenue;
  };
  const rows = [
    { id: "hdr", type: "section-header", label: "WIP Schedule", cells: { label: "WIP Schedule" } },
    ...jobs.map((job) => {
      const pct = calcPctComplete(job.contractValue, job.costsToDate);
      const overUnder = calcOverUnder(job.contractValue, job.costsToDate, job.billingsToDate);
      return {
        id: `wip-${job.id}`,
        type: "data",
        indent: 1,
        cells: {
          label: job.jobName,
          status: job.status ?? "active",
          contractValue: job.contractValue,
          costsToDate: job.costsToDate,
          billingsToDate: job.billingsToDate,
          pctComplete: pct,
          overUnder
        }
      };
    })
  ];
  const totalContract = jobs.reduce((s, j) => s + j.contractValue, 0);
  const totalCosts = jobs.reduce((s, j) => s + j.costsToDate, 0);
  const totalBillings = jobs.reduce((s, j) => s + j.billingsToDate, 0);
  const totalPct = totalContract > 0 ? totalCosts / totalContract : 0;
  const totalOverUnder = jobs.reduce(
    (s, j) => s + calcOverUnder(j.contractValue, j.costsToDate, j.billingsToDate),
    0
  );
  rows.push({
    id: "total",
    type: "total",
    cells: {
      label: "Total",
      status: "",
      contractValue: totalContract,
      costsToDate: totalCosts,
      billingsToDate: totalBillings,
      pctComplete: totalPct,
      overUnder: totalOverUnder
    }
  });
  const totalOverBilled = jobs.reduce((s, j) => {
    const ou = calcOverUnder(j.contractValue, j.costsToDate, j.billingsToDate);
    return ou > 0 ? s + ou : s;
  }, 0);
  const totalUnderBilled = jobs.reduce((s, j) => {
    const ou = calcOverUnder(j.contractValue, j.costsToDate, j.billingsToDate);
    return ou < 0 ? s + ou : s;
  }, 0);
  rows.push(
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-summary", type: "section-header", label: "Summary", cells: { label: "Summary" } },
    { id: "over-billed", type: "data", indent: 1, cells: { label: "Total Over-Billed (Contract Liabilities)", status: "", contractValue: null, costsToDate: null, billingsToDate: null, pctComplete: null, overUnder: totalOverBilled } },
    { id: "under-billed", type: "data", indent: 1, cells: { label: "Total Under-Billed (Contract Assets)", status: "", contractValue: null, costsToDate: null, billingsToDate: null, pctComplete: null, overUnder: totalUnderBilled } },
    { id: "net", type: "total", cells: { label: "Net Over/(Under) Billing", status: "", contractValue: null, costsToDate: null, billingsToDate: null, pctComplete: null, overUnder: totalOverUnder } }
  );
  return { columns, rows, frozenColumns: 1 };
}
function computeWIPAggregates(dealData) {
  const jobs = dealData.wipSchedule?.jobs ?? [];
  if (jobs.length === 0) return null;
  const calcOverUnder = (j) => {
    const pct = j.contractValue > 0 ? j.costsToDate / j.contractValue : 0;
    return j.billingsToDate - j.contractValue * pct;
  };
  const totalContract = jobs.reduce((s, j) => s + j.contractValue, 0);
  let totalOverBilled = 0;
  let totalUnderBilled = 0;
  for (const j of jobs) {
    const ou = calcOverUnder(j);
    if (ou > 0) totalOverBilled += ou;
    else totalUnderBilled += ou;
  }
  const netOverUnder = totalOverBilled + totalUnderBilled;
  const highConcentrationJob = jobs.reduce((max, j) => j.contractValue > max.contractValue ? j : max, jobs[0]);
  const concentrationPct = totalContract > 0 ? highConcentrationJob.contractValue / totalContract * 100 : 0;
  const nearCompleteCount = jobs.filter((j) => j.contractValue > 0 && j.costsToDate / j.contractValue > 0.9).length;
  return {
    totalContract,
    totalOverBilled,
    totalUnderBilled,
    netOverUnder,
    highConcentrationJob,
    concentrationPct,
    nearCompleteCount,
    jobCount: jobs.length
  };
}
function buildStandardColumns(dealData, labelHeader, opts) {
  const format = opts?.format || "currency";
  const labelWidth = opts?.labelWidth || 280;
  const { periods, aggregatePeriods } = dealData.deal;
  return [
    { key: "label", label: labelHeader, width: labelWidth, frozen: true, format: "text" },
    // Aggregate columns first (FY, LTM, YTD)
    ...aggregatePeriods.map((ap) => ({
      key: ap.id,
      label: ap.shortLabel,
      width: 110,
      format
    })),
    // Monthly columns
    ...periods.map((p) => ({
      key: p.id,
      label: p.shortLabel,
      width: 100,
      format
    }))
  ];
}
function periodCells(dealData, calcFn) {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells = {};
  for (const p of periods) {
    cells[p.id] = calcFn(p.id);
  }
  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) {
      sum += calcFn(mpid);
    }
    cells[ap.id] = sum;
  }
  return cells;
}
function entryCells(dealData, balances) {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells = {};
  for (const p of periods) {
    cells[p.id] = balances[p.id] || 0;
  }
  for (const ap of aggregatePeriods) {
    let sum = 0;
    for (const mpid of ap.monthPeriodIds) {
      sum += balances[mpid] || 0;
    }
    cells[ap.id] = sum;
  }
  return cells;
}
function marginCells(dealData, numeratorFn, denominatorFn) {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells = {};
  const calcMargin = (num, den) => {
    if (den === 0) return NaN;
    return num / Math.abs(den);
  };
  for (const p of periods) {
    cells[p.id] = calcMargin(numeratorFn(p.id), denominatorFn(p.id));
  }
  for (const ap of aggregatePeriods) {
    let numSum = 0, denSum = 0;
    for (const mpid of ap.monthPeriodIds) {
      numSum += numeratorFn(mpid);
      denSum += denominatorFn(mpid);
    }
    cells[ap.id] = calcMargin(numSum, denSum);
  }
  return cells;
}
function adjustmentCells(dealData, amounts) {
  return entryCells(dealData, amounts);
}
function negatedPeriodCells(dealData, calcFn) {
  return periodCells(dealData, (p) => -calcFn(p));
}
function negatedBsEndingBalanceCells(dealData, calcFn) {
  return bsEndingBalanceCells(dealData, (p) => -calcFn(p));
}
function bsEndingBalanceCells(dealData, calcFn) {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells = {};
  for (const p of periods) {
    cells[p.id] = calcFn(p.id);
  }
  for (const ap of aggregatePeriods) {
    const lastPeriodId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
    cells[ap.id] = lastPeriodId ? calcFn(lastPeriodId) : 0;
  }
  return cells;
}
function bsEntryCells(dealData, balances) {
  const { periods, aggregatePeriods } = dealData.deal;
  const cells = {};
  for (const p of periods) {
    cells[p.id] = balances[p.id] || 0;
  }
  for (const ap of aggregatePeriods) {
    const lastPeriodId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
    cells[ap.id] = lastPeriodId ? balances[lastPeriodId] || 0 : 0;
  }
  return cells;
}
function reclassOverlay(rc, pids, categories) {
  if (rc.length === 0) return 0;
  let total = 0;
  for (const pid of pids) {
    for (const cat of categories) {
      total += sumReclassImpact(rc, cat, pid);
    }
  }
  return total;
}
const IS_CATEGORIES = ["Revenue", "Cost of Goods Sold", "Operating expenses", "Payroll & Related", "Other expense (income)"];
function reclassAwareRevenue(tb, rc, pids) {
  const raw = -pids.reduce((s, p) => s + calcRevenue(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, ["Revenue"]);
}
function reclassAwareCOGS(tb, rc, pids) {
  const raw = pids.reduce((s, p) => s + calcCOGS(tb, p), 0);
  return raw + reclassOverlay(rc, pids, ["Cost of Goods Sold"]);
}
function reclassAwareGrossProfit(tb, rc, pids) {
  const raw = -pids.reduce((s, p) => s + calcGrossProfit(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, ["Revenue", "Cost of Goods Sold"]);
}
function reclassAwareOperatingIncome(tb, rc, pids) {
  const raw = -pids.reduce((s, p) => s + calcOperatingIncome(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, ["Revenue", "Cost of Goods Sold", "Operating expenses", "Payroll & Related"]);
}
function reclassAwareNetIncome(tb, rc, pids) {
  const raw = -pids.reduce((s, p) => s + calcNetIncome(tb, p), 0);
  return raw + -reclassOverlay(rc, pids, IS_CATEGORIES);
}
function reclassAwareOpEx(tb, rc, pids) {
  const raw = pids.reduce((s, p) => s + calcOpEx(tb, p), 0);
  return raw + reclassOverlay(rc, pids, ["Operating expenses", "Payroll & Related"]);
}
function reclassAwareOtherExpense(tb, rc, pids) {
  const raw = pids.reduce((s, p) => s + calcOtherExpense(tb, p), 0);
  return raw + reclassOverlay(rc, pids, ["Other expense (income)"]);
}
function reclassAwareReportedEBITDA(tb, rc, pids, ab) {
  const raw = -pids.reduce((s, p) => s + calcReportedEBITDA(tb, p, ab), 0);
  return raw + -reclassOverlay(rc, pids, IS_CATEGORIES);
}
function reclassAwareAdjustedEBITDA(tb, rc, adj, pids, ab) {
  const raw = -pids.reduce((s, p) => s + calcAdjustedEBITDA(tb, adj, p, ab), 0);
  return raw + -reclassOverlay(rc, pids, IS_CATEGORIES);
}
function reclassAwareRevenueRaw(tb, rc, pid) {
  return calcRevenue(tb, pid) + sumReclassImpact(rc, "Revenue", pid);
}
function calcLineItemAdjustments(lineItem, adj, tbIdx, type, p) {
  switch (lineItem) {
    case "Revenue":
      return calcRevenueAdjustments(adj, tbIdx, type, p);
    case "Cost of Goods Sold":
      return calcCOGSAdjustments(adj, tbIdx, type, p);
    case "Operating expenses":
      return calcOpExAdjustments(adj, tbIdx, type, p);
    case "Other expense (income)":
      return calcOtherExpenseAdjustments(adj, tbIdx, type, p);
    case "Payroll & Related":
      return calcOpExAdjustments(adj, tbIdx, type, p);
    default:
      return 0;
  }
}
function buildBreakdownGrid(dealData, config) {
  const { lineItem, title } = config;
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const tbIdx = buildTbIndex(tb);
  const entries = getEntriesByLineItem(tb, lineItem);
  const pc = (fn) => periodCells(dealData, fn);
  const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
  const pctLabel = config.pctLabel || "% of Revenue";
  const rc = dealData.reclassifications ?? [];
  const pctDenFn = config.pctDenominator || ((p) => reclassAwareRevenueRaw(tb, rc, p));
  const sign = config.negateValues ? -1 : 1;
  const showDetail = config.showDetailColumns !== false;
  const baseColumns = buildStandardColumns(dealData, title);
  const columns = showDetail ? [
    baseColumns[0],
    // label
    { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 100, frozen: true, format: "text" },
    ...baseColumns.slice(1)
  ] : baseColumns;
  const frozenColumns = showDetail ? 4 : 1;
  const ec = showDetail ? { acctNo: "", fsLine: "", sub1: "" } : {};
  const buildSection = (sectionLabel, isAdjusted) => {
    const prefix = isAdjusted ? "adj-" : "";
    const sectionRows = [];
    sectionRows.push({ id: `${prefix}hdr-reported`, type: "section-header", label: sectionLabel, cells: { label: sectionLabel, ...ec } });
    for (const e of entries) {
      const signedBalances = {};
      for (const [k, v] of Object.entries(e.balances)) signedBalances[k] = v * sign;
      sectionRows.push({
        id: `${prefix}rpt-${e.accountId}`,
        type: "data",
        indent: 1,
        cells: {
          label: e.accountName,
          ...showDetail ? { acctNo: e.accountId, fsLine: e.fsLineItem, sub1: e.subAccount1 } : {},
          ...entryCells(dealData, signedBalances)
        }
      });
    }
    sectionRows.push({
      id: `${prefix}total-reported`,
      type: isAdjusted ? "subtotal" : "total",
      cells: { label: `Total ${title}, as reported`, ...ec, ...pc((p) => sumByLineItem(tb, lineItem, p) * sign) }
    });
    if (isAdjusted) {
      sectionRows.push({
        id: `${prefix}adj-alloc`,
        type: "data",
        cells: { label: "QoE Adjustments", ...ec, ...pc((p) => calcLineItemAdjustments(lineItem, adj, tbIdx, "all", p) * sign) }
      });
      sectionRows.push({
        id: `${prefix}total-adjusted`,
        type: "total",
        cells: { label: `Total ${title}, as adjusted`, ...ec, ...pc((p) => (sumByLineItem(tb, lineItem, p) - calcLineItemAdjustments(lineItem, adj, tbIdx, "all", p)) * sign) }
      });
    }
    sectionRows.push({ id: `${prefix}s1`, type: "spacer", cells: {} });
    sectionRows.push({ id: `${prefix}hdr-change`, type: "section-header", label: `Change in ${title}`, cells: { label: `Change in ${title}`, ...ec } });
    sectionRows.push({
      id: `${prefix}change-dollar`,
      type: "data",
      cells: { label: "$ Amount", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells = {};
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            cells[periods[i].id] = 0;
            continue;
          }
          cells[periods[i].id] = (sumByLineItem(tb, lineItem, periods[i].id) - sumByLineItem(tb, lineItem, periods[i - 1].id)) * sign;
        }
        const aggVals = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + sumByLineItem(tb, lineItem, pid), 0) * sign;
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) {
            cells[ap.id] = 0;
            continue;
          }
          const prior = aggregatePeriods[i - 1];
          const priorIsFY = prior.label.startsWith("FY");
          const currIsFY = ap.label.startsWith("FY");
          cells[ap.id] = priorIsFY && currIsFY ? aggVals[ap.id] - aggVals[prior.id] : 0;
        }
        return cells;
      })() }
    });
    sectionRows.push({
      id: `${prefix}change-pct`,
      type: "data",
      format: "percent",
      cells: { label: "% Change", ...ec, ...(() => {
        const { periods, aggregatePeriods } = dealData.deal;
        const cells = {};
        for (let i = 0; i < periods.length; i++) {
          if (i === 0) {
            cells[periods[i].id] = NaN;
            continue;
          }
          const prior = sumByLineItem(tb, lineItem, periods[i - 1].id);
          const current = sumByLineItem(tb, lineItem, periods[i].id);
          cells[periods[i].id] = prior === 0 ? NaN : (current - prior) / Math.abs(prior);
        }
        const aggVals = {};
        for (const ap of aggregatePeriods) {
          aggVals[ap.id] = ap.monthPeriodIds.reduce((s, pid) => s + sumByLineItem(tb, lineItem, pid), 0) * sign;
        }
        for (let i = 0; i < aggregatePeriods.length; i++) {
          const ap = aggregatePeriods[i];
          if (i === 0) {
            cells[ap.id] = NaN;
            continue;
          }
          const prior = aggregatePeriods[i - 1];
          const priorIsFY = prior.label.startsWith("FY");
          const currIsFY = ap.label.startsWith("FY");
          const priorVal = aggVals[prior.id];
          const currVal = aggVals[ap.id];
          cells[ap.id] = priorIsFY && currIsFY && priorVal !== 0 ? (currVal - priorVal) / Math.abs(priorVal) : NaN;
        }
        return cells;
      })() }
    });
    sectionRows.push({ id: `${prefix}s2`, type: "spacer", cells: {} });
    sectionRows.push({ id: `${prefix}hdr-pct`, type: "section-header", label: pctLabel, cells: { label: pctLabel, ...ec } });
    for (const e of entries) {
      sectionRows.push({
        id: `${prefix}pct-${e.accountId}`,
        type: "data",
        format: "percent",
        indent: 1,
        cells: {
          label: e.accountName,
          ...ec,
          // Negate numerator if sign=-1 so that e.g. revenue/|revenue| = +1 = 100%
          ...mc((p) => (e.balances[p] || 0) * sign, pctDenFn)
        }
      });
    }
    sectionRows.push({
      id: `${prefix}pct-total`,
      type: "subtotal",
      format: "percent",
      cells: {
        label: `Total ${title}`,
        ...ec,
        ...mc((p) => sumByLineItem(tb, lineItem, p) * sign, pctDenFn)
      }
    });
    sectionRows.push({ id: `${prefix}s3`, type: "spacer", cells: {} });
    sectionRows.push({ id: `${prefix}hdr-check`, type: "section-header", label: "Checks", cells: { label: "Checks", ...ec } });
    sectionRows.push({
      id: `${prefix}check`,
      type: "check",
      checkPassed: true,
      cells: {
        label: "Check to IS (should = 0)",
        ...ec,
        ...pc((p) => {
          const total = entries.reduce((s, e) => s + (e.balances[p] || 0), 0);
          const isTotal = sumByLineItem(tb, lineItem, p);
          return Math.abs(total - isTotal) < 0.01 ? 0 : total - isTotal;
        })
      }
    });
    return sectionRows;
  };
  const rows = [
    ...buildSection(`${title} - reported`, false),
    { id: "section-divider", type: "spacer", cells: {} },
    ...buildSection(`${title} - adjusted`, true)
  ];
  return { columns, rows, frozenColumns };
}
function buildSetupGrid(dealData) {
  const info = dealData.deal;
  const regular = info.periods.filter((p) => !p.isStub);
  const stubs = info.periods.filter((p) => p.isStub);
  const periodLabel = stubs.length > 0 ? `${regular.length} months + ${stubs.length} stub${stubs.length > 1 ? "s" : ""}` : `${regular.length} months`;
  const allDates = info.periods.map((p) => p.date).filter(Boolean);
  const reviewPeriod = allDates.length > 0 ? `${allDates[0].toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${allDates[allDates.length - 1].toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "None";
  const rows = [
    { id: "r0", type: "data", cells: { label: "Project Name", value: info.projectName } },
    { id: "r1", type: "data", cells: { label: "Client / Firm", value: info.clientName } },
    { id: "r2", type: "data", cells: { label: "Target Company", value: info.targetCompany } },
    { id: "r3", type: "data", cells: { label: "Industry", value: info.industry } },
    { id: "r4", type: "data", cells: { label: "Transaction Type", value: info.transactionType ? info.transactionType.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-") : "" } },
    { id: "r5", type: "data", cells: { label: "Fiscal Year End", value: `Month ${info.fiscalYearEnd}` } },
    { id: "r6", type: "data", cells: { label: "Periods", value: periodLabel } },
    { id: "r7", type: "data", cells: { label: "Period Range", value: info.periods.length > 0 ? `${info.periods[0].label} – ${info.periods[info.periods.length - 1].label}` : "None" } },
    { id: "r8", type: "data", cells: { label: "Review Period", value: reviewPeriod } }
  ];
  return {
    columns: [
      { key: "label", label: "Field", width: 200, frozen: true, format: "text" },
      { key: "value", label: "Value", width: 300, format: "text" }
    ],
    rows,
    frozenColumns: 1
  };
}
function buildTrialBalanceGrid(dealData) {
  const periods = dealData.deal.periods;
  const columns = [
    { key: "fsType", label: "FS", width: 40, frozen: true, format: "text" },
    { key: "accountId", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "accountName", label: "Account Name", width: 200, frozen: true, format: "text" },
    { key: "fsLineItem", label: "FS Line Item", width: 150, frozen: true, format: "text" },
    ...periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 90, format: "currency" }))
  ];
  const dataRows = dealData.trialBalance.map((entry) => ({
    id: entry.accountId,
    type: "data",
    cells: {
      fsType: entry.fsType,
      accountId: entry.accountId,
      accountName: entry.accountName,
      fsLineItem: entry.fsLineItem,
      ...Object.fromEntries(periods.map((p) => [p.id, entry.balances[p.id] || 0]))
    }
  }));
  const bsTotals = {};
  const isTotals = {};
  for (const entry of dealData.trialBalance) {
    for (const p of periods) {
      const val = entry.balances[p.id] || 0;
      if (entry.fsType === "BS") bsTotals[p.id] = (bsTotals[p.id] || 0) + val;
      else isTotals[p.id] = (isTotals[p.id] || 0) + val;
    }
  }
  const fyEndMonth = dealData.deal.fiscalYearEnd;
  const fyStartMonth = fyEndMonth % 12 + 1;
  const isYtdTotals = {};
  let isRunning = 0;
  for (const p of periods) {
    if (p.month === fyStartMonth) isRunning = 0;
    isRunning += isTotals[p.id] || 0;
    isYtdTotals[p.id] = isRunning;
  }
  let allBalanced = true;
  const checkCells = { fsType: "", accountId: "", accountName: "Check (should be 0)", fsLineItem: "" };
  for (const p of periods) {
    const checkVal = (bsTotals[p.id] || 0) + (isYtdTotals[p.id] || 0);
    checkCells[p.id] = checkVal;
    if (Math.abs(checkVal) >= 0.01) allBalanced = false;
  }
  const rows = [
    ...dataRows,
    { id: "__bs_total", type: "subtotal", cells: { fsType: "", accountId: "", accountName: "BS Total", fsLineItem: "", ...Object.fromEntries(periods.map((p) => [p.id, bsTotals[p.id] || 0])) } },
    { id: "__is_total", type: "subtotal", cells: { fsType: "", accountId: "", accountName: "IS Total (YTD)", fsLineItem: "", ...Object.fromEntries(periods.map((p) => [p.id, isYtdTotals[p.id] || 0])) } },
    { id: "__check", type: "check", checkPassed: allBalanced, cells: checkCells }
  ];
  return { columns, rows, frozenColumns: 4 };
}
function buildIncomeStatementGrid(dealData) {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const rc = dealData.reclassifications ?? [];
  const npc = (fn) => negatedPeriodCells(dealData, fn);
  const pc = (fn) => periodCells(dealData, fn);
  const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
  const columns = buildStandardColumns(dealData, "");
  const rev = (p) => sumByLineItemWithReclass(tb, rc, "Revenue", p);
  const cogs = (p) => sumByLineItemWithReclass(tb, rc, "Cost of Goods Sold", p);
  const gp = (p) => rev(p) + cogs(p);
  const opex = (p) => {
    let total = calcOpEx(tb, p);
    total += sumReclassImpact(rc, "Operating expenses", p);
    return total;
  };
  const payroll = (p) => {
    let total = calcPayroll(tb, p);
    total += sumReclassImpact(rc, "Payroll & Related", p);
    return total;
  };
  const calcTotalOpEx = (p) => opex(p) + payroll(p);
  const otherExp = (p) => sumByLineItemWithReclass(tb, rc, "Other expense (income)", p);
  const repEbitda = (p) => calcReportedEBITDA(tb, p, ab);
  const adjEbitda = (p) => calcAdjustedEBITDA(tb, adj, p, ab);
  const rows = [
    { id: "hdr-reported", type: "section-header", label: "Income Statement - as reported", cells: { label: "Income Statement - as reported" } },
    { id: "revenue", type: "data", cells: { label: "Revenue", ...npc((p) => rev(p)) } },
    { id: "cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc((p) => cogs(p)) } },
    { id: "gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc((p) => gp(p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "opex", type: "data", cells: { label: "Operating Expenses", ...pc((p) => calcTotalOpEx(p)) } },
    { id: "op-income", type: "subtotal", cells: { label: "Operating income", ...npc((p) => gp(p) + calcTotalOpEx(p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "other", type: "data", cells: { label: "Other expense (income)", ...pc((p) => otherExp(p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "net-income", type: "total", cells: { label: "Net income (loss)", ...npc((p) => calcNetIncome(tb, p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "hdr-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
    { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } },
    { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...npc((p) => repEbitda(p)) } },
    { id: "s6", type: "spacer", cells: {} },
    { id: "hdr-adjusted", type: "section-header", label: "Income Statement - as adjusted", cells: { label: "Income Statement - as adjusted" } },
    { id: "adj-revenue", type: "data", cells: { label: "Revenue", ...npc((p) => rev(p)) } },
    { id: "adj-cogs", type: "data", cells: { label: "Cost of Goods Sold", ...pc((p) => cogs(p)) } },
    { id: "adj-gross-profit", type: "subtotal", cells: { label: "Gross profit", ...npc((p) => gp(p)) } },
    { id: "s-adj1", type: "spacer", cells: {} },
    { id: "adj-opex", type: "data", cells: { label: "Operating Expenses", ...pc((p) => calcTotalOpEx(p)) } },
    { id: "adj-op-income", type: "subtotal", cells: { label: "Operating income", ...npc((p) => gp(p) + calcTotalOpEx(p)) } },
    { id: "s-adj2", type: "spacer", cells: {} },
    { id: "qoe-adjustments", type: "data", indent: 1, cells: { label: "QoE Adjustments", ...pc((p) => calcAdjustmentTotal(adj, "all", p)) } },
    { id: "s-adj2b", type: "spacer", cells: {} },
    { id: "adj-other", type: "data", cells: { label: "Other expense (income)", ...pc((p) => otherExp(p)) } },
    { id: "s-adj3", type: "spacer", cells: {} },
    { id: "adj-net-income", type: "total", cells: { label: "Net income (loss)", ...npc((p) => calcNetIncome(tb, p) - calcAdjustmentTotal(adj, "all", p)) } },
    { id: "s-adj4", type: "spacer", cells: {} },
    { id: "hdr-adj-addbacks", type: "section-header", label: "EBITDA addbacks", cells: { label: "EBITDA addbacks" } },
    { id: "adj-interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } },
    { id: "adj-taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "adj-depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } },
    { id: "s-adj5", type: "spacer", cells: {} },
    { id: "adj-ebitda", type: "total", cells: { label: "Adjusted EBITDA", ...npc((p) => adjEbitda(p)) } },
    { id: "s7", type: "spacer", cells: {} },
    { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue" } },
    { id: "gm", type: "data", format: "percent", cells: { label: "Gross margin", ...mc((p) => -gp(p), (p) => rev(p)) } },
    { id: "om", type: "data", format: "percent", cells: { label: "Operating margin", ...mc((p) => -(gp(p) + calcTotalOpEx(p)), (p) => rev(p)) } },
    { id: "em", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...mc((p) => -repEbitda(p), (p) => rev(p)) } },
    { id: "aem", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...mc((p) => -adjEbitda(p), (p) => rev(p)) } },
    { id: "nm", type: "data", format: "percent", cells: { label: "Net margin", ...mc((p) => -calcNetIncome(tb, p), (p) => rev(p)) } }
  ];
  return { columns, rows, frozenColumns: 1 };
}
function buildQoEAnalysisGrid(dealData) {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const tbIdx = buildTbIndex(tb);
  const pc = (fn) => periodCells(dealData, fn);
  const npc = (fn) => negatedPeriodCells(dealData, fn);
  const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
  const { periods, aggregatePeriods } = dealData.deal;
  const columns = [
    { key: "label", label: "USD $", width: 240, frozen: true, format: "text" },
    { key: "adjNo", label: "Adj. #", width: 55, frozen: true, format: "text" },
    { key: "adjType", label: "Adj. Type", width: 70, frozen: true, format: "text" },
    { key: "acctNo", label: "Account #", width: 80, frozen: true, format: "text" },
    { key: "acctDesc", label: "Account Description", width: 160, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account 1", width: 100, frozen: true, format: "text" },
    { key: "sub2", label: "Sub-account 2", width: 100, frozen: true, format: "text" },
    { key: "sub3", label: "Sub-account 3", width: 100, frozen: true, format: "text" },
    ...aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" })),
    { key: "comments", label: "Comments", width: 200, format: "text" }
  ];
  const ec = { adjNo: "", adjType: "", acctNo: "", acctDesc: "", fsLine: "", sub1: "", sub2: "", sub3: "", comments: "" };
  const maAdj = adj.filter((a) => a.type === "MA" && a.effectType !== "NonQoE");
  const ddAdj = adj.filter((a) => a.type === "DD" && a.effectType !== "NonQoE");
  const pfAdj = adj.filter((a) => a.type === "PF" && a.effectType !== "NonQoE");
  const adjRow = (a, prefix, i) => ({
    id: `${prefix}-${a.id}`,
    type: "data",
    indent: 1,
    cells: {
      label: a.label || a.notes || `${prefix.toUpperCase()}-${i + 1}`,
      adjNo: `${a.type}-${i + 1}`,
      adjType: a.type,
      acctNo: a.tbAccountNumber,
      acctDesc: a.label,
      fsLine: a.intent,
      sub1: "",
      sub2: "",
      sub3: "",
      comments: a.notes,
      ...adjustmentCells(dealData, a.amounts)
    }
  });
  const rows = [
    { id: "revenue-reported", type: "data", cells: { label: "Revenue, as reported", ...ec, ...npc((p) => calcRevenue(tb, p)) } },
    { id: "revenue-adjusted", type: "data", cells: { label: "Revenue, as adjusted", ...ec, ...npc((p) => calcRevenue(tb, p) - calcRevenueAdjustments(adj, tbIdx, "all", p)) } },
    { id: "gross-profit", type: "data", cells: { label: "Gross profit, as adjusted", ...ec, ...npc((p) => calcGrossProfit(tb, p) - calcRevenueAdjustments(adj, tbIdx, "all", p) - calcCOGSAdjustments(adj, tbIdx, "all", p)) } },
    { id: "net-income", type: "subtotal", cells: { label: "Net income (loss)", ...ec, ...npc((p) => calcNetIncome(tb, p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-normal", type: "section-header", label: "Normal adjustments", cells: { label: "Normal adjustments", ...ec } },
    { id: "interest", type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } },
    { id: "taxes", type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "depreciation", type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "reported-ebitda", type: "total", cells: { label: "Reported EBITDA", ...ec, ...npc((p) => calcReportedEBITDA(tb, p, ab)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "hdr-ma", type: "section-header", label: "Management adjustments", cells: { label: "Management adjustments", ...ec } },
    ...maAdj.map((a, i) => adjRow(a, "ma", i)),
    { id: "ma-total", type: "subtotal", cells: { label: "Total management adjustments", ...ec, ...pc((p) => calcAdjustmentTotal(adj, "MA", p)) } },
    { id: "ma-ebitda", type: "total", cells: { label: "Management adjusted EBITDA", ...ec, ...npc((p) => calcReportedEBITDA(tb, p, ab) - calcAdjustmentTotal(adj, "MA", p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "hdr-dd", type: "section-header", label: "Due diligence adjustments", cells: { label: "Due diligence adjustments", ...ec } },
    ...ddAdj.map((a, i) => adjRow(a, "dd", i)),
    { id: "dd-total", type: "subtotal", cells: { label: "Total due diligence adjustments", ...ec, ...pc((p) => calcAdjustmentTotal(adj, "DD", p)) } },
    { id: "dd-ebitda", type: "total", cells: { label: "Due diligence adjusted EBITDA", ...ec, ...npc((p) => calcReportedEBITDA(tb, p, ab) - calcAdjustmentTotal(adj, "MA", p) - calcAdjustmentTotal(adj, "DD", p)) } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "hdr-pf", type: "section-header", label: "Pro Forma Adjustments", cells: { label: "Pro Forma Adjustments", ...ec } },
    ...pfAdj.map((a, i) => adjRow(a, "pf", i)),
    { id: "pf-total", type: "subtotal", cells: { label: "Total pro forma adjustments", ...ec, ...pc((p) => calcAdjustmentTotal(adj, "PF", p)) } },
    { id: "pf-ebitda", type: "total", cells: { label: "Pro Forma Adjusted EBITDA", ...ec, ...npc((p) => calcReportedEBITDA(tb, p, ab) - calcAdjustmentTotal(adj, "all", p)) } },
    { id: "s6", type: "spacer", cells: {} }
  ];
  const wipAgg = dealData.wipSchedule?.jobs?.length ? computeWIPAggregates(dealData) : null;
  if (wipAgg && Math.abs(wipAgg.netOverUnder) > 0) {
    rows.push(
      { id: "hdr-wip", type: "section-header", label: "WIP Analysis (Memo)", cells: { label: "WIP Analysis (Memo)", ...ec } }
    );
    if (wipAgg.totalOverBilled > 0) {
      rows.push({ id: "wip-over-memo", type: "data", indent: 1, cells: { label: `Memo: WIP Over-Billing (suggest reversing $${(wipAgg.totalOverBilled / 1e3).toFixed(0)}K revenue)`, ...ec, ...pc(() => 0) } });
    }
    if (wipAgg.totalUnderBilled < 0) {
      rows.push({ id: "wip-under-memo", type: "data", indent: 1, cells: { label: `Memo: WIP Under-Billing (suggest accruing $${(Math.abs(wipAgg.totalUnderBilled) / 1e3).toFixed(0)}K revenue)`, ...ec, ...pc(() => 0) } });
    }
    rows.push({ id: "s-wip", type: "spacer", cells: {} });
  }
  rows.push(
    { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
    { id: "reported-margin", type: "data", format: "percent", cells: { label: "Reported EBITDA margin", ...ec, ...mc((p) => -calcReportedEBITDA(tb, p, ab), (p) => calcRevenue(tb, p)) } },
    { id: "adj-margin", type: "data", format: "percent", cells: { label: "Adjusted EBITDA margin", ...ec, ...mc((p) => -(calcReportedEBITDA(tb, p, ab) - calcAdjustmentTotal(adj, "all", p)), (p) => calcRevenue(tb, p)) } }
  );
  return { columns, rows, frozenColumns: 9 };
}
function buildBalanceSheetGrid(dealData) {
  const tb = dealData.trialBalance;
  const rc = dealData.reclassifications ?? [];
  const s = (lineItem, p) => sumByLineItemWithReclass(tb, rc, lineItem, p);
  const bc = (fn) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "");
  const totalCA = (p) => s("Cash and cash equivalents", p) + s("Accounts receivable", p) + s("Other current assets", p);
  const totalAssets = (p) => totalCA(p) + s("Fixed assets", p) + s("Other assets", p);
  const totalCL = (p) => s("Current liabilities", p) + s("Other current liabilities", p);
  const totalLiab = (p) => totalCL(p) + s("Long term liabilities", p);
  const wipAgg = dealData.wipSchedule?.jobs?.length ? computeWIPAggregates(dealData) : null;
  const rows = [
    { id: "hdr-assets", type: "section-header", label: "ASSETS", cells: { label: "ASSETS" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc((p) => s("Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc((p) => s("Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc((p) => s("Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc((p) => totalCA(p)) } },
    ...wipAgg ? [
      { id: "wip-contract-assets", type: "data", indent: 1, cells: { label: `  Memo: Contract Assets (Under-Billed)`, ...(() => {
        const c = {};
        for (const p of dealData.deal.periods) c[p.id] = Math.abs(wipAgg.totalUnderBilled);
        for (const ap of dealData.deal.aggregatePeriods) c[ap.id] = Math.abs(wipAgg.totalUnderBilled);
        return c;
      })() } }
    ] : [],
    { id: "fa", type: "data", indent: 1, cells: { label: "Fixed Assets", ...bc((p) => s("Fixed assets", p)) } },
    { id: "oa", type: "data", indent: 1, cells: { label: "Other Assets", ...bc((p) => s("Other assets", p)) } },
    { id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...bc((p) => totalAssets(p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-liab", type: "section-header", label: "LIABILITIES", cells: { label: "LIABILITIES" } },
    { id: "ap", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc((p) => s("Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc((p) => s("Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc((p) => totalCL(p)) } },
    ...wipAgg ? [
      { id: "wip-contract-liab", type: "data", indent: 1, cells: { label: `  Memo: Contract Liabilities (Over-Billed)`, ...(() => {
        const c = {};
        for (const p of dealData.deal.periods) c[p.id] = wipAgg.totalOverBilled;
        for (const ap of dealData.deal.aggregatePeriods) c[ap.id] = wipAgg.totalOverBilled;
        return c;
      })() } }
    ] : [],
    { id: "ltl", type: "data", indent: 1, cells: { label: "Long Term Liabilities", ...nbc((p) => s("Long term liabilities", p)) } },
    { id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...nbc((p) => totalLiab(p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "hdr-eq", type: "section-header", label: "EQUITY", cells: { label: "EQUITY" } },
    { id: "equity", type: "data", indent: 1, cells: { label: "Total Equity", ...bc((p) => totalAssets(p) + totalLiab(p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...bc((p) => totalAssets(p)) } }
  ];
  return { columns, rows, frozenColumns: 1 };
}
function buildDDAdjustmentsGrid(dealData, tabIndex, proofMap, proposalMap) {
  const adj = dealData.adjustments;
  const { periods, aggregatePeriods } = dealData.deal;
  const columns = [
    { key: "label", label: "Description", width: 240, frozen: true, format: "text" },
    { key: "adjNo", label: "Adj #", width: 60, frozen: true, format: "text" },
    { key: "adjType", label: "Type", width: 60, frozen: true, format: "text" },
    { key: "acctNo", label: "Account #", width: 80, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    { key: "source", label: "Source", width: 100, frozen: true, format: "text" },
    { key: "tier", label: "Support Tier", width: 100, frozen: false, format: "text" },
    { key: "verified", label: "Verified", width: 140, frozen: false, format: "text" },
    { key: "findings", label: "Findings", width: 200, frozen: false, format: "text" },
    { key: "flags", label: "Red Flags", width: 140, frozen: false, format: "text" },
    ...aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const emptyCols = { adjNo: "", adjType: "", acctNo: "", fsLine: "", source: "", tier: "", verified: "", findings: "", flags: "" };
  const filterTypes = tabIndex === 1 ? ["MA"] : ["DD", "PF"];
  const filtered = adj.filter((a) => filterTypes.includes(a.type));
  const sectionLabel = tabIndex === 1 ? "Management Adjustments" : "Due Diligence & Pro Forma Adjustments";
  const TIER_LABELS = {
    0: "T0 - Corroborated",
    1: "T1 - Multi-Source",
    2: "T2 - Single Source",
    3: "T3 - Analytical",
    4: "T4 - Asserted"
  };
  const rows = [
    { id: "hdr", type: "section-header", label: sectionLabel, cells: { label: sectionLabel, ...emptyCols } },
    ...filtered.map((a, i) => {
      const proof = proofMap?.get(a.id);
      const proposal = proposalMap?.get(a.id) ?? proposalMap?.get(a.label) ?? proposalMap?.get(a.notes);
      let verifiedLabel = "";
      if (proof && proof.validation_status !== "pending") {
        const statusLabel = proof.validation_status.charAt(0).toUpperCase() + proof.validation_status.slice(1);
        verifiedLabel = proof.validation_score != null ? `${statusLabel} (${proof.validation_score})` : statusLabel;
        if (proof.matchCount > 0) verifiedLabel += ` · ${proof.matchCount} matches`;
      }
      const findingsStr = proof?.key_findings?.length ? proof.key_findings.join("; ").slice(0, 160) : "";
      const flagsStr = proof?.red_flags?.length ? proof.red_flags.length === 1 ? proof.red_flags[0] : `${proof.red_flags.length} flags` : "";
      return {
        id: `adj-${a.id}`,
        type: "data",
        indent: 1,
        cells: {
          label: a.label || a.notes || `Adjustment ${i + 1}`,
          adjNo: `${a.type}-${i + 1}`,
          adjType: a.type,
          acctNo: a.tbAccountNumber,
          fsLine: a.intent,
          source: proposal ? proposal.source === "ai_discovery" ? "AI Discovery" : "Manual" : a.type === "MA" ? "Manual" : "",
          tier: proposal?.supportTier != null ? TIER_LABELS[proposal.supportTier] || `T${proposal.supportTier}` : "",
          verified: verifiedLabel,
          findings: findingsStr,
          flags: flagsStr,
          ...adjustmentCells(dealData, a.amounts)
        }
      };
    })
  ];
  const totalCells = {};
  for (const p of periods) totalCells[p.id] = filtered.reduce((s, a) => s + (a.amounts[p.id] || 0), 0);
  for (const ap of aggregatePeriods) totalCells[ap.id] = ap.monthPeriodIds.reduce((s, mpid) => s + filtered.reduce((ss, a) => ss + (a.amounts[mpid] || 0), 0), 0);
  rows.push({ id: "total", type: "total", cells: { label: `Total ${sectionLabel}`, ...emptyCols, ...totalCells } });
  return { columns, rows, frozenColumns: 6 };
}
function buildSalesGrid(dealData) {
  return buildBreakdownGrid(dealData, { lineItem: "Revenue", title: "Revenue", negateValues: true });
}
function buildCOGSGrid(dealData) {
  return buildBreakdownGrid(dealData, { lineItem: "Cost of Goods Sold", title: "Cost of Goods Sold" });
}
function buildOpExGrid(dealData) {
  const tb = dealData.trialBalance;
  return buildBreakdownGrid(dealData, {
    lineItem: "Operating expenses",
    title: "Operating Expenses",
    pctLabel: "% of Operating Expenses",
    pctDenominator: (p) => calcOpEx(tb, p) + calcPayroll(tb, p)
  });
}
function buildOtherExpenseGrid(dealData) {
  const tb = dealData.trialBalance;
  return buildBreakdownGrid(dealData, {
    lineItem: "Other expense (income)",
    title: "Other Expense (Income)",
    pctLabel: "% of Other Expense (Income)",
    pctDenominator: (p) => calcOtherExpense(tb, p)
  });
}
function buildPayrollGrid(dealData) {
  const tb = dealData.trialBalance;
  const entries = getEntriesByLineItem(tb, "Payroll & Related");
  const pc = (fn) => periodCells(dealData, fn);
  const mc = (numFn, denFn) => marginCells(dealData, numFn, denFn);
  const totalRevenue = (p) => calcRevenue(tb, p);
  const tbHasData = entries.some(
    (e) => dealData.deal.periods.some((p) => Math.abs(e.balances[p.id] || 0) > 0.01)
  );
  if (!tbHasData && dealData.payrollFallback) {
    return buildPayrollFallbackGrid(dealData, dealData.payrollFallback);
  }
  const totalPayroll = (p) => calcPayroll(tb, p);
  const columns = [
    { key: "label", label: "Payroll & Related", width: 280, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 100, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const ec = { acctNo: "", fsLine: "", sub1: "" };
  const rows = [
    { id: "hdr-reported", type: "section-header", label: "Payroll & Related - reported", cells: { label: "Payroll & Related - reported", ...ec } },
    ...entries.map((e) => ({
      id: `rpt-${e.accountId}`,
      type: "data",
      indent: 1,
      cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, sub1: e.subAccount1, ...entryCells(dealData, e.balances) }
    })),
    { id: "total-reported", type: "total", cells: { label: "Total Payroll & Related", ...ec, ...pc(totalPayroll) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-pct-rev", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue", ...ec } },
    ...entries.map((e) => ({
      id: `pct-rev-${e.accountId}`,
      type: "data",
      indent: 1,
      format: "percent",
      cells: { label: e.accountName, ...ec, ...mc((p) => e.balances[p] || 0, totalRevenue) }
    })),
    { id: "pct-rev-total", type: "subtotal", format: "percent", cells: { label: "Total Payroll as % of Revenue", ...ec, ...mc(totalPayroll, totalRevenue) } }
  ];
  return { columns, rows, frozenColumns: 4 };
}
function buildPayrollFallbackGrid(dealData, fb) {
  const periods = dealData.deal.periods;
  const aggPeriods = dealData.deal.aggregatePeriods;
  const totalRevenue = (p) => calcRevenue(dealData.trialBalance, p);
  const columns = [
    { key: "label", label: "Payroll & Related (from payroll register)", width: 320, frozen: true, format: "text" },
    ...aggPeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const sumCategory = (items, pid) => items.reduce((s, it) => s + (it.monthlyValues[pid] || 0), 0);
  const sumCategoryAgg = (items, ap) => ap.monthPeriodIds.reduce((s, pid) => s + sumCategory(items, pid), 0);
  const categories = [
    { id: "sw", label: "Salaries & Wages", items: fb.salaryWages },
    { id: "oc", label: "Owner Compensation", items: fb.ownerCompensation },
    { id: "pt", label: "Payroll Taxes", items: fb.payrollTaxes },
    { id: "bn", label: "Benefits", items: fb.benefits }
  ];
  const totalForPeriod = (pid) => categories.reduce((s, c) => s + sumCategory(c.items, pid), 0);
  const totalForAgg = (ap) => categories.reduce((s, c) => s + sumCategoryAgg(c.items, ap), 0);
  const makeCells = (fn, aggFn) => {
    const cells = {};
    for (const ap of aggPeriods) cells[ap.id] = aggFn(ap);
    for (const p of periods) cells[p.id] = fn(p.id);
    return cells;
  };
  const rows = [
    { id: "hdr", type: "section-header", label: "Payroll & Related (from payroll register)", cells: { label: "Payroll & Related (from payroll register)" } },
    ...categories.filter((c) => c.items.length > 0).map((c) => ({
      id: `fb-${c.id}`,
      type: "data",
      indent: 1,
      cells: { label: c.label, ...makeCells((pid) => sumCategory(c.items, pid), (ap) => sumCategoryAgg(c.items, ap)) }
    })),
    { id: "fb-total", type: "total", cells: { label: "Total Payroll & Related", ...makeCells(totalForPeriod, totalForAgg) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-pct", type: "section-header", label: "% of Revenue", cells: { label: "% of Revenue" } },
    { id: "pct-total", type: "subtotal", format: "percent", cells: {
      label: "Total Payroll as % of Revenue",
      ...(() => {
        const cells = {};
        for (const ap of aggPeriods) {
          const rev = ap.monthPeriodIds.reduce((s, pid) => s + totalRevenue(pid), 0);
          cells[ap.id] = rev === 0 ? NaN : totalForAgg(ap) / Math.abs(rev);
        }
        for (const p of periods) {
          const rev = totalRevenue(p.id);
          cells[p.id] = rev === 0 ? NaN : totalForPeriod(p.id) / Math.abs(rev);
        }
        return cells;
      })()
    } }
  ];
  return { columns, rows, frozenColumns: 1 };
}
function buildWorkingCapitalGrid(dealData) {
  const tb = dealData.trialBalance;
  const rc = dealData.reclassifications ?? [];
  const s = (li, p) => sumByLineItemWithReclass(tb, rc, li, p);
  const bc = (fn) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "Working Capital Summary", { labelWidth: 280 });
  const totalCA = (p) => s("Cash and cash equivalents", p) + s("Accounts receivable", p) + s("Other current assets", p);
  const totalCL = (p) => s("Current liabilities", p) + s("Other current liabilities", p);
  const rows = [
    { id: "hdr-ca", type: "section-header", label: "Current Assets", cells: { label: "Current Assets" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash & Equivalents", ...bc((p) => s("Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts Receivable", ...bc((p) => s("Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other Current Assets", ...bc((p) => s("Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...bc((p) => totalCA(p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-cl", type: "section-header", label: "Current Liabilities", cells: { label: "Current Liabilities" } },
    { id: "cl", type: "data", indent: 1, cells: { label: "Current Liabilities", ...nbc((p) => s("Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other Current Liabilities", ...nbc((p) => s("Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...nbc((p) => totalCL(p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "nwc", type: "total", cells: { label: "Net Working Capital", ...bc((p) => totalCA(p) + totalCL(p)) } },
    { id: "nwc-ex", type: "subtotal", cells: { label: "NWC ex. Cash", ...bc((p) => s("Accounts receivable", p) + s("Other current assets", p) + totalCL(p)) } }
  ];
  return { columns, rows, frozenColumns: 1 };
}
function buildNWCAnalysisGrid(dealData) {
  const tb = dealData.trialBalance;
  const rc = dealData.reclassifications ?? [];
  const s = (li, p) => sumByLineItemWithReclass(tb, rc, li, p);
  const bc = (fn) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "NWC Analysis", { labelWidth: 280 });
  const totalCA = (p) => s("Cash and cash equivalents", p) + s("Accounts receivable", p) + s("Other current assets", p);
  const totalCL = (p) => s("Current liabilities", p) + s("Other current liabilities", p);
  const nwc = (p) => totalCA(p) + totalCL(p);
  const nwcExCash = (p) => s("Accounts receivable", p) + s("Other current assets", p) + totalCL(p);
  const rows = [
    { id: "hdr-nwc", type: "section-header", label: "Net working capital - reported to adjusted", cells: { label: "Net working capital - reported to adjusted" } },
    { id: "cash", type: "data", indent: 1, cells: { label: "Cash and cash equivalents", ...bc((p) => s("Cash and cash equivalents", p)) } },
    { id: "ar", type: "data", indent: 1, cells: { label: "Accounts receivable", ...bc((p) => s("Accounts receivable", p)) } },
    { id: "oca", type: "data", indent: 1, cells: { label: "Other current assets", ...bc((p) => s("Other current assets", p)) } },
    { id: "total-ca", type: "subtotal", cells: { label: "Current assets", ...bc((p) => totalCA(p)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "cl", type: "data", indent: 1, cells: { label: "Current liabilities", ...nbc((p) => s("Current liabilities", p)) } },
    { id: "ocl", type: "data", indent: 1, cells: { label: "Other current liabilities", ...nbc((p) => s("Other current liabilities", p)) } },
    { id: "total-cl", type: "subtotal", cells: { label: "Current liabilities total", ...nbc((p) => totalCL(p)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "nwc-reported", type: "total", cells: { label: "Net working capital", ...bc((p) => nwc(p)) } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "hdr-adj", type: "section-header", label: "Normal NWC adjustments", cells: { label: "Normal NWC adjustments" } },
    { id: "adj-cash", type: "data", indent: 1, cells: { label: "Remove: Cash and cash equivalents", ...bc((p) => -s("Cash and cash equivalents", p)) } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "nwc-ex-cash", type: "total", cells: { label: "Net working capital, reported (ex. cash)", ...bc((p) => nwcExCash(p)) } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "nwc-adjusted", type: "total", cells: { label: "Net working capital, adjusted", ...bc((p) => nwcExCash(p)) } }
  ];
  const wipAgg = dealData.wipSchedule?.jobs?.length ? computeWIPAggregates(dealData) : null;
  if (wipAgg) {
    rows.push(
      { id: "s-wip", type: "spacer", cells: {} },
      { id: "hdr-wip", type: "section-header", label: "WIP Adjustments", cells: { label: "WIP Adjustments" } },
      { id: "wip-over", type: "data", indent: 1, cells: { label: "Contract Liabilities (Over-Billed)", ...bc(() => wipAgg.totalOverBilled) } },
      { id: "wip-under", type: "data", indent: 1, cells: { label: "Contract Assets (Under-Billed)", ...bc(() => Math.abs(wipAgg.totalUnderBilled)) } },
      { id: "wip-net", type: "subtotal", cells: { label: "Net WIP Impact on NWC", ...bc(() => wipAgg.netOverUnder) } }
    );
  }
  rows.push(
    { id: "s8", type: "spacer", cells: {} },
    { id: "hdr-trail", type: "section-header", label: "Trailing Averages", cells: { label: "Trailing Averages" } },
    { id: "trail-ar", type: "data", format: "number", cells: { label: "A/R Days Outstanding", ...bc((p) => {
      const ar = Math.abs(s("Accounts receivable", p));
      const rev = Math.abs(sumByLineItemWithReclass(tb, rc, "Revenue", p));
      return rev < 1 ? 0 : ar / rev * 30;
    }) } },
    { id: "trail-ap", type: "data", format: "number", cells: { label: "A/P Days Outstanding", ...bc((p) => {
      const ap = Math.abs(s("Current liabilities", p));
      const cogs = Math.abs(sumByLineItemWithReclass(tb, rc, "Cost of Goods Sold", p));
      return cogs < 1e3 ? 0 : ap / cogs * 30;
    }) } }
  );
  return { columns, rows, frozenColumns: 1 };
}
function buildCashGrid(dealData) {
  const tb = dealData.trialBalance;
  const entries = getEntriesByLineItem(tb, "Cash and cash equivalents");
  const bc = (fn) => bsEndingBalanceCells(dealData, fn);
  const columns = [
    { key: "label", label: "Cash", width: 280, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const rows = entries.map((e) => ({
    id: e.accountId,
    type: "data",
    indent: 1,
    cells: { label: e.accountName, ...bsEntryCells(dealData, e.balances) }
  }));
  rows.push({ id: "total", type: "total", cells: { label: "Total Cash", ...bc((p) => sumByLineItem(tb, "Cash and cash equivalents", p)) } });
  return { columns, rows, frozenColumns: 1 };
}
function buildAgingGrid(dealData, type) {
  const data = type === "ar" ? dealData.arAging : dealData.apAging;
  const entityLabel = type === "ar" ? "Customer" : "Vendor";
  const totalLabel = type === "ar" ? "Total AR" : "Total AP";
  const columns = [
    { key: "label", label: entityLabel, width: 200, frozen: true, format: "text" },
    { key: "current", label: "Current", width: 90, format: "currency" },
    { key: "d30", label: "1-30", width: 90, format: "currency" },
    { key: "d60", label: "31-60", width: 90, format: "currency" },
    { key: "d90", label: "61-90", width: 90, format: "currency" },
    { key: "d90p", label: "90+", width: 90, format: "currency" },
    { key: "total", label: "Total", width: 100, format: "currency" }
  ];
  const rows = [];
  const agingPeriods = Object.keys(data).sort();
  for (const periodKey of agingPeriods) {
    const entries = data[periodKey];
    rows.push({ id: `hdr-${periodKey}`, type: "section-header", label: periodKey, cells: { label: periodKey } });
    for (const [i, e] of entries.entries()) {
      rows.push({ id: `${type}-${periodKey}-${i}`, type: "data", cells: { label: e.name, current: e.current, d30: e.days1to30, d60: e.days31to60, d90: e.days61to90, d90p: e.days90plus, total: e.total } });
    }
    if (entries.length > 0) {
      const totals = entries.reduce((acc, e) => ({ current: acc.current + e.current, d30: acc.d30 + e.days1to30, d60: acc.d60 + e.days31to60, d90: acc.d90 + e.days61to90, d90p: acc.d90p + e.days90plus, total: acc.total + e.total }), { current: 0, d30: 0, d60: 0, d90: 0, d90p: 0, total: 0 });
      rows.push({ id: `total-${periodKey}`, type: "total", cells: { label: totalLabel, ...totals } });
    }
    rows.push({ id: `sp-${periodKey}`, type: "spacer", cells: {} });
  }
  return { columns, rows, frozenColumns: 1 };
}
function buildARAgingGrid(dealData) {
  return buildAgingGrid(dealData, "ar");
}
function buildAPAgingGrid(dealData) {
  return buildAgingGrid(dealData, "ap");
}
function buildFixedAssetsGrid(dealData) {
  const columns = [
    { key: "desc", label: "Description", width: 200, frozen: true, format: "text" },
    { key: "category", label: "Category", width: 120, format: "text" },
    { key: "date", label: "Acquired", width: 100, format: "text" },
    { key: "cost", label: "Cost", width: 100, format: "currency" },
    { key: "depr", label: "Accum Depr", width: 100, format: "currency" },
    { key: "nbv", label: "Net Book Value", width: 100, format: "currency" }
  ];
  const rows = dealData.fixedAssets.map((fa, i) => ({
    id: `fa-${i}`,
    type: "data",
    cells: { desc: fa.description, category: fa.category, date: fa.acquisitionDate, cost: fa.cost, depr: fa.accumulatedDepreciation, nbv: fa.netBookValue }
  }));
  if (rows.length > 0) {
    rows.push({ id: "total", type: "total", cells: {
      desc: "Total",
      category: "",
      date: "",
      cost: dealData.fixedAssets.reduce((s, f) => s + f.cost, 0),
      depr: dealData.fixedAssets.reduce((s, f) => s + f.accumulatedDepreciation, 0),
      nbv: dealData.fixedAssets.reduce((s, f) => s + f.netBookValue, 0)
    } });
  }
  return { columns, rows, frozenColumns: 1 };
}
function buildOtherCurrentAssetsGrid(dealData) {
  const tb = dealData.trialBalance;
  const entries = getEntriesByLineItem(tb, "Other current assets");
  const bc = (fn) => bsEndingBalanceCells(dealData, fn);
  const columns = [
    { key: "label", label: "Other Current Assets", width: 280, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const ec = { acctNo: "", fsLine: "" };
  const rows = [
    { id: "hdr-reported", type: "section-header", label: "Other Current Assets - reported", cells: { label: "Other Current Assets - reported", ...ec } },
    ...entries.map((e) => ({ id: `rpt-${e.accountId}`, type: "data", indent: 1, cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, e.balances) } })),
    { id: "total-reported", type: "total", cells: { label: "Total Other Current Assets", ...ec, ...bc((p) => sumByLineItem(tb, "Other current assets", p)) } }
  ];
  return { columns, rows, frozenColumns: 3 };
}
function buildOtherCurrentLiabilitiesGrid(dealData) {
  const tb = dealData.trialBalance;
  const entries = getEntriesByLineItem(tb, "Other current liabilities");
  const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = [
    { key: "label", label: "Other Current Liabilities", width: 280, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 70, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const ec = { acctNo: "", fsLine: "" };
  const rows = [
    { id: "hdr-reported", type: "section-header", label: "Other Current Liabilities - reported", cells: { label: "Other Current Liabilities - reported", ...ec } },
    ...entries.map((e) => {
      const neg = {};
      for (const [k, v] of Object.entries(e.balances)) neg[k] = -v;
      return { id: `rpt-${e.accountId}`, type: "data", indent: 1, cells: { label: e.accountName, acctNo: e.accountId, fsLine: e.fsLineItem, ...bsEntryCells(dealData, neg) } };
    }),
    { id: "total-reported", type: "total", cells: { label: "Total Other Current Liabilities", ...ec, ...nbc((p) => sumByLineItem(tb, "Other current liabilities", p)) } }
  ];
  return { columns, rows, frozenColumns: 3 };
}
function buildTopCustomersGrid(dealData) {
  const dataKeys = Object.keys(dealData.topCustomers || {});
  const yearSet = /* @__PURE__ */ new Set();
  for (const k of dataKeys) {
    const am = k.match(/^annual-(\d{4})$/);
    if (am) {
      yearSet.add(am[1]);
      continue;
    }
    const mm = k.match(/^(\d{4})-\d{2}$/);
    if (mm) yearSet.add(mm[1]);
  }
  const years = Array.from(yearSet).sort();
  if (years.length === 0) return { columns: [], rows: [], frozenColumns: 0 };
  const columns = [{ key: "rank", label: "#", width: 30, frozen: true, format: "text" }];
  for (const yr of years) {
    columns.push(
      { key: `${yr}-name`, label: `${yr} Customer`, width: 160, format: "text" },
      { key: `${yr}-revenue`, label: "Revenue", width: 110, format: "currency" },
      { key: `${yr}-pct`, label: "% of Total", width: 80, format: "percent" }
    );
  }
  const yearMaps = {};
  for (const yr of years) {
    const customerMap = /* @__PURE__ */ new Map();
    for (const e of dealData.topCustomers[`annual-${yr}`] || []) customerMap.set(e.name, (customerMap.get(e.name) || 0) + e.revenue);
    for (let m = 1; m <= 12; m++) {
      const pid = `${yr}-${String(m).padStart(2, "0")}`;
      for (const e of dealData.topCustomers[pid] || []) customerMap.set(e.name, (customerMap.get(e.name) || 0) + e.revenue);
    }
    const sorted = Array.from(customerMap.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    yearMaps[yr] = { sorted, total: sorted.reduce((s, [, v]) => s + v, 0) };
  }
  const rows = [{ id: "hdr", type: "section-header", label: "Top Customers by Year", cells: { rank: "Top Customers by Year" } }];
  for (let i = 0; i < 10; i++) {
    const cells = { rank: `${i + 1}` };
    for (const yr of years) {
      const { sorted, total } = yearMaps[yr];
      if (i < sorted.length) {
        cells[`${yr}-name`] = sorted[i][0];
        cells[`${yr}-revenue`] = sorted[i][1];
        cells[`${yr}-pct`] = total === 0 ? NaN : sorted[i][1] / Math.abs(total);
      } else {
        cells[`${yr}-name`] = "";
        cells[`${yr}-revenue`] = null;
        cells[`${yr}-pct`] = null;
      }
    }
    rows.push({ id: `cust-${i}`, type: "data", cells });
  }
  const totalCells = { rank: "" };
  for (const yr of years) {
    totalCells[`${yr}-name`] = "Total Revenue";
    totalCells[`${yr}-revenue`] = yearMaps[yr].total;
    totalCells[`${yr}-pct`] = 1;
  }
  rows.push({ id: "total", type: "total", cells: totalCells });
  return { columns, rows, frozenColumns: 1 };
}
function buildTopVendorsGrid(dealData) {
  const dataKeys = Object.keys(dealData.topVendors || {});
  const yearSet = /* @__PURE__ */ new Set();
  for (const k of dataKeys) {
    const am = k.match(/^annual-(\d{4})$/);
    if (am) {
      yearSet.add(am[1]);
      continue;
    }
    const mm = k.match(/^(\d{4})-\d{2}$/);
    if (mm) yearSet.add(mm[1]);
  }
  const years = Array.from(yearSet).sort();
  if (years.length === 0) return { columns: [], rows: [], frozenColumns: 0 };
  const columns = [{ key: "rank", label: "#", width: 30, frozen: true, format: "text" }];
  for (const yr of years) {
    columns.push(
      { key: `${yr}-name`, label: `${yr} Vendor`, width: 160, format: "text" },
      { key: `${yr}-spend`, label: "Expenses", width: 110, format: "currency" },
      { key: `${yr}-pct`, label: "% of Total", width: 80, format: "percent" }
    );
  }
  const yearMaps = {};
  for (const yr of years) {
    const vendorMap = /* @__PURE__ */ new Map();
    for (const e of dealData.topVendors[`annual-${yr}`] || []) vendorMap.set(e.name, (vendorMap.get(e.name) || 0) + e.spend);
    for (let m = 1; m <= 12; m++) {
      const pid = `${yr}-${String(m).padStart(2, "0")}`;
      for (const e of dealData.topVendors[pid] || []) vendorMap.set(e.name, (vendorMap.get(e.name) || 0) + e.spend);
    }
    const sorted = Array.from(vendorMap.entries()).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    yearMaps[yr] = { sorted, total: sorted.reduce((s, [, v]) => s + v, 0) };
  }
  const rows = [{ id: "hdr", type: "section-header", label: "Top Vendors by Year", cells: { rank: "Top Vendors by Year" } }];
  for (let i = 0; i < 10; i++) {
    const cells = { rank: `${i + 1}` };
    for (const yr of years) {
      const { sorted, total } = yearMaps[yr];
      if (i < sorted.length) {
        cells[`${yr}-name`] = sorted[i][0];
        cells[`${yr}-spend`] = sorted[i][1];
        cells[`${yr}-pct`] = total === 0 ? NaN : sorted[i][1] / Math.abs(total);
      } else {
        cells[`${yr}-name`] = "";
        cells[`${yr}-spend`] = null;
        cells[`${yr}-pct`] = null;
      }
    }
    rows.push({ id: `vend-${i}`, type: "data", cells });
  }
  const totalCells = { rank: "" };
  for (const yr of years) {
    totalCells[`${yr}-name`] = "Total vendor purchases";
    totalCells[`${yr}-spend`] = yearMaps[yr].total;
    totalCells[`${yr}-pct`] = 1;
  }
  rows.push({ id: "total", type: "total", cells: totalCells });
  return { columns, rows, frozenColumns: 1 };
}
function buildFreeCashFlowGrid(dealData) {
  const tb = dealData.trialBalance;
  const adj = dealData.adjustments;
  const ab = dealData.addbacks;
  const pc = (fn) => periodCells(dealData, fn);
  const npc = (fn) => negatedPeriodCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "Free Cash Flow", { labelWidth: 280 });
  const calcNWCChange = (p) => {
    const { periods } = dealData.deal;
    const idx = periods.findIndex((pp) => pp.id === p);
    if (idx <= 0) return 0;
    return calcNWCExCash(tb, p) - calcNWCExCash(tb, periods[idx - 1].id);
  };
  const rows = [
    { id: "adj-ebitda", type: "data", cells: { label: "Adjusted EBITDA", ...npc((p) => calcAdjustedEBITDA(tb, adj, p, ab)) } },
    { id: "nwc-change", type: "data", cells: { label: "Change in NWC", ...pc((p) => -calcNWCChange(p)) } },
    { id: "capex", type: "data", cells: { label: "Capital Expenditures", ...pc((_) => 0) } },
    { id: "taxes", type: "data", cells: { label: "Estimated Taxes", ...pc((p) => -calcIncomeTaxExpense(tb, p, ab.taxes)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "fcf", type: "total", cells: { label: "Free Cash Flow", ...pc((p) => -calcAdjustedEBITDA(tb, adj, p, ab) - calcNWCChange(p) - calcIncomeTaxExpense(tb, p, ab.taxes)) } }
  ];
  return { columns, rows, frozenColumns: 1 };
}
function buildISBSReconciliationGrid(dealData) {
  const tb = dealData.trialBalance;
  dealData.addbacks;
  const { aggregatePeriods } = dealData.deal;
  const calcTotalOpEx = (p) => calcOpEx(tb, p) + calcPayroll(tb, p);
  const cols = [{ key: "label", label: "", width: 260, frozen: true, format: "text" }];
  for (const ap of aggregatePeriods) {
    cols.push(
      { key: `${ap.id}-ours`, label: `${ap.shortLabel} — Our Numbers`, width: 120, format: "currency" },
      { key: `${ap.id}-audited`, label: `${ap.shortLabel} — Audited`, width: 120, format: "currency" }
    );
  }
  const isAggCells = (rowFn) => {
    const c = {};
    for (const ap of aggregatePeriods) {
      const v = rowFn(ap.monthPeriodIds);
      c[`${ap.id}-ours`] = v;
      c[`${ap.id}-audited`] = v;
    }
    return c;
  };
  const bsAggCells = (rowFn) => {
    const c = {};
    for (const ap of aggregatePeriods) {
      const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1] ?? "";
      const v = lastPid ? rowFn(lastPid) : 0;
      c[`${ap.id}-ours`] = v;
      c[`${ap.id}-audited`] = v;
    }
    return c;
  };
  const rows = [
    { id: "hdr-is", type: "section-header", cells: { label: "INCOME STATEMENT" } },
    { id: "is-revenue", type: "data", indent: 1, cells: { label: "Revenue", ...isAggCells((mids) => -mids.reduce((s, p) => s + calcRevenue(tb, p), 0)) } },
    { id: "is-cogs", type: "data", indent: 1, cells: { label: "Cost of goods sold", ...isAggCells((mids) => mids.reduce((s, p) => s + calcCOGS(tb, p), 0)) } },
    { id: "is-gross-profit", type: "subtotal", cells: { label: "Gross profit", ...isAggCells((mids) => -mids.reduce((s, p) => s + calcGrossProfit(tb, p), 0)) } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "is-opex", type: "data", indent: 1, cells: { label: "Operating expenses", ...isAggCells((mids) => mids.reduce((s, p) => s + calcTotalOpEx(p), 0)) } },
    { id: "is-other-exp", type: "data", indent: 1, cells: { label: "Other expense (income)", ...isAggCells((mids) => mids.reduce((s, p) => s + calcOtherExpense(tb, p), 0)) } },
    { id: "is-net-income", type: "total", cells: { label: "Net income (loss)", ...isAggCells((mids) => -mids.reduce((s, p) => s + calcNetIncome(tb, p), 0)) } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "hdr-bs", type: "section-header", cells: { label: "BALANCE SHEET" } },
    { id: "bs-total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...bsAggCells((p) => calcTotalAssets(tb, p)) } },
    { id: "bs-total-liab", type: "subtotal", cells: { label: "Total liabilities", ...bsAggCells((p) => -calcTotalLiabilities(tb, p)) } },
    { id: "bs-equity", type: "data", indent: 1, cells: { label: "Equity", ...bsAggCells((p) => calcTotalAssets(tb, p) + calcTotalLiabilities(tb, p)) } },
    { id: "bs-total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...bsAggCells((p) => calcTotalAssets(tb, p)) } }
  ];
  return { columns: cols, rows, frozenColumns: 1 };
}
function buildISDetailedGrid(dealData) {
  const tb = dealData.trialBalance;
  const ab = dealData.addbacks;
  const adj = dealData.adjustments;
  const pc = (fn) => periodCells(dealData, fn);
  const npc = (fn) => negatedPeriodCells(dealData, fn);
  const calcTotalOpEx = (p) => calcOpEx(tb, p) + calcPayroll(tb, p);
  const columns = [
    { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const ec = { acctNo: "", fsLine: "", sub1: "" };
  const rows = [];
  const buildSection = (title, adjusted) => {
    const prefix = adjusted ? "adj-" : "rpt-";
    rows.push({ id: `${prefix}hdr`, type: "section-header", label: title, cells: { label: title, ...ec } });
    const revEntries = getEntriesByLineItem(tb, "Revenue");
    rows.push({ id: `${prefix}hdr-rev`, type: "section-header", label: "Revenue", cells: { label: "Revenue", ...ec } });
    for (const entry of revEntries) {
      const negBalances = {};
      for (const [k, v] of Object.entries(entry.balances)) negBalances[k] = -v;
      rows.push({ id: `${prefix}d-rev-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, negBalances) } });
    }
    rows.push({ id: `${prefix}sub-rev`, type: "subtotal", cells: { label: "Revenue", ...ec, ...npc((p) => calcRevenue(tb, p)) } });
    const cogsEntries = getEntriesByLineItem(tb, "Cost of Goods Sold");
    rows.push({ id: `${prefix}hdr-cogs`, type: "section-header", label: "Cost of Goods Sold", cells: { label: "Cost of Goods Sold", ...ec } });
    for (const entry of cogsEntries) {
      rows.push({ id: `${prefix}d-cogs-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) } });
    }
    rows.push({ id: `${prefix}sub-cogs`, type: "subtotal", cells: { label: "Total Cost of Goods Sold", ...ec, ...pc((p) => calcCOGS(tb, p)) } });
    rows.push({ id: `${prefix}gross-profit`, type: "total", cells: { label: "Gross Profit", ...ec, ...npc((p) => calcGrossProfit(tb, p)) } });
    const opexEntries = getEntriesByLineItem(tb, "Operating expenses");
    const payrollEntries = getEntriesByLineItem(tb, "Payroll & Related");
    rows.push({ id: `${prefix}hdr-opex`, type: "section-header", label: "Operating Expenses", cells: { label: "Operating Expenses", ...ec } });
    for (const entry of [...opexEntries, ...payrollEntries]) {
      rows.push({ id: `${prefix}d-opex-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) } });
    }
    rows.push({ id: `${prefix}sub-opex`, type: "subtotal", cells: { label: "Total Operating Expenses", ...ec, ...pc((p) => calcTotalOpEx(p)) } });
    rows.push({ id: `${prefix}op-income`, type: "total", cells: { label: "Operating Income", ...ec, ...npc((p) => calcGrossProfit(tb, p) + calcTotalOpEx(p)) } });
    const otherExpEntries = getEntriesByLineItem(tb, "Other expense (income)");
    if (otherExpEntries.length > 0) {
      rows.push({ id: `${prefix}hdr-other`, type: "section-header", label: "Other Expense (Income)", cells: { label: "Other Expense (Income)", ...ec } });
      for (const entry of otherExpEntries) {
        rows.push({ id: `${prefix}d-other-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...entryCells(dealData, entry.balances) } });
      }
      rows.push({ id: `${prefix}sub-other`, type: "subtotal", cells: { label: "Total Other Expense (Income)", ...ec, ...pc((p) => calcOtherExpense(tb, p)) } });
    }
    rows.push({ id: `${prefix}net-income`, type: "total", cells: { label: adjusted ? "Adjusted Net Income" : "Net Income (Loss)", ...ec, ...npc((p) => adjusted ? calcNetIncome(tb, p) - calcAdjustmentTotal(adj, "all", p) : calcNetIncome(tb, p)) } });
    rows.push({ id: `${prefix}hdr-ab`, type: "section-header", label: "EBITDA Addbacks", cells: { label: "EBITDA Addbacks", ...ec } });
    rows.push({ id: `${prefix}ab-int`, type: "data", indent: 1, cells: { label: "Interest expense, net", ...ec, ...pc((p) => calcInterestExpense(tb, p, ab.interest)) } });
    rows.push({ id: `${prefix}ab-tax`, type: "data", indent: 1, cells: { label: "Income taxes", ...ec, ...pc((p) => calcIncomeTaxExpense(tb, p, ab.taxes)) } });
    rows.push({ id: `${prefix}ab-dep`, type: "data", indent: 1, cells: { label: "Depreciation expense", ...ec, ...pc((p) => calcDepreciationExpense(tb, p, ab.depreciation)) } });
    rows.push({ id: `${prefix}ebitda`, type: "total", cells: { label: adjusted ? "Adjusted EBITDA" : "Reported EBITDA", ...ec, ...npc((p) => adjusted ? calcAdjustedEBITDA(tb, adj, p, ab) : calcReportedEBITDA(tb, p, ab)) } });
    rows.push({ id: `${prefix}sp-end`, type: "spacer", cells: {} });
  };
  buildSection("Summary of Reported Income Statements", false);
  rows.push({ id: "section-divider", type: "spacer", cells: {} });
  buildSection("Summary of Adjusted Income Statements", true);
  return { columns, rows, frozenColumns: 4 };
}
function buildBSDetailedGrid(dealData) {
  const tb = dealData.trialBalance;
  const bc = (fn) => bsEndingBalanceCells(dealData, fn);
  const nbc = (fn) => negatedBsEndingBalanceCells(dealData, fn);
  const columns = [
    { key: "label", label: "Account", width: 240, frozen: true, format: "text" },
    { key: "acctNo", label: "Acct #", width: 80, frozen: true, format: "text" },
    { key: "fsLine", label: "FS Line Item", width: 140, frozen: true, format: "text" },
    { key: "sub1", label: "Sub-account", width: 120, frozen: true, format: "text" },
    ...dealData.deal.aggregatePeriods.map((ap) => ({ key: ap.id, label: ap.shortLabel, width: 110, format: "currency" })),
    ...dealData.deal.periods.map((p) => ({ key: p.id, label: p.shortLabel, width: 100, format: "currency" }))
  ];
  const ec = { acctNo: "", fsLine: "", sub1: "" };
  const rows = [];
  const addAssetLineItem = (lineItem) => {
    const entries = getEntriesByLineItem(tb, lineItem);
    if (!entries.length) return;
    rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...ec } });
    for (const entry of entries) {
      rows.push({ id: `d-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...bsEntryCells(dealData, entry.balances) } });
    }
    rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...ec, ...bc((p) => sumByLineItem(tb, lineItem, p)) } });
  };
  const addLiabLineItem = (lineItem) => {
    const entries = getEntriesByLineItem(tb, lineItem);
    if (!entries.length) return;
    rows.push({ id: `hdr-${lineItem}`, type: "section-header", label: lineItem, cells: { label: lineItem, ...ec } });
    for (const entry of entries) {
      const neg = {};
      for (const [k, v] of Object.entries(entry.balances)) neg[k] = -v;
      rows.push({ id: `d-${entry.accountId}`, type: "data", indent: 1, cells: { label: entry.accountName, acctNo: entry.accountId, fsLine: entry.fsLineItem, sub1: entry.subAccount1, ...bsEntryCells(dealData, neg) } });
    }
    rows.push({ id: `sub-${lineItem}`, type: "subtotal", cells: { label: `Total ${lineItem}`, ...ec, ...nbc((p) => sumByLineItem(tb, lineItem, p)) } });
  };
  rows.push({ id: "hdr-reported", type: "section-header", label: "Summary reported balance sheets", cells: { label: "Summary reported balance sheets", ...ec } });
  for (const li of ["Cash and cash equivalents", "Accounts receivable", "Other current assets"]) addAssetLineItem(li);
  rows.push({ id: "total-ca", type: "subtotal", cells: { label: "Total Current Assets", ...ec, ...bc((p) => calcTotalCurrentAssets(tb, p)) } });
  for (const li of ["Fixed assets", "Other assets"]) addAssetLineItem(li);
  rows.push({ id: "total-assets", type: "total", cells: { label: "TOTAL ASSETS", ...ec, ...bc((p) => calcTotalAssets(tb, p)) } });
  rows.push({ id: "s-a", type: "spacer", cells: {} });
  for (const li of ["Current liabilities", "Other current liabilities"]) addLiabLineItem(li);
  rows.push({ id: "total-cl", type: "subtotal", cells: { label: "Total Current Liabilities", ...ec, ...nbc((p) => calcTotalCurrentLiabilities(tb, p)) } });
  addLiabLineItem("Long term liabilities");
  rows.push({ id: "total-liab", type: "subtotal", cells: { label: "Total Liabilities", ...ec, ...nbc((p) => calcTotalLiabilities(tb, p)) } });
  rows.push({ id: "s-l", type: "spacer", cells: {} });
  rows.push({ id: "hdr-Equity", type: "section-header", label: "Equity", cells: { label: "Equity", ...ec } });
  rows.push({ id: "d-equity-display", type: "data", indent: 1, cells: { label: "Retained Earnings / Equity", acctNo: "9200", fsLine: "Equity", sub1: "", ...bc((p) => calcTotalAssets(tb, p) + calcTotalLiabilities(tb, p)) } });
  rows.push({ id: "total-le", type: "total", cells: { label: "TOTAL LIABILITIES & EQUITY", ...ec, ...bc((p) => calcTotalAssets(tb, p)) } });
  return { columns, rows, frozenColumns: 4 };
}
function buildSupplementaryGrid(dealData) {
  const columns = [
    { key: "col0", label: "Description", width: 280, frozen: true, format: "text" },
    { key: "col1", label: "Type", width: 130, format: "text" },
    { key: "col2", label: "Balance / Payment", width: 150, format: "currency" },
    { key: "col3", label: "Rate", width: 90, format: "text" },
    { key: "col4", label: "Maturity / Expiry", width: 140, format: "text" }
  ];
  const rows = [];
  const supp = dealData.supplementary;
  rows.push({ id: "hdr-debt", type: "section-header", label: "Debt Schedule", cells: { col0: "Debt Schedule", col1: "", col2: "", col3: "", col4: "" } });
  const debtItems = supp?.debtSchedule ?? [];
  let totalDebt = 0;
  for (const [i, d] of debtItems.entries()) {
    totalDebt += d.balance;
    rows.push({ id: `debt-${i}`, type: "data", cells: { col0: d.lender, col1: d.type ?? "Term Loan", col2: d.balance, col3: `${d.interestRate.toFixed(2)}%`, col4: d.maturityDate ?? "—" } });
  }
  if (debtItems.length > 0) rows.push({ id: "debt-total", type: "subtotal", cells: { col0: "Total Debt", col1: "", col2: totalDebt, col3: "", col4: "" } });
  rows.push({ id: "sp1", type: "spacer", cells: {} });
  rows.push({ id: "hdr-lease", type: "section-header", label: "Lease Obligations", cells: { col0: "Lease Obligations", col1: "", col2: "", col3: "", col4: "" } });
  const leaseItems = supp?.leaseObligations ?? [];
  let totalLease = 0;
  for (const [i, l] of leaseItems.entries()) {
    totalLease += l.annualPayment;
    rows.push({ id: `lease-${i}`, type: "data", cells: { col0: l.description, col1: l.leaseType, col2: l.annualPayment, col3: "—", col4: l.expirationDate ?? "—" } });
  }
  if (leaseItems.length > 0) rows.push({ id: "lease-total", type: "subtotal", cells: { col0: "Total Annual Lease Payments", col1: "", col2: totalLease, col3: "", col4: "" } });
  return { columns, rows, frozenColumns: 1 };
}
function buildProofOfCashGrid(dealData, bankData) {
  const tb = dealData.trialBalance;
  const bc = (fn) => bsEndingBalanceCells(dealData, fn);
  const pc = (fn) => periodCells(dealData, fn);
  const npc = (fn) => negatedPeriodCells(dealData, fn);
  const columns = buildStandardColumns(dealData, "Proof of Cash", { labelWidth: 280 });
  const { periods, aggregatePeriods } = dealData.deal;
  const bsChange = (calcFn) => {
    const cells = {};
    for (let i = 0; i < periods.length; i++) {
      cells[periods[i].id] = calcFn(tb, periods[i].id) - (i > 0 ? calcFn(tb, periods[i - 1].id) : 0);
    }
    for (const ap of aggregatePeriods) {
      const firstPid = ap.monthPeriodIds[0];
      const lastPid = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
      const idx = periods.findIndex((pp) => pp.id === firstPid);
      cells[ap.id] = (lastPid ? calcFn(tb, lastPid) : 0) - (idx > 0 ? calcFn(tb, periods[idx - 1].id) : 0);
    }
    return cells;
  };
  const bankCells = (field) => {
    if (!bankData) return {};
    const cells = {};
    for (const p of periods) {
      cells[p.id] = bankData.bankByPeriod.get(p.id)?.[field] ?? 0;
    }
    for (const ap of aggregatePeriods) {
      if (field === "openingBalance") {
        const firstId = ap.monthPeriodIds[0];
        cells[ap.id] = firstId ? bankData.bankByPeriod.get(firstId)?.[field] ?? 0 : 0;
      } else if (field === "closingBalance") {
        const lastId = ap.monthPeriodIds[ap.monthPeriodIds.length - 1];
        cells[ap.id] = lastId ? bankData.bankByPeriod.get(lastId)?.[field] ?? 0 : 0;
      } else {
        let sum = 0;
        for (const mpid of ap.monthPeriodIds) sum += bankData.bankByPeriod.get(mpid)?.[field] ?? 0;
        cells[ap.id] = sum;
      }
    }
    return cells;
  };
  const classificationCells = (field) => {
    if (!bankData?.classifications) return {};
    const cells = {};
    for (const p of periods) {
      cells[p.id] = bankData.classifications.get(p.id)?.[field] ?? 0;
    }
    for (const ap of aggregatePeriods) {
      let sum = 0;
      for (const mpid of ap.monthPeriodIds) sum += bankData.classifications.get(mpid)?.[field] ?? 0;
      cells[ap.id] = sum;
    }
    return cells;
  };
  const totalCredits = bankCells("totalCredits");
  const totalDebits = bankCells("totalDebits");
  const interbankNet = classificationCells("interbank");
  const interbankIn = classificationCells("interbankIn");
  const interbankOut = classificationCells("interbankOut");
  const ownerOut = classificationCells("owner");
  const debtOut = classificationCells("debt_service");
  const capexOut = classificationCells("capex");
  const taxOut = classificationCells("tax_payments");
  const opReceiptsCells = {};
  for (const key of Object.keys(totalCredits)) {
    opReceiptsCells[key] = (totalCredits[key] ?? 0) - (interbankIn[key] ?? 0);
  }
  const opDisbursementsCells = {};
  for (const key of Object.keys(totalDebits)) {
    opDisbursementsCells[key] = (totalDebits[key] ?? 0) - (interbankOut[key] ?? 0) - (ownerOut[key] ?? 0) - (debtOut[key] ?? 0) - (taxOut[key] ?? 0) - (capexOut[key] ?? 0);
  }
  const revenueCells = npc((p) => calcRevenue(tb, p));
  const expensesCells = pc(
    (p) => calcCOGS(tb, p) + calcOpEx(tb, p) + calcPayroll(tb, p)
  );
  const receiptsVarianceCells = {};
  for (const key of Object.keys(revenueCells)) {
    if (key === "label") continue;
    receiptsVarianceCells[key] = revenueCells[key] - (opReceiptsCells[key] ?? 0);
  }
  const arChangeCells = bsChange((tb2, p) => sumByLineItem(tb2, "Accounts receivable", p));
  const undepChangeCells = bsChange((tb2, p) => calcUndepositedFunds(tb2, p));
  const ocaChangeCells = bsChange((tb2, p) => sumByLineItem(tb2, "Other current assets", p));
  const receiptsResidualCells = {};
  let receiptsAllTied = true;
  for (const key of Object.keys(receiptsVarianceCells)) {
    const residual = (receiptsVarianceCells[key] ?? 0) - (arChangeCells[key] ?? 0) - (undepChangeCells[key] ?? 0) - (ocaChangeCells[key] ?? 0);
    receiptsResidualCells[key] = residual;
    if (Math.abs(residual) > 0.5) receiptsAllTied = false;
  }
  const disbVarianceCells = {};
  for (const key of Object.keys(expensesCells)) {
    if (key === "label") continue;
    disbVarianceCells[key] = expensesCells[key] - (opDisbursementsCells[key] ?? 0);
  }
  const clChangeCells = bsChange((tb2, p) => calcTotalCurrentLiabilities(tb2, p));
  const negClChangeCells = {};
  for (const key of Object.keys(clChangeCells)) {
    negClChangeCells[key] = -(clChangeCells[key] ?? 0);
  }
  const daCells = pc((p) => calcDepreciationExpense(tb, p, dealData.addbacks?.depreciation));
  const otherExpCells = pc((p) => calcOtherExpense(tb, p));
  const disbResidualCells = {};
  let disbAllTied = true;
  for (const key of Object.keys(disbVarianceCells)) {
    const residual = (disbVarianceCells[key] ?? 0) - (negClChangeCells[key] ?? 0) - (daCells[key] ?? 0) - (otherExpCells[key] ?? 0);
    disbResidualCells[key] = residual;
    if (Math.abs(residual) > 0.5) disbAllTied = false;
  }
  const glEndingCells = bc((p) => sumByLineItem(tb, "Cash and cash equivalents", p));
  const bankEndingCells = bankCells("closingBalance");
  const undepEndingCells = bc((p) => calcUndepositedFunds(tb, p));
  const adjustedGlCells = {};
  for (const key of Object.keys(glEndingCells)) {
    if (key === "label") continue;
    adjustedGlCells[key] = glEndingCells[key] - undepEndingCells[key];
  }
  const legacyVarianceCells = {};
  for (const key of Object.keys(glEndingCells)) {
    if (key === "label") continue;
    const v = glEndingCells[key] - (bankEndingCells[key] ?? 0);
    legacyVarianceCells[key] = v;
  }
  const adjustedVarianceCells = {};
  let adjustedAllZero = true;
  for (const key of Object.keys(adjustedGlCells)) {
    const v = (adjustedGlCells[key] ?? 0) - (bankEndingCells[key] ?? 0);
    adjustedVarianceCells[key] = v;
    if (Math.abs(v) > 0.01) adjustedAllZero = false;
  }
  const nonOpTotalCells = {};
  const allKeys = /* @__PURE__ */ new Set([...Object.keys(interbankNet), ...Object.keys(ownerOut), ...Object.keys(debtOut), ...Object.keys(capexOut), ...Object.keys(taxOut)]);
  for (const key of allKeys) {
    nonOpTotalCells[key] = (interbankNet[key] ?? 0) + (ownerOut[key] ?? 0) + (debtOut[key] ?? 0) + (capexOut[key] ?? 0) + (taxOut[key] ?? 0);
  }
  const rows = [
    { id: "hdr-receipts-bank", type: "section-header", label: "Bank Activity — Receipts", cells: { label: "Bank Activity — Receipts" } },
    { id: "dep-total", type: "data", cells: { label: "Total Deposits (Credits)", ...totalCredits } },
    { id: "less-interbank-in", type: "data", indent: 1, cells: { label: "Less: Interbank transfers in", ...interbankIn } },
    { id: "op-receipts", type: "subtotal", cells: { label: "Operating Cash Receipts", ...opReceiptsCells } },
    { id: "s1", type: "spacer", cells: {} },
    { id: "hdr-receipts-recon", type: "section-header", label: "Receipts Reconciliation (Cash vs Accrual)", cells: { label: "Receipts Reconciliation (Cash vs Accrual)" } },
    { id: "recon-op-receipts", type: "data", cells: { label: "Operating Cash Receipts (Bank)", ...opReceiptsCells } },
    { id: "recon-revenue", type: "data", cells: { label: "Revenue per Income Statement", ...revenueCells } },
    { id: "recon-receipts-var", type: "subtotal", cells: { label: "Receipts Variance (Revenue − Receipts)", ...receiptsVarianceCells } },
    { id: "hdr-explained-r", type: "data", indent: 1, cells: { label: "Explained by:" } },
    { id: "recon-ar-change", type: "data", indent: 2, cells: { label: "Change in Accounts Receivable", ...arChangeCells } },
    { id: "recon-undep-change", type: "data", indent: 2, cells: { label: "Change in Undeposited Funds", ...undepChangeCells } },
    { id: "recon-oca-change", type: "data", indent: 2, cells: { label: "Change in Other Current Assets", ...ocaChangeCells } },
    { id: "recon-receipts-residual", type: "check", checkPassed: receiptsAllTied, cells: { label: "Receipts Residual", ...receiptsResidualCells } },
    { id: "s2", type: "spacer", cells: {} },
    { id: "hdr-disb-bank", type: "section-header", label: "Bank Activity — Disbursements", cells: { label: "Bank Activity — Disbursements" } },
    { id: "disb-total", type: "data", cells: { label: "Total Withdrawals (Debits)", ...totalDebits } },
    { id: "less-interbank-out", type: "data", indent: 1, cells: { label: "Less: Interbank transfers out", ...interbankOut } },
    { id: "less-owner", type: "data", indent: 1, cells: { label: "Less: Owner draws", ...ownerOut } },
    { id: "less-debt", type: "data", indent: 1, cells: { label: "Less: Debt service", ...debtOut } },
    { id: "less-tax", type: "data", indent: 1, cells: { label: "Less: Tax payments", ...taxOut } },
    { id: "less-capex", type: "data", indent: 1, cells: { label: "Less: Capital expenditures", ...capexOut } },
    { id: "op-disbursements", type: "subtotal", cells: { label: "Operating Cash Disbursements", ...opDisbursementsCells } },
    { id: "s3", type: "spacer", cells: {} },
    { id: "hdr-disb-recon", type: "section-header", label: "Disbursements Reconciliation (Cash vs Accrual)", cells: { label: "Disbursements Reconciliation (Cash vs Accrual)" } },
    { id: "recon-op-disb", type: "data", cells: { label: "Operating Cash Disbursements (Bank)", ...opDisbursementsCells } },
    { id: "recon-expenses", type: "data", cells: { label: "Expenses per Income Statement", ...expensesCells } },
    { id: "recon-disb-var", type: "subtotal", cells: { label: "Disbursements Variance (Expenses − Disbursements)", ...disbVarianceCells } },
    { id: "hdr-explained-d", type: "data", indent: 1, cells: { label: "Explained by:" } },
    { id: "recon-ap-change", type: "data", indent: 2, cells: { label: "Change in Current Liabilities (AP)", ...negClChangeCells } },
    { id: "recon-da", type: "data", indent: 2, cells: { label: "Depreciation & Amortization (non-cash)", ...daCells } },
    { id: "recon-other-exp", type: "data", indent: 2, cells: { label: "Other Income / Non-operating Items", ...otherExpCells } },
    { id: "recon-disb-residual", type: "check", checkPassed: disbAllTied, cells: { label: "Disbursements Residual", ...disbResidualCells } },
    { id: "s4", type: "spacer", cells: {} },
    { id: "hdr-nonop", type: "section-header", label: "Non-Operating Flows (Reference)", cells: { label: "Non-Operating Flows (Reference)" } },
    { id: "nonop-interbank", type: "data", indent: 1, cells: { label: "Interbank transfers (net)", ...interbankNet } },
    { id: "nonop-owner", type: "data", indent: 1, cells: { label: "Owner draws", ...ownerOut } },
    { id: "nonop-debt", type: "data", indent: 1, cells: { label: "Debt service", ...debtOut } },
    { id: "nonop-tax", type: "data", indent: 1, cells: { label: "Tax payments", ...taxOut } },
    { id: "nonop-capex", type: "data", indent: 1, cells: { label: "Capital expenditures", ...capexOut } },
    { id: "nonop-total", type: "subtotal", cells: { label: "Total non-operating flows", ...nonOpTotalCells } },
    { id: "s5", type: "spacer", cells: {} },
    { id: "hdr-legacy", type: "section-header", label: "GL vs Bank Variance", cells: { label: "GL vs Bank Variance" } },
    { id: "gl-ending", type: "data", cells: { label: "GL Ending Cash", ...glEndingCells } },
    { id: "less-undep-bal", type: "data", indent: 1, cells: { label: "Less: Undeposited Funds Balance", ...undepEndingCells } },
    { id: "adjusted-gl", type: "subtotal", cells: { label: "Adjusted GL Cash", ...adjustedGlCells } },
    { id: "bank-ending-var", type: "data", cells: { label: "Bank Ending Balance", ...bankEndingCells } },
    { id: "legacy-variance", type: "data", cells: { label: "Unadjusted Variance (GL − Bank)", ...legacyVarianceCells } },
    { id: "adjusted-variance", type: "check", checkPassed: adjustedAllZero, cells: { label: "Adjusted Variance", ...adjustedVarianceCells } },
    { id: "net-income", type: "data", cells: { label: "Net Income per IS", ...npc((p) => calcNetIncome(tb, p)) } }
  ];
  return { columns, rows, frozenColumns: 1 };
}
const TAB_GRID_BUILDERS = {
  "setup": buildSetupGrid,
  "trial-balance": buildTrialBalanceGrid,
  "qoe-analysis": buildQoEAnalysisGrid,
  "is-bs-reconciliation": buildISBSReconciliationGrid,
  "dd-adjustments-1": (d) => buildDDAdjustmentsGrid(d, 1),
  "dd-adjustments-2": (d) => buildDDAdjustmentsGrid(d, 2),
  "income-statement": buildIncomeStatementGrid,
  "is-detailed": buildISDetailedGrid,
  "balance-sheet": buildBalanceSheetGrid,
  "bs-detailed": buildBSDetailedGrid,
  "sales": buildSalesGrid,
  "cogs": buildCOGSGrid,
  "opex": buildOpExGrid,
  "other-expense": buildOtherExpenseGrid,
  "payroll": buildPayrollGrid,
  "working-capital": buildWorkingCapitalGrid,
  "nwc-analysis": buildNWCAnalysisGrid,
  "cash": buildCashGrid,
  "ar-aging": buildARAgingGrid,
  "other-current-assets": buildOtherCurrentAssetsGrid,
  "fixed-assets": buildFixedAssetsGrid,
  "ap-aging": buildAPAgingGrid,
  "other-current-liabilities": buildOtherCurrentLiabilitiesGrid,
  "supplementary": buildSupplementaryGrid,
  "top-customers": buildTopCustomersGrid,
  "top-vendors": buildTopVendorsGrid,
  "proof-of-cash": buildProofOfCashGrid,
  "free-cash-flow": buildFreeCashFlowGrid,
  "disclaimer": () => buildDisclaimerGrid(),
  "wip-schedule": buildWIPScheduleGrid
  // "data-sources" is handled specially in exportWorkbookXlsx (needs async doc fetch)
};
const INDUSTRIES = [
  // Professional & Knowledge-Based Services (9)
  { id: "professional_services", label: "Professional Services", category: "professional" },
  { id: "consulting", label: "Consulting & Advisory", category: "professional" },
  { id: "accounting", label: "Accounting & Tax Services", category: "professional" },
  { id: "legal", label: "Legal Services", category: "professional" },
  { id: "marketing", label: "Marketing, Advertising & Creative", category: "professional" },
  { id: "it_services", label: "IT Services & Managed Services", category: "professional" },
  { id: "staffing", label: "Staffing & Recruiting", category: "professional" },
  { id: "engineering", label: "Engineering Services", category: "professional" },
  { id: "architecture", label: "Architecture & Design", category: "professional" },
  // Healthcare & Regulated Care (7)
  { id: "medical_practices", label: "Medical Practices & Clinics", category: "healthcare" },
  { id: "dental", label: "Dental Practices", category: "healthcare" },
  { id: "behavioral_health", label: "Behavioral Health", category: "healthcare" },
  { id: "home_health", label: "Home Health & Hospice", category: "healthcare" },
  { id: "veterinary", label: "Veterinary Services", category: "healthcare" },
  { id: "medical_devices", label: "Medical Devices & Diagnostics", category: "healthcare" },
  { id: "life_sciences", label: "Life Sciences & Biotech", category: "healthcare" },
  // Construction, Trades & Field Services (9)
  { id: "commercial_construction", label: "Commercial Construction", category: "construction_property" },
  { id: "residential_construction", label: "Residential Construction", category: "construction_property" },
  { id: "specialty_trades", label: "Specialty Trades", category: "construction_property" },
  { id: "landscaping", label: "Landscaping & Grounds Maintenance", category: "construction_property" },
  { id: "facilities", label: "Facilities Maintenance", category: "construction_property" },
  { id: "janitorial", label: "Janitorial & Cleaning Services", category: "construction_property" },
  { id: "restoration", label: "Restoration & Remediation Services", category: "construction_property" },
  { id: "security", label: "Security & Alarm Services", category: "construction_property" },
  { id: "pest_control", label: "Pest Control Services", category: "construction_property" },
  // Manufacturing & Industrial (6)
  { id: "manufacturing", label: "Manufacturing", category: "manufacturing" },
  { id: "precision_manufacturing", label: "Precision Manufacturing", category: "manufacturing" },
  { id: "food_beverage_manufacturing", label: "Food & Beverage Manufacturing", category: "manufacturing" },
  { id: "packaging", label: "Packaging & Materials", category: "manufacturing" },
  { id: "industrial_equipment", label: "Industrial Equipment & Machinery", category: "manufacturing" },
  { id: "contract_manufacturing", label: "Contract Manufacturing", category: "manufacturing" },
  // Technology & Digital (6)
  { id: "saas", label: "Software & SaaS", category: "technology" },
  { id: "vertical_saas", label: "Vertical SaaS", category: "technology" },
  { id: "it_hardware", label: "IT Products & Hardware", category: "technology" },
  { id: "ecommerce", label: "E-Commerce & Online Retail", category: "technology" },
  { id: "digital_media", label: "Digital Media & Platforms", category: "technology" },
  { id: "telecom", label: "Telecommunications & Infrastructure", category: "technology" },
  // Distribution, Logistics & Transportation (4)
  { id: "wholesale_distribution", label: "Wholesale Distribution", category: "distribution" },
  { id: "transportation", label: "Transportation & Logistics", category: "distribution" },
  { id: "warehousing", label: "Warehousing & Fulfillment", category: "distribution" },
  { id: "route_distribution", label: "Route-Based Distribution", category: "distribution" },
  // Consumer, Retail & Hospitality (6)
  { id: "retail", label: "Retail Trade", category: "consumer" },
  { id: "restaurants", label: "Restaurants & Food Service", category: "consumer" },
  { id: "hospitality", label: "Hospitality & Lodging", category: "consumer" },
  { id: "franchise", label: "Franchise Operations", category: "consumer" },
  { id: "personal_services", label: "Personal Services", category: "consumer" },
  { id: "automotive", label: "Automotive Sales & Service", category: "consumer" },
  // Financial, Insurance & Real Estate (4)
  { id: "wealth_management", label: "Financial Advisory & Wealth Management", category: "financial_realestate" },
  { id: "insurance", label: "Insurance Agencies & Brokerages", category: "financial_realestate" },
  { id: "real_estate_brokerage", label: "Real Estate Brokerage", category: "financial_realestate" },
  { id: "property_management", label: "Property Management", category: "financial_realestate" },
  // Energy, Environmental & Infrastructure (3)
  { id: "energy", label: "Energy Services", category: "energy" },
  { id: "clean_energy", label: "Clean Energy & Environmental Services", category: "energy" },
  { id: "utilities", label: "Utilities & Infrastructure Services", category: "energy" },
  // Agriculture, Education & Other (5)
  { id: "agriculture", label: "Agriculture & Agribusiness", category: "other" },
  { id: "education", label: "Education & Training", category: "other" },
  { id: "media", label: "Media & Content Production", category: "other" },
  { id: "nonprofit", label: "Nonprofit & Social Services", category: "other" },
  { id: "other", label: "Other", category: "other" }
];
const CATEGORY_DEFAULTS = {
  professional: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low"
  },
  healthcare: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium"
  },
  construction_property: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "high"
  },
  manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "low",
    seasonality: "low",
    workingCapitalIntensity: "high"
  },
  technology: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low"
  },
  distribution: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high"
  },
  consumer: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "medium"
  },
  financial_realestate: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low"
  },
  energy: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium"
  },
  other: {
    laborIntensity: "unknown",
    revenueRecurrence: "unknown",
    seasonality: "unknown",
    workingCapitalIntensity: "unknown"
  }
};
const INDUSTRY_TRAITS = {
  // ===== Field Services - High labor, often seasonal =====
  landscaping: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "high",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 8, median: 15, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Seasonal revenue concentration",
      "Owner labor normalization",
      "Subcontractor reclassification",
      "Equipment maintenance timing"
    ]
  },
  janitorial: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 6, median: 12, high: 18, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Employee vs contractor classification",
      "Customer concentration",
      "Equipment/supply cost timing",
      "Multi-location overhead allocation"
    ]
  },
  pest_control: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "medium",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 10, median: 18, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Recurring vs one-time revenue mix",
      "Route density economics",
      "Chemical costs and timing",
      "Customer acquisition costs"
    ]
  },
  security: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 12, median: 20, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "RMR vs installation revenue",
      "Attrition rate",
      "Deferred revenue treatment",
      "Equipment capitalization"
    ]
  },
  facilities: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 8, median: 14, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Contract profitability by site",
      "Labor cost allocation",
      "Subcontractor margins",
      "Customer concentration"
    ]
  },
  restoration: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 10, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Revenue recognition timing",
      "Insurance receivable collectibility",
      "Project margin variability",
      "Equipment utilization"
    ]
  },
  // ===== Technology - Low labor, high recurring =====
  saas: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 25, high: 40, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Deferred revenue treatment",
      "Capitalized R&D policy",
      "Stock compensation addbacks",
      "Customer churn and cohort analysis",
      "ARR vs recognized revenue"
    ]
  },
  vertical_saas: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 18, median: 28, high: 45, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Implementation revenue recognition",
      "Module upsell sustainability",
      "Niche market concentration",
      "Customer lifetime value"
    ]
  },
  it_services: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 12, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Managed services vs project revenue",
      "Technician utilization",
      "Hardware resale margins",
      "Customer concentration"
    ]
  },
  ecommerce: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 5, median: 12, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Platform fee normalization",
      "Inventory obsolescence",
      "Returns reserve adequacy",
      "Customer acquisition costs",
      "Fulfillment cost trends"
    ]
  },
  // ===== Healthcare - Medium labor, regulated =====
  dental: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 20, median: 30, high: 40, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Provider compensation normalization",
      "Hygienist productivity metrics",
      "Insurance reimbursement trends",
      "Lab fees as % of production"
    ]
  },
  medical_practices: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 15, median: 25, high: 35, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Physician compensation normalization",
      "Payer mix and reimbursement",
      "Ancillary revenue sustainability",
      "Staff-to-provider ratios"
    ]
  },
  home_health: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Medicare rate changes",
      "Census volatility",
      "Caregiver turnover costs",
      "Billing and collection timing"
    ]
  },
  behavioral_health: {
    laborIntensity: "high",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 10, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Clinician compensation models",
      "Payer mix and authorization",
      "Utilization and no-show rates",
      "Regulatory compliance costs"
    ]
  },
  veterinary: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 22, high: 32, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Veterinarian compensation normalization",
      "Pharmacy revenue sustainability",
      "Referral vs primary care mix",
      "Emergency services profitability"
    ]
  },
  // ===== Construction & Trades - Project-based, WC intensive =====
  commercial_construction: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 4, median: 8, high: 14, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Percentage of completion vs completed contract",
      "Backlog quality and profitability",
      "Bonding capacity and limits",
      "Change order timing and recognition",
      "Retainage and billing timing",
      "WIP/over-under billing analysis",
      "Job margin outlier detection",
      "Stale WIP identification"
    ]
  },
  residential_construction: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 6, median: 12, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Spec vs contract home mix",
      "Land and lot inventory",
      "Warranty reserve adequacy",
      "Subcontractor cost trends",
      "WIP/over-under billing analysis",
      "Job margin outlier detection",
      "Stale WIP identification"
    ]
  },
  specialty_trades: {
    laborIntensity: "high",
    revenueRecurrence: "medium",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Service vs project revenue mix",
      "Warranty reserves",
      "Material cost volatility",
      "Technician productivity",
      "WIP/over-under billing analysis"
    ]
  },
  // ===== Consumer & Hospitality =====
  restaurants: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 5, median: 10, high: 18, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Four-wall EBITDA vs consolidated",
      "Labor cost normalization",
      "Lease treatment and rent escalations",
      "Food cost trends",
      "Delivery platform fees"
    ]
  },
  hospitality: {
    laborIntensity: "high",
    revenueRecurrence: "low",
    seasonality: "high",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 28, high: 40, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "RevPAR and ADR trends",
      "Seasonality normalization",
      "Management fee treatment",
      "FF&E reserves",
      "OTA commission rates"
    ]
  },
  personal_services: {
    laborIntensity: "high",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 10, median: 18, high: 28, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Stylist/technician compensation",
      "Booth rental vs employee model",
      "Product revenue sustainability",
      "Location profitability"
    ]
  },
  franchise: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 15, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Royalty and advertising fund treatment",
      "Franchise agreement terms",
      "Unit-level economics",
      "Development pipeline sustainability"
    ]
  },
  automotive: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 3, median: 5, high: 8, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "New vs used vehicle margins",
      "F&I income sustainability",
      "Parts and service profitability",
      "Floorplan interest treatment"
    ]
  },
  // ===== Distribution & Logistics =====
  wholesale_distribution: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 3, median: 6, high: 10, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Inventory obsolescence",
      "Vendor rebate timing and treatment",
      "Customer concentration",
      "Freight cost trends",
      "LIFO reserve"
    ]
  },
  transportation: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 6, median: 12, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Asset-based vs asset-light model",
      "Driver compensation and turnover",
      "Fuel cost normalization",
      "Equipment age and replacement"
    ]
  },
  route_distribution: {
    laborIntensity: "high",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Route density economics",
      "Driver compensation models",
      "Customer acquisition costs",
      "Vehicle and equipment timing"
    ]
  },
  // ===== Manufacturing =====
  manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "low",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 8, median: 14, high: 22, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Inventory costing method (FIFO/LIFO)",
      "Capacity utilization",
      "Customer concentration",
      "Raw material hedging",
      "Standard cost variance analysis"
    ]
  },
  food_beverage_manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "medium",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 6, median: 12, high: 20, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Commodity cost volatility",
      "Co-packer relationships",
      "Trade spend normalization",
      "Spoilage reserves",
      "Recall risk"
    ]
  },
  precision_manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "low",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 10, median: 16, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Program/contract dependency",
      "Scrap and rework rates",
      "Quality certification costs",
      "Equipment depreciation methods"
    ]
  },
  contract_manufacturing: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "medium",
    typicalEbitdaMargin: { low: 6, median: 10, high: 16, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Customer concentration",
      "Consignment inventory treatment",
      "Tooling ownership and depreciation",
      "Excess and obsolete reserves"
    ]
  },
  // ===== Professional Services =====
  professional_services: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 15, median: 22, high: 32, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Partner/owner compensation normalization",
      "Utilization and realization rates",
      "WIP and billing timing",
      "Key person dependency"
    ]
  },
  consulting: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 18, median: 28, high: 40, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Principal compensation normalization",
      "Project vs retainer revenue mix",
      "Subcontractor pass-through",
      "Client concentration"
    ]
  },
  accounting: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "high",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 25, median: 35, high: 48, source: "internal_v1", confidence: "high" },
    qoeRiskFactors: [
      "Partner compensation normalization",
      "Seasonal revenue concentration",
      "Staff-to-partner leverage",
      "Billing rate sustainability"
    ]
  },
  legal: {
    laborIntensity: "medium",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 20, median: 32, high: 45, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Partner compensation normalization",
      "Contingency fee timing",
      "WIP and unbilled time",
      "Rainmaker dependency"
    ]
  },
  staffing: {
    laborIntensity: "low",
    revenueRecurrence: "medium",
    seasonality: "low",
    workingCapitalIntensity: "high",
    typicalEbitdaMargin: { low: 3, median: 6, high: 12, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Gross profit per FTE",
      "Temp vs perm placement mix",
      "Payroll funding and timing",
      "Client concentration",
      "Bill rate sustainability"
    ]
  },
  // ===== Financial & Real Estate =====
  wealth_management: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 25, median: 38, high: 55, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "AUM-based vs transaction revenue",
      "Advisor compensation and retention",
      "Client concentration",
      "Regulatory compliance costs"
    ]
  },
  insurance: {
    laborIntensity: "low",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 18, median: 28, high: 40, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Commission vs fee revenue",
      "Contingent commission timing",
      "Retention rates",
      "Producer compensation"
    ]
  },
  property_management: {
    laborIntensity: "medium",
    revenueRecurrence: "high",
    seasonality: "low",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 12, median: 20, high: 30, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Management fee structure",
      "Ancillary revenue sustainability",
      "Contract terms and churn",
      "Unit count growth trends"
    ]
  },
  real_estate_brokerage: {
    laborIntensity: "low",
    revenueRecurrence: "low",
    seasonality: "medium",
    workingCapitalIntensity: "low",
    typicalEbitdaMargin: { low: 8, median: 15, high: 25, source: "internal_v1", confidence: "medium" },
    qoeRiskFactors: [
      "Commission split structures",
      "Agent retention and productivity",
      "Market cycle sensitivity",
      "Transaction volume trends"
    ]
  }
};
function inferCategory(input) {
  const lower = input.toLowerCase();
  if (/software|saas|tech|digital|app|platform/.test(lower)) return "technology";
  if (/construct|build|trade|hvac|plumb|electr|roof|landscap|clean|maint|restoration/.test(lower)) return "construction_property";
  if (/health|medical|dental|clinic|hospital|care|vet|hospice/.test(lower)) return "healthcare";
  if (/manufactur|industrial|factory|production|packaging/.test(lower)) return "manufacturing";
  if (/distribut|wholesale|logistics|transport|freight|warehous/.test(lower)) return "distribution";
  if (/restaurant|retail|hotel|hospitality|food|franchise|salon|spa/.test(lower)) return "consumer";
  if (/consult|legal|account|law|advisory|market|staffing|recruit/.test(lower)) return "professional";
  if (/insur|financ|bank|wealth|real estate|property|brokerage/.test(lower)) return "financial_realestate";
  if (/energy|oil|gas|solar|wind|power|utility/.test(lower)) return "energy";
  return "other";
}
function resolveIndustry(input) {
  if (!input) {
    return { id: null, label: "", category: "other", confidence: "custom" };
  }
  const exact = INDUSTRIES.find((i) => i.label === input);
  if (exact) {
    return { id: exact.id, label: exact.label, category: exact.category, confidence: "exact" };
  }
  const normalized = input.toLowerCase().trim();
  const fuzzy = INDUSTRIES.find((i) => i.label.toLowerCase().trim() === normalized);
  if (fuzzy) {
    return { id: fuzzy.id, label: input, category: fuzzy.category, confidence: "fuzzy" };
  }
  return { id: null, label: input, category: inferCategory(input), confidence: "custom" };
}
function getIndustryTraits(industryInput) {
  const resolved = resolveIndustry(industryInput);
  if (resolved.id && INDUSTRY_TRAITS[resolved.id]) {
    return INDUSTRY_TRAITS[resolved.id];
  }
  return CATEGORY_DEFAULTS[resolved.category];
}
function getIndustryContext(industryInput) {
  const resolved = resolveIndustry(industryInput);
  const traits = getIndustryTraits(industryInput);
  const traitsJson = JSON.stringify({
    industry: resolved.label,
    industryId: resolved.id,
    category: resolved.category,
    confidence: resolved.confidence,
    traits: {
      laborIntensity: traits.laborIntensity,
      seasonality: traits.seasonality,
      revenueRecurrence: traits.revenueRecurrence,
      workingCapitalIntensity: traits.workingCapitalIntensity,
      ebitdaRange: traits.typicalEbitdaMargin ? `${traits.typicalEbitdaMargin.low}-${traits.typicalEbitdaMargin.high}%` : null
    }
  });
  const parts = [`Industry: ${resolved.label}`];
  if (resolved.confidence === "custom") {
    parts.push(`(Custom industry, inferred category: ${resolved.category})`);
  }
  if (traits.laborIntensity === "high") {
    parts.push("- High labor intensity: Watch for owner compensation normalization");
  }
  if (traits.seasonality === "high") {
    parts.push("- Seasonal business: Analyze revenue by month, normalize working capital");
  }
  if (traits.workingCapitalIntensity === "high") {
    parts.push("- Working capital intensive: Focus on inventory, AR/AP trends");
  }
  if (traits.revenueRecurrence === "high") {
    parts.push("- Recurring revenue: Analyze churn, retention metrics");
  } else if (traits.revenueRecurrence === "low") {
    parts.push("- Project/transaction-based: Focus on backlog, pipeline, concentration");
  }
  if (traits.qoeRiskFactors?.length) {
    parts.push(`- Key QoE risks: ${traits.qoeRiskFactors.join(", ")}`);
  }
  if (traits.typicalEbitdaMargin) {
    const conf = traits.typicalEbitdaMargin.confidence || "medium";
    parts.push(`- EBITDA range: ${traits.typicalEbitdaMargin.low}%-${traits.typicalEbitdaMargin.high}% (${conf} confidence)`);
  }
  return {
    traitsJson,
    narrative: parts.join("\n")
  };
}
function getIndustryLabels() {
  return INDUSTRIES.map((i) => i.label);
}
function assessEbitdaMargin(industryInput, margin) {
  const traits = getIndustryTraits(industryInput);
  if (!traits.typicalEbitdaMargin) {
    const assessment2 = margin > 15 ? "above" : margin > 10 ? "within" : "below";
    return { assessment: assessment2, rangeText: "vs general benchmarks", confidence: "low" };
  }
  const { low, high, confidence = "medium" } = traits.typicalEbitdaMargin;
  const assessment = margin < low ? "below" : margin > high ? "above" : "within";
  const rangeText = `industry range: ${low}%-${high}%`;
  return { assessment, rangeText, confidence };
}
function useChatHistory({
  projectId,
  contextType,
  limit = 50
}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState(null);
  const [sessionUserId, setSessionUserId] = useState(null);
  const fetchSeqRef = useRef(0);
  const isMountedRef = useRef(true);
  const cachedUserIdRef = useRef(null);
  const fetchHistory = useCallback(async (userId, seq) => {
    if (!projectId || !userId) {
      if (isMountedRef.current) {
        setMessages([]);
        setIsLoading(false);
      }
      return;
    }
    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const { data, error: fetchError } = await supabase.from("chat_messages").select("id, role, content, created_at").eq("project_id", projectId).eq("context_type", contextType).order("created_at", { ascending: true }).limit(limit);
      if (seq !== fetchSeqRef.current || !isMountedRef.current) return;
      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      if (seq === fetchSeqRef.current && isMountedRef.current) {
        console.error("Error fetching chat history:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setMessages([]);
      }
    } finally {
      if (seq === fetchSeqRef.current && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [projectId, contextType, limit]);
  useEffect(() => {
    isMountedRef.current = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMountedRef.current) return;
        const userId = session?.user?.id || null;
        cachedUserIdRef.current = userId;
        setSessionUserId(userId);
        setIsAuthReady(true);
        const seq = ++fetchSeqRef.current;
        fetchHistory(userId, seq);
      }
    );
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;
        const userId = session?.user?.id || null;
        cachedUserIdRef.current = userId;
        setSessionUserId(userId);
        setIsAuthReady(true);
        if (fetchSeqRef.current === 0) {
          const seq = ++fetchSeqRef.current;
          fetchHistory(userId, seq);
        }
      } catch (err) {
        console.error("Error getting session:", err);
        if (isMountedRef.current) {
          setIsAuthReady(true);
          setIsLoading(false);
        }
      }
    };
    initSession();
    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (isAuthReady && sessionUserId) {
      const seq = ++fetchSeqRef.current;
      fetchHistory(sessionUserId, seq);
    } else if (isAuthReady && !sessionUserId) {
      setMessages([]);
      setIsLoading(false);
    }
  }, [projectId, contextType, isAuthReady, sessionUserId, fetchHistory]);
  const saveMessages = useCallback(async (userContent, assistantContent) => {
    if (!projectId || !userContent || !assistantContent) return;
    const userId = cachedUserIdRef.current;
    if (!userId) {
      console.warn("Cannot save chat: no authenticated user");
      return;
    }
    try {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const messagesToSave = [
        {
          project_id: projectId,
          user_id: userId,
          role: "user",
          content: userContent,
          context_type: contextType,
          created_at: now
        },
        {
          project_id: projectId,
          user_id: userId,
          role: "assistant",
          content: assistantContent,
          context_type: contextType,
          created_at: new Date(Date.now() + 1).toISOString()
        }
      ];
      const { error: insertError } = await supabase.from("chat_messages").insert(messagesToSave);
      if (insertError) {
        console.error("Failed to save chat messages:", insertError.message);
      }
    } catch (err) {
      console.error("Error saving chat messages:", err);
    }
  }, [projectId, contextType]);
  const clearHistory = useCallback(async () => {
    if (!projectId) return false;
    const userId = cachedUserIdRef.current;
    if (!userId) {
      console.error("Cannot clear chat: no authenticated user");
      return false;
    }
    try {
      const { error: deleteError, count: deletedCount } = await supabase.from("chat_messages").delete({ count: "exact" }).eq("project_id", projectId).eq("context_type", contextType).eq("user_id", userId);
      if (deleteError) {
        console.error("Error clearing chat history:", deleteError.message);
        return false;
      }
      console.log(`[useChatHistory] Deleted ${deletedCount} messages`);
      ++fetchSeqRef.current;
      setMessages([]);
      return true;
    } catch (err) {
      console.error("Error clearing chat history:", err);
      return false;
    }
  }, [projectId, contextType]);
  const oldestMessageDate = messages.length > 0 ? new Date(messages[0].created_at) : null;
  return {
    messages,
    isLoading,
    isAuthReady,
    error,
    saveMessages,
    clearHistory,
    hasHistory: messages.length > 0,
    oldestMessageDate
  };
}
function sanitizeWizardData(wizardData) {
  if (!wizardData || typeof wizardData !== "object") return wizardData;
  const sanitized = { ...wizardData };
  if (sanitized.trialBalance?.accounts?.length > 50) {
    sanitized.trialBalance = {
      ...sanitized.trialBalance,
      accounts: sanitized.trialBalance.accounts.slice(0, 50),
      _truncated: true,
      _totalAccounts: sanitized.trialBalance.accounts.length
    };
  }
  if (Array.isArray(sanitized.chartOfAccounts) && sanitized.chartOfAccounts.length > 50) {
    const total = sanitized.chartOfAccounts.length;
    sanitized.chartOfAccounts = sanitized.chartOfAccounts.slice(0, 50);
    sanitized._chartOfAccountsTruncated = true;
    sanitized._chartOfAccountsTotal = total;
  }
  if (sanitized.generalLedger) {
    sanitized.generalLedger = void 0;
  }
  if (sanitized.arAging) {
    const entries = sanitized.arAging.entries || sanitized.arAging.customers;
    if (Array.isArray(entries) && entries.length > 20) {
      sanitized.arAging = {
        ...sanitized.arAging,
        ...sanitized.arAging.entries ? { entries: entries.slice(0, 20) } : { customers: entries.slice(0, 20) },
        _truncated: true,
        _totalEntries: entries.length
      };
    }
  }
  if (sanitized.apAging) {
    const entries = sanitized.apAging.entries || sanitized.apAging.vendors;
    if (Array.isArray(entries) && entries.length > 20) {
      sanitized.apAging = {
        ...sanitized.apAging,
        ...sanitized.apAging.entries ? { entries: entries.slice(0, 20) } : { vendors: entries.slice(0, 20) },
        _truncated: true,
        _totalEntries: entries.length
      };
    }
  }
  return sanitized;
}
export {
  reclassAwareAdjustedEBITDA as $,
  buildBSDetailedGrid as A,
  buildBalanceSheetGrid as B,
  buildISDetailedGrid as C,
  buildIncomeStatementGrid as D,
  gridDataToRawData as E,
  calcRevenue as F,
  calcGrossProfit as G,
  calcNetIncome as H,
  calcReportedEBITDA as I,
  calcAdjustedEBITDA as J,
  sumReclassImpact as K,
  computeWIPAggregates as L,
  computeSign as M,
  sumByLineItem as N,
  calcNWCExCash as O,
  assessEbitdaMargin as P,
  derivePriorBalances as Q,
  buildProofOfCashGrid as R,
  INDUSTRIES as S,
  TAB_GRID_BUILDERS as T,
  getIndustryLabels as U,
  getProofHint as V,
  isITDAAnchor as W,
  INTENT_TO_SIGN as X,
  INTENT_LABELS as Y,
  getTemplateById as Z,
  TEMPLATES_BY_TYPE as _,
  buildTbIndex as a,
  calcNetWorkingCapital as a0,
  calcTotalCurrentAssets as a1,
  calcTotalCurrentLiabilities as a2,
  reclassAwareOtherExpense as a3,
  reclassAwareRevenue as a4,
  reclassAwareOpEx as a5,
  reclassAwareOperatingIncome as a6,
  reclassAwareCOGS as a7,
  reclassAwareGrossProfit as a8,
  getSubAccounts as a9,
  reclassAwareRevenueRaw as aA,
  calcRevenueAdjustments as aB,
  calcCOGSAdjustments as aC,
  buildStandardColumns as aD,
  sumByFsType as aE,
  getEntriesByLineItem as aF,
  entryCells as aG,
  bsEndingBalanceCells as aH,
  negatedBsEndingBalanceCells as aI,
  bsEntryCells as aJ,
  buildBreakdownGrid as aK,
  calcUndepositedFunds as aL,
  bsCheckPasses as aa,
  calcTotalAssets as ab,
  calcTotalLiabilitiesAndEquity as ac,
  calcTotalLiabilities as ad,
  calcTotalEquity as ae,
  reclassAwareNetIncome as af,
  reclassAwareReportedEBITDA as ag,
  calcIncomeTaxExpense as ah,
  sumByLineItemWithReclass as ai,
  calcCOGS as aj,
  calcOpEx as ak,
  calcPayroll as al,
  calcOtherExpense as am,
  calcDepreciationExpense as an,
  matchesCategory as ao,
  resolveLabel as ap,
  calcOperatingIncome as aq,
  calcEBITDA as ar,
  calcInterestExpense as as,
  buildDDAdjustmentsGrid as at,
  formatCell as au,
  adjustmentCells as av,
  negatedPeriodCells as aw,
  periodCells as ax,
  marginCells as ay,
  calcAdjustmentTotal as az,
  buildAggregatePeriods as b,
  getIndustryContext as c,
  buildTopVendorsGrid as d,
  buildTopCustomersGrid as e,
  buildFixedAssetsGrid as f,
  groupByFiscalYear as g,
  buildAPAgingGrid as h,
  buildARAgingGrid as i,
  buildPayrollGrid as j,
  buildISBSReconciliationGrid as k,
  loadDealDataWithPriorBalances as l,
  buildFreeCashFlowGrid as m,
  buildOtherCurrentLiabilitiesGrid as n,
  buildOtherCurrentAssetsGrid as o,
  projectToDealData as p,
  buildCashGrid as q,
  buildNWCAnalysisGrid as r,
  sanitizeWizardData as s,
  buildWorkingCapitalGrid as t,
  useChatHistory as u,
  buildQoEAnalysisGrid as v,
  buildOtherExpenseGrid as w,
  buildOpExGrid as x,
  buildCOGSGrid as y,
  buildSalesGrid as z
};
