// insights-chat v5 — OpenAI direct (gpt-4o-mini classifier, gpt-4o orchestrator), streaming restored
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ============================================================
// SHARED DATA PARSING UTILITIES
// ============================================================

function extractFromQBRows(rows: any, groupName: string): number | null {
  if (!rows?.row) return null;
  for (const row of rows.row) {
    if (row.group === groupName && row.summary?.colData) {
      const valueCol = row.summary.colData.find((c: any) =>
        c.value && !isNaN(parseFloat(String(c.value).replace(/[,$]/g, '')))
      );
      if (valueCol) return parseFloat(String(valueCol.value).replace(/[,$]/g, ''));
    }
    if (row.rows) {
      const nested = extractFromQBRows(row.rows, groupName);
      if (nested !== null) return nested;
    }
  }
  return null;
}

function parseQuickBooksReport(data: any): Record<string, number> {
  const values: Record<string, number> = {};
  function traverseRows(rows: any) {
    if (!rows?.row) return;
    for (const row of rows.row) {
      if (row.group && row.summary?.colData) {
        const valueCol = row.summary.colData.find((c: any) =>
          c.value && !isNaN(parseFloat(String(c.value).replace(/[,$]/g, '')))
        );
        if (valueCol) {
          values[row.group] = parseFloat(String(valueCol.value).replace(/[,$]/g, ''));
        }
      }
      if (row.rows) traverseRows(row.rows);
    }
  }
  if (data?.rows) traverseRows(data.rows);
  return values;
}

function parseMultiPeriodAccounts(accounts: any[]): { total: number; byPeriod: Record<string, number>; count: number } {
  if (!Array.isArray(accounts)) return { total: 0, byPeriod: {}, count: 0 };
  const byPeriod: Record<string, number> = {};
  let total = 0;
  for (const acc of accounts) {
    if (acc.monthlyValues && typeof acc.monthlyValues === 'object') {
      for (const [period, value] of Object.entries(acc.monthlyValues)) {
        const numValue = Number(value) || 0;
        byPeriod[period] = (byPeriod[period] || 0) + numValue;
        total += numValue;
      }
    }
  }
  return { total, byPeriod, count: accounts.length };
}

function getLatestPeriodValue(accounts: any[]): number {
  if (!Array.isArray(accounts) || accounts.length === 0) return 0;
  const periods = Object.keys(accounts[0]?.monthlyValues || {}).sort();
  const latestPeriod = periods[periods.length - 1];
  if (!latestPeriod) return 0;
  return accounts.reduce((sum, acc) => sum + (Number(acc.monthlyValues?.[latestPeriod]) || 0), 0);
}

function detectDataFormat(data: any): 'quickbooks' | 'multiperiod' | 'googlesheets' | 'simple' | 'unknown' {
  if (!data) return 'unknown';
  if (data.rows?.row) return 'quickbooks';
  if (data.rawData && data.source === 'google_sheets') return 'googlesheets';
  if (Array.isArray(data) && data[0]?.monthlyValues) return 'multiperiod';
  if (typeof data === 'object' && (data.revenue !== undefined || data.totalAssets !== undefined)) return 'simple';
  return 'unknown';
}

// ============================================================
// TYPES
// ============================================================

type AgentType = 'qoe' | 'cashflow' | 'risk' | 'education';

interface ClassificationResult {
  agents: AgentType[];
  reasoning: string;
}

interface ProcessedDataRecord {
  data_type: string;
  source_type: string;
  data: any;
  period_start: string | null;
  period_end: string | null;
  record_count: number | null;
}

interface AgentContext {
  dataContext: string;
  systemPrompt: string;
}

// ============================================================
// STEP 1: INTENT CLASSIFIER
// ============================================================

