import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import { inferFsTypeFromName, inferCategoryFromName, mapAccountToFields, mapAccountTypeToFsType } from "../_shared/qbAccountMappings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ProcessRequest {
  documentId: string;
}

// Map document categories to qbToJson API endpoints
function getQbToJsonEndpoint(category: string): string {
  const endpoints: Record<string, string> = {
    // Core Financial Statements
    'chart_of_accounts': '/api/convert/accounts',
    'balance_sheet': '/api/convert/balance-sheet',
    'income_statement': '/api/convert/profit-loss',
    'profit_loss': '/api/convert/profit-loss',
    'trial_balance': '/api/convert/trial-balance',
    'cash_flow': '/api/convert/cash-flow',
    
    // Detailed Records
    'general_ledger': '/api/convert/general-ledger',
    'journal_entries': '/api/convert/journal-entries',
    'accounts_payable': '/api/convert/accounts-payable',
    'accounts_receivable': '/api/convert/accounts-receivable',
    'customer_concentration': '/api/convert/customer-concentration',
    'vendor_concentration': '/api/convert/vendor-concentration',
  };
  
  return endpoints[category] || '/api/convert/trial-balance';
}

// Map category to data_type for processed_data table
function getDataType(category: string): string {
  const mapping: Record<string, string> = {
    'profit_loss': 'income_statement',
    // All others map directly
  };
  
  return mapping[category] || category;
}

// Calculate record count based on document type and data structure
function getRecordCount(data: unknown, category: string): number {
  if (Array.isArray(data)) {
    return data.length;
  }
  
  if (typeof data !== 'object' || data === null) {
    return 1;
  }
  
  const dataObj = data as Record<string, unknown>;
  
  if (category === 'trial_balance' && dataObj.monthlyReports) {
    return Array.isArray(dataObj.monthlyReports) ? dataObj.monthlyReports.length : 1;
  }
  
  if (category === 'general_ledger' && dataObj.rows) {
    const rows = dataObj.rows as Record<string, unknown>;
    if (rows.row) {
      return Array.isArray(rows.row) ? rows.row.length : 1;
    }
  }
  
  if (category === 'chart_of_accounts' && dataObj.accounts) {
    return Array.isArray(dataObj.accounts) ? dataObj.accounts.length : 1;
  }
  
  return 1;
}

