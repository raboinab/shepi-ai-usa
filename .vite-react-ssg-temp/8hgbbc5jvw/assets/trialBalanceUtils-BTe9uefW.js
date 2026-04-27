function createEmptyAccount() {
  return {
    id: crypto.randomUUID(),
    fsType: "BS",
    accountNumber: "",
    accountName: "",
    accountType: "",
    accountSubtype: "",
    monthlyValues: {}
  };
}
function calculateBalanceCheck(accounts, periodId) {
  let bsTotal = 0;
  let isTotal = 0;
  accounts.forEach((account) => {
    const value = account.monthlyValues[periodId] || 0;
    if (account.fsType === "BS") {
      bsTotal += value;
    } else {
      isTotal += value;
    }
  });
  const cniTotal = -isTotal;
  const checkTotal = bsTotal + isTotal;
  return { bsTotal, isTotal, cniTotal, checkTotal };
}
function formatCurrency(value) {
  if (value === 0) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}
function parseCurrencyInput(input) {
  const cleaned = input.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
function deriveEndDateFromMonthYear(month, year) {
  const map = {
    JAN: 1,
    FEB: 2,
    MAR: 3,
    APR: 4,
    MAY: 5,
    JUN: 6,
    JUL: 7,
    AUG: 8,
    SEP: 9,
    OCT: 10,
    NOV: 11,
    DEC: 12
  };
  const m = map[month.toUpperCase()];
  const y = parseInt(year, 10);
  if (!m || isNaN(y)) return null;
  const lastDay = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}
function parseColDataRow(rawRow) {
  const colData = rawRow.colData;
  if (!colData || colData.length < 3) return null;
  const accountName = colData[0]?.value || "";
  const accountId = colData[0]?.id ? String(colData[0].id) : "";
  const debitStr = colData[1]?.value || "0";
  const creditStr = colData[2]?.value || "0";
  if (!accountName || accountName === "Account" || accountName === "Total") return null;
  const debit = parseFloat(debitStr.replace(/[^0-9.-]/g, "")) || 0;
  const credit = parseFloat(creditStr.replace(/[^0-9.-]/g, "")) || 0;
  return {
    accountNumber: accountId,
    accountName,
    debit,
    credit,
    balance: debit - credit
  };
}
function transformQbTrialBalanceData(qbData, periods) {
  const accountMap = /* @__PURE__ */ new Map();
  if (qbData.reportDate) {
    const period = findPeriodByDate(qbData.reportDate, periods);
    if (period) {
      if (qbData.rows && Array.isArray(qbData.rows)) {
        processRows(qbData.rows, period.id, accountMap);
      } else if (qbData.rows && typeof qbData.rows === "object" && !Array.isArray(qbData.rows)) {
        const rowsObj = qbData.rows;
        if (rowsObj.row && Array.isArray(rowsObj.row)) {
          const normalizedRows = rowsObj.row.map(parseColDataRow).filter((row) => row !== null);
          processRows(normalizedRows, period.id, accountMap);
        }
      }
    }
  }
  if (qbData.monthlyReports && Array.isArray(qbData.monthlyReports)) {
    for (const monthlyReport of qbData.monthlyReports) {
      let reportDate = monthlyReport.reportDate || monthlyReport.endDate || monthlyReport.report?.header?.endPeriod;
      if (!reportDate && monthlyReport.month && monthlyReport.year) {
        reportDate = deriveEndDateFromMonthYear(monthlyReport.month, monthlyReport.year);
      }
      if (!reportDate) continue;
      const period = findPeriodByDate(reportDate, periods);
      if (!period) continue;
      if (monthlyReport.rows && Array.isArray(monthlyReport.rows)) {
        processRows(monthlyReport.rows, period.id, accountMap);
      } else if (monthlyReport.report?.rows?.row && Array.isArray(monthlyReport.report.rows.row)) {
        const rawRows = monthlyReport.report.rows.row;
        const normalizedRows = rawRows.map(parseColDataRow).filter((row) => row !== null);
        processRows(normalizedRows, period.id, accountMap);
      }
    }
  }
  return Array.from(accountMap.values());
}
function findPeriodByDate(dateStr, periods) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const exactMatch = periods.find((p) => p.year === year && p.month === month);
  if (exactMatch) return exactMatch;
  for (const p of periods) {
    if (p.isStub && p.startDate && p.endDate) {
      const start = new Date(p.startDate);
      const end = new Date(p.endDate);
      if (date >= start && date <= end) return p;
    }
  }
  return void 0;
}
function processRows(rows, periodId, accountMap) {
  for (const row of rows) {
    const accountKey = row.accountName || row.accountNumber || "";
    if (!accountKey) continue;
    let account = accountMap.get(accountKey);
    if (!account) {
      const accountType = row.accountType || "";
      const accountSubtype = row.accountSubtype || row.subAccountType || "";
      account = {
        id: crypto.randomUUID(),
        // Use backend-provided fsType, simple fallback to BS (not derived)
        fsType: row.fsType || "BS",
        accountNumber: row.accountNumber || "",
        accountName: row.accountName || "",
        accountType,
        accountSubtype,
        // Use backend-provided fsLineItem only - empty = bug visible
        fsLineItem: row.fsLineItem || "",
        monthlyValues: {},
        // Preserve match flag if present
        ...row._matchedFromCOA !== void 0 && { _matchedFromCOA: row._matchedFromCOA }
      };
      accountMap.set(accountKey, account);
    }
    let value = row.balance;
    if (value === void 0) {
      if (row.debit !== void 0 || row.credit !== void 0) {
        value = (row.debit || 0) - (row.credit || 0);
      } else if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const debit = parseFloat(colData[1]?.value || "0") || 0;
        const credit = parseFloat(colData[2]?.value || "0") || 0;
        value = debit - credit;
      } else {
        value = 0;
      }
    }
    account.monthlyValues[periodId] = value;
  }
}
function mergeAccounts(existing, incoming) {
  const accountMap = /* @__PURE__ */ new Map();
  for (const account of existing) {
    const key = account.accountName || account.accountNumber;
    if (key) {
      accountMap.set(key, { ...account, monthlyValues: { ...account.monthlyValues } });
    }
  }
  for (const account of incoming) {
    const key = account.accountName || account.accountNumber;
    if (!key) continue;
    const existingAccount = accountMap.get(key);
    if (existingAccount) {
      existingAccount.monthlyValues = {
        ...existingAccount.monthlyValues,
        ...account.monthlyValues
      };
    } else {
      accountMap.set(key, { ...account, monthlyValues: { ...account.monthlyValues } });
    }
  }
  return Array.from(accountMap.values());
}
function normalizeClassification(classification) {
  if (!classification) return void 0;
  const classMap = {
    "REVENUE": "Revenue",
    // Prefer "Revenue" terminology (per user's QB setup)
    "INCOME": "Revenue",
    // Map INCOME to Revenue terminology
    "EXPENSE": "Operating expenses",
    "ASSET": void 0,
    // Don't use generic "Assets" - fallback to 154-row mapping
    "LIABILITY": void 0,
    // Don't use generic "Liabilities" - fallback to mapping
    "EQUITY": "Equity",
    "OTHER_INCOME": "Other expense (income)",
    "OTHERINCOME": "Other expense (income)",
    "OTHER_EXPENSE": "Other expense (income)",
    "OTHEREXPENSE": "Other expense (income)",
    "COST_OF_GOODS_SOLD": "Cost of Goods Sold",
    "COSTOFGOODSSOLD": "Cost of Goods Sold",
    "COGS": "Cost of Goods Sold"
  };
  const key = classification.toUpperCase();
  return key in classMap ? classMap[key] : void 0;
}
function crossReferenceWithCOA(tbAccounts, coaAccounts) {
  const coaByNumber = /* @__PURE__ */ new Map();
  const coaByName = /* @__PURE__ */ new Map();
  coaAccounts.forEach((coa) => {
    if (coa.accountNumber) coaByNumber.set(coa.accountNumber, coa);
    if (coa.id) coaByNumber.set(String(coa.id), coa);
    if (coa.accountName) coaByName.set(coa.accountName.toLowerCase(), coa);
  });
  let matched = 0;
  let unmatched = 0;
  const enrichedAccounts = tbAccounts.map((tb) => {
    const coaMatch = tb.accountNumber && coaByNumber.get(tb.accountNumber) || tb.accountName && coaByName.get(tb.accountName.toLowerCase()) || // Parent-name fallback for sub-accounts (e.g., "Cost of Sales:Equipment Rental" -> "Cost of Sales")
    tb.accountName?.includes(":") && coaByName.get(tb.accountName.split(":")[0].trim().toLowerCase()) || // Child-name fallback (e.g., "Payroll Expenses:Payroll Taxes" -> "Payroll Taxes")
    tb.accountName?.includes(":") && coaByName.get(tb.accountName.split(":").pop().trim().toLowerCase());
    if (coaMatch) {
      matched++;
      const fsLineItemFromClassification = coaMatch.classification ? normalizeClassification(coaMatch.classification) : void 0;
      return {
        ...tb,
        accountNumber: coaMatch.accountNumber || tb.accountNumber,
        // Real COA account number
        fsType: coaMatch.fsType,
        // From COA
        accountType: coaMatch.category,
        // Map COA category to accountType
        accountSubtype: coaMatch.accountSubtype || "",
        // From COA (qbToJson accountSubType)
        // Priority: existing fsLineItem (Java) → classification → fallback mapping
        fsLineItem: tb.fsLineItem || coaMatch.category || fsLineItemFromClassification || void 0,
        _matchedFromCOA: true
        // Internal flag for UI
      };
    } else {
      unmatched++;
      const nameLower = (tb.accountName || "").toLowerCase();
      let inferredFsLineItem;
      if (nameLower.includes("income") || nameLower.includes("revenue") || nameLower.includes("sales")) {
        inferredFsLineItem = "Revenue";
      } else if (nameLower.includes("cost of goods") || nameLower.includes("cogs")) {
        inferredFsLineItem = "Cost of Goods Sold";
      } else if (nameLower.includes("depreciation") || nameLower.includes("amortization")) {
        inferredFsLineItem = "Other expense (income)";
      } else if (nameLower.includes("payroll") || nameLower.includes("salary") || nameLower.includes("wage")) {
        inferredFsLineItem = "Operating expenses";
      } else if (nameLower.includes("expense") || nameLower.includes("cost")) {
        inferredFsLineItem = "Operating expenses";
      } else if (nameLower.includes("insurance") || nameLower.includes("rent") || nameLower.includes("utilities")) {
        inferredFsLineItem = "Operating expenses";
      }
      return {
        ...tb,
        ...inferredFsLineItem && !tb.fsLineItem ? {
          fsLineItem: inferredFsLineItem,
          fsType: "IS"
        } : {},
        _matchedFromCOA: false
      };
    }
  });
  return {
    accounts: enrichedAccounts,
    matchStats: { matched, unmatched }
  };
}
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function getFiscalYears(periods, fiscalYearEnd) {
  const regularPeriods = periods.filter((p) => !p.isStub);
  if (regularPeriods.length === 0) return [];
  const fySet = /* @__PURE__ */ new Set();
  const fyEndPeriods = regularPeriods.filter((p) => p.month === fiscalYearEnd);
  for (const fyEnd of fyEndPeriods) {
    fySet.add(fyEnd.year);
  }
  return Array.from(fySet).sort((a, b) => a - b);
}
function calculateFYTotalForYear(account, periods, fiscalYearEnd, fyYear) {
  const regularPeriods = periods.filter((p) => !p.isStub);
  const fyEndPeriod = regularPeriods.find((p) => p.year === fyYear && p.month === fiscalYearEnd);
  if (!fyEndPeriod) return 0;
  if (account.fsType === "BS") {
    return account.monthlyValues[fyEndPeriod.id] || 0;
  } else {
    const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
    const fyStartYear = fiscalYearEnd === 12 ? fyYear : fyYear - 1;
    let total = 0;
    regularPeriods.forEach((p) => {
      const isInFY = fiscalYearEnd === 12 ? p.year === fyYear && p.month >= 1 && p.month <= 12 : p.year === fyStartYear && p.month >= fyStartMonth || p.year === fyYear && p.month <= fiscalYearEnd;
      if (isInFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  }
}
function getLTMReferencePeriods(periods, fiscalYearEnd) {
  const regularPeriods = periods.filter((p) => !p.isStub);
  return regularPeriods.filter((p) => p.month === fiscalYearEnd);
}
function calculateLTMAtPeriod(account, periods, endPeriod) {
  const regularPeriods = periods.filter((p) => !p.isStub);
  if (account.fsType === "BS") {
    return account.monthlyValues[endPeriod.id] || 0;
  } else {
    const endIndex = regularPeriods.findIndex((p) => p.id === endPeriod.id);
    if (endIndex < 0) return 0;
    const startIndex = Math.max(0, endIndex - 11);
    const ltmPeriods = regularPeriods.slice(startIndex, endIndex + 1);
    return ltmPeriods.reduce((sum, p) => sum + (account.monthlyValues[p.id] || 0), 0);
  }
}
function getYTDReferencePeriods(periods, fiscalYearEnd) {
  const regularPeriods = periods.filter((p) => !p.isStub);
  return regularPeriods.filter((p) => p.month === fiscalYearEnd);
}
function calculateYTDAtPeriod(account, periods, fiscalYearEnd, endPeriod) {
  const regularPeriods = periods.filter((p) => !p.isStub);
  if (account.fsType === "BS") {
    return account.monthlyValues[endPeriod.id] || 0;
  } else {
    const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
    const fyStartYear = fiscalYearEnd === 12 ? endPeriod.year : endPeriod.year - 1;
    let total = 0;
    regularPeriods.forEach((p) => {
      const isInFY = fiscalYearEnd === 12 ? p.year === endPeriod.year && p.month <= endPeriod.month : p.year === fyStartYear && p.month >= fyStartMonth || p.year === endPeriod.year && p.month <= endPeriod.month;
      if (isInFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  }
}
export {
  SHORT_MONTHS as S,
  getLTMReferencePeriods as a,
  getYTDReferencePeriods as b,
  crossReferenceWithCOA as c,
  calculateFYTotalForYear as d,
  calculateLTMAtPeriod as e,
  formatCurrency as f,
  getFiscalYears as g,
  calculateYTDAtPeriod as h,
  calculateBalanceCheck as i,
  createEmptyAccount as j,
  mergeAccounts as m,
  parseCurrencyInput as p,
  transformQbTrialBalanceData as t
};