async function classifyIntent(
  userMessage: string,
  currentSection: { phase: number; section: number; sectionName: string } | null,
  apiKey: string
): Promise<ClassificationResult> {
  // Fast heuristic pre-classification for obvious cases
  const lower = userMessage.toLowerCase();

  // Pure definitional / educational questions
  const educationSignals = ['what is', 'what are', 'define', 'meaning of', 'explain the concept',
    'how does', 'what does', 'tell me about', 'why is', 'difference between'];
  const isEducational = educationSignals.some(s => lower.includes(s)) &&
    !lower.includes('my data') && !lower.includes('our') && !lower.includes('the company');

  if (isEducational) {
    return { agents: ['education'], reasoning: 'Definitional/conceptual question' };
  }

  // Section-based heuristic routing for clear cases
  if (currentSection) {
    const { phase, section } = currentSection;
    const sectionKey = `${phase}-${section}`;

    const sectionAgentMap: Record<string, AgentType[]> = {
      '2-1': ['qoe'],       // Chart of Accounts
      '2-2': ['qoe'],       // Trial Balance
      '3-1': ['qoe'],       // DD Adjustments
      '3-2': ['qoe'],       // Reclassifications
      '3-3': ['cashflow'],  // AR Aging
      '3-4': ['cashflow'],  // AP Aging
      '3-5': ['qoe'],       // Fixed Assets
      '3-6': ['cashflow'],  // Inventory
      '3-7': ['qoe'],       // Payroll
      '4-1': ['risk'],      // Top Customers
      '4-2': ['risk'],      // Top Vendors
      '5-1': ['qoe'],       // Income Statement
      '5-2': ['cashflow'],  // Balance Sheet
      '5-3': ['qoe'],       // QoE Summary
      '5-5': ['cashflow'],  // Working Capital
      '5-6': ['cashflow'],  // NWC & FCF
      '5-7': ['cashflow'],  // Proof of Cash
      '6-1': ['qoe', 'risk'], // Executive Summary
    };

    // If user is asking about their data in a specific section, route by section
    const dataSignals = ['my', 'our', 'the data', 'this', 'these', 'look at', 'analyze',
      'review', 'check', 'validate', 'flag', 'issue', 'problem', 'concern'];
    const isDataQuestion = dataSignals.some(s => lower.includes(s));

    if (isDataQuestion && sectionAgentMap[sectionKey]) {
      return {
        agents: sectionAgentMap[sectionKey],
        reasoning: `Data question in section ${sectionKey}`
      };
    }
  }

  // For ambiguous or cross-domain questions, use LLM classifier (plain JSON prompt — no tool_choice)
  try {
    const classifyAbort = AbortSignal.timeout(4000); // 4s max — prevent hanging
    const classifyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: classifyAbort,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `Classify this QoE analysis question into one or more agent categories. Pick the minimum set needed.

Categories:
- qoe: EBITDA adjustments, earnings quality, normalization, trial balance, chart of accounts, income statement, reclassifications, payroll normalization
- cashflow: Working capital, FCF, proof of cash, AR/AP aging, DSO/DPO/DIO, balance sheet, liquidity, cash conversion
- risk: Customer/vendor concentration, CIM insights, debt schedule, material contracts, red flags, related party transactions
- education: Pure concept explanations, definitions, general QoE methodology (no company-specific data needed)

Respond with ONLY valid JSON, no markdown, no explanation:
{"agents": ["qoe"|"cashflow"|"risk"|"education"], "reasoning": "one sentence"}`
          },
          { role: "user", content: userMessage }
        ],
      }),
    });

    if (classifyResponse.ok) {
      const data = await classifyResponse.json();
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.agents) && parsed.agents.length > 0) {
            console.log(`[classifier] LLM classified as: ${parsed.agents.join(', ')} — ${parsed.reasoning}`);
            return parsed as ClassificationResult;
          }
        }
      } catch (parseErr) {
        console.error("[classifier] JSON parse error:", parseErr, "content:", content);
      }
    } else {
      const errText = await classifyResponse.text();
      console.error("[classifier] LLM error:", classifyResponse.status, errText);
    }
  } catch (err) {
    console.error("[classifier] Error:", err);
  }

  // Fallback: education agent (safest default — no data needed)
  return { agents: ['education'], reasoning: 'Fallback: could not classify' };
}

// ============================================================
// STEP 2: DATA LOADERS (isolated per agent domain)
// ============================================================

// --- Shared: fetch processed_data from DB ---
async function fetchProcessedData(projectId: string): Promise<ProcessedDataRecord[]> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !projectId) return [];

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase
      .from('processed_data')
      .select('data_type, source_type, data, period_start, period_end, record_count')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("[data-loader] Error fetching processed_data:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[data-loader] Error:", err);
    return [];
  }
}

