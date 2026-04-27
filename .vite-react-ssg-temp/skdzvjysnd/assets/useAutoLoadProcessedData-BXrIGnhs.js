import { useRef, useEffect } from "react";
import { s as supabase, t as toast } from "../main.mjs";
function flattenQBReportToRawData(qbData) {
  const result = [];
  const data = qbData;
  if (!data) return result;
  if (data.columns?.column && Array.isArray(data.columns.column)) {
    const headerRow = data.columns.column.map((c) => c.colTitle || "");
    if (headerRow.some((h) => h)) {
      result.push(headerRow);
    }
  }
  function processRows(rows2) {
    for (const row of rows2) {
      if (row.header?.colData && Array.isArray(row.header.colData)) {
        const headerValues = row.header.colData.map((c) => c.value || "");
        if (headerValues.some((v) => v)) {
          result.push(headerValues);
        }
      }
      if (row.colData && Array.isArray(row.colData)) {
        const rowValues = row.colData.map((c) => c.value || "");
        if (rowValues.some((v) => v)) {
          result.push(rowValues);
        }
      }
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        processRows(row.rows.row);
      }
      if (row.summary?.colData && Array.isArray(row.summary.colData)) {
        const summaryValues = row.summary.colData.map((c) => c.value || "");
        if (summaryValues.some((v) => v)) {
          result.push(summaryValues);
        }
      }
    }
  }
  let rows = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data.rows.row && Array.isArray(data.rows.row)) {
      rows = data.rows.row;
    }
  } else if (data.Rows) {
    if (data.Rows.Row && Array.isArray(data.Rows.Row)) {
      rows = data.Rows.Row;
    }
  }
  if (rows.length > 0) {
    processRows(rows);
  }
  return result;
}
function parseAgingBucket(colTitle) {
  const title = colTitle.toLowerCase();
  if (title.includes("current") || title === "current") return "current";
  if (title.includes("1-30") || title.includes("1 - 30")) return "days1to30";
  if (title.includes("31-60") || title.includes("31 - 60")) return "days31to60";
  if (title.includes("61-90") || title.includes("61 - 90")) return "days61to90";
  if (title.includes("90") || title.includes("over 90") || title.includes("91+")) return "days90plus";
  return null;
}
function transformQBArAgingToWizard(qbData, periodEnd) {
  const periodId = periodEnd ? `as_of_${periodEnd.substring(0, 7)}` : `as_of_${(/* @__PURE__ */ new Date()).toISOString().substring(0, 7)}`;
  const entries = [];
  const data = qbData;
  if (!data) {
    return { periodData: [{ periodId, entries: [] }], badDebtReserve: 0 };
  }
  const columns = data.columns?.column || [];
  const bucketMap = /* @__PURE__ */ new Map();
  columns.forEach((col, idx) => {
    const bucket = parseAgingBucket(col.colTitle || "");
    if (bucket && bucket !== "id" && bucket !== "customer" && bucket !== "total") {
      bucketMap.set(idx, bucket);
    }
  });
  let rows = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data.rows.row) {
      rows = data.rows.row;
    }
  }
  function extractEntries(rowList) {
    for (const row of rowList) {
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const customerName = colData[0]?.value || "";
        if (!customerName || customerName.toLowerCase().includes("total")) continue;
        const entry = {
          id: entries.length + 1,
          customer: customerName,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90plus: 0,
          total: 0
        };
        if (bucketMap.size > 0) {
          bucketMap.forEach((bucket, idx) => {
            const value = parseFloat(colData[idx]?.value || "0");
            if (!isNaN(value)) {
              entry[bucket] = value;
            }
          });
        } else {
          entry.current = parseFloat(colData[1]?.value || "0") || 0;
          entry.days1to30 = parseFloat(colData[2]?.value || "0") || 0;
          entry.days31to60 = parseFloat(colData[3]?.value || "0") || 0;
          entry.days61to90 = parseFloat(colData[4]?.value || "0") || 0;
          entry.days90plus = parseFloat(colData[5]?.value || "0") || 0;
        }
        entry.total = entry.current + entry.days1to30 + entry.days31to60 + entry.days61to90 + entry.days90plus;
        if (entry.total > 0) {
          entries.push(entry);
        }
      }
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractEntries(row.rows.row);
      }
    }
  }
  extractEntries(rows);
  return {
    periodData: [{ periodId, entries }],
    badDebtReserve: 0
  };
}
function transformQBApAgingToWizard(qbData, periodEnd) {
  const periodId = periodEnd ? `as_of_${periodEnd.substring(0, 7)}` : `as_of_${(/* @__PURE__ */ new Date()).toISOString().substring(0, 7)}`;
  const entries = [];
  const data = qbData;
  if (!data) {
    return {
      periodData: [{ periodId, entries: [] }],
      summary: { totalAP: 0, currentAP: 0, overdueAP: 0 }
    };
  }
  const columns = data.columns?.column || [];
  const bucketMap = /* @__PURE__ */ new Map();
  columns.forEach((col, idx) => {
    const bucket = parseAgingBucket(col.colTitle || "");
    if (bucket && bucket !== "id" && bucket !== "vendor" && bucket !== "total") {
      bucketMap.set(idx, bucket);
    }
  });
  let rows = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data.rows.row) {
      rows = data.rows.row;
    }
  }
  function extractEntries(rowList) {
    for (const row of rowList) {
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const vendorName = colData[0]?.value || "";
        if (!vendorName || vendorName.toLowerCase().includes("total")) continue;
        const entry = {
          id: entries.length + 1,
          vendor: vendorName,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90plus: 0,
          total: 0
        };
        if (bucketMap.size > 0) {
          bucketMap.forEach((bucket, idx) => {
            const value = parseFloat(colData[idx]?.value || "0");
            if (!isNaN(value)) {
              entry[bucket] = value;
            }
          });
        } else {
          entry.current = parseFloat(colData[1]?.value || "0") || 0;
          entry.days1to30 = parseFloat(colData[2]?.value || "0") || 0;
          entry.days31to60 = parseFloat(colData[3]?.value || "0") || 0;
          entry.days61to90 = parseFloat(colData[4]?.value || "0") || 0;
          entry.days90plus = parseFloat(colData[5]?.value || "0") || 0;
        }
        entry.total = entry.current + entry.days1to30 + entry.days31to60 + entry.days61to90 + entry.days90plus;
        if (entry.total > 0) {
          entries.push(entry);
        }
      }
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractEntries(row.rows.row);
      }
    }
  }
  extractEntries(rows);
  const totalAP = entries.reduce((sum, e) => sum + e.total, 0);
  const currentAP = entries.reduce((sum, e) => sum + e.current, 0);
  const overdueAP = totalAP - currentAP;
  return {
    periodData: [{ periodId, entries }],
    summary: { totalAP, currentAP, overdueAP }
  };
}
function transformQBCustomersToWizard(qbData, periodStart, periodEnd) {
  if (!qbData) {
    return { customers: [], totalRevenue: 0 };
  }
  const year = periodEnd ? periodEnd.substring(0, 4) : (/* @__PURE__ */ new Date()).getFullYear().toString();
  if (Array.isArray(qbData)) {
    const items = qbData.filter((item) => item.customerName);
    const total = items.reduce((s, item) => s + (item.revenue || 0), 0);
    return {
      customers: items.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10).map((item, idx) => ({
        id: idx + 1,
        name: item.customerName,
        yearlyRevenue: { [year]: item.revenue || 0 }
      })),
      totalRevenue: Math.abs(total)
    };
  }
  const customers = [];
  const data = qbData;
  let totalRevenue = 0;
  let rows = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data.rows.row) {
      rows = data.rows.row;
    }
  }
  function extractCustomers(rowList) {
    for (const row of rowList) {
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const customerName = colData[0]?.value || "";
        if (!customerName || customerName.toLowerCase().includes("total")) continue;
        const amount = parseFloat(colData[1]?.value || "0") || 0;
        if (amount !== 0) {
          totalRevenue += amount;
          customers.push({
            id: customers.length + 1,
            name: customerName,
            yearlyRevenue: { [year]: amount }
          });
        }
      }
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractCustomers(row.rows.row);
      }
    }
  }
  extractCustomers(rows);
  customers.sort((a, b) => {
    const aRev = Object.values(a.yearlyRevenue || {})[0] || 0;
    const bRev = Object.values(b.yearlyRevenue || {})[0] || 0;
    return bRev - aRev;
  });
  return {
    customers: customers.slice(0, 10),
    totalRevenue: Math.abs(totalRevenue)
  };
}
function transformQBVendorsToWizard(qbData, periodStart, periodEnd) {
  if (!qbData) {
    return { vendors: [], totalSpend: 0 };
  }
  const year = periodEnd ? periodEnd.substring(0, 4) : (/* @__PURE__ */ new Date()).getFullYear().toString();
  if (Array.isArray(qbData)) {
    const items = qbData.filter((item) => item.vendorName);
    const total = items.reduce((s, item) => s + (item.payments || 0), 0);
    return {
      vendors: items.sort((a, b) => (b.payments || 0) - (a.payments || 0)).slice(0, 10).map((item, idx) => ({
        id: idx + 1,
        name: item.vendorName,
        yearlySpend: { [year]: item.payments || 0 },
        isRelatedParty: false
      })),
      totalSpend: Math.abs(total)
    };
  }
  const vendors = [];
  const data = qbData;
  let totalSpend = 0;
  let rows = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (data.rows.row) {
      rows = data.rows.row;
    }
  }
  function extractVendors(rowList) {
    for (const row of rowList) {
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const vendorName = colData[0]?.value || "";
        if (!vendorName || vendorName.toLowerCase().includes("total")) continue;
        const amount = parseFloat(colData[1]?.value || "0") || 0;
        if (amount !== 0) {
          totalSpend += amount;
          vendors.push({
            id: vendors.length + 1,
            name: vendorName,
            yearlySpend: { [year]: amount },
            isRelatedParty: false
          });
        }
      }
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractVendors(row.rows.row);
      }
    }
  }
  extractVendors(rows);
  vendors.sort((a, b) => {
    const aSpend = Object.values(a.yearlySpend || {})[0] || 0;
    const bSpend = Object.values(b.yearlySpend || {})[0] || 0;
    return bSpend - aSpend;
  });
  return {
    vendors: vendors.slice(0, 10),
    totalSpend: Math.abs(totalSpend)
  };
}
function transformQBJournalEntriesToWizard(qbData) {
  const data = qbData;
  const rawEntries = data.data || [];
  const entries = rawEntries.map((je) => {
    const lines = (je.line || []).map((line) => {
      const detail = line.journalEntryLineDetail || {};
      const accountRef = detail.accountRef || {};
      return {
        accountName: String(accountRef.name || ""),
        accountId: String(accountRef.value || ""),
        amount: Number(line.amount) || 0,
        postingType: String(detail.postingType || "")
      };
    });
    let txnDate = String(je.txnDate || "");
    try {
      const parsed = new Date(txnDate);
      if (!isNaN(parsed.getTime())) {
        txnDate = parsed.toISOString().substring(0, 10);
      }
    } catch {
    }
    const totalDebit = lines.filter((l) => l.postingType === "DEBIT").reduce((s, l) => s + l.amount, 0);
    return {
      id: String(je.id || ""),
      txnDate,
      totalAmount: totalDebit,
      isAdjustment: !!je.adjustment,
      memo: String(je.privateNote || je.description || ""),
      lines
    };
  });
  entries.sort((a, b) => b.txnDate.localeCompare(a.txnDate));
  return {
    entries,
    totalCount: entries.length
  };
}
function mapDataTypeToDbType(dataType) {
  const mapping = {
    ar_aging: "accounts_receivable",
    ap_aging: "accounts_payable"
  };
  return mapping[dataType] ?? dataType;
}
function useAutoLoadProcessedData({
  projectId,
  dataType,
  hasExistingData,
  updateData
}) {
  const hasAttemptedLoad = useRef(false);
  useEffect(() => {
    if (hasExistingData || hasAttemptedLoad.current || !projectId) {
      return;
    }
    const autoLoad = async () => {
      hasAttemptedLoad.current = true;
      try {
        const { data: records, error } = await supabase.from("processed_data").select("id, data, period_start, period_end, created_at").eq("project_id", projectId).eq("data_type", mapDataTypeToDbType(dataType)).order("period_end", { ascending: false }).limit(1);
        if (error) {
          console.error(`Auto-load ${dataType} error:`, error);
          return;
        }
        if (!records || records.length === 0) {
          return;
        }
        const record = records[0];
        const transformed = transformRecord(dataType, record);
        if (transformed) {
          updateData(transformed);
          const typeLabels = {
            balance_sheet: "Balance Sheet",
            income_statement: "Income Statement",
            ar_aging: "AR Aging",
            ap_aging: "AP Aging",
            customer_concentration: "Top Customers",
            vendor_concentration: "Top Vendors",
            journal_entries: "Journal Entries"
          };
          toast({
            title: `${typeLabels[dataType]} loaded`,
            description: "Data loaded from synced QuickBooks data."
          });
        }
      } catch (err) {
        console.error(`Auto-load ${dataType} exception:`, err);
      }
    };
    autoLoad();
  }, [projectId, dataType, hasExistingData, updateData]);
}
function transformRecord(dataType, record) {
  const { data, period_start, period_end, created_at } = record;
  switch (dataType) {
    case "balance_sheet":
    case "income_statement": {
      const rawData = flattenQBReportToRawData(data);
      if (rawData.length === 0) return null;
      return {
        rawData,
        syncedAt: created_at,
        source: "processed_data"
      };
    }
    case "ar_aging": {
      return transformQBArAgingToWizard(data, period_end || void 0);
    }
    case "ap_aging": {
      return transformQBApAgingToWizard(data, period_end || void 0);
    }
    case "customer_concentration": {
      return transformQBCustomersToWizard(data, period_start || void 0, period_end || void 0);
    }
    case "vendor_concentration": {
      return transformQBVendorsToWizard(data, period_start || void 0, period_end || void 0);
    }
    case "journal_entries": {
      return transformQBJournalEntriesToWizard(data);
    }
    default:
      return null;
  }
}
function useAutoLoadArAging({
  projectId,
  data,
  updateData
}) {
  const hasExistingData = !!(data?.periodData && data.periodData.length > 0 && data.periodData.some((p) => p.entries && p.entries.length > 0 && p.entries.some((e) => e.customer)));
  useAutoLoadProcessedData({
    projectId,
    dataType: "ar_aging",
    hasExistingData,
    updateData
  });
}
function useAutoLoadApAging({
  projectId,
  data,
  updateData
}) {
  const hasExistingData = !!(data?.periodData && data.periodData.length > 0 && data.periodData.some((p) => p.entries && p.entries.length > 0 && p.entries.some((e) => e.vendor)));
  useAutoLoadProcessedData({
    projectId,
    dataType: "ap_aging",
    hasExistingData,
    updateData
  });
}
function useAutoLoadCustomers({
  projectId,
  data,
  updateData
}) {
  const hasExistingData = !!(data?.customers && data.customers.length > 0 && data.customers.some((c) => c.name));
  useAutoLoadProcessedData({
    projectId,
    dataType: "customer_concentration",
    hasExistingData,
    updateData
  });
}
function useAutoLoadVendors({
  projectId,
  data,
  updateData
}) {
  const hasExistingData = !!(data?.vendors && data.vendors.length > 0 && data.vendors.some((v) => v.name));
  useAutoLoadProcessedData({
    projectId,
    dataType: "vendor_concentration",
    hasExistingData,
    updateData
  });
}
function useAutoLoadJournalEntries({
  projectId,
  data,
  updateData
}) {
  const hasExistingData = !!(data?.entries && data.entries.length > 0);
  useAutoLoadProcessedData({
    projectId,
    dataType: "journal_entries",
    hasExistingData,
    updateData
  });
}
export {
  useAutoLoadArAging as a,
  useAutoLoadApAging as b,
  useAutoLoadCustomers as c,
  useAutoLoadVendors as d,
  useAutoLoadJournalEntries as u
};
