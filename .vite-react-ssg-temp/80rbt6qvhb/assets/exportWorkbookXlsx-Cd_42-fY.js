import * as XLSX from "xlsx";
import { Q as derivePriorBalances, R as buildProofOfCashGrid, T as TAB_GRID_BUILDERS, E as gridDataToRawData } from "./sanitizeWizardData-nrsUY-BP.js";
import { s as supabase } from "../main.mjs";
const TIER_ORDER = ["required", "recommended", "optional"];
const TIER_LABELS = {
  required: "REQUIRED",
  recommended: "RECOMMENDED",
  optional: "OPTIONAL"
};
const STATUS_LABELS = {
  provided: "Provided",
  not_provided: "Not Provided",
  na: "N/A"
};
function buildDataSourcesGrid(sources) {
  const columns = [
    { key: "document", label: "Document", width: 300, align: "left", format: "text" },
    { key: "tier", label: "Tier", width: 120, align: "center", format: "text" },
    { key: "status", label: "Status", width: 120, align: "center", format: "text" },
    { key: "uploadDate", label: "Upload Date", width: 140, align: "center", format: "text" }
  ];
  const rows = [];
  for (const tier of TIER_ORDER) {
    const items = sources.filter((s) => s.tier === tier);
    if (items.length === 0) continue;
    rows.push({
      id: `header-${tier}`,
      type: "section-header",
      label: TIER_LABELS[tier],
      cells: { document: TIER_LABELS[tier], tier: "", status: "", uploadDate: "" }
    });
    for (const item of items) {
      rows.push({
        id: `src-${tier}-${item.label}`,
        type: "data",
        cells: {
          document: item.label,
          tier: TIER_LABELS[tier],
          status: STATUS_LABELS[item.status] || item.status,
          uploadDate: item.uploadDate || "—"
        }
      });
    }
    rows.push({ id: `spacer-${tier}`, type: "spacer", cells: {} });
  }
  const requiredMissing = sources.filter((s) => s.tier === "required" && s.status === "not_provided");
  if (requiredMissing.length > 0) {
    rows.push({
      id: "warning",
      type: "total",
      cells: {
        document: `⚠ ${requiredMissing.length} of ${sources.filter((s) => s.tier === "required").length} required documents not provided. Analysis scope limited accordingly.`,
        tier: "",
        status: "",
        uploadDate: ""
      }
    });
  }
  return { columns, rows, frozenColumns: 1 };
}
const DOCUMENT_CHECKLIST = [
  // Required
  { label: "Chart of Accounts", tier: "required", matchTypes: ["chart_of_accounts"] },
  { label: "Trial Balance", tier: "required", matchTypes: ["trial_balance"] },
  { label: "General Ledger", tier: "required", matchTypes: ["general_ledger"] },
  { label: "Bank Statements", tier: "required", matchTypes: ["bank_statement"] },
  // Recommended
  { label: "AR Aging", tier: "recommended", matchTypes: ["accounts_receivable"] },
  { label: "AP Aging", tier: "recommended", matchTypes: ["accounts_payable"] },
  { label: "Payroll Reports", tier: "recommended", matchTypes: ["payroll"] },
  { label: "Fixed Asset Register", tier: "recommended", matchTypes: ["fixed_asset_register", "depreciation_schedule"] },
  { label: "Tax Returns", tier: "recommended", matchTypes: ["tax_return"] },
  { label: "Journal Entries", tier: "recommended", matchTypes: ["journal_entries"] },
  { label: "Credit Card Statements", tier: "recommended", matchTypes: ["credit_card"] },
  { label: "Customer Concentration", tier: "recommended", matchTypes: ["customer_concentration"] },
  { label: "Vendor Concentration", tier: "recommended", matchTypes: ["vendor_concentration"] },
  { label: "Inventory Reports", tier: "recommended", matchTypes: ["inventory"] },
  { label: "Debt Schedule", tier: "recommended", matchTypes: ["debt_schedule"] },
  { label: "Material Contracts", tier: "recommended", matchTypes: ["material_contract"] },
  { label: "Lease Agreements", tier: "recommended", matchTypes: ["lease_agreement"] },
  { label: "Supporting Documents", tier: "recommended", matchTypes: ["supporting_documents"] },
  { label: "Job Cost Reports", tier: "recommended", matchTypes: ["job_cost_reports"] },
  { label: "WIP Schedule", tier: "recommended", matchTypes: ["wip_schedule"] },
  // Optional
  { label: "Income Statements", tier: "optional", matchTypes: ["income_statement"] },
  { label: "Balance Sheets", tier: "optional", matchTypes: ["balance_sheet"] },
  { label: "Cash Flow Statements", tier: "optional", matchTypes: ["cash_flow"] },
  { label: "CIM / Offering Memo", tier: "optional", matchTypes: ["cim"] }
];
async function fetchDocumentSources(projectId) {
  const { data: docs } = await supabase.from("documents").select("account_type, created_at").eq("project_id", projectId);
  const uploadedTypes = /* @__PURE__ */ new Map();
  if (docs) {
    for (const doc of docs) {
      if (doc.account_type && !uploadedTypes.has(doc.account_type)) {
        uploadedTypes.set(doc.account_type, new Date(doc.created_at || "").toLocaleDateString());
      }
    }
  }
  return DOCUMENT_CHECKLIST.map((item) => {
    const matchedType = item.matchTypes.find((t) => uploadedTypes.has(t));
    return {
      label: item.label,
      tier: item.tier,
      status: matchedType ? "provided" : "not_provided",
      uploadDate: matchedType ? uploadedTypes.get(matchedType) : void 0
    };
  });
}
const WORKBOOK_TABS = [
  // Setup & Input
  { id: "setup", label: "Due Diligence Information", shortLabel: "Setup", tabNumber: 1, type: "input", category: "setup" },
  { id: "trial-balance", label: "Trial Balance", shortLabel: "TB", tabNumber: 2, type: "input", category: "financial" },
  // QoE & Adjustments
  { id: "qoe-analysis", label: "QoE Analysis", shortLabel: "QoE", tabNumber: 3, type: "calculated", category: "financial" },
  { id: "is-bs-reconciliation", label: "Reconciling IS & BS", shortLabel: "IS↔BS", tabNumber: 5, type: "calculated", category: "financial" },
  // Financial Statements
  { id: "income-statement", label: "Income Statement", shortLabel: "IS", tabNumber: 6, type: "calculated", category: "financial" },
  { id: "is-detailed", label: "Income Statement - Detailed", shortLabel: "IS Detail", tabNumber: 7, type: "calculated", category: "financial" },
  // IS Breakdown
  { id: "sales", label: "Sales", shortLabel: "Sales", tabNumber: 8, type: "calculated", category: "financial" },
  { id: "cogs", label: "Cost of Goods Sold", shortLabel: "COGS", tabNumber: 9, type: "calculated", category: "financial" },
  { id: "opex", label: "Operating Expenses", shortLabel: "OpEx", tabNumber: 10, type: "calculated", category: "financial" },
  { id: "other-expense", label: "Other Expense (Income)", shortLabel: "Other", tabNumber: 11, type: "calculated", category: "financial" },
  { id: "payroll", label: "Payroll & Related", shortLabel: "Payroll", tabNumber: 12, type: "calculated", category: "financial" },
  // Working Capital
  { id: "working-capital", label: "Working Capital", shortLabel: "WC", tabNumber: 13, type: "calculated", category: "working-capital" },
  { id: "nwc-analysis", label: "NWC Analysis", shortLabel: "NWC", tabNumber: 14, type: "calculated", category: "working-capital" },
  // Balance Sheet
  { id: "balance-sheet", label: "Balance Sheet", shortLabel: "BS", tabNumber: 15, type: "calculated", category: "financial" },
  { id: "bs-detailed", label: "Balance Sheet - Detailed", shortLabel: "BS Detail", tabNumber: 16, type: "calculated", category: "financial" },
  // BS Detail tabs
  { id: "cash", label: "Cash", shortLabel: "Cash", tabNumber: 17, type: "calculated", category: "working-capital" },
  { id: "ar-aging", label: "AR Aging", shortLabel: "AR", tabNumber: 18, type: "input", category: "working-capital" },
  { id: "other-current-assets", label: "Other Current Assets", shortLabel: "OCA", tabNumber: 19, type: "calculated", category: "working-capital" },
  { id: "fixed-assets", label: "Fixed Assets", shortLabel: "FA", tabNumber: 20, type: "input", category: "working-capital" },
  { id: "ap-aging", label: "AP Aging", shortLabel: "AP", tabNumber: 21, type: "input", category: "working-capital" },
  { id: "other-current-liabilities", label: "Other Current Liabilities", shortLabel: "OCL", tabNumber: 22, type: "calculated", category: "working-capital" },
  { id: "wip-schedule", label: "WIP Schedule", shortLabel: "WIP", tabNumber: 23, type: "input", category: "working-capital" },
  // Supplementary
  { id: "top-customers", label: "Top Customers by Year", shortLabel: "Customers", tabNumber: 24, type: "input", category: "supplementary" },
  { id: "top-vendors", label: "Top Vendors by Year", shortLabel: "Vendors", tabNumber: 25, type: "input", category: "supplementary" },
  { id: "proof-of-cash", label: "Proof of Cash", shortLabel: "PoC", tabNumber: 26, type: "calculated", category: "supplementary" },
  { id: "free-cash-flow", label: "Free Cash Flow", shortLabel: "FCF", tabNumber: 27, type: "calculated", category: "supplementary" },
  // Disclosure
  { id: "disclaimer", label: "Disclaimer", shortLabel: "Disc.", tabNumber: 28, type: "calculated", category: "supplementary" },
  { id: "data-sources", label: "Data Sources", shortLabel: "Sources", tabNumber: 29, type: "calculated", category: "supplementary" }
];
async function fetchProofOfCashBankData(projectId) {
  try {
    const { data: processedData, error: bankError } = await supabase.from("processed_data").select("id, period_start, period_end, data").eq("project_id", projectId).eq("data_type", "bank_transactions").order("period_start", { ascending: true }).limit(1e6);
    if (bankError) {
      console.warn("Failed to fetch bank statements for PoC export:", bankError);
      return void 0;
    }
    const bankByPeriod = /* @__PURE__ */ new Map();
    for (const item of processedData || []) {
      if (!item.period_start) continue;
      const key = item.period_start.substring(0, 7);
      const data = item.data || {};
      const summary = data.summary || {};
      const existing = bankByPeriod.get(key);
      if (existing) {
        existing.openingBalance += summary.openingBalance ?? 0;
        existing.closingBalance += summary.closingBalance ?? 0;
        existing.totalCredits += summary.totalCredits ?? 0;
        existing.totalDebits += summary.totalDebits ?? 0;
      } else {
        bankByPeriod.set(key, {
          openingBalance: summary.openingBalance ?? 0,
          closingBalance: summary.closingBalance ?? 0,
          totalCredits: summary.totalCredits ?? 0,
          totalDebits: summary.totalDebits ?? 0
        });
      }
    }
    const { data: classData, error: classError } = await supabase.from("processed_data").select("data").eq("project_id", projectId).eq("data_type", "transfer_classification").maybeSingle();
    let classifications = null;
    if (!classError && classData?.data) {
      const rawClassData = classData.data;
      const map = /* @__PURE__ */ new Map();
      for (const [period, periodData] of Object.entries(rawClassData)) {
        if (period.startsWith("_")) continue;
        let interbankIn = 0;
        let interbankOut = 0;
        const txns = Array.isArray(periodData?.transactions) ? periodData.transactions : [];
        for (const txn of txns) {
          if (txn.category === "interbank") {
            const amt = txn.amount ?? 0;
            if (amt > 0) interbankIn += amt;
            else interbankOut += Math.abs(amt);
          }
        }
        map.set(period, {
          interbank: periodData?.interbank ?? 0,
          interbankIn,
          interbankOut,
          owner: periodData?.owner ?? 0,
          debt_service: 0,
          capex: 0,
          tax_payments: 0
        });
      }
      if (map.size > 0) classifications = map;
    }
    if (bankByPeriod.size === 0 && !classifications) return void 0;
    return { bankByPeriod, classifications };
  } catch (err) {
    console.warn("Failed to fetch PoC bank data:", err);
    return void 0;
  }
}
function safeSheetName(label, usedNames) {
  let name = label.substring(0, 31);
  name = name.replace(/[/\\*?:[\]]/g, "");
  let base = name;
  let counter = 1;
  while (usedNames.has(name)) {
    name = `${base.substring(0, 28)}_${counter++}`;
  }
  usedNames.add(name);
  return name;
}
function applyFormatting(ws, gridData, rawData) {
  if (rawData.length === 0) return;
  const colCount = rawData[0].length;
  const rowCount = rawData.length;
  ws["!cols"] = gridData.columns.map((col) => ({
    wch: Math.max(Math.ceil((col.width || 100) / 7), 8)
  }));
  const frozenCols = gridData.frozenColumns || 0;
  ws["!freeze"] = { xSplit: frozenCols, ySplit: 1 };
  const nonNumericColIndices = /* @__PURE__ */ new Set();
  gridData.columns.forEach((col, i) => {
    if (col.format === "text") nonNumericColIndices.add(i);
  });
  const rowTypes = ["header"];
  for (const row of gridData.rows) {
    if (row.type === "spacer") continue;
    rowTypes.push(row.type);
  }
  const rowFormats = [void 0];
  for (const row of gridData.rows) {
    if (row.type === "spacer") continue;
    rowFormats.push(row.format);
  }
  for (let r = 1; r < rowCount; r++) {
    for (let c = 0; c < colCount; c++) {
      if (nonNumericColIndices.has(c)) continue;
      const cellRef = XLSX.utils.encode_cell({ r, c });
      const cell = ws[cellRef];
      if (!cell) continue;
      const raw = rawData[r][c];
      if (!raw || raw === "—" || raw === "n/a" || raw === "n/q") continue;
      if (raw === "-") {
        const colFormat = gridData.columns[c]?.format;
        const rowFormat = rowFormats[r];
        const effectiveFormat = rowFormat || colFormat;
        cell.t = "n";
        cell.v = 0;
        cell.z = effectiveFormat === "percent" ? "0.0%" : "#,##0";
        continue;
      }
      const cleaned = raw.replace(/[$,%\s()]/g, (match) => match === "(" ? "-" : match === ")" ? "" : "").replace(/,/g, "");
      const num = parseFloat(cleaned);
      if (!isNaN(num) && isFinite(num)) {
        cell.t = "n";
        const colFormat = gridData.columns[c]?.format;
        const rowFormat = rowFormats[r];
        const effectiveFormat = rowFormat || colFormat;
        if (effectiveFormat === "percent") {
          cell.v = num / 100;
          cell.z = "0.0%";
        } else if (effectiveFormat === "currency") {
          cell.v = num;
          cell.z = "#,##0";
        } else {
          cell.v = num;
        }
      }
    }
  }
}
async function exportWorkbookXlsx({ dealData, projectId, filename, onProgress }) {
  const wb = XLSX.utils.book_new();
  const usedNames = /* @__PURE__ */ new Set();
  const resolvedProjectId = projectId || dealData.deal.projectId;
  if (resolvedProjectId && !dealData.deal.priorBalances) {
    const priorBalances = await derivePriorBalances(
      resolvedProjectId,
      dealData.trialBalance,
      dealData.deal.periods
    );
    if (Object.keys(priorBalances).length > 0) {
      dealData.deal.priorBalances = priorBalances;
    }
  }
  let pocBankData;
  let docSources;
  if (resolvedProjectId) {
    const [bankData, sources] = await Promise.all([
      fetchProofOfCashBankData(resolvedProjectId),
      fetchDocumentSources(resolvedProjectId)
    ]);
    pocBankData = bankData;
    docSources = sources;
  }
  const tabsToExport = [];
  for (const tab of WORKBOOK_TABS) {
    if (tab.id === "qoe-analysis") {
      tabsToExport.push(tab);
      tabsToExport.push({ id: "dd-adjustments-1", label: "DD Adjustments I" });
      tabsToExport.push({ id: "dd-adjustments-2", label: "DD Adjustments II" });
    } else {
      tabsToExport.push(tab);
    }
  }
  const total = tabsToExport.length;
  for (let i = 0; i < tabsToExport.length; i++) {
    const tab = tabsToExport[i];
    onProgress?.(i + 1, total, tab.label);
    try {
      let gridData;
      if (tab.id === "proof-of-cash") {
        gridData = buildProofOfCashGrid(dealData, pocBankData);
      } else if (tab.id === "data-sources") {
        if (!docSources || docSources.length === 0) continue;
        gridData = buildDataSourcesGrid(docSources);
      } else {
        const builder = TAB_GRID_BUILDERS[tab.id];
        if (!builder) continue;
        gridData = builder(dealData);
      }
      if (gridData.columns.length === 0) continue;
      const rawData = gridDataToRawData(gridData);
      if (rawData.length === 0) continue;
      const ws = XLSX.utils.aoa_to_sheet(rawData);
      applyFormatting(ws, gridData, rawData);
      const sheetName = safeSheetName(tab.label, usedNames);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } catch (err) {
      console.warn(`Failed to build tab "${tab.label}":`, err);
    }
    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  const companyName = dealData.deal.targetCompany || dealData.deal.projectName || "Company";
  const safeName = companyName.replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
  const outputFilename = filename || `${safeName}_QoE_Workbook.xlsx`;
  XLSX.writeFile(wb, outputFilename);
}
export {
  WORKBOOK_TABS as W,
  exportWorkbookXlsx as e
};