// --- QoE Agent Data Loader ---
function loadQoEData(wizardData: any, processedRecords: ProcessedDataRecord[]): string {
  const parts: string[] = [];

  // Adjustments (always from wizard — user-created)
  const adjustments = wizardData?.qoeAnalysis?.adjustments || wizardData?.adjustments;
  if (Array.isArray(adjustments) && adjustments.length > 0) {
    let totalImpact = 0;
    let approvedCount = 0;
    const categories: Record<string, number> = {};
    const INTENT_SIGN: Record<string, number> = {
      remove_expense: 1, remove_revenue: -1, add_expense: -1,
      add_revenue: 1, normalize_up_expense: -1, normalize_down_expense: 1, other: 1,
    };
    for (const adj of adjustments) {
      const sign = INTENT_SIGN[adj.intent as string] ?? 1;
      const amount = (Number(adj.amount) || 0) * sign;
      totalImpact += amount;
      if (adj.approved) approvedCount++;
      const cat = adj.category || 'Uncategorized';
      categories[cat] = (categories[cat] || 0) + amount;
    }
    parts.push(`## QoE Adjustments (${adjustments.length} total, ${approvedCount} approved)\n- Net EBITDA Impact: $${totalImpact.toLocaleString()}\n${adjustments.slice(0, 15).map((adj: any) => {
      const s = INTENT_SIGN[adj.intent as string] ?? 1;
      return `- ${adj.name || adj.description}: $${((adj.amount || 0) * s).toLocaleString()} (${adj.category || 'Uncategorized'})${adj.approved ? ' ✓' : ''}`;
    }).join('\n')}`);
  }

  // Trial Balance (from wizard)
  if (wizardData?.trialBalance?.accounts?.length > 0) {
    const tb = wizardData.trialBalance;
    const accounts = tb.accounts;
    const periods = Object.keys(accounts[0]?.monthlyValues || {}).sort();

    // Balance check
    const balanceChecks: string[] = [];
    for (const period of periods) {
      let bsTotal = 0, isTotal = 0;
      for (const acc of accounts) {
        const val = Number(acc.monthlyValues?.[period]) || 0;
        if (acc.fsType === 'BS') bsTotal += val;
        else isTotal += val;
      }
      const check = bsTotal + isTotal;
      if (Math.abs(check) >= 1) {
        balanceChecks.push(`${period}: OUT OF BALANCE (${check.toFixed(2)})`);
      }
    }

    parts.push(`## Trial Balance (${accounts.length} accounts, ${periods.length} periods)\n${balanceChecks.length > 0 ? `⚠️ Balance issues: ${balanceChecks.join('; ')}` : '✓ All periods balanced'}\n### Account Details:\n${accounts.slice(0, 100).map((a: any) => {
      const lastPeriod = periods[periods.length - 1];
      const lastValue = a.monthlyValues?.[lastPeriod] || 0;
      const matchStatus = a._matchedFromCOA === false ? ' [UNMATCHED]' : '';
      return `- ${a.accountNumber || 'N/A'} | ${a.accountName} | ${a.fsType} | ${a.fsLineItem || 'N/A'} | $${Number(lastValue).toLocaleString()}${matchStatus}`;
    }).join('\n')}${accounts.length > 100 ? `\n... and ${accounts.length - 100} more` : ''}`);
  }

  // Chart of Accounts (from wizard)
  if (wizardData?.chartOfAccounts && Array.isArray(wizardData.chartOfAccounts)) {
    const coa = wizardData.chartOfAccounts;
    const bsCount = coa.filter((a: any) => a.fsType === 'BS').length;
    const isCount = coa.filter((a: any) => a.fsType === 'IS').length;
    parts.push(`## Chart of Accounts (${coa.length} accounts: ${bsCount} BS, ${isCount} IS)\n${coa.map((a: any) =>
      `- ${a.accountNumber || 'N/A'} | ${a.accountName || a.name || ''} | ${a.fsType || ''} | ${a.accountType || a.category || ''}`
    ).join('\n')}`);
  }

  // Income Statement from processed_data or wizard
  const isRecord = processedRecords.find(r => r.data_type === 'income_statement');
  if (isRecord) {
    const data = isRecord.data;
    if (data?.monthlyReports && Array.isArray(data.monthlyReports)) {
      let totalRevenue = 0, totalExpenses = 0;
      for (const report of data.monthlyReports) {
        if (report.rows?.row) {
          const values = parseQuickBooksReport(report);
          totalRevenue += values.TotalIncome || values.Income || 0;
          totalExpenses += values.TotalExpenses || values.Expenses || 0;
        }
      }
      parts.push(`## Income Statement (QuickBooks API)\n- Revenue: $${totalRevenue.toLocaleString()}\n- Expenses: $${totalExpenses.toLocaleString()}\n- Net: $${(totalRevenue - totalExpenses).toLocaleString()}`);
    } else if (data?.rows?.row) {
      const values = parseQuickBooksReport(data);
      parts.push(`## Income Statement (QuickBooks)\n${Object.entries(values).slice(0, 15).map(([k, v]) => `- ${k}: $${v.toLocaleString()}`).join('\n')}`);
    }
  } else if (wizardData?.incomeStatement) {
    const is = wizardData.incomeStatement;
    const format = detectDataFormat(is);
    if (format === 'quickbooks') {
      const qbValues = parseQuickBooksReport(is);
      parts.push(`## Income Statement (QuickBooks)\n${Object.entries(qbValues).map(([k, v]) => `- ${k}: $${v.toLocaleString()}`).join('\n')}`);
    } else if (format === 'multiperiod' || (is.revenue && Array.isArray(is.revenue))) {
      const rev = parseMultiPeriodAccounts(is.revenue || []);
      const cogs = parseMultiPeriodAccounts(is.cogs || is.costOfGoodsSold || []);
      const opex = parseMultiPeriodAccounts(is.operatingExpenses || is.expenses || []);
      parts.push(`## Income Statement (Multi-Period)\n- Revenue: $${rev.total.toLocaleString()} (${rev.count} accounts)\n- COGS: $${cogs.total.toLocaleString()}\n- OpEx: $${opex.total.toLocaleString()}`);
    }
  }

  // Payroll (relevant for owner compensation normalization)
  const prRecord = processedRecords.find(r => r.data_type === 'payroll');
  if (prRecord) {
    const data = prRecord.data;
    const employees = Array.isArray(data) ? data : data?.employees || [];
    if (employees.length > 0) {
      const totalPayroll = employees.reduce((sum: number, e: any) =>
        sum + (Number(e.salary) || Number(e.totalCompensation) || Number(e.annualPay) || 0), 0);
      parts.push(`## Payroll (${employees.length} employees, total: $${totalPayroll.toLocaleString()})`);
    }
  } else if (wizardData?.payroll) {
    parts.push(`## Payroll (from wizard) - Data available`);
  }

  return parts.join('\n\n');
}

