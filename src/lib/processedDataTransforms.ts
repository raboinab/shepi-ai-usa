/**
 * Transform utilities for flattening QuickBooks data from processed_data table
 * Used for auto-loading wizard sections when wizard_data is empty
 */

// Type definitions for raw QuickBooks structures
interface QBColData {
  id?: string;
  value?: string;
}

interface QBRow {
  type?: string;
  header?: { colData?: QBColData[] };
  colData?: QBColData[];
  rows?: { row?: QBRow[] };
  summary?: { colData?: QBColData[] };
}

interface QBColumn {
  colTitle?: string;
  colType?: string;
}

interface QBReportData {
  columns?: { column?: QBColumn[] };
  rows?: { row?: QBRow[] } | QBRow[];
  Rows?: { Row?: QBRow[] };
}

// AR/AP Aging entry interfaces
export interface ARAgingEntry {
  id: number;
  customer: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

export interface APAgingEntry {
  id: number;
  vendor: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

export interface ARAgingPeriodData {
  periodId: string;
  entries: ARAgingEntry[];
}

export interface APAgingPeriodData {
  periodId: string;
  entries: APAgingEntry[];
}

export interface ARAgingData {
  periodData: ARAgingPeriodData[];
  badDebtReserve: number;
}

export interface APAgingData {
  periodData: APAgingPeriodData[];
  summary: {
    totalAP: number;
    currentAP: number;
    overdueAP: number;
  };
}

// Customer/Vendor concentration interfaces
export interface TopCustomersData {
  customers: Record<string, unknown>[];
  totalRevenue: number;
}

export interface TopVendorsData {
  vendors: Record<string, unknown>[];
  totalSpend: number;
}

/**
 * Flattens a QuickBooks financial report (Balance Sheet, Income Statement, etc.)
 * from its nested structure to a 2D array suitable for SpreadsheetReportViewer
 */
export function flattenQBReportToRawData(qbData: unknown): string[][] {
  const result: string[][] = [];
  const data = qbData as QBReportData;
  
  if (!data) return result;
  
  // Add header row from columns metadata if available
  if (data.columns?.column && Array.isArray(data.columns.column)) {
    const headerRow = data.columns.column.map((c: QBColumn) => c.colTitle || '');
    if (headerRow.some(h => h)) {
      result.push(headerRow);
    }
  }
  
  // Recursively flatten nested rows
  function processRows(rows: QBRow[]) {
    for (const row of rows) {
      // Process section header
      if (row.header?.colData && Array.isArray(row.header.colData)) {
        const headerValues = row.header.colData.map((c: QBColData) => c.value || '');
        if (headerValues.some(v => v)) {
          result.push(headerValues);
        }
      }
      
      // Process data row
      if (row.colData && Array.isArray(row.colData)) {
        const rowValues = row.colData.map((c: QBColData) => c.value || '');
        if (rowValues.some(v => v)) {
          result.push(rowValues);
        }
      }
      
      // Recurse into nested sections
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        processRows(row.rows.row);
      }
      
      // Process summary/total row
      if (row.summary?.colData && Array.isArray(row.summary.colData)) {
        const summaryValues = row.summary.colData.map((c: QBColData) => c.value || '');
        if (summaryValues.some(v => v)) {
          result.push(summaryValues);
        }
      }
    }
  }
  
  // Handle different row container formats
  let rows: QBRow[] = [];
  
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if ((data.rows as { row?: QBRow[] }).row && Array.isArray((data.rows as { row?: QBRow[] }).row)) {
      rows = (data.rows as { row: QBRow[] }).row;
    }
  } else if (data.Rows) {
    if ((data.Rows as { Row?: QBRow[] }).Row && Array.isArray((data.Rows as { Row?: QBRow[] }).Row)) {
      rows = (data.Rows as { Row: QBRow[] }).Row;
    }
  }
  
  if (rows.length > 0) {
    processRows(rows);
  }
  
  return result;
}

/**
 * Parse aging bucket value based on column title
 */
function parseAgingBucket(colTitle: string): keyof ARAgingEntry | keyof APAgingEntry | null {
  const title = colTitle.toLowerCase();
  if (title.includes('current') || title === 'current') return 'current';
  if (title.includes('1-30') || title.includes('1 - 30')) return 'days1to30';
  if (title.includes('31-60') || title.includes('31 - 60')) return 'days31to60';
  if (title.includes('61-90') || title.includes('61 - 90')) return 'days61to90';
  if (title.includes('90') || title.includes('over 90') || title.includes('91+')) return 'days90plus';
  return null;
}