// Subtype-based accountType corrections
// When Java qbToJson misclassifies accountType (returns "EXPENSE" for everything),
// use the accountSubType to determine the correct accountType
const SUBTYPE_TO_CORRECT_TYPE: Record<string, string> = {
  // Bank / Cash
  'Checking': 'BANK',
  'Savings': 'BANK',
  'MoneyMarket': 'BANK',
  'CashOnHand': 'BANK',
  'CashAndCashEquivalents': 'BANK',
  'TrustAccounts': 'BANK',
  // Accounts Receivable
  'AccountsReceivable(AR)': 'ACCOUNTS_RECEIVABLE',
  'AccountsReceivable': 'ACCOUNTS_RECEIVABLE',
  // Accounts Payable
  'AccountsPayable(AP)': 'ACCOUNTS_PAYABLE',
  'AccountsPayable': 'ACCOUNTS_PAYABLE',
  // Credit Card
  'CreditCard': 'CREDIT_CARD',
  // Other Current Asset
  'AllowanceForBadDebts': 'OTHER_CURRENT_ASSET',
  'Inventory': 'OTHER_CURRENT_ASSET',
  'PrepaidExpenses': 'OTHER_CURRENT_ASSET',
  'UndepositedFunds': 'OTHER_CURRENT_ASSET',
  'OtherCurrentAssets': 'OTHER_CURRENT_ASSET',
  'LoansToOfficers': 'OTHER_CURRENT_ASSET',
  'RetainageReceivable': 'OTHER_CURRENT_ASSET',
  'EmployeeCashAdvances': 'OTHER_CURRENT_ASSET',
  // Fixed Asset
  'FurnitureAndFixtures': 'FIXED_ASSET',
  'MachineryAndEquipment': 'FIXED_ASSET',
  'Buildings': 'FIXED_ASSET',
  'LeaseholdImprovements': 'FIXED_ASSET',
  'Vehicles': 'FIXED_ASSET',
  'Land': 'FIXED_ASSET',
  'AccumulatedDepreciation': 'FIXED_ASSET',
  'DepletableAssets': 'FIXED_ASSET',
  'OtherFixedAssets': 'FIXED_ASSET',
  // Other Asset
  'Goodwill': 'OTHER_ASSET',
  'IntangibleAssets': 'OTHER_ASSET',
  'OtherAsset': 'OTHER_ASSET',
  'LicensesAndPermits': 'OTHER_ASSET',
  'SecurityDeposits': 'OTHER_ASSET',
  'OrganizationalCosts': 'OTHER_ASSET',
  'AccumulatedAmortization': 'OTHER_ASSET',
  // Current Liability
  'LineOfCredit': 'CURRENT_LIABILITY',
  'OtherCurrentLiabilities': 'CURRENT_LIABILITY',
  'PayrollClearing': 'CURRENT_LIABILITY',
  'PayrollTaxPayable': 'CURRENT_LIABILITY',
  'SalesTaxPayable': 'CURRENT_LIABILITY',
  'PrepaidExpensesPayable': 'CURRENT_LIABILITY',
  'InsurancePayable': 'CURRENT_LIABILITY',
  'GlobalTaxPayable': 'CURRENT_LIABILITY',
  'CurrentPortionOfObligationsUnderFinanceLeases': 'CURRENT_LIABILITY',
  'TrustAccountsLiabilities': 'CURRENT_LIABILITY',
  // Long-Term Liability
  'NotesPayable': 'LONG_TERM_LIABILITY',
  'ShareholderNotesPayable': 'LONG_TERM_LIABILITY',
  'OtherLongTermLiabilities': 'LONG_TERM_LIABILITY',
  'ObligationsUnderFinanceLeases': 'LONG_TERM_LIABILITY',
  // Equity
  'OpeningBalanceEquity': 'EQUITY',
  'RetainedEarnings': 'EQUITY',
  'OwnersEquity': 'EQUITY',
  'AccumulatedAdjustment': 'EQUITY',
  'PaidInCapitalOrSurplus': 'EQUITY',
  'PartnerContributions': 'EQUITY',
  'PartnerDistributions': 'EQUITY',
  'EstimatedTaxes': 'EQUITY',
  'PersonalExpense': 'EQUITY',
  'PersonalIncome': 'EQUITY',
  'HealthInsurance': 'EQUITY',
  'CommonStock': 'EQUITY',
  'PreferredStock': 'EQUITY',
  'TreasuryStock': 'EQUITY',
};

// Enrich COA accounts with deterministic 154-row mapping before storage
function enrichCoaAccounts(data: unknown): unknown {
  // Extract accounts array from various response shapes
  let accounts: any[];
  if (Array.isArray(data)) {
    accounts = data;
  } else if (typeof data === 'object' && data !== null) {
    const obj = data as Record<string, unknown>;
    accounts = (obj.accounts || obj.Accounts) as any[] || [];
  } else {
    return data; // Can't enrich, pass through
  }

  if (!Array.isArray(accounts) || accounts.length === 0) {
    return data;
  }

  let correctionCount = 0;
  const enriched = accounts.map(acc => {
    let accountType = acc.accountType || acc.AccountType || acc.classification || '';
    const accountSubtype = acc.accountSubType || acc.accountSubtype || acc.subtype || '';

    // Correct misclassified accountType using subtype when Java service gives wrong type
    const correctedType = SUBTYPE_TO_CORRECT_TYPE[accountSubtype];
    if (correctedType && accountType === 'EXPENSE') {
      console.log(`[enrichCoaAccounts] Correcting ${acc.name || acc.Name}: ${accountType} -> ${correctedType} (subtype: ${accountSubtype})`);
      accountType = correctedType;
      correctionCount++;
    }

    const mapped = mapAccountToFields(accountType, accountSubtype);
    const fsType = mapAccountTypeToFsType(accountType);

    return {
      ...acc,
      fsType,
      fsLineItem: mapped.fsLineItem,
      category: mapped.fsLineItem,
      subAccount1: mapped.subAccount1,
      subAccount2: mapped.subAccount2,
      subAccount3: mapped.subAccount3,
      _rawAccountType: accountType,
      _rawAccountSubtype: accountSubtype,
    };
  });

  console.log(`[enrichCoaAccounts] Enriched ${enriched.length} accounts (${correctionCount} subtype-corrected)`);

  if (Array.isArray(data)) {
    return enriched;
  }
  return { ...(data as object), accounts: enriched };
}