// --- Cash Flow Agent Data Loader ---
function loadCashFlowData(wizardData: any, processedRecords: ProcessedDataRecord[]): string {
  const parts: string[] = [];

  // Balance Sheet
  const bsRecord = processedRecords.find(r => r.data_type === 'balance_sheet');
  if (bsRecord) {
    const data = bsRecord.data;
    if (data?.monthlyReports && Array.isArray(data.monthlyReports)) {
      const latest = data.monthlyReports[data.monthlyReports.length - 1];
      if (latest?.rows?.row) {
        const values = parseQuickBooksReport(latest);
        parts.push(`## Balance Sheet (QuickBooks API - ${latest.reportDate || 'latest'})\n- Total Assets: $${(values.TotalAssets || values.Assets || 0).toLocaleString()}\n- Total Liabilities: $${(values.TotalLiabilities || values.Liabilities || 0).toLocaleString()}\n- Total Equity: $${(values.Equity || values.TotalEquity || 0).toLocaleString()}`);
      }
    } else if (data?.rows?.row) {
      const values = parseQuickBooksReport(data);
      parts.push(`## Balance Sheet (QuickBooks)\n${Object.entries(values).slice(0, 15).map(([k, v]) => `- ${k}: $${v.toLocaleString()}`).join('\n')}`);
    }
  } else if (wizardData?.balanceSheet) {
    const bs = wizardData.balanceSheet;
    const format = detectDataFormat(bs);
    if (format === 'quickbooks') {
      const qbValues = parseQuickBooksReport(bs);
      parts.push(`## Balance Sheet (QuickBooks)\n${Object.entries(qbValues).map(([k, v]) => `- ${k}: $${v.toLocaleString()}`).join('\n')}`);
    } else if (format === 'multiperiod' || (bs.assets && Array.isArray(bs.assets))) {
      parts.push(`## Balance Sheet (Multi-Period)\n- Total Assets: $${getLatestPeriodValue(bs.assets || []).toLocaleString()}\n- Total Liabilities: $${getLatestPeriodValue(bs.liabilities || []).toLocaleString()}\n- Total Equity: $${getLatestPeriodValue(bs.equity || []).toLocaleString()}`);
    }
  }

  // AR Aging
  const arRecord = processedRecords.find(r => r.data_type === 'ar_aging');
  if (arRecord) {
    parts.push(`## AR Aging (QuickBooks API, ${arRecord.period_start || 'N/A'} to ${arRecord.period_end || 'N/A'})`);
  } else if (wizardData?.arAging) {
    parts.push(`## AR Aging (from wizard) - Data available`);
  }

  // AP Aging
  const apRecord = processedRecords.find(r => r.data_type === 'ap_aging');
  if (apRecord) {
    parts.push(`## AP Aging (QuickBooks API, ${apRecord.period_start || 'N/A'} to ${apRecord.period_end || 'N/A'})`);
  } else if (wizardData?.apAging) {
    parts.push(`## AP Aging (from wizard) - Data available`);
  }

  // Bank Transactions
  const btRecord = processedRecords.find(r => r.data_type === 'bank_transactions');
  if (btRecord) {
    const data = btRecord.data;
    const transactions = data?.transactions || [];
    const totalDeposits = transactions.filter((t: any) => (Number(t.amount) || 0) > 0)
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalWithdrawals = transactions.filter((t: any) => (Number(t.amount) || 0) < 0)
      .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount)), 0);
    parts.push(`## Bank Transactions (DocuClipper)\n- Transactions: ${transactions.length}\n- Deposits: $${totalDeposits.toLocaleString()}\n- Withdrawals: $${totalWithdrawals.toLocaleString()}`);
  }

  // Cash Flow Statement
  const cfRecord = processedRecords.find(r => r.data_type === 'cash_flow');
  if (cfRecord) {
    const data = cfRecord.data;
    if (data?.monthlyReports) {
      parts.push(`## Cash Flow Statement (QuickBooks API, ${data.monthlyReports.length} periods)`);
    } else if (data?.rows?.row) {
      const values = parseQuickBooksReport(data);
      parts.push(`## Cash Flow Statement\n${Object.entries(values).slice(0, 10).map(([k, v]) => `- ${k}: $${v.toLocaleString()}`).join('\n')}`);
    }
  }

  // Inventory
  if (wizardData?.inventory) {
    parts.push(`## Inventory (from wizard) - Data available`);
  }

  // Fixed Assets (relevant for CapEx/depreciation in FCF)
  const faRecord = processedRecords.find(r => r.data_type === 'fixed_assets');
  if (faRecord) {
    const data = faRecord.data;
    const assets = Array.isArray(data) ? data : data?.assets || [];
    if (assets.length > 0) {
      const totalCost = assets.reduce((sum: number, a: any) =>
        sum + (Number(a.costBasis) || Number(a.purchasePrice) || Number(a.value) || 0), 0);
      const totalDep = assets.reduce((sum: number, a: any) =>
        sum + (Number(a.accumulatedDepreciation) || 0), 0);
      parts.push(`## Fixed Assets (${assets.length} items)\n- Cost: $${totalCost.toLocaleString()}\n- Depreciation: $${totalDep.toLocaleString()}\n- NBV: $${(totalCost - totalDep).toLocaleString()}`);
    }
  }

  return parts.join('\n\n');
}