/**
 * Transforms QuickBooks AR Aging data to wizard format
 */
export function transformQBArAgingToWizard(qbData: unknown, periodEnd?: string): ARAgingData {
  const periodId = periodEnd 
    ? `as_of_${periodEnd.substring(0, 7)}` 
    : `as_of_${new Date().toISOString().substring(0, 7)}`;
  
  const entries: ARAgingEntry[] = [];
  const data = qbData as QBReportData;
  
  if (!data) {
    return { periodData: [{ periodId, entries: [] }], badDebtReserve: 0 };
  }
  
  // Get column metadata for bucket mapping
  const columns = data.columns?.column || [];
  const bucketMap: Map<number, keyof ARAgingEntry> = new Map();
  
  columns.forEach((col, idx) => {
    const bucket = parseAgingBucket(col.colTitle || '');
    if (bucket && bucket !== 'id' && bucket !== 'customer' && bucket !== 'total') {
      bucketMap.set(idx, bucket as keyof ARAgingEntry);
    }
  });
  
  // Extract rows
  let rows: QBRow[] = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if ((data.rows as { row?: QBRow[] }).row) {
      rows = (data.rows as { row: QBRow[] }).row;
    }
  }
  
  // Process rows
  function extractEntries(rowList: QBRow[]) {
    for (const row of rowList) {
      // Process data row
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const customerName = colData[0]?.value || '';
        
        // Skip empty or total rows
        if (!customerName || customerName.toLowerCase().includes('total')) continue;
        
        const entry: ARAgingEntry = {
          id: entries.length + 1,
          customer: customerName,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90plus: 0,
          total: 0,
        };
        
        // Use bucket map if available, otherwise use position-based mapping
        if (bucketMap.size > 0) {
          bucketMap.forEach((bucket, idx) => {
            const value = parseFloat(colData[idx]?.value || '0');
            if (!isNaN(value)) {
              (entry as any)[bucket] = value;
            }
          });
        } else {
          // Fallback position-based mapping: [Customer, Current, 1-30, 31-60, 61-90, 90+, Total]
          entry.current = parseFloat(colData[1]?.value || '0') || 0;
          entry.days1to30 = parseFloat(colData[2]?.value || '0') || 0;
          entry.days31to60 = parseFloat(colData[3]?.value || '0') || 0;
          entry.days61to90 = parseFloat(colData[4]?.value || '0') || 0;
          entry.days90plus = parseFloat(colData[5]?.value || '0') || 0;
        }
        
        entry.total = entry.current + entry.days1to30 + entry.days31to60 + entry.days61to90 + entry.days90plus;
        
        if (entry.total > 0) {
          entries.push(entry);
        }
      }
      
      // Recurse into nested sections
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractEntries(row.rows.row);
      }
    }
  }
  
  extractEntries(rows);
  
  return {
    periodData: [{ periodId, entries }],
    badDebtReserve: 0,
  };
}

/**
 * Transforms QuickBooks AP Aging data to wizard format
 */