// Extract period dates from parsed qbToJson data
// Phase 2: Prefer header dates (now reliable from qbToJson), fallback to transaction scan
function extractPeriodDates(data: unknown, category: string): { 
  periodStart: string | null; 
  periodEnd: string | null; 
} {
  if (typeof data !== 'object' || data === null) {
    return { periodStart: null, periodEnd: null };
  }
  
  const dataObj = data as Record<string, unknown>;
  
  // Trial Balance: has monthlyReports array with reportDate/endDate/header.endPeriod fields
  if (category === 'trial_balance' && Array.isArray(dataObj.monthlyReports)) {
    const reports = dataObj.monthlyReports as Array<{
      reportDate?: string;
      endDate?: string;
      report?: { header?: { endPeriod?: string; startPeriod?: string } };
    }>;
    if (reports.length > 0) {
      const dates = reports
        .map(r => r.reportDate || r.endDate || r.report?.header?.endPeriod)
        .filter((d): d is string => !!d)
        .sort();
      
      if (dates.length > 0) {
        console.log(`[extractPeriodDates] Trial balance dates: ${dates[0]} to ${dates[dates.length - 1]}`);
        return { 
          periodStart: dates[0], 
          periodEnd: dates[dates.length - 1] 
        };
      }
    }
  }
  
  // Balance Sheet: has asOfDate
  if ((category === 'balance_sheet') && dataObj.asOfDate) {
    console.log(`[extractPeriodDates] Balance sheet asOfDate: ${dataObj.asOfDate}`);
    return { 
      periodStart: null, 
      periodEnd: dataObj.asOfDate as string 
    };
  }
  
  // Income Statement / P&L: has startDate and endDate
  if ((category === 'income_statement' || category === 'profit_loss')) {
    const startDate = dataObj.startDate as string | undefined;
    const endDate = dataObj.endDate as string | undefined;
    if (startDate || endDate) {
      console.log(`[extractPeriodDates] P&L dates: ${startDate} to ${endDate}`);
      return { 
        periodStart: startDate || null, 
        periodEnd: endDate || null 
      };
    }
  }
  
  // Cash Flow: similar to P&L
  if (category === 'cash_flow') {
    const startDate = dataObj.startDate as string | undefined;
    const endDate = dataObj.endDate as string | undefined;
    if (startDate || endDate) {
      console.log(`[extractPeriodDates] Cash flow dates: ${startDate} to ${endDate}`);
      return { 
        periodStart: startDate || null, 
        periodEnd: endDate || null 
      };
    }
  }
  
  // General Ledger: PREFER header dates (qbToJson now provides reliable dates)
  // Only fallback to transaction scan if header is missing
  if (category === 'general_ledger') {
    // Phase 2 fix: Check header dates FIRST (now reliable from qbToJson-00015)
    if (dataObj.header && typeof dataObj.header === 'object') {
      const header = dataObj.header as Record<string, unknown>;
      const startPeriod = header.startPeriod as string | undefined;
      const endPeriod = header.endPeriod as string | undefined;
      
      if (startPeriod && endPeriod) {
        console.log(`[extractPeriodDates] GL header dates (preferred): ${startPeriod} to ${endPeriod}`);
        return { 
          periodStart: startPeriod, 
          periodEnd: endPeriod 
        };
      }
    }
    
    // Fallback: scan transaction dates only if header is missing
    const dates: string[] = [];
    
    try {
      const rows = dataObj.rows as { row?: Array<{ rows?: { row?: Array<{ colData?: Array<{ value?: string }> }> } }> } | undefined;
      if (rows?.row) {
        for (const accountGroup of rows.row) {
          if (accountGroup.rows?.row) {
            for (const txn of accountGroup.rows.row) {
              const dateValue = txn.colData?.[0]?.value;
              if (dateValue && /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                dates.push(dateValue);
              }
            }
          }
        }
      }
    } catch (e) {
      console.log(`[extractPeriodDates] Error parsing GL dates: ${e}`);
    }
    
    if (dates.length > 0) {
      const normalizedDates = dates.map(d => {
        if (d.includes('/')) {
          const [month, day, year] = d.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return d;
      }).sort();
      
      console.log(`[extractPeriodDates] GL transaction dates (fallback): ${normalizedDates[0]} to ${normalizedDates[normalizedDates.length - 1]} (from ${dates.length} transactions)`);
      return { 
        periodStart: normalizedDates[0], 
        periodEnd: normalizedDates[normalizedDates.length - 1] 
      };
    }
  }
  
  // AP/AR Aging: typically has asOfDate
  if ((category === 'accounts_payable' || category === 'accounts_receivable') && dataObj.asOfDate) {
    console.log(`[extractPeriodDates] AP/AR asOfDate: ${dataObj.asOfDate}`);
    return { 
      periodStart: null, 
      periodEnd: dataObj.asOfDate as string 
    };
  }
  
  console.log(`[extractPeriodDates] No dates found for category: ${category}`);
  return { periodStart: null, periodEnd: null };
}

// Phase 3: Derive COA from GL data as fallback
interface DerivedAccount {
  accountName: string;
  accountNumber: string | null;
  fsType: 'BS' | 'IS';
  category: string;
}

// Known column headers that are NOT accounts - filter these out
const COLUMN_HEADERS = new Set([
  'date', 'type', 'date type', 'account', 'num', 'name', 'memo', 'split',
  'amount', 'balance', 'debit', 'credit', 'description', 'reference', 'class',
  'transaction type', 'doc number', 'customer', 'vendor', 'item', 'quantity',
  'rate', 'sales price', 'cost', 'category', 'location', 'department'
]);

function deriveCoaFromGlData(glData: unknown): DerivedAccount[] {
  if (typeof glData !== 'object' || glData === null) {
    console.log(`[deriveCoaFromGlData] Invalid glData: not an object`);
    return [];
  }
  
  const accounts: DerivedAccount[] = [];
  const seenAccounts = new Set<string>();
  
  const dataObj = glData as Record<string, unknown>;
  const rows = dataObj.rows as { row?: Array<{ header?: { colData?: Array<{ value?: string }> }, type?: string }> } | undefined;
  
  if (!rows?.row) {
    console.log(`[deriveCoaFromGlData] No rows.row found in GL data`);
    return [];
  }
  
  console.log(`[deriveCoaFromGlData] Processing ${rows.row.length} row groups`);
  
  for (const accountGroup of rows.row) {
    // FIX: Case-insensitive check for "Section" type (qbToJson returns "SECTION")
    const groupType = accountGroup.type?.toUpperCase();
    if (groupType !== 'SECTION' || !accountGroup.header?.colData?.[0]?.value) {
      continue;
    }
    
    const headerValue = accountGroup.header.colData[0].value;
    
    // Skip known column headers (case-insensitive)
    if (COLUMN_HEADERS.has(headerValue.toLowerCase().trim())) {
      console.log(`[deriveCoaFromGlData] Skipping column header: ${headerValue}`);
      continue;
    }
    
    // Skip entries that start with parentheses (incomplete account names like "(5557) - 1")
    if (headerValue.startsWith('(')) {
      console.log(`[deriveCoaFromGlData] Skipping incomplete entry: ${headerValue}`);
      continue;
    }
    
    // Remove trailing suffixes like "- 1", "- 2" before parsing
    const cleanedHeader = headerValue.replace(/\s*-\s*\d+$/, '').trim();
    
    // Try to parse "Account Name (1234)" pattern first
    const matchWithNumber = cleanedHeader.match(/^(.+?)\s*\((\d+)\)$/);
    
    let accountName: string;
    let accountNumber: string | null;
    
    if (matchWithNumber) {
      accountName = matchWithNumber[1].trim();
      accountNumber = matchWithNumber[2];
    } else {
      // Accept accounts without numbers if they pass other validation
      // (already filtered column headers above)
      accountName = cleanedHeader;
      accountNumber = null;
    }
    
    // Skip if account name is too short or just numbers
    if (accountName.length < 2 || /^\d+$/.test(accountName)) {
      console.log(`[deriveCoaFromGlData] Skipping invalid account name: ${accountName}`);
      continue;
    }
    
    // Skip if we've seen this account
    const key = accountNumber || accountName.toLowerCase();
    if (seenAccounts.has(key)) continue;
    seenAccounts.add(key);
    
    // Infer fsType and category using shared module
    const fsType = inferFsTypeFromName(accountName);
    const category = inferCategoryFromName(accountName, fsType);
    
    console.log(`[deriveCoaFromGlData] Found account: ${accountName} (${accountNumber}) - ${fsType}/${category}`);
    
    accounts.push({
      accountName,
      accountNumber,
      fsType,
      category
    });
  }
  
  console.log(`[deriveCoaFromGlData] ✅ Derived ${accounts.length} accounts from GL structure`);
  return accounts;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let documentIdForError: string | null = null;

  try {
    const { documentId } = await req.json() as ProcessRequest;
    documentIdForError = documentId;
    
    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "documentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const qbToJsonApiUrl = Deno.env.get("QBTOJSON_API_URL")?.trim().replace(/\/+$/, "");
    const qbToJsonApiKey = Deno.env.get("QBTOJSON_API_KEY")?.trim();
    const dbProxyApiKey = Deno.env.get("QB_AUTH_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[process-quickbooks-file] Processing document: ${documentId}`);

    // 1. Get document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      console.error("[process-quickbooks-file] Document not found:", docError);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const category = doc.category || doc.account_type;
    console.log(`[process-quickbooks-file] Processing: ${doc.name}, category: ${category}`);

    // 2. Check if qbToJson API is configured
    if (!qbToJsonApiUrl || !qbToJsonApiKey) {
      console.log("[process-quickbooks-file] qbToJson API not configured");
      
      await supabase
        .from('documents')
        .update({
          processing_status: "pending",
          parsed_summary: { note: "qbToJson API not configured" }
        })
        .eq('id', documentId);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "qbToJson API not configured",
          documentId 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: "processing" })
      .eq('id', documentId);

    // 4. Download file directly from storage
    console.log(`[process-quickbooks-file] Downloading file: ${doc.file_path}`);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(doc.file_path);

    if (downloadError || !fileData) {
      console.error("[process-quickbooks-file] Failed to download file:", downloadError);
      
      await supabase
        .from('documents')
        .update({
          processing_status: "failed",
          parsed_summary: { error: "Failed to download file from storage" }
        })
        .eq('id', documentId);

      throw new Error("Failed to download file from storage");
    }

    console.log(`[process-quickbooks-file] File downloaded, size: ${fileData.size} bytes`);

    // 5. Fetch project periods to determine date range for the conversion API
    let projectStartDate: string | null = null;
    let projectEndDate: string | null = null;

    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('periods')
        .eq('id', doc.project_id)
        .single();

      if (!projectError && project?.periods && Array.isArray(project.periods)) {
        const allPeriods = project.periods as Array<{ year?: number; month?: number; startDate?: string; endDate?: string; isStub?: boolean }>;
        
        // Derive dates from year/month (regular periods) or startDate/endDate (stub periods)
        const derivedDates: { start: string; end: string }[] = [];
        for (const p of allPeriods) {
          if (p.startDate && p.endDate) {
            derivedDates.push({ start: p.startDate, end: p.endDate });
          } else if (p.year && p.month) {
            const startStr = `${p.year}-${String(p.month).padStart(2, '0')}-01`;
            // Last day of month
            const lastDay = new Date(p.year, p.month, 0).getDate();
            const endStr = `${p.year}-${String(p.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
            derivedDates.push({ start: startStr, end: endStr });
          }
        }
        
        const starts = derivedDates.map(d => d.start).sort();
        const ends = derivedDates.map(d => d.end).sort();

        if (starts.length > 0) projectStartDate = starts[0];
        if (ends.length > 0) projectEndDate = ends[ends.length - 1];

        console.log(`[process-quickbooks-file] Project date range from ${allPeriods.length} periods: ${projectStartDate} → ${projectEndDate}`);
      } else {
        console.log(`[process-quickbooks-file] Could not fetch project periods:`, projectError?.message || 'no periods');
      }
    } catch (e) {
      console.log(`[process-quickbooks-file] Error fetching project periods:`, e);
    }

    // 6. Call qbToJson API with file as multipart/form-data
    const endpoint = getQbToJsonEndpoint(category);
    console.log(`[process-quickbooks-file] Calling qbToJson: ${qbToJsonApiUrl}${endpoint}`);
    const keyPreview = qbToJsonApiKey ? `${qbToJsonApiKey.substring(0, 8)}...` : 'MISSING';
    console.log(`[process-quickbooks-file] API key configured: ${!!qbToJsonApiKey}, length: ${qbToJsonApiKey?.length || 0}, preview: ${keyPreview}`);

    const formData = new FormData();
    formData.append("file", fileData, doc.name);

    // Pass project date range so the conversion API extracts all months
    if (projectStartDate) {
      formData.append("start_date", projectStartDate);
      console.log(`[process-quickbooks-file] Added start_date: ${projectStartDate}`);
    }
    if (projectEndDate) {
      formData.append("end_date", projectEndDate);
      console.log(`[process-quickbooks-file] Added end_date: ${projectEndDate}`);
    }

    // Use plain object for headers - Headers class may not serialize correctly with FormData
    const requestUrl = `${qbToJsonApiUrl}${endpoint}`;
    console.log(`[process-quickbooks-file] Sending x-api-key header (length: ${qbToJsonApiKey?.length})`);
    
    const qbResponse = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "x-api-key": qbToJsonApiKey!,
      },
      body: formData,
    });

    // Debug: log redirect and response info
    console.log(`[process-quickbooks-file] Response URL: ${qbResponse.url}, redirected: ${qbResponse.redirected}, status: ${qbResponse.status}`);

    if (!qbResponse.ok) {
      const errorText = await qbResponse.text();
      console.error("[process-quickbooks-file] qbToJson API error:", qbResponse.status, errorText);
      
      const errorSummary = { 
        error: `qbToJson API error: ${errorText}`,
        status: qbResponse.status 
      };
      
      await supabase
        .from('documents')
        .update({
          processing_status: "failed",
          parsed_summary: errorSummary
        })
        .eq('id', documentId);

      // Return proper 401 status if authentication failed
      if (qbResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "qbToJson authentication failed", 
            details: errorText 
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`qbToJson API error: ${errorText}`);
    }

    const result = await qbResponse.json();
    
    // Phase 1: Enhanced logging - capture full qbToJson response structure
    console.log("[process-quickbooks-file] qbToJson response keys:", Object.keys(result));
    console.log("[process-quickbooks-file] qbToJson response received:", JSON.stringify({
      success: result.success,
      hasData: !!result.data,
      coaDerived: result.coa_derived || false,
      derivedCoaExists: !!result.derived_coa,
      derivedCount: result.derived_count,
      logs: result.logs,
      warnings: result.warnings,
      revision: result.revision,
    }));
    
    if (!result.success) {
      const errorMsg = result.error || "Conversion failed";
      console.error("[process-quickbooks-file] Conversion failed:", errorMsg);
      
      await supabase
        .from('documents')
        .update({
          processing_status: "failed",
          parsed_summary: { error: errorMsg }
        })
        .eq('id', documentId);

      throw new Error(errorMsg);
    }

    const convertedData = result.data;
    const recordCount = getRecordCount(convertedData, category);
    const dataType = getDataType(category);
    const { periodStart, periodEnd } = extractPeriodDates(convertedData, category);
    
    // Enrich COA accounts with deterministic mapping before storage
    let dataToSave = convertedData;
    if (category === 'chart_of_accounts') {
      console.log('[process-quickbooks-file] Enriching COA with mapAccountToFields...');
      dataToSave = enrichCoaAccounts(convertedData);
    }
    
    let coaDerived = result.coa_derived || false;
    let derivedCount = result.derived_count || 
      (result.derived_coa?.accounts ? result.derived_coa.accounts.length : 0);

    console.log(`[process-quickbooks-file] Extracted period: ${periodStart} to ${periodEnd}, coaDerived: ${coaDerived}`);

    // Determine source_type based on whether COA was derived from GL
    const sourceType = coaDerived ? 'derived_from_gl' : 'qbtojson';

    // 6. Save to processed_data via db-proxy
    console.log(`[process-quickbooks-file] Saving to processed_data: data_type=${dataType}, records=${recordCount}`);
    
    const saveResponse = await fetch(`${supabaseUrl}/functions/v1/db-proxy`, {
      method: "POST",
      headers: {
        "x-api-key": dbProxyApiKey || "",
        "x-service-name": "process-quickbooks-file",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "query",
        table: "processed_data",
        operation: "insert",
        data: {
          project_id: doc.project_id,
          user_id: doc.user_id,
          source_type: sourceType,
          data_type: dataType,
          source_document_id: documentId,
          data: dataToSave,
          record_count: recordCount,
          period_start: periodStart,
          period_end: periodEnd,
          validation_status: "pending"
        }
      })
    });

    const saveData = await saveResponse.json();
    
    if (!saveData.success) {
      console.error("[process-quickbooks-file] Failed to save to processed_data:", saveData.error);
      // Don't throw - we still want to update the document status
    } else {
      console.log("[process-quickbooks-file] Successfully saved to processed_data");
    }

    // Log if COA was auto-derived by qbToJson API
    if (coaDerived) {
      console.log(`[process-quickbooks-file] ✅ COA auto-derived by qbToJson API: ${derivedCount} accounts saved to database`);
    }
    
    // Phase 3: Fallback COA derivation if qbToJson didn't do it and this is a GL upload
    if (!coaDerived && category === 'general_ledger') {
      console.log(`[process-quickbooks-file] qbToJson did not derive COA, attempting fallback derivation...`);
      
      // Check if COA already exists for this project
      const coaCheckResponse = await fetch(`${supabaseUrl}/functions/v1/db-proxy`, {
        method: "POST",
        headers: {
          "x-api-key": dbProxyApiKey || "",
          "x-service-name": "process-quickbooks-file",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "query",
          table: "processed_data",
          operation: "select",
          filters: { 
            project_id: doc.project_id,
            data_type: "chart_of_accounts"
          },
          select: "id"
        })
      });
      
      const coaCheckData = await coaCheckResponse.json();
      const existingCoaCount = coaCheckData.data?.length || 0;
      
      if (existingCoaCount === 0) {
        console.log(`[process-quickbooks-file] No COA exists, deriving from GL structure...`);
        
        const derivedAccounts = deriveCoaFromGlData(convertedData);
        
        if (derivedAccounts.length > 0) {
          // Save derived COA
          const coaSaveResponse = await fetch(`${supabaseUrl}/functions/v1/db-proxy`, {
            method: "POST",
            headers: {
              "x-api-key": dbProxyApiKey || "",
              "x-service-name": "process-quickbooks-file",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              action: "query",
              table: "processed_data",
              operation: "insert",
              data: {
                project_id: doc.project_id,
                user_id: doc.user_id,
                source_type: "derived_from_gl",
                data_type: "chart_of_accounts",
                source_document_id: documentId,
                data: { accounts: derivedAccounts },
                record_count: derivedAccounts.length,
                period_start: periodStart,
                period_end: periodEnd,
                validation_status: "pending"
              }
            })
          });
          
          const coaSaveData = await coaSaveResponse.json();
          
          if (coaSaveData.success) {
            console.log(`[process-quickbooks-file] ✅ Fallback COA derived and saved: ${derivedAccounts.length} accounts`);
            coaDerived = true;
            derivedCount = derivedAccounts.length;
          } else {
            console.error(`[process-quickbooks-file] Failed to save fallback COA:`, coaSaveData.error);
          }
        } else {
          console.log(`[process-quickbooks-file] Could not derive accounts from GL structure`);
        }
      } else {
        console.log(`[process-quickbooks-file] COA already exists (${existingCoaCount} records), skipping fallback derivation`);
      }
    }

    // 7. Update document status with period dates and enhanced debug info
    await supabase
      .from('documents')
      .update({ 
        processing_status: "completed",
        period_start: periodStart,
        period_end: periodEnd,
        parsed_summary: {
          record_count: recordCount,
          data_type: dataType,
          period_start: periodStart,
          period_end: periodEnd,
          processed_at: new Date().toISOString(),
          source: "qbtojson",
          coa_derived: coaDerived,
          derived_count: coaDerived ? derivedCount : undefined,
          // Phase 1: Debug info for qbToJson response
          qbtojson_revision: result.revision,
          qbtojson_coa_flags: {
            coa_derived_response: result.coa_derived,
            derived_coa_exists: !!result.derived_coa,
            derived_count_response: result.derived_count,
            fallback_used: !result.coa_derived && coaDerived
          }
        }
      })
      .eq('id', documentId);

    console.log(`[process-quickbooks-file] Successfully processed document ${documentId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        dataType,
        recordCount,
        coaDerived,
        derivedCount: coaDerived ? derivedCount : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[process-quickbooks-file] Error:", error);
    
    // Try to update document status to failed
    if (documentIdForError) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        await supabase
          .from('documents')
          .update({ processing_status: "failed" })
          .eq('id', documentIdForError);
      } catch (e) {
        console.error("[process-quickbooks-file] Failed to update error status:", e);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