// --- Risk Agent Data Loader ---
function loadRiskData(wizardData: any, processedRecords: ProcessedDataRecord[], cimInsights: any): string {
  const parts: string[] = [];

  // Top Customers
  const ccRecord = processedRecords.find(r => r.data_type === 'customer_concentration');
  const customers = ccRecord
    ? (Array.isArray(ccRecord.data) ? ccRecord.data : ccRecord.data?.customers || [])
    : (wizardData?.topCustomers || []);

  if (customers.length > 0) {
    const formatted = customers.map((c: any) => {
      let revenue = 0;
      if (c.yearlyRevenue && typeof c.yearlyRevenue === 'object') {
        revenue = Object.values(c.yearlyRevenue).reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0);
      } else {
        revenue = Number(c.revenue) || Number(c.amount) || Number(c.total) || 0;
      }
      return { name: c.name || c.customerName || 'Unknown', revenue };
    });
    const totalRevenue = formatted.reduce((s: number, c: any) => s + c.revenue, 0);
    const topPct = totalRevenue > 0 ? ((formatted[0]?.revenue / totalRevenue) * 100).toFixed(1) : '0';

    parts.push(`## Customer Concentration (${formatted.length} customers)\n- Top customer: ${formatted[0]?.name} (${topPct}% of tracked revenue)\n${formatted.slice(0, 10).map((c: any, i: number) => `${i + 1}. ${c.name}: $${c.revenue.toLocaleString()}`).join('\n')}`);
  }

  // Top Vendors
  const vcRecord = processedRecords.find(r => r.data_type === 'vendor_concentration');
  const vendors = vcRecord
    ? (Array.isArray(vcRecord.data) ? vcRecord.data : vcRecord.data?.vendors || [])
    : (wizardData?.topVendors || []);

  if (vendors.length > 0) {
    const formatted = vendors.map((v: any) => {
      let spend = 0;
      if (v.yearlySpend && typeof v.yearlySpend === 'object') {
        spend = Object.values(v.yearlySpend).reduce((sum: number, val: unknown) => sum + (Number(val) || 0), 0);
      } else {
        spend = Number(v.spend) || Number(v.amount) || Number(v.total) || 0;
      }
      return { name: v.name || v.vendorName || 'Unknown', spend };
    });
    const totalSpend = formatted.reduce((s: number, v: any) => s + v.spend, 0);
    const topPct = totalSpend > 0 ? ((formatted[0]?.spend / totalSpend) * 100).toFixed(1) : '0';

    parts.push(`## Vendor Concentration (${formatted.length} vendors)\n- Top vendor: ${formatted[0]?.name} (${topPct}% of tracked spend)\n${formatted.slice(0, 10).map((v: any, i: number) => `${i + 1}. ${v.name}: $${v.spend.toLocaleString()}`).join('\n')}`);
  }

  // CIM Insights
  const cimRecord = processedRecords.find(r => r.data_type === 'cim_insights');
  const cim = cimRecord?.data || cimInsights;
  if (cim) {
    let cimContext = '## CIM Insights\n';
    if (cim.businessOverview?.description) cimContext += `**Business:** ${cim.businessOverview.description}\n`;
    if (cim.rawSummary) cimContext += `**Summary:** ${cim.rawSummary}\n`;
    if (cim.marketPosition?.industry) cimContext += `**Industry:** ${cim.marketPosition.industry}\n`;
    if (cim.keyRisks?.length > 0) cimContext += `**Key Risks:** ${cim.keyRisks.slice(0, 5).join('; ')}\n`;
    if (cim.growthDrivers?.length > 0) cimContext += `**Growth Drivers:** ${cim.growthDrivers.slice(0, 5).join('; ')}\n`;
    parts.push(cimContext);
  }

  // Debt Schedule
  const dsRecord = processedRecords.find(r => r.data_type === 'debt_schedule');
  if (dsRecord) {
    const data = dsRecord.data;
    const debts = Array.isArray(data) ? data : data?.debts || [];
    if (debts.length > 0) {
      const totalDebt = debts.reduce((sum: number, d: any) =>
        sum + (Number(d.principalBalance) || Number(d.outstandingBalance) || Number(d.amount) || 0), 0);
      parts.push(`## Debt Schedule (${debts.length} instruments, total: $${totalDebt.toLocaleString()})`);
    }
  } else if (wizardData?.debtSchedule) {
    parts.push(`## Debt Schedule (from wizard) - Data available`);
  }

  // Material Contracts
  const mcRecord = processedRecords.find(r => r.data_type === 'material_contract');
  if (mcRecord) {
    parts.push(`## Material Contracts - Data available`);
  }

  return parts.join('\n\n');
}