export function transformQBApAgingToWizard(qbData: unknown, periodEnd?: string): APAgingData {
  const periodId = periodEnd 
    ? `as_of_${periodEnd.substring(0, 7)}` 
    : `as_of_${new Date().toISOString().substring(0, 7)}`;
  
  const entries: APAgingEntry[] = [];
  const data = qbData as QBReportData;
  
  if (!data) {
    return { 
      periodData: [{ periodId, entries: [] }], 
      summary: { totalAP: 0, currentAP: 0, overdueAP: 0 } 
    };
  }
  
  // Get column metadata for bucket mapping
  const columns = data.columns?.column || [];
  const bucketMap: Map<number, keyof APAgingEntry> = new Map();
  
  columns.forEach((col, idx) => {
    const bucket = parseAgingBucket(col.colTitle || '');
    if (bucket && bucket !== 'id' && bucket !== 'vendor' && bucket !== 'total') {
      bucketMap.set(idx, bucket as keyof APAgingEntry);
    }
  });
  
  // Extract rows
  let rows: QBRow[] = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if ((data.rows as { row?: QBRow[] }).row) {
      rows = (data.rows as { row: QBRow[] }).row;
    }
  }
  
  // Process rows
  function extractEntries(rowList: QBRow[]) {
    for (const row of rowList) {
      // Process data row
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const vendorName = colData[0]?.value || '';
        
        // Skip empty or total rows
        if (!vendorName || vendorName.toLowerCase().includes('total')) continue;
        
        const entry: APAgingEntry = {
          id: entries.length + 1,
          vendor: vendorName,
          current: 0,
          days1to30: 0,
          days31to60: 0,
          days61to90: 0,
          days90plus: 0,
          total: 0,
        };
        
        // Use bucket map if available, otherwise use position-based mapping
        if (bucketMap.size > 0) {
          bucketMap.forEach((bucket, idx) => {
            const value = parseFloat(colData[idx]?.value || '0');
            if (!isNaN(value)) {
              (entry as any)[bucket] = value;
            }
          });
        } else {
          // Fallback position-based mapping: [Vendor, Current, 1-30, 31-60, 61-90, 90+, Total]
          entry.current = parseFloat(colData[1]?.value || '0') || 0;
          entry.days1to30 = parseFloat(colData[2]?.value || '0') || 0;
          entry.days31to60 = parseFloat(colData[3]?.value || '0') || 0;
          entry.days61to90 = parseFloat(colData[4]?.value || '0') || 0;
          entry.days90plus = parseFloat(colData[5]?.value || '0') || 0;
        }
        
        entry.total = entry.current + entry.days1to30 + entry.days31to60 + entry.days61to90 + entry.days90plus;
        
        if (entry.total > 0) {
          entries.push(entry);
        }
      }
      
      // Recurse into nested sections
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractEntries(row.rows.row);
      }
    }
  }
  
  extractEntries(rows);
  
  // Calculate summary
  const totalAP = entries.reduce((sum, e) => sum + e.total, 0);
  const currentAP = entries.reduce((sum, e) => sum + e.current, 0);
  const overdueAP = totalAP - currentAP;
  
  return {
    periodData: [{ periodId, entries }],
    summary: { totalAP, currentAP, overdueAP },
  };
}

/**
 * Transforms QuickBooks customer concentration data to wizard format
 */
export function transformQBCustomersToWizard(
  qbData: unknown, 
  periodStart?: string, 
  periodEnd?: string
): TopCustomersData {
  if (!qbData) {
    return { customers: [], totalRevenue: 0 };
  }

  // Determine year label from period
  const year = periodEnd ? periodEnd.substring(0, 4) : new Date().getFullYear().toString();

  // Handle flat-array format: [{customerName, revenue, percentage}]
  if (Array.isArray(qbData)) {
    const items = (qbData as any[]).filter(item => item.customerName);
    const total = items.reduce((s: number, item: any) => s + (item.revenue || 0), 0);
    return {
      customers: items.sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 10).map((item: any, idx: number) => ({
        id: idx + 1,
        name: item.customerName,
        yearlyRevenue: { [year]: item.revenue || 0 },
      })),
      totalRevenue: Math.abs(total),
    };
  }

  const customers: Record<string, unknown>[] = [];
  const data = qbData as QBReportData;
  
  let totalRevenue = 0;
  
  // Extract rows
  let rows: QBRow[] = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if ((data.rows as { row?: QBRow[] }).row) {
      rows = (data.rows as { row: QBRow[] }).row;
    }
  }
  
  // Process rows
  function extractCustomers(rowList: QBRow[]) {
    for (const row of rowList) {
      // Process data row
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const customerName = colData[0]?.value || '';
        
        // Skip empty or total rows
        if (!customerName || customerName.toLowerCase().includes('total')) continue;
        
        const amount = parseFloat(colData[1]?.value || '0') || 0;
        
        if (amount !== 0) {
          totalRevenue += amount;
          customers.push({
            id: customers.length + 1,
            name: customerName,
            yearlyRevenue: { [year]: amount },
          });
        }
      }
      
      // Recurse into nested sections
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractCustomers(row.rows.row);
      }
    }
  }
  
  extractCustomers(rows);
  
  // Sort by revenue (descending) and take top 10
  customers.sort((a, b) => {
    const aRev = Object.values((a.yearlyRevenue as Record<string, number>) || {})[0] || 0;
    const bRev = Object.values((b.yearlyRevenue as Record<string, number>) || {})[0] || 0;
    return bRev - aRev;
  });
  
  return {
    customers: customers.slice(0, 10),
    totalRevenue: Math.abs(totalRevenue),
  };
}

/**
 * Transforms QuickBooks vendor concentration data to wizard format
 */
export function transformQBVendorsToWizard(
  qbData: unknown, 
  periodStart?: string, 
  periodEnd?: string
): TopVendorsData {
  if (!qbData) {
    return { vendors: [], totalSpend: 0 };
  }

  // Determine year label from period
  const year = periodEnd ? periodEnd.substring(0, 4) : new Date().getFullYear().toString();

  // Handle flat-array format: [{vendorName, payments, percentage}]
  if (Array.isArray(qbData)) {
    const items = (qbData as any[]).filter(item => item.vendorName);
    const total = items.reduce((s: number, item: any) => s + (item.payments || 0), 0);
    return {
      vendors: items.sort((a, b) => (b.payments || 0) - (a.payments || 0)).slice(0, 10).map((item: any, idx: number) => ({
        id: idx + 1,
        name: item.vendorName,
        yearlySpend: { [year]: item.payments || 0 },
        isRelatedParty: false,
      })),
      totalSpend: Math.abs(total),
    };
  }

  const vendors: Record<string, unknown>[] = [];
  const data = qbData as QBReportData;
  
  let totalSpend = 0;
  
  // Extract rows
  let rows: QBRow[] = [];
  if (data.rows) {
    if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if ((data.rows as { row?: QBRow[] }).row) {
      rows = (data.rows as { row: QBRow[] }).row;
    }
  }
  
  // Process rows
  function extractVendors(rowList: QBRow[]) {
    for (const row of rowList) {
      // Process data row
      if (row.colData && Array.isArray(row.colData) && row.colData.length >= 2) {
        const colData = row.colData;
        const vendorName = colData[0]?.value || '';
        
        // Skip empty or total rows
        if (!vendorName || vendorName.toLowerCase().includes('total')) continue;
        
        const amount = parseFloat(colData[1]?.value || '0') || 0;
        
        if (amount !== 0) {
          totalSpend += amount;
          vendors.push({
            id: vendors.length + 1,
            name: vendorName,
            yearlySpend: { [year]: amount },
            isRelatedParty: false,
          });
        }
      }
      
      // Recurse into nested sections
      if (row.rows?.row && Array.isArray(row.rows.row)) {
        extractVendors(row.rows.row);
      }
    }
  }
  
  extractVendors(rows);
  
  // Sort by spend (descending) and take top 10
  vendors.sort((a, b) => {
    const aSpend = Object.values((a.yearlySpend as Record<string, number>) || {})[0] || 0;
    const bSpend = Object.values((b.yearlySpend as Record<string, number>) || {})[0] || 0;
    return bSpend - aSpend;
  });
  
  return {
    vendors: vendors.slice(0, 10),
    totalSpend: Math.abs(totalSpend),
  };
}

// Journal Entries interfaces
export interface JELine {
  accountName: string;
  accountId: string;
  amount: number;
  postingType: string;
}

export interface JournalEntry {
  id: string;
  txnDate: string;
  totalAmount: number;
  isAdjustment: boolean;
  memo: string;
  lines: JELine[];
}

export interface JournalEntriesData {
  entries: JournalEntry[];
  totalCount: number;
  syncSource?: string;
  lastSyncDate?: string;
}

/**
 * Transforms raw QB journal entries data from processed_data to wizard format
 */
export function transformQBJournalEntriesToWizard(qbData: unknown): JournalEntriesData {
  const data = qbData as { data?: unknown[]; count?: number };
  const rawEntries = data.data || [];

  const entries: JournalEntry[] = (rawEntries as Record<string, unknown>[]).map((je) => {
    const lines: JELine[] = ((je.line || []) as Record<string, unknown>[]).map((line) => {
      const detail = (line.journalEntryLineDetail || {}) as Record<string, unknown>;
      const accountRef = (detail.accountRef || {}) as Record<string, unknown>;
      return {
        accountName: String(accountRef.name || ""),
        accountId: String(accountRef.value || ""),
        amount: Number(line.amount) || 0,
        postingType: String(detail.postingType || ""),
      };
    });

    let txnDate = String(je.txnDate || "");
    try {
      const parsed = new Date(txnDate);
      if (!isNaN(parsed.getTime())) {
        txnDate = parsed.toISOString().substring(0, 10);
      }
    } catch { /* keep original */ }

    const totalDebit = lines.filter(l => l.postingType === "DEBIT").reduce((s, l) => s + l.amount, 0);

    return {
      id: String(je.id || ""),
      txnDate,
      totalAmount: totalDebit,
      isAdjustment: !!(je.adjustment),
      memo: String((je as Record<string, unknown>).privateNote || (je as Record<string, unknown>).description || ""),
      lines,
    };
  });

  entries.sort((a, b) => b.txnDate.localeCompare(a.txnDate));

  return {
    entries,
    totalCount: entries.length,
  };
}