// --- Education Agent Data Loader ---
function loadEducationData(
  phase: number,
  section: number,
  sectionName: string
): string {
  const SECTION_EDUCATION: Record<string, { concepts: string[]; description: string; keyTerms: { term: string; definition: string }[] }> = {
    "1-1": {
      concepts: ["Target Company Profile", "Deal Context", "Industry Analysis"],
      description: "Understanding the target company's background is crucial for contextualizing the QoE analysis.",
      keyTerms: [
        { term: "Target Company", definition: "The business being analyzed for potential acquisition or investment" },
        { term: "Transaction Type", definition: "The nature of the deal (acquisition, merger, investment, etc.)" },
      ],
    },
    "2-1": {
      concepts: ["Account Structure", "Account Classification", "Mapping Consistency", "Mapping Validation"],
      description: "The chart of accounts defines how transactions are categorized. Correct account mappings ensure accurate financial statement presentation and EBITDA calculations.",
      keyTerms: [
        { term: "Chart of Accounts", definition: "The organized list of all accounts used to record transactions" },
        { term: "FS Line Item", definition: "The standardized financial statement line where an account appears" },
        { term: "Mapping Validation", definition: "Comparing account classifications against standard mapping rules to identify errors" },
      ],
    },
    "2-2": {
      concepts: ["General Ledger", "Account Mapping", "Period Comparison"],
      description: "The trial balance is the foundation of the QoE analysis.",
      keyTerms: [
        { term: "Trial Balance", definition: "A listing of all general ledger accounts and their balances at a point in time" },
        { term: "Account Mapping", definition: "Categorizing GL accounts into standardized financial statement line items" },
      ],
    },
    "3-1": {
      concepts: ["EBITDA Adjustments", "Normalization", "Pro Forma Adjustments", "Run-Rate"],
      description: "Due diligence adjustments normalize EBITDA by removing non-recurring items.",
      keyTerms: [
        { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization" },
        { term: "Add-back", definition: "An expense added back to EBITDA to increase adjusted earnings" },
        { term: "Run-Rate", definition: "Annualized earnings based on recent performance trends" },
      ],
    },
    "3-2": {
      concepts: ["Reclassification", "Above/Below the Line", "COGS vs OpEx"],
      description: "Reclassifications correct presentation without changing net income.",
      keyTerms: [
        { term: "Reclassification", definition: "Moving an item from one line to another without changing total earnings" },
      ],
    },
    "3-3": {
      concepts: ["DSO Analysis", "Collectibility", "Bad Debt"],
      description: "AR aging analysis assesses receivable quality.",
      keyTerms: [
        { term: "DSO", definition: "Days Sales Outstanding - measures how quickly receivables are collected" },
        { term: "Aging Bucket", definition: "Categories of receivables based on days past due" },
      ],
    },
    "3-4": {
      concepts: ["DPO Analysis", "Vendor Terms", "Cash Management"],
      description: "AP aging reveals payment practices.",
      keyTerms: [
        { term: "DPO", definition: "Days Payable Outstanding - measures how long it takes to pay vendors" },
      ],
    },
    "3-5": {
      concepts: ["PP&E", "Depreciation", "CapEx Analysis"],
      description: "Fixed asset analysis identifies deferred maintenance and CapEx requirements.",
      keyTerms: [
        { term: "CapEx", definition: "Capital Expenditures - spending on property, plant, and equipment" },
        { term: "Maintenance CapEx", definition: "Spending required to maintain current operations" },
      ],
    },
    "3-7": {
      concepts: ["Compensation Analysis", "Owner Compensation", "FTE Analysis"],
      description: "Payroll analysis identifies owner/executive compensation needing normalization.",
      keyTerms: [
        { term: "Owner Compensation", definition: "Salary and benefits paid to owners that may exceed or fall below market rates" },
        { term: "FTE", definition: "Full-Time Equivalent - standardized measure of employee headcount" },
      ],
    },
    "4-1": {
      concepts: ["Customer Concentration", "Revenue Quality"],
      description: "Customer analysis identifies concentration risk.",
      keyTerms: [
        { term: "Customer Concentration", definition: "Percentage of revenue from top customers - often flagged if >20% from one customer" },
      ],
    },
    "4-2": {
      concepts: ["Vendor Concentration", "Supply Chain Risk", "Related Party Transactions"],
      description: "Vendor analysis identifies supply chain risks.",
      keyTerms: [
        { term: "Vendor Concentration", definition: "Reliance on a small number of suppliers for critical inputs" },
        { term: "Related Party", definition: "Entity with ownership or control relationship to the target" },
      ],
    },
    "5-1": {
      concepts: ["Revenue Recognition", "Gross Margin", "EBITDA Margin"],
      description: "The adjusted income statement shows normalized earnings.",
      keyTerms: [
        { term: "Adjusted EBITDA", definition: "EBITDA after normalization adjustments" },
        { term: "EBITDA Margin", definition: "EBITDA as a percentage of revenue" },
      ],
    },
    "5-2": {
      concepts: ["Working Capital", "Net Debt", "Off-Balance Sheet Items"],
      description: "The adjusted balance sheet identifies working capital requirements.",
      keyTerms: [
        { term: "Net Working Capital", definition: "Current assets minus current liabilities (often excludes cash and debt)" },
        { term: "Net Debt", definition: "Total debt minus cash and cash equivalents" },
      ],
    },
    "5-3": {
      concepts: ["EBITDA Bridge", "Adjustment Summary", "Earnings Quality"],
      description: "The QoE summary presents the bridge from reported to adjusted EBITDA.",
      keyTerms: [
        { term: "EBITDA Bridge", definition: "Walkthrough from reported to adjusted EBITDA showing each adjustment" },
      ],
    },
    "5-5": {
      concepts: ["NWC Target", "Peg Calculation", "Seasonal Adjustments"],
      description: "Working capital analysis determines the NWC target for the transaction.",
      keyTerms: [
        { term: "NWC Peg", definition: "The agreed working capital target that affects purchase price adjustments" },
        { term: "True-Up", definition: "Post-closing adjustment based on actual vs. target NWC" },
      ],
    },
    "5-6": {
      concepts: ["Free Cash Flow", "Cash Conversion"],
      description: "FCF analysis shows how efficiently the business converts EBITDA to cash.",
      keyTerms: [
        { term: "Free Cash Flow", definition: "Cash generated after operating expenses and capital expenditures" },
        { term: "Cash Conversion", definition: "Ratio of FCF to EBITDA" },
      ],
    },
    "5-7": {
      concepts: ["Bank Reconciliation", "Cash Verification", "Deposit Analysis"],
      description: "Proof of cash reconciles book cash to bank statements.",
      keyTerms: [
        { term: "Proof of Cash", definition: "Four-way reconciliation of beginning/ending cash and receipts/disbursements" },
      ],
    },
    "6-1": {
      concepts: ["Key Findings", "Deal Considerations", "Risk Factors"],
      description: "The executive summary distills the QoE analysis into key findings.",
      keyTerms: [
        { term: "Key Findings", definition: "Most significant discoveries from the QoE analysis" },
        { term: "Risk Factors", definition: "Items that could negatively impact deal value" },
      ],
    },
  };

  const education = SECTION_EDUCATION[`${phase}-${section}`];
  if (!education) {
    return `Current section: ${sectionName} (Phase ${phase}, Section ${section})`;
  }

  return `## Current Section: ${sectionName} (Phase ${phase}, Section ${section})\n### Key Concepts: ${education.concepts.join(", ")}\n### Purpose: ${education.description}\n### Key Terms:\n${education.keyTerms.map(t => `- **${t.term}**: ${t.definition}`).join("\n")}`;
}

// ============================================================
// STEP 3: FOCUSED SYSTEM PROMPTS (per subagent)
// ============================================================

const RESPONSE_CONTRACT = `
## Response Guidelines
- Never quote more than 25 words from any reference material
- Structure responses: 1) What we see (finding) 2) Why it matters (QoE impact) 3) How to verify
- Reference concepts, not passages. Express ideas in your own analytical voice
- DO NOT use markdown formatting (no **, ##, -, >, etc.) - write in plain conversational text`;

function buildQoEPrompt(projectContext: string, dataContext: string, sectionContext: string, phase?: number, section?: number): string {
  let extraRules = '';
  if (phase === 2 && section === 1) {
    extraRules = `
### Account Mapping Validation Mode
When validating account mappings:
- Compare each account's FS Type against QuickBooks standard mappings
- Flag common misclassifications: Undeposited Funds not as Cash, Accumulated Depreciation outside Fixed Assets, Revenue as Other Income
- Group findings by severity: Critical (affects EBITDA), Moderate (presentation), Minor (cosmetic)
- Focus on Revenue/COGS boundary, Operating vs Other expense, Current vs Long-term`;
  }
  if (phase === 2 && section === 2) {
    extraRules = `
### Trial Balance Validation Mode
When validating Trial Balance:
- Check balance (BS + IS = 0 per period)
- Flag missing period data, sign anomalies, large month-over-month variances (>50%)
- Materiality: flag account variances >10% of revenue, unclassified >5% of assets
- Balance check variances >$100 = data entry errors`;
  }

  return `You are a senior QoE analyst specializing in EBITDA adjustments and earnings quality.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${extraRules}
${RESPONSE_CONTRACT}

Focus on: EBITDA normalization, adjustment analysis, trial balance validation, COA classification, income statement trends, payroll normalization. Always reference the user's actual financial data.`;
}

function buildCashFlowPrompt(projectContext: string, dataContext: string, sectionContext: string): string {
  return `You are a senior QoE analyst specializing in cash flow analysis and working capital.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${RESPONSE_CONTRACT}

Focus on: Working capital metrics (DSO, DPO, DIO), free cash flow, proof of cash reconciliation, cash conversion, AR/AP aging analysis, balance sheet trends, liquidity assessment. Calculate and reference specific metrics from the user's data.`;
}

function buildRiskPrompt(projectContext: string, dataContext: string, sectionContext: string): string {
  return `You are a senior QoE analyst specializing in deal risk assessment.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${RESPONSE_CONTRACT}

Focus on: Customer/vendor concentration thresholds (flag >20% from single customer), related party transactions, debt covenants, material contract risks, CIM vs. financial data discrepancies, industry benchmarks. Quantify risk exposure using the user's data.`;
}

function buildEducationPrompt(projectContext: string, sectionContext: string): string {
  return `You are a senior QoE analyst and educator helping finance professionals understand due diligence concepts.

${projectContext}

${sectionContext}
${RESPONSE_CONTRACT}

Focus on: Explaining QoE concepts clearly with real-world examples, teaching best practices for the current wizard section, defining key terms, describing common pitfalls. Be professional but approachable. Use terminology appropriate for finance professionals.`;
}

// ============================================================
// STEP 4: RAG RETRIEVAL (unchanged logic)
// ============================================================

function determineChunkCount(query: string): number {
  const queryLength = query.split(' ').length;
  const queryLower = query.toLowerCase();
  const isBroad = queryLower.includes('how do') || queryLower.includes('explain') ||
    queryLower.includes('what are the') || queryLower.includes('walk me through') || queryLength > 15;
  const isNarrow = queryLower.includes('what is') || queryLower.includes('define') || queryLength < 8;
  if (isNarrow) return 3;
  if (isBroad) return 7;
  return 5;
}

async function getRelevantContext(
  query: string,
  options: { sources?: string[]; minAuthority?: number; topics?: string[] } = {}
): Promise<{ context: string; sources: string[]; chunkCount: number } | null> {
  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
    });
    if (!embeddingRes.ok) { console.error("Embedding error:", embeddingRes.status); return null; }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    const matchCount = determineChunkCount(query);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: chunks, error } = await supabase.rpc('match_rag_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.72,
      match_count: matchCount,
      source_filter: options.sources || null,
      min_authority: options.minAuthority || 0.0,
      topic_filter: options.topics || null,
    });

    if (error || !chunks?.length) return null;

    const formatted = chunks.map((c: any) => {
      const sourceLabel = c.source?.toUpperCase() || 'REFERENCE';
      const location = [c.chapter, c.section].filter(Boolean).join(' / ');
      return `[${sourceLabel}${location ? ` - ${location}` : ''}]\n${c.content}`;
    }).join('\n\n---\n\n');

    const sourcesUsed = [...new Set(chunks.map((c: any) => c.source || 'unknown'))] as string[];
    console.log(`[rag] Retrieved ${chunks.length} chunks from ${sourcesUsed.join(', ')}`);
    return { context: formatted, sources: sourcesUsed, chunkCount: chunks.length };
  } catch (err) {
    console.error("[rag] Error:", err);
    return null;
  }
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, wizardData, projectInfo, currentSection, cimInsights } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const userMessage = messages?.length > 0 ? messages[messages.length - 1].content : "";
    console.log(`[orchestrator] Request: project=${projectInfo?.name}, section=${currentSection?.sectionName || 'none'}`);

    // === STEP 1: Classify intent ===
    const classification = await classifyIntent(userMessage, currentSection, OPENAI_API_KEY);
    console.log(`[orchestrator] Classification: ${classification.agents.join(', ')} — ${classification.reasoning}`);

    // === STEP 2: Load only relevant data ===
    const processedRecords = classification.agents.includes('education') && classification.agents.length === 1
      ? [] // Education-only questions don't need DB data
      : await fetchProcessedData(projectInfo?.id);

    console.log(`[orchestrator] Loaded ${processedRecords.length} processed_data records`);

    // Build project context (shared across all agents)
    let projectContext = '';
    if (projectInfo) {
      projectContext = `## Project: ${projectInfo.name || 'Unnamed'}\n- Target: ${projectInfo.targetCompany || 'Not specified'}\n- Industry: ${projectInfo.industry || 'Not specified'}\n- Periods: ${projectInfo.periods?.join(', ') || 'Not specified'}`;

      if (projectInfo.industryTraitsJson || projectInfo.industryNarrative) {
        projectContext += `\n## Industry Intelligence\n`;
        if (projectInfo.industryTraitsJson) projectContext += projectInfo.industryTraitsJson + '\n';
        if (projectInfo.industryNarrative) projectContext += projectInfo.industryNarrative + '\n';
      }
    }

    // Build section context
    const sectionContext = currentSection
      ? loadEducationData(currentSection.phase, currentSection.section, currentSection.sectionName)
      : '';

    // Load agent-specific data and build prompt
    let dataContext = '';
    let systemPrompt = '';

    if (classification.agents.length === 1) {
      // Single agent — focused context
      const agent = classification.agents[0];
      switch (agent) {
        case 'qoe':
          dataContext = loadQoEData(wizardData, processedRecords);
          systemPrompt = buildQoEPrompt(projectContext, dataContext, sectionContext, currentSection?.phase, currentSection?.section);
          break;
        case 'cashflow':
          dataContext = loadCashFlowData(wizardData, processedRecords);
          systemPrompt = buildCashFlowPrompt(projectContext, dataContext, sectionContext);
          break;
        case 'risk':
          dataContext = loadRiskData(wizardData, processedRecords, cimInsights);
          systemPrompt = buildRiskPrompt(projectContext, dataContext, sectionContext);
          break;
        case 'education':
          systemPrompt = buildEducationPrompt(projectContext, sectionContext);
          break;
      }
    } else {
      // Multi-agent — merge relevant data contexts
      const dataParts: string[] = [];
      for (const agent of classification.agents) {
        switch (agent) {
          case 'qoe':
            dataParts.push(loadQoEData(wizardData, processedRecords));
            break;
          case 'cashflow':
            dataParts.push(loadCashFlowData(wizardData, processedRecords));
            break;
          case 'risk':
            dataParts.push(loadRiskData(wizardData, processedRecords, cimInsights));
            break;
        }
      }
      dataContext = dataParts.filter(Boolean).join('\n\n');
      // Use a combined prompt for multi-agent
      systemPrompt = `You are a senior QoE analyst. Answer the question using all relevant data below.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${RESPONSE_CONTRACT}

You have expertise across: EBITDA adjustments, cash flow analysis, and risk assessment. Focus on the aspects most relevant to the user's question.`;
    }

    // === STEP 3: RAG retrieval — only for education-only queries ===
    const isEducationOnly = classification.agents.length === 1 && classification.agents[0] === 'education';
    const ragResult = isEducationOnly ? await getRelevantContext(userMessage) : null;

    // === STEP 4: Build messages and stream response ===
    const messagesWithContext = [
      { role: "system", content: systemPrompt },
      ...(ragResult ? [{
        role: "user" as const,
        content: `### Retrieved References (summarize concepts, do not quote verbatim):\n\n${ragResult.context}\n\n---\nThe above reference material is for your reasoning only. Use it to inform your analysis but express ideas in your own words. Now answer the user's question below.`
      }] : []),
      ...messages,
    ];

    const requestPayload = {
      model: "gpt-4o",
      messages: messagesWithContext,
      temperature: 0.3,
      stream: true,
    };
    const payloadJson = JSON.stringify(requestPayload);
    console.log(`[orchestrator] Sending to AI. Agents: ${classification.agents.join(',')}. Context: ${systemPrompt.length} chars. RAG: ${ragResult?.chunkCount || 0} chunks`);

    const callAI = () => fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: payloadJson,
    });

    let response = await callAI();

    // 1 retry on transient 500
    if (!response.ok && response.status === 500) {
      await response.text(); // consume body
      await new Promise(r => setTimeout(r, 500));
      response = await callAI();
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("[orchestrator] OpenAI error:", response.status, errText, "| Key prefix:", OPENAI_API_KEY.substring(0, 8));

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Stream OpenAI response directly to client (true token-by-token streaming)
    console.log(`[orchestrator] Streaming response from OpenAI`);
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[orchestrator] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
