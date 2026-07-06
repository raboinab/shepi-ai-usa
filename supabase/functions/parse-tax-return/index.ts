import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

import { aiFetch, ensureZdrEnabled } from "../_shared/zdrGuard.ts";
import { requireProjectAccess } from "../_shared/auth.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Enhanced Tax Return Data Structure with ~60 fields
interface TaxReturnData {
  // === ENTITY INFORMATION ===
  formType: string; // "1040", "1120", "1065", "1120S"
  taxYear: number;
  filingStatus?: string;
  taxpayerName: string;
  ein?: string;
  naicsCode?: string;
  dateIncorporated?: string;
  sElectionEffectiveDate?: string;
  numberOfShareholders?: number;
  accountingMethod?: 'cash' | 'accrual' | 'other';
  
  // === PAGE 1 INCOME ===
  grossReceipts: number | null;
  returnsAndAllowances: number | null;
  netReceipts: number | null;
  costOfGoodsSold: number | null;
  grossProfit: number | null;
  netGainForm4797: number | null;
  otherIncome: number | null;
  totalIncome: number | null;
  
  // === PAGE 1 DEDUCTIONS ===
  officerCompensation: number | null;
  salariesWages: number | null;
  repairs: number | null;
  badDebts: number | null;
  rent: number | null;
  taxes: number | null;
  interestExpense: number | null;
  depreciation: number | null;
  depletion: number | null;
  advertising: number | null;
  pension: number | null;
  employeeBenefit: number | null;
  otherDeductions: number | null;
  totalDeductions: number | null;
  
  // === BOTTOM LINE ===
  ordinaryBusinessIncome: number | null;
  taxableIncome: number | null;
  totalTax: number | null;
  estimatedTaxPayments: number | null;
  overpayment: number | null;
  amountOwed: number | null;
  
  // Legacy fields for backward compatibility
  businessIncome: number | null;
  
  // === SCHEDULE K (Shareholder Items) - 1120S/1065 ===
  scheduleK?: {
    ordinaryBusinessIncome: number | null;
    netRentalRealEstateIncome: number | null;
    otherNetRentalIncome: number | null;
    interestIncome: number | null;
    ordinaryDividends: number | null;
    qualifiedDividends: number | null;
    royalties: number | null;
    netShortTermCapitalGain: number | null;
    netLongTermCapitalGain: number | null;
    netSection1231Gain: number | null;
    otherIncomeLoss: number | null;
    section179Deduction: number | null;
    charitableContributions: number | null;
    investmentInterestExpense: number | null;
    taxExemptInterestIncome: number | null;
    otherTaxExemptIncome: number | null;
    nondeductibleExpenses: number | null;
    distributions: number | null;
    foreignTaxesPaid: number | null;
  };
  
  // === SCHEDULE L (Balance Sheet) ===
  scheduleL?: {
    beginningOfYear: {
      cash: number | null;
      accountsReceivable: number | null;
      inventories: number | null;
      loansToShareholders: number | null;
      otherCurrentAssets: number | null;
      buildings: number | null;
      depreciableAssets: number | null;
      accumulatedDepreciation: number | null;
      land: number | null;
      otherAssets: number | null;
      totalAssets: number | null;
      accountsPayable: number | null;
      mortgagesPayable: number | null;
      loansFromShareholders: number | null;
      otherLiabilities: number | null;
      totalLiabilities: number | null;
      capitalStock: number | null;
      retainedEarnings: number | null;
      adjustmentsToShareholderEquity: number | null;
      totalEquity: number | null;
    };
    endOfYear: {
      cash: number | null;
      accountsReceivable: number | null;
      inventories: number | null;
      loansToShareholders: number | null;
      otherCurrentAssets: number | null;
      buildings: number | null;
      depreciableAssets: number | null;
      accumulatedDepreciation: number | null;
      land: number | null;
      otherAssets: number | null;
      totalAssets: number | null;
      accountsPayable: number | null;
      mortgagesPayable: number | null;
      loansFromShareholders: number | null;
      otherLiabilities: number | null;
      totalLiabilities: number | null;
      capitalStock: number | null;
      retainedEarnings: number | null;
      adjustmentsToShareholderEquity: number | null;
      totalEquity: number | null;
    };
  };
  
  // === SCHEDULE M-1 (Book/Tax Reconciliation) ===
  scheduleM1?: {
    netIncomePerBooks: number | null;
    incomeOnBooksNotOnReturn: number | null;
    expensesOnBooksNotDeducted: number | null;
    incomeOnReturnNotOnBooks: number | null;
    deductionsNotChargedToBooks: number | null;
    incomePerScheduleK: number | null;
  };
  
  // === SCHEDULE M-2 (AAA Analysis) - 1120S ===
  scheduleM2?: {
    beginningAAA: number | null;
    ordinaryIncome: number | null;
    otherAdditions: number | null;
    lossDeductions: number | null;
    otherReductions: number | null;
    distributionsCash: number | null;
    distributionsProperty: number | null;
    endingAAA: number | null;
    otherAdjustmentsAccount: number | null;
    shareholdersUndistributedTaxableIncome: number | null;
    accumulatedEP: number | null;
  };
  
  // === FORM 1125-A (COGS Details) ===
  cogsDetails?: {
    beginningInventory: number | null;
    purchases: number | null;
    costOfLabor: number | null;
    additionalSection263ACosts: number | null;
    otherCosts: number | null;
    endingInventory: number | null;
    inventoryMethod?: string;
  };
  
  // === FORM 1040 SPECIFIC ===
  form1040?: {
    wagesFromW2: number | null;
    interestIncome: number | null;
    dividendIncome: number | null;
    scheduleCGrossReceipts: number | null;
    scheduleCNetProfit: number | null;
    capitalGains: number | null;
    otherGains: number | null;
    iraDistributions: number | null;
    pensionsAnnuities: number | null;
    socialSecurityBenefits: number | null;
    adjustedGrossIncome: number | null;
    standardDeduction: number | null;
    itemizedDeductions: number | null;
    qualifiedBusinessIncomeDeduction: number | null;
    selfEmploymentTax: number | null;
  };
}

interface ComparisonResult {
  field: string;
  taxReturnValue: number | null;
  comparisonValue: number | null;
  source: string;
  variance: number | null;
  variancePercent: number | null;
  status: 'match' | 'minor_variance' | 'significant_variance' | 'missing_data' | 'review_only';
  category?: string;
  /** GL account names that fed into comparisonValue (transparency) */
  matchedAccounts?: string[];
  /** Optional short note (e.g. "period mismatch", "no GL counterpart") */
  note?: string;
  /** Informational rows that should display but not affect the consistency score */
  excludeFromScore?: boolean;
}

interface AnalysisDiagnostics {
  taxYear: number;
  sources: Array<{
    dataType: string;
    status: 'in_year' | 'aggregate' | 'period_mismatch' | 'missing';
    detail?: string;
  }>;
  glSourceTypes: Array<{ source_type: string; rows: number; usedForGL: boolean }>;
  hasGL: boolean;
  glFallback?: 'income_statement_aggregate' | null;
  skippedFields?: Array<{ field: string; reason: string }>;
}

interface TaxReturnAnalysis {
  extractedData: TaxReturnData;
  comparisons: ComparisonResult[];
  /** null = no comparable financial data was found; otherwise 0-100 */
  overallScore: number | null;
  flags: string[];
  summary: string;
  analyzedAt: string;
  documentId: string;
  extractionSource?: string;
  analysisDiagnostics?: AnalysisDiagnostics;
}


// Helper function to safely parse numbers from various formats
function parseNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Handle parentheses for negative numbers
    let cleaned = value.replace(/[$,\s]/g, '');
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      cleaned = '-' + cleaned.slice(1, -1);
    }
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Helper to extract year from document name or data
function extractYearFromContext(documentName: string, dcData?: any): number {
  // Try to get from data first
  if (dcData?.taxYear) return dcData.taxYear;
  
  // Try to extract from filename
  const yearMatch = documentName.match(/\b(20\d{2})\b/);
  if (yearMatch) return parseInt(yearMatch[1]);
  
  // Default to previous year
  return new Date().getFullYear() - 1;
}

// Build form-specific extraction prompt
function getExtractionPrompt(formType?: string): string {
  const basePrompt = `You are a tax professional analyzing a US tax return document. Extract ALL visible data with precision.

IDENTIFICATION:
First, identify the form type from these options:
- Form 1040: "U.S. Individual Income Tax Return"
- Form 1120: "U.S. Corporation Income Tax Return" 
- Form 1120-S: "U.S. Income Tax Return for an S Corporation"
- Form 1065: "U.S. Return of Partnership Income"

EXTRACTION RULES:
- Extract ALL line items visible in the document
- Use null for missing/illegible values
- All monetary values as numbers (no $ or commas)
- Negative numbers: use negative sign (not parentheses)
- Look at EVERY page including schedules

`;

  const form1120sPrompt = `
FOR FORM 1120-S (S Corporation), extract:

PAGE 1 - INCOME:
- Line 1a: Gross receipts or sales
- Line 1b: Returns and allowances  
- Line 1c: Balance (subtract 1b from 1a)
- Line 2: Cost of goods sold (from Form 1125-A)
- Line 3: Gross profit (1c minus line 2)
- Line 4: Net gain (loss) from Form 4797
- Line 5: Other income (loss)
- Line 6: Total income (loss) - add lines 3 through 5

PAGE 1 - DEDUCTIONS:
- Line 7: Compensation of officers
- Line 8: Salaries and wages (less employment credits)
- Line 9: Repairs and maintenance
- Line 10: Bad debts
- Line 11: Rents
- Line 12: Taxes and licenses
- Line 13: Interest
- Line 14: Depreciation
- Line 15: Depletion
- Line 16: Advertising
- Line 17: Pension, profit-sharing, etc.
- Line 18: Employee benefit programs
- Line 19: Other deductions
- Line 20: Total deductions
- Line 21: Ordinary business income (loss) - Line 6 minus Line 20 *** CRITICAL ***

TAX AND PAYMENTS:
- Line 22a-c: Excess net passive income tax, LIFO recapture
- Line 23: Estimated tax payments
- Line 27: Amount owed / Line 28: Overpayment

SCHEDULE K (Shareholders' Pro Rata Share Items) - Usually page 3-4:
Income/Loss:
- Line 1: Ordinary business income (loss)
- Line 2: Net rental real estate income (loss)
- Line 3: Other net rental income (loss)
- Line 4: Interest income
- Line 5a: Ordinary dividends, 5b: Qualified dividends
- Line 6: Royalties
- Line 7: Net short-term capital gain (loss)
- Line 8a: Net long-term capital gain (loss)
- Line 9: Net section 1231 gain (loss)
- Line 10: Other income (loss)

Deductions:
- Line 11: Section 179 deduction
- Line 12a: Charitable contributions

Other Information:
- Line 16c: Nondeductible expenses
- Line 16d: Distributions (cash and property)
- Line 17f: Foreign taxes paid

SCHEDULE L (Balance Sheet) - Usually page 4:
Beginning of Year (column b) and End of Year (column d):
Assets:
- Line 1: Cash
- Line 2a,b: Trade notes and accounts receivable (net)
- Line 3: Inventories
- Line 4: U.S. government obligations
- Line 5: Other current assets
- Line 6: Loans to shareholders
- Line 7: Mortgage and real estate loans
- Line 8: Other investments
- Line 9a: Buildings and other depreciable assets
- Line 9b: Less accumulated depreciation
- Line 10a: Depletable assets
- Line 11: Land
- Line 12: Intangible assets
- Line 13: Other assets
- Line 14: Total assets

Liabilities and Equity:
- Line 15: Accounts payable
- Line 16: Mortgages, notes, bonds payable < 1 year
- Line 17: Other current liabilities
- Line 18: Loans from shareholders
- Line 19: Mortgages, notes, bonds payable ≥ 1 year
- Line 20: Other liabilities
- Line 21: Capital stock
- Line 22: Additional paid-in capital
- Line 23: Retained earnings
- Line 24: Adjustments to shareholders' equity
- Line 25: Less cost of treasury stock
- Line 26: Total liabilities and shareholders' equity

SCHEDULE M-1 (Reconciliation) - Usually page 5:
- Line 1: Net income (loss) per books
- Line 2: Income included on Schedule K not on books
- Line 3: Expenses recorded on books not on Schedule K
- Line 4: Add lines 1 through 3
- Line 5: Income on Schedule K not on books
- Line 6: Deductions on Schedule K not charged to books
- Line 7: Add lines 5 and 6
- Line 8: Income (loss) per Schedule K (line 4 minus line 7)

SCHEDULE M-2 (AAA Analysis) - Usually page 5:
- Line 1: Balance at beginning of tax year
- Line 2: Ordinary income from page 1, line 21
- Line 3: Other additions
- Line 4: Loss from page 1, line 21
- Line 5: Other reductions
- Line 6: Combine lines 1 through 5
- Line 7: Distributions (other than dividend distributions)
- Line 8: Balance at end of tax year

FORM 1125-A (COGS) - if present:
- Line 1: Inventory at beginning of year
- Line 2: Purchases
- Line 3: Cost of labor
- Line 4: Additional section 263A costs
- Line 5: Other costs
- Line 6: Total (add lines 1-5)
- Line 7: Inventory at end of year
- Line 8: Cost of goods sold (line 6 minus line 7)
`;

  const form1040Prompt = `
FOR FORM 1040 (Individual), extract:

INCOME:
- Line 1: Wages, salaries, tips (from W-2s)
- Line 2a,b: Tax-exempt interest, Taxable interest
- Line 3a,b: Qualified dividends, Ordinary dividends
- Line 4a,b: IRA distributions - total, taxable
- Line 5a,b: Pensions and annuities - total, taxable
- Line 6a,b: Social security benefits - total, taxable
- Line 7: Capital gain or (loss) from Schedule D
- Line 8: Other income from Schedule 1
- Line 9: Total income
- Line 10: Adjustments from Schedule 1
- Line 11: Adjusted gross income (AGI)

DEDUCTIONS:
- Line 12: Standard deduction or itemized deductions
- Line 13: Qualified business income deduction
- Line 14: Add lines 12 and 13
- Line 15: Taxable income

TAX AND CREDITS:
- Line 16: Tax
- Line 17: Amount from Schedule 2
- Line 18: Add lines 16 and 17
- Line 19-21: Credits from Schedule 3
- Line 22: Other taxes from Schedule 2
- Line 24: Total tax
- Line 25a-d: Withholding and payments
- Line 33: Total payments
- Line 34: Overpayment
- Line 37: Amount you owe

SCHEDULE C (if present):
- Line 1: Gross receipts or sales
- Line 2: Returns and allowances
- Line 3: Subtract line 2 from line 1
- Line 4: Cost of goods sold
- Line 5: Gross profit
- Line 7: Gross income
- Lines 8-27: Various expenses
- Line 28: Total expenses
- Line 29: Tentative profit (or loss)
- Line 31: Net profit (or loss)

SCHEDULE SE (Self-Employment Tax):
- Line 3: Net earnings from self-employment
- Line 12: Self-employment tax
`;

  return basePrompt + form1120sPrompt + form1040Prompt + `

Return a JSON object matching this structure exactly:
{
  "formType": "1040|1120|1065|1120S",
  "taxYear": <number>,
  "taxpayerName": "<name>",
  "ein": "<if business>",
  "naicsCode": "<business code if shown>",
  "accountingMethod": "cash|accrual|other",
  "numberOfShareholders": <number if 1120S>,
  
  "grossReceipts": <number>,
  "returnsAndAllowances": <number>,
  "netReceipts": <number>,
  "costOfGoodsSold": <number>,
  "grossProfit": <number>,
  "netGainForm4797": <number>,
  "otherIncome": <number>,
  "totalIncome": <number>,
  
  "officerCompensation": <number>,
  "salariesWages": <number>,
  "repairs": <number>,
  "badDebts": <number>,
  "rent": <number>,
  "taxes": <number>,
  "interestExpense": <number>,
  "depreciation": <number>,
  "depletion": <number>,
  "advertising": <number>,
  "pension": <number>,
  "employeeBenefit": <number>,
  "otherDeductions": <number>,
  "totalDeductions": <number>,
  
  "ordinaryBusinessIncome": <number>,
  "taxableIncome": <number>,
  "totalTax": <number>,
  "estimatedTaxPayments": <number>,
  "overpayment": <number>,
  "amountOwed": <number>,
  
  "scheduleK": {
    "ordinaryBusinessIncome": <number>,
    "netRentalRealEstateIncome": <number>,
    "interestIncome": <number>,
    "ordinaryDividends": <number>,
    "qualifiedDividends": <number>,
    "netShortTermCapitalGain": <number>,
    "netLongTermCapitalGain": <number>,
    "netSection1231Gain": <number>,
    "section179Deduction": <number>,
    "charitableContributions": <number>,
    "nondeductibleExpenses": <number>,
    "distributions": <number>,
    "foreignTaxesPaid": <number>
  },
  
  "scheduleL": {
    "beginningOfYear": {
      "cash": <number>,
      "accountsReceivable": <number>,
      "inventories": <number>,
      "loansToShareholders": <number>,
      "buildings": <number>,
      "depreciableAssets": <number>,
      "accumulatedDepreciation": <number>,
      "land": <number>,
      "totalAssets": <number>,
      "accountsPayable": <number>,
      "mortgagesPayable": <number>,
      "loansFromShareholders": <number>,
      "totalLiabilities": <number>,
      "capitalStock": <number>,
      "retainedEarnings": <number>,
      "totalEquity": <number>
    },
    "endOfYear": {
      "cash": <number>,
      "accountsReceivable": <number>,
      "inventories": <number>,
      "loansToShareholders": <number>,
      "buildings": <number>,
      "depreciableAssets": <number>,
      "accumulatedDepreciation": <number>,
      "land": <number>,
      "totalAssets": <number>,
      "accountsPayable": <number>,
      "mortgagesPayable": <number>,
      "loansFromShareholders": <number>,
      "totalLiabilities": <number>,
      "capitalStock": <number>,
      "retainedEarnings": <number>,
      "totalEquity": <number>
    }
  },
  
  "scheduleM1": {
    "netIncomePerBooks": <number>,
    "incomeOnBooksNotOnReturn": <number>,
    "expensesOnBooksNotDeducted": <number>,
    "incomeOnReturnNotOnBooks": <number>,
    "deductionsNotChargedToBooks": <number>,
    "incomePerScheduleK": <number>
  },
  
  "scheduleM2": {
    "beginningAAA": <number>,
    "ordinaryIncome": <number>,
    "otherAdditions": <number>,
    "lossDeductions": <number>,
    "otherReductions": <number>,
    "distributionsCash": <number>,
    "distributionsProperty": <number>,
    "endingAAA": <number>,
    "accumulatedEP": <number>
  },
  
  "cogsDetails": {
    "beginningInventory": <number>,
    "purchases": <number>,
    "costOfLabor": <number>,
    "otherCosts": <number>,
    "endingInventory": <number>,
    "inventoryMethod": "<FIFO|LIFO|Cost|Lower of cost or market|Other>"
  },
  
  "form1040": {
    "wagesFromW2": <number>,
    "interestIncome": <number>,
    "dividendIncome": <number>,
    "scheduleCGrossReceipts": <number>,
    "scheduleCNetProfit": <number>,
    "capitalGains": <number>,
    "adjustedGrossIncome": <number>,
    "standardDeduction": <number>,
    "itemizedDeductions": <number>,
    "qualifiedBusinessIncomeDeduction": <number>,
    "selfEmploymentTax": <number>
  }
}

Use null for any values not found. Extract EVERYTHING visible.`;
}

// Extract tax return data using AI vision
async function extractWithAI(base64: string, mimeType: string, apiKey: string): Promise<TaxReturnData> {
  const extractionPrompt = getExtractionPrompt();

  console.log("Sending document to AI for comprehensive extraction...");
  
  const aiResponse = await aiFetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: extractionPrompt },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 8000, // Increased for comprehensive extraction
    }),
  });

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error("AI extraction failed:", aiResponse.status, errorText);
    throw new Error(`AI extraction failed: ${aiResponse.status}`);
  }

  const aiData = await aiResponse.json();
  const content = aiData.choices?.[0]?.message?.content || "";

  console.log("AI extraction response length:", content.length);
  console.log("AI extraction preview:", content.substring(0, 1000));

  // Parse the JSON from AI response
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                    content.match(/```\s*([\s\S]*?)\s*```/) ||
                    content.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    const jsonStr = jsonMatch[1] || jsonMatch[0];
    try {
      const parsed = JSON.parse(jsonStr);
      // Ensure backward compatibility
      if (!parsed.businessIncome && parsed.ordinaryBusinessIncome) {
        parsed.businessIncome = parsed.ordinaryBusinessIncome;
      }
      return parsed;
    } catch (e) {
      console.error("JSON parse error:", e, "Raw:", jsonStr.substring(0, 500));
      throw new Error("Failed to parse AI response as JSON");
    }
  } else {
    throw new Error("No JSON found in AI response");
  }
}

// ============================================================================
// QuickBooks Reports API → normalized {accounts: [{name, monthlyValues}]} shape
// ============================================================================
// qbtojson stores raw QB ProfitAndLoss / BalanceSheet / CashFlow reports.
// The comparison engine expects normalized buckets. These helpers convert
// in-memory at read time. No DB schema changes.

function parseQbAmount(v: any): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  let s = String(v).replace(/[$,\s]/g, "");
  if (!s) return 0;
  let neg = false;
  if (s.startsWith("(") && s.endsWith(")")) { neg = true; s = s.slice(1, -1); }
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  return neg ? -n : n;
}

function isRawQbMonthlyArray(data: any): boolean {
  return Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === "object"
    && "month" in (data[0] as any) && "report" in (data[0] as any);
}

function hasMonthlyReports(data: any): boolean {
  return !!(data && Array.isArray(data?.monthlyReports) && data.monthlyReports[0]?.report?.rows);
}

function isRawQbReport(data: any): boolean {
  // Single QB report shape: { rows: { row: [...] }, header, columns }
  return !!(data && data?.rows?.row && Array.isArray(data.rows.row) && !Array.isArray(data));
}

interface NormalizedAccount { name: string; monthlyValues: Record<string, number>; }
interface NormalizedSection { accounts: NormalizedAccount[]; }
interface NormalizedIS { revenue: NormalizedSection; otherIncome: NormalizedSection; cogs: NormalizedSection; expenses: NormalizedSection; totalRevenue: number; netIncome: number; }
interface NormalizedBS { assets: NormalizedSection; liabilities: NormalizedSection; equity: NormalizedSection; }

function bucketIsSection(group: string, header: string): "revenue" | "otherIncome" | "cogs" | "expenses" | null {
  const g = (group || "").toLowerCase();
  const h = (header || "").toLowerCase();
  // Keep operating revenue (Line 1a counterpart) separate from non-operating Other Income
  // (interest, dividends, gains) which belong on Schedule K, not Page 1.
  if (g === "otherincome" || h === "other income") return "otherIncome";
  if (g === "income" || h === "income") return "revenue";
  if (g === "cogs" || h.includes("cost of goods")) return "cogs";
  if (g === "expenses" || g === "otherexpenses" || h === "expenses" || h === "other expenses") return "expenses";
  return null; // ignore GrossProfit, NetIncome, NetOperatingIncome, NetOtherIncome
}

function bucketBsSection(group: string, header: string): "assets" | "liabilities" | "equity" | null {
  const g = (group || "").toLowerCase();
  const h = (header || "").toLowerCase();
  if (g === "totalassets" || g.endsWith("assets") || g === "bank" || g === "ar" || g === "inventory" || h.includes("asset")) return "assets";
  if (g === "totalliabilitiesandequity") return null; // parent — children resolve to liabilities/equity
  if (g === "liabilities" || g.endsWith("liabilities") || g === "creditcards" || g === "longtermliabilities" || h.includes("liabilit")) return "liabilities";
  if (g === "equity" || h === "equity") return "equity";
  return null;
}

// Walk QB report `rows` (which is `{row: [...]}`); call `onLeaf` for each DATA row.
function walkQbLeaves(rows: any, onLeaf: (colData: any[]) => void, onSection?: (r: any) => { skip?: boolean; replaceBucket?: any } | void): void {
  const list = rows?.row;
  if (!Array.isArray(list)) return;
  for (const r of list) {
    if (!r) continue;
    const isSection = r.type === "Section" || r.type === "SECTION" || !!r.rows;
    if (isSection) {
      const action = onSection?.(r);
      if (action?.skip) continue;
      if (r.rows) walkQbLeaves(r.rows, onLeaf, onSection);
    } else if (r.colData && Array.isArray(r.colData) && r.colData.length >= 2) {
      onLeaf(r.colData);
    }
  }
}

function normalizeQbPnlMonthly(months: any[]): NormalizedIS {
  const buckets: Record<"revenue" | "otherIncome" | "cogs" | "expenses", Map<string, Record<string, number>>> = {
    revenue: new Map(), otherIncome: new Map(), cogs: new Map(), expenses: new Map(),
  };
  let totalRevenue = 0;
  let netIncome = 0;
  for (const m of months || []) {
    const monthKey = String(m?.month || "").substring(0, 7); // "YYYY-MM"
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
    const topRows = m?.report?.rows?.row;
    if (!Array.isArray(topRows)) continue;
    for (const section of topRows) {
      const group = section?.group || "";
      const header = section?.header?.colData?.[0]?.value || "";
      if (group === "NetIncome") {
        netIncome += parseQbAmount(section?.summary?.colData?.[1]?.value);
      }
      const bucket = bucketIsSection(group, header);
      if (!bucket) continue;
      walkQbLeaves(section.rows, (colData) => {
        const name = String(colData?.[0]?.value || "").trim();
        if (!name) return;
        const amt = parseQbAmount(colData?.[1]?.value);
        if (amt === 0) return;
        const mv = buckets[bucket].get(name) || {};
        mv[monthKey] = (mv[monthKey] || 0) + amt;
        buckets[bucket].set(name, mv);
        // totalRevenue tracks operating revenue only (Line 1a counterpart).
        // Other Income is non-operating and intentionally excluded.
        if (bucket === "revenue") totalRevenue += amt;
      });
    }
  }
  const sec = (b: Map<string, Record<string, number>>): NormalizedSection => ({
    accounts: Array.from(b.entries()).map(([name, mv]) => ({ name, monthlyValues: mv })),
  });
  return { revenue: sec(buckets.revenue), otherIncome: sec(buckets.otherIncome), cogs: sec(buckets.cogs), expenses: sec(buckets.expenses), totalRevenue, netIncome };
}

function normalizeQbBalanceSheetMonthly(months: any[]): NormalizedBS {
  const buckets: Record<"assets" | "liabilities" | "equity", Map<string, Record<string, number>>> = {
    assets: new Map(), liabilities: new Map(), equity: new Map(),
  };
  for (const m of months || []) {
    const monthKey = String(m?.month || "").substring(0, 7);
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
    const topRows = m?.report?.rows;
    if (!topRows) continue;

    const visit = (rows: any, currentBucket: "assets" | "liabilities" | "equity" | null) => {
      const list = rows?.row;
      if (!Array.isArray(list)) return;
      for (const r of list) {
        if (!r) continue;
        const isSection = r.type === "Section" || r.type === "SECTION" || !!r.rows;
        if (isSection) {
          const g = r.group || "";
          const h = r.header?.colData?.[0]?.value || "";
          const resolved = bucketBsSection(g, h);
          // For TotalLiabilitiesAndEquity parent (resolved === null but children carry the bucket),
          // keep currentBucket as null so child sections set it.
          const nextBucket = resolved ?? currentBucket;
          if (r.rows) visit(r.rows, nextBucket);
        } else if (r.colData && Array.isArray(r.colData) && r.colData.length >= 2 && currentBucket) {
          const name = String(r.colData[0]?.value || "").trim();
          if (!name) continue;
          const amt = parseQbAmount(r.colData[1]?.value);
          // BS is point-in-time: record EOM balance per month (replace, don't add)
          const mv = buckets[currentBucket].get(name) || {};
          mv[monthKey] = amt;
          buckets[currentBucket].set(name, mv);
        }
      }
    };
    visit(topRows, null);
  }
  const sec = (b: Map<string, Record<string, number>>): NormalizedSection => ({
    accounts: Array.from(b.entries()).map(([name, mv]) => ({ name, monthlyValues: mv })),
  });
  return { assets: sec(buckets.assets), liabilities: sec(buckets.liabilities), equity: sec(buckets.equity) };
}

function bucketCfSection(group: string, header: string): "operating" | "investing" | "financing" | null {
  const g = (group || "").toLowerCase();
  const h = (header || "").toLowerCase();
  if (g.includes("operat") || h.includes("operat")) return "operating";
  if (g.includes("invest") || h.includes("invest")) return "investing";
  if (g.includes("financ") || h.includes("financ")) return "financing";
  return null;
}

function normalizeQbCashFlowMonthly(months: any[]): {
  operating: NormalizedSection; investing: NormalizedSection; financing: NormalizedSection; netChange: number;
} {
  const buckets: Record<"operating" | "investing" | "financing", Map<string, Record<string, number>>> = {
    operating: new Map(), investing: new Map(), financing: new Map(),
  };
  let netChange = 0;
  for (const m of months || []) {
    const monthKey = String(m?.month || "").substring(0, 7);
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
    const topRows = m?.report?.rows?.row;
    if (!Array.isArray(topRows)) continue;
    for (const section of topRows) {
      const group = section?.group || "";
      const header = section?.header?.colData?.[0]?.value || "";
      if (group === "NetCashIncrease" || /net (cash )?increase/i.test(header)) {
        netChange += parseQbAmount(section?.summary?.colData?.[1]?.value);
        continue;
      }
      const bucket = bucketCfSection(group, header);
      if (!bucket) continue;
      walkQbLeaves(section.rows, (colData) => {
        const name = String(colData?.[0]?.value || "").trim();
        if (!name) return;
        const amt = parseQbAmount(colData?.[1]?.value);
        if (amt === 0) return;
        const mv = buckets[bucket].get(name) || {};
        mv[monthKey] = (mv[monthKey] || 0) + amt;
        buckets[bucket].set(name, mv);
      });
    }
  }
  const sec = (b: Map<string, Record<string, number>>): NormalizedSection => ({
    accounts: Array.from(b.entries()).map(([name, mv]) => ({ name, monthlyValues: mv })),
  });
  return { operating: sec(buckets.operating), investing: sec(buckets.investing), financing: sec(buckets.financing), netChange };
}

/** Normalize qbtojson trial_balance payload to { accounts: [{ name, debit, credit, monthlyValues }] }. */
function normalizeQbTrialBalance(payload: any): { accounts: NormalizedAccount[]; totalDebit: number; totalCredit: number } {
  const monthlyReports = Array.isArray(payload?.monthlyReports) ? payload.monthlyReports : [];
  const byAccount = new Map<string, { debit: number; credit: number; monthlyValues: Record<string, number> }>();
  let totalDebit = 0;
  let totalCredit = 0;
  for (const mr of monthlyReports) {
    const year = mr?.year;
    const month = mr?.month;
    if (!year || !month) continue;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const rows = mr?.report?.rows;
    if (!rows) continue;
    const visit = (r: any) => {
      const list = r?.row;
      if (!Array.isArray(list)) return;
      for (const row of list) {
        if (!row) continue;
        if (row.type === "Section" || row.rows) {
          if (row.rows) visit(row.rows);
          continue;
        }
        const cd = row.colData;
        if (!Array.isArray(cd) || cd.length < 2) continue;
        const name = String(cd[0]?.value || "").trim();
        if (!name) continue;
        // TB rows commonly: [name, debit, credit] OR [name, amount]
        const debit = parseQbAmount(cd[1]?.value);
        const credit = cd.length >= 3 ? parseQbAmount(cd[2]?.value) : 0;
        const net = debit - credit;
        if (debit === 0 && credit === 0) continue;
        const cur = byAccount.get(name) || { debit: 0, credit: 0, monthlyValues: {} };
        cur.debit += debit;
        cur.credit += credit;
        cur.monthlyValues[monthKey] = (cur.monthlyValues[monthKey] || 0) + net;
        byAccount.set(name, cur);
        totalDebit += debit;
        totalCredit += credit;
      }
    };
    visit(rows);
  }
  return {
    accounts: Array.from(byAccount.entries()).map(([name, v]) => ({
      name, monthlyValues: v.monthlyValues, debit: v.debit, credit: v.credit,
    } as any)),
    totalDebit, totalCredit,
  };
}

/** Apply the right QB-shape normalizer based on data_type. Returns input untouched if already normalized. */
function maybeNormalizeQbData(dataType: string, sourceType: string, data: any): any {
  const looksRawMonthly = isRawQbMonthlyArray(data);
  const looksRawTb = hasMonthlyReports(data);
  // Run normalization for qbtojson OR for any source that happens to carry raw QB shapes
  // (e.g. quickbooks_api / unified_api proxying QB Reports verbatim).
  if (sourceType !== "qbtojson" && !looksRawMonthly && !looksRawTb) return data;
  try {
    if (dataType === "income_statement" && looksRawMonthly) {
      return normalizeQbPnlMonthly(data);
    }
    if (dataType === "balance_sheet" && looksRawMonthly) {
      return normalizeQbBalanceSheetMonthly(data);
    }
    if (dataType === "cash_flow" && looksRawMonthly) {
      return normalizeQbCashFlowMonthly(data);
    }
    if (dataType === "trial_balance" && looksRawTb) {
      return normalizeQbTrialBalance(data);
    }
  } catch (e) {
    console.warn(`maybeNormalizeQbData(${dataType}) failed:`, e);
  }
  return data;
}



serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, projectId } = await req.json();

    if (!documentId || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing documentId or projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = await requireProjectAccess(req, projectId);
    if (!auth.ok) return auth.response;


    const VERCEL_AI_GATEWAY_KEY = Deno.env.get("VERCEL_AI_GATEWAY_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!VERCEL_AI_GATEWAY_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch document details
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`);
    }

    console.log("Processing tax return:", document.name);

    // Use AI vision extraction directly
    console.log("Using AI vision extraction for tax return");
    const extractionSource = "ai_extraction";
    
    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Convert to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    // Determine MIME type
    const fileType = document.file_type?.toLowerCase() || "pdf";
    const mimeType = fileType === "pdf" ? "application/pdf" : `image/${fileType}`;
    
    const extractedData = await extractWithAI(base64, mimeType, VERCEL_AI_GATEWAY_KEY);

    // Log extraction summary
    console.log("Extracted form type:", extractedData.formType);
    console.log("Tax year:", extractedData.taxYear);
    console.log("Has Schedule K:", !!extractedData.scheduleK);
    console.log("Has Schedule L:", !!extractedData.scheduleL);
    console.log("Has Schedule M-1:", !!extractedData.scheduleM1);
    console.log("Has Schedule M-2:", !!extractedData.scheduleM2);
    console.log("Has COGS details:", !!extractedData.cogsDetails);

    // Fetch comparison data from wizard_data and processed_data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("wizard_data, periods")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.warn("Failed to fetch project:", projectError);
    }

    const wizardData = (project?.wizard_data || {}) as Record<string, any>;

    // Fetch processed_data for comparison
    const { data: processedRecords, error: pdError } = await supabase
      .from("processed_data")
      .select("data_type, data, period_start, period_end, source_type")
      .eq("project_id", projectId);

    if (pdError) {
      console.warn("Failed to fetch processed data:", pdError);
    }

    // Year-scoped processed_data resolution.
    // Preference order (prefer multi-year normalized aggregates so we don't pick a single
    // monthly snapshot whose raw shape the downstream matchers can't interpret):
    //   (a) qbtojson "aggregate" — either NULL period_end OR a row spanning ≥ 11 months.
    //       Carries monthlyValues across years; year-scoped downstream via taxYear-aware helpers.
    //   (b) row whose period_end is inside the tax year (single-month snapshots),
    //       used only when no qbtojson aggregate exists for this data_type.
    //   (c) most recent row with period_end (flagged as period_mismatch).
    const taxYear = extractedData.taxYear;
    const yearStart = `${taxYear}-01-01`;
    const yearEnd = `${taxYear}-12-31`;

    const monthsBetween = (a?: string | null, b?: string | null): number => {
      if (!a || !b) return 0;
      const da = new Date(String(a));
      const db = new Date(String(b));
      if (isNaN(da.getTime()) || isNaN(db.getTime())) return 0;
      return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth()) + 1;
    };
    const isQbAggregateRow = (r: any): boolean => {
      if (r.source_type !== 'qbtojson') return false;
      if (!r.period_end) return true;
      return monthsBetween(r.period_start, r.period_end) >= 11;
    };

    const processedData: Record<string, any> = {};
    const processedDataPeriodMismatch: Record<string, boolean> = {};
    const processedDataSourceKind: Record<string, 'in_year' | 'aggregate' | 'period_mismatch'> = {};
    const byType: Record<string, any[]> = {};
    for (const r of processedRecords || []) {
      (byType[r.data_type] ||= []).push(r);
    }
    for (const [dtype, rows] of Object.entries(byType)) {
      // (a) qbtojson aggregate first — multi-year, normalized into monthlyValues
      const aggregate = rows.find(isQbAggregateRow);
      if (aggregate) {
        processedData[dtype] = maybeNormalizeQbData(dtype, 'qbtojson', aggregate.data);
        processedDataSourceKind[dtype] = 'aggregate';
        continue;
      }
      // (b) row whose period_end is inside the tax year
      const inYear = rows.find((r) => {
        if (!r.period_end) return false;
        const d = String(r.period_end);
        return d >= yearStart && d <= yearEnd;
      });
      if (inYear) {
        processedData[dtype] = maybeNormalizeQbData(dtype, inYear.source_type, inYear.data);
        processedDataSourceKind[dtype] = 'in_year';
        continue;
      }
      // (c) most recent with period_end
      const sorted = rows
        .filter((r) => r.period_end)
        .sort((a, b) => String(b.period_end).localeCompare(String(a.period_end)));
      if (sorted[0]) {
        processedData[dtype] = maybeNormalizeQbData(dtype, sorted[0].source_type, sorted[0].data);
        processedDataPeriodMismatch[dtype] = true;
        processedDataSourceKind[dtype] = 'period_mismatch';
      } else if (rows[0]) {
        processedData[dtype] = maybeNormalizeQbData(dtype, rows[0].source_type, rows[0].data);
        processedDataPeriodMismatch[dtype] = true;
        processedDataSourceKind[dtype] = 'period_mismatch';
      }
    }



    // Year-scoped canonical_transactions (the primary GL source).
    // IMPORTANT: exclude rows that are *monthly snapshots* of IS/BS/CF/TB — those are
    // already covered by the IS/BS helpers and would double-count (often 12-60x).
    const GL_SOURCE_TYPES = ['general_ledger', 'bank_transactions', 'credit_card_transactions', 'journal_entries', 'qbtojson'];
    const { data: txns, error: txnsErr } = await supabase
      .from("canonical_transactions")
      .select("account_name, account_type, amount, amount_signed, amount_abs, source_type")
      .eq("project_id", projectId)
      .in("source_type", GL_SOURCE_TYPES)
      .gte("txn_date", yearStart)
      .lte("txn_date", yearEnd);
    if (txnsErr) {
      console.warn("canonical_transactions fetch warning:", txnsErr.message);
    }

    // Diagnostics: count rows per source_type for THIS year (including excluded snapshots),
    // so the UI can explain why GL matching produced few/no comparisons.
    const { data: txnSourceCounts } = await supabase
      .from("canonical_transactions")
      .select("source_type")
      .eq("project_id", projectId)
      .gte("txn_date", yearStart)
      .lte("txn_date", yearEnd);
    const sourceTypeRows: Record<string, number> = {};
    for (const r of txnSourceCounts || []) {
      const st = String(r.source_type || 'unknown');
      sourceTypeRows[st] = (sourceTypeRows[st] || 0) + 1;
    }

    interface AccountAgg { signed: number; abs: number; type: string | null }
    const glByAccount = new Map<string, AccountAgg>();
    for (const t of txns || []) {
      const name = String(t.account_name || "").trim();
      if (!name) continue;
      const cur = glByAccount.get(name) || { signed: 0, abs: 0, type: t.account_type ?? null };
      cur.signed += Number(t.amount_signed ?? t.amount ?? 0);
      cur.abs += Number(t.amount_abs ?? Math.abs(Number(t.amount ?? 0)));
      glByAccount.set(name, cur);
    }
    let hasGL = glByAccount.size > 0;


    const matchAccounts = (matchers: RegExp[], exclude: RegExp[] = []): { total: number; accounts: string[] } => {
      let total = 0;
      const accounts: string[] = [];
      for (const [name, vals] of glByAccount.entries()) {
        if (exclude.some((rx) => rx.test(name))) continue;
        if (matchers.some((rx) => rx.test(name))) {
          total += vals.abs;
          accounts.push(name);
        }
      }
      return { total, accounts };
    };

    // P&L deduction-account matchers (used against canonical_transactions)
    const PL_MATCHERS: Record<string, { match: RegExp[]; exclude?: RegExp[] }> = {
      salariesWages: {
        match: [
          /salar/i, /\bwages?\b/i, /\bpayroll\b/i,
          /\bw[- ]?2\b/i, /\bgusto\b/i, /\badp\b/i, /paychex/i, /justworks/i, /rippling/i,
          /payroll expense/i, /employee comp/i, /staff (cost|wage|pay)/i, /labor expense/i,
        ],
        exclude: [/officer/i, /owner/i, /payroll tax/i, /shareholder/i, /contract labor/i],
      },
      officerCompensation: {
        match: [
          /officer/i, /owner.*comp/i, /shareholder.*comp/i, /\bowners?\s+draw\b/i,
          /officer salar/i, /officer wage/i, /owner salar/i, /owner wage/i,
          /shareholder salar/i, /shareholder wage/i, /\bowner pay\b/i,
          /\bs[- ]?corp.*(salary|wage|comp)/i,
        ],
      },
      repairs: {
        match: [
          /repair/i, /maintenance/i,
          /\br\s*&\s*m\b/i, /\br\/m\b/i, /upkeep/i, /janitorial/i, /\bcleaning\b/i,
          /\bservice contract/i, /\bgroundskeep/i, /landscap/i,
        ],
        exclude: [/customer service/i, /internet service/i, /professional service/i],
      },
      badDebts: { match: [/bad debt/i, /uncollect/i, /write.?off/i] },
      rent: {
        match: [
          /\brent\b/i, /\blease\b/i,
          /\brental expense/i, /office space/i, /storage (rent|fee)/i,
          /equipment lease/i, /vehicle lease/i, /\brent expense/i,
        ],
        exclude: [/rental income/i, /rent income/i, /prepaid rent/i],
      },
      taxes: {
        match: [
          /\btax(es)?\b/i, /licens/i,
          /\bbusiness license/i, /\bpermit/i, /regulatory fee/i,
          /\bfranchise tax/i, /\bproperty tax/i, /\bpayroll tax/i, /\bexcise tax/i,
        ],
        exclude: [/income tax/i, /deferred tax/i, /tax refund/i],
      },
      interestExpense: {
        match: [
          /interest expen/i, /^interest$/i, /finance charg/i,
          /\bloan interest/i, /credit card interest/i, /mortgage interest/i,
          /line of credit/i, /\bloc interest/i,
        ],
        exclude: [/interest income/i],
      },
      depreciation: {
        match: [
          /deprec/i, /amortiz/i,
          /section 179/i, /bonus depreciation/i,
        ],
      },
      depletion: { match: [/deplet/i] },
      advertising: {
        match: [
          /advertis/i, /marketing/i, /promot/i,
          /\bads\b/i, /google ads/i, /facebook ads/i, /social media/i,
          /sponsorship/i, /trade show/i, /\bbranding\b/i, /seo expense/i,
        ],
      },
      pension: {
        match: [
          /pension/i, /401\s*\(?k\)?/i, /retirement plan/i, /profit shar/i,
          /simple ira/i, /sep[- ]?ira/i, /\broth\b/i, /employer match/i,
        ],
      },
      employeeBenefit: {
        match: [
          /employee benefit/i, /health insur/i, /\bmedical\b/i, /dental/i, /vision insur/i,
          /\bhsa\b/i, /\bfsa\b/i, /life insurance/i, /disability insurance/i,
          /worker.?s? comp/i, /\bpto\b/i, /staff (meal|event|gift)/i,
        ],
      },
    };

    // Balance-sheet matchers (used against processed_data.balance_sheet / trial_balance EOY values)
    const BS_MATCHERS: Record<string, { match: RegExp[]; exclude?: RegExp[] }> = {
      cash: { match: [/^cash/i, /checking/i, /money market/i, /^bank/i, /savings/i] },
      accountsReceivable: { match: [/^a\/?r\b/i, /accounts? receiv/i, /trade receiv/i] },
      inventories: { match: [/inventor/i] },
      loansToShareholders: { match: [/loan.*to.*(shareholder|owner|officer)/i, /due from (shareholder|officer|owner)/i] },
      buildings: { match: [/building/i, /leasehold improvement/i] },
      depreciableAssets: { match: [/equipment/i, /machinery/i, /vehicle/i, /furniture/i, /fixture/i, /computer hardware/i], exclude: [/accumulated/i] },
      accumulatedDepreciation: { match: [/accumulated depreciation/i, /less.*depreciation/i] },
      land: { match: [/^land\b/i] },
      accountsPayable: { match: [/^a\/?p\b/i, /accounts? payab/i, /trade payab/i] },
      mortgagesPayable: { match: [/mortgage/i, /note.*payab/i, /long.term.*debt/i, /loan.*payab/i] },
      loansFromShareholders: { match: [/loan.*from.*(shareholder|owner|officer)/i, /due to (shareholder|officer|owner)/i] },
      capitalStock: { match: [/capital stock/i, /common stock/i, /paid.in capital/i] },
      retainedEarnings: { match: [/retained earnings/i] },
    };

    // Helper: extract EOY balance from processed_data.balance_sheet shape, scoped to taxYear.
    // Picks the December (or last available) monthly key whose YYYY-MM <= yearEnd. If no key
    // belongs to or precedes the tax year, falls back to absolute-last (with mismatch flag).
    const yearMonthPrefix = `${taxYear}-`;
    const getBsEoyByMatcher = (matchers: { match: RegExp[]; exclude?: RegExp[] }): { total: number; accounts: string[] } => {
      const bs = wizardData.balanceSheet || processedData.balance_sheet;
      if (!bs) return { total: 0, accounts: [] };
      const collect = (accounts: any[]): { total: number; accounts: string[] } => {
        let total = 0;
        const matched: string[] = [];
        for (const a of accounts || []) {
          const name = String(a?.name || a?.accountName || "").trim();
          if (!name) continue;
          if (matchers.exclude?.some((rx) => rx.test(name))) continue;
          if (!matchers.match.some((rx) => rx.test(name))) continue;
          const monthly = a.monthlyValues || {};
          const keys = Object.keys(monthly).sort();
          let eoyKey: string | undefined;
          // Prefer last key inside the tax year (e.g. "2024-12")
          const inYear = keys.filter((k) => k.startsWith(yearMonthPrefix));
          if (inYear.length) {
            eoyKey = inYear[inYear.length - 1];
          } else {
            // Otherwise last key <= yearEnd ("YYYY-12")
            const leYearEnd = keys.filter((k) => k <= `${taxYear}-12`);
            if (leYearEnd.length) eoyKey = leYearEnd[leYearEnd.length - 1];
            else if (keys.length) eoyKey = keys[keys.length - 1];
          }
          const eoy = eoyKey ? Number(monthly[eoyKey]) || 0 : Number(a.endingBalance ?? a.balance ?? 0);
          total += eoy;
          matched.push(name);
        }
        return { total, accounts: matched };
      };
      const buckets = [bs.accounts, bs.assets?.accounts, bs.liabilities?.accounts, bs.equity?.accounts];
      let total = 0;
      const accounts: string[] = [];
      for (const b of buckets) {
        if (!Array.isArray(b)) continue;
        const r = collect(b);
        total += r.total;
        accounts.push(...r.accounts);
      }
      return { total, accounts: Array.from(new Set(accounts)) };
    };


    // Build comparisons
    const comparisons: ComparisonResult[] = [];
    const flags: string[] = [];
    // Surface why expected comparisons were skipped. Populated throughout
    // the loops below; emitted in the final analysisDiagnostics block.
    const skippedFields: NonNullable<AnalysisDiagnostics['skippedFields']> = [];


    const getStatus = (variance: number | null, threshold: number = 0.05): ComparisonResult['status'] => {
      if (variance === null) return 'missing_data';
      const a = Math.abs(variance);
      if (a <= threshold) return 'match';
      if (a <= 0.10) return 'minor_variance';
      return 'significant_variance';
    };

    const pushCompare = (args: {
      field: string;
      taxValue: number | null | undefined;
      comparisonValue: number | null;
      source: string;
      category: string;
      threshold?: number;
      matchedAccounts?: string[];
      note?: string;
      flagMessage?: string;
      excludeFromScore?: boolean;
    }) => {
      const { field, taxValue, comparisonValue, source, category, threshold = 0.05, matchedAccounts, note, flagMessage, excludeFromScore } = args;
      if (taxValue === null || taxValue === undefined) return;
      if (comparisonValue === null || comparisonValue === 0) {
        // Skip rows where we have no comparable counterpart — they pollute the table
        return;
      }
      const variance = (taxValue - comparisonValue) / Math.abs(comparisonValue);
      const status = getStatus(variance, threshold);
      comparisons.push({
        field,
        taxReturnValue: taxValue,
        comparisonValue,
        source,
        variance: taxValue - comparisonValue,
        variancePercent: variance * 100,
        status,
        category,
        matchedAccounts,
        note,
        excludeFromScore,
      });
      if (flagMessage && Math.abs(variance) > threshold && !excludeFromScore) flags.push(flagMessage);
    };

    const pushReviewOnly = (args: {
      field: string;
      taxValue: number | null | undefined;
      category: string;
      note: string;
    }) => {
      if (args.taxValue === null || args.taxValue === undefined || args.taxValue === 0) return;
      comparisons.push({
        field: args.field,
        taxReturnValue: args.taxValue,
        comparisonValue: null,
        source: "Manual review",
        variance: null,
        variancePercent: null,
        status: 'review_only',
        category: args.category,
        note: args.note,
      });
    };

    // ============ INCOME STATEMENT helpers ============
    const incomeStatement = wizardData.incomeStatement || processedData.income_statement;
    const isPeriodMismatch = processedDataPeriodMismatch.income_statement;
    const isSourceKind = processedDataSourceKind.income_statement;
    const isSourceLabel = isPeriodMismatch
      ? "Income Statement (period mismatch)"
      : isSourceKind === 'aggregate'
        ? `Income Statement (${taxYear}, from multi-year aggregate)`
        : "Income Statement";

    // Year-scoped monthly summation. Only sums monthlyValues keys matching `${taxYear}-*`.
    // If no keys match the tax year, returns 0 (so we don't compare a 1120-S against the wrong year).
    const sumISMonthly = (group: 'revenue' | 'otherIncome' | 'cogs' | 'expenses'): number => {
      if (!incomeStatement) return 0;
      const accounts = incomeStatement[group]?.accounts;
      if (!Array.isArray(accounts)) return 0;
      let anyYearKeyFound = false;
      const total = accounts.reduce((sum: number, acc: any) => {
        const monthly = acc.monthlyValues || {};
        let acctTotal = 0;
        for (const k of Object.keys(monthly)) {
          if (k.startsWith(yearMonthPrefix)) {
            anyYearKeyFound = true;
            acctTotal += Number(monthly[k]) || 0;
          }
        }
        return sum + acctTotal;
      }, 0);
      // If accounts use monthlyValues but none for this year, return 0 (not all-years total)
      return anyYearKeyFound ? total : 0;
    };

    // Per-year totals only. If the IS is a multi-year aggregate, do NOT fall back to
    // top-level totalRevenue/netIncome (those span all years).
    const isYearScoped = isSourceKind === 'in_year' || isSourceKind === 'aggregate';
    const isRevenue = sumISMonthly('revenue') || (isYearScoped ? 0 : (Number(incomeStatement?.totalRevenue) || 0));
    const isExpenses = sumISMonthly('expenses');
    const isCogs = sumISMonthly('cogs');
    const isNetIncomeFromMonthly = (isRevenue || isExpenses || isCogs) ? (isRevenue - isCogs - isExpenses) : 0;
    const isNetIncome = isNetIncomeFromMonthly || (isYearScoped ? 0 : (Number(incomeStatement?.netIncome) || 0));


    // ============ PAGE 1 — INCOME ============
    pushCompare({
      field: "Gross Receipts (1a)",
      taxValue: extractedData.grossReceipts,
      comparisonValue: isRevenue > 0 ? isRevenue : null,
      source: isSourceLabel,
      category: "income_p1",
      threshold: 0.05,
      flagMessage: `Revenue variance between tax return and Income Statement exceeds 5%`,
      note: "Compares to operating revenue only; non-operating Other Income (interest, dividends, gains) is tied out separately against Schedule K.",
    });

    // ============ OTHER INCOME (Schedule K non-operating) ============
    // Tie out QB's "Other Income" section to the Schedule K items that aggregate it on the return.
    // Without this, Other Income silently inflated the Gross Receipts comparison (pre-fix bug).
    const isOtherIncome = sumISMonthly('otherIncome');
    if (isOtherIncome > 0 && extractedData.scheduleK) {
      const k = extractedData.scheduleK;
      const taxOtherIncomeSum =
        (Number(k.interestIncome) || 0) +
        (Number(k.ordinaryDividends) || 0) +
        (Number(k.netShortTermCapitalGain) || 0) +
        (Number(k.netLongTermCapitalGain) || 0) +
        (Number(k.netSection1231Gain) || 0) +
        (Number(k.otherIncomeLoss) || 0);
      if (taxOtherIncomeSum > 0) {
        pushCompare({
          field: "Other Income (Schedule K non-operating)",
          taxValue: taxOtherIncomeSum,
          comparisonValue: isOtherIncome,
          source: isSourceLabel,
          category: "income_p1",
          threshold: 0.10,
          note: "Informational only — books 'Other Income' bucket and Schedule K line items (interest, dividends, capital gains, etc.) are structurally different categorizations. Excluded from consistency score.",
          excludeFromScore: true,
        });
      }
    }


    // Year-scoped matching against the Income Statement accounts (expenses + COGS).
    // Used both as a complement to GL and as a fallback when no GL is available for the year.
    const matchISAccounts = (matchers: RegExp[], exclude: RegExp[] = []): { total: number; accounts: string[] } => {
      if (!incomeStatement) return { total: 0, accounts: [] };
      const buckets = [incomeStatement.expenses?.accounts, incomeStatement.cogs?.accounts];
      let total = 0;
      const accounts: string[] = [];
      for (const b of buckets) {
        if (!Array.isArray(b)) continue;
        for (const a of b) {
          const name = String(a?.name || a?.accountName || "").trim();
          if (!name) continue;
          if (exclude.some((rx) => rx.test(name))) continue;
          if (!matchers.some((rx) => rx.test(name))) continue;
          const monthly = a.monthlyValues || {};
          let acctYearTotal = 0;
          let anyKey = false;
          for (const k of Object.keys(monthly)) {
            if (k.startsWith(yearMonthPrefix)) {
              acctYearTotal += Math.abs(Number(monthly[k]) || 0);
              anyKey = true;
            }
          }
          if (!anyKey) continue;
          total += acctYearTotal;
          accounts.push(name);
        }
      }
      return { total, accounts: Array.from(new Set(accounts)) };
    };

    // List year-scoped IS expense + COGS account names (used to surface "considered but
    // unmatched" hints when a tax line lands $0 in books).
    const listISExpenseAccountNames = (): string[] => {
      if (!incomeStatement) return [];
      const buckets = [incomeStatement.expenses?.accounts, incomeStatement.cogs?.accounts];
      const names: string[] = [];
      for (const b of buckets) {
        if (!Array.isArray(b)) continue;
        for (const a of b) {
          const name = String(a?.name || a?.accountName || "").trim();
          if (!name) continue;
          const monthly = a?.monthlyValues || {};
          const hasYearActivity = Object.keys(monthly).some((k) =>
            k.startsWith(yearMonthPrefix) && Math.abs(Number(monthly[k]) || 0) > 0
          );
          if (hasYearActivity) names.push(name);
        }
      }
      return Array.from(new Set(names));
    };
    const hasIS = !!incomeStatement && isYearScoped;

    // ---------- External-document fallback helpers ----------
    // When books (GL + IS) show $0 for a deduction line, consult uploaded
    // payroll / fixed assets / debt schedule documents before giving up.
    type ExtFallback = { total: number; yearScoped: boolean; source: string };
    const payrollDoc: any = wizardData.payroll || processedData.payroll;
    const fixedAssetsDoc: any = wizardData.fixedAssets || processedData.fixed_assets;
    const debtScheduleDoc: any = wizardData.debtSchedule || processedData.debt_schedule;

    // Resolve a payroll accounts array from any of the shapes we've shipped:
    //   raw processed_data: { extractedData: { salaryWages: [...], ownerCompensation: [...] } }
    //   PayrollFallbackData (wizardData.payroll): { salaryWages: [...], ownerCompensation: [...] }
    //   legacy:              { salaryWages: { accounts: [...] }, ownerComp: { accounts: [...] } }
    const resolvePayrollAccounts = (group: 'salaryWages' | 'ownerCompensation'): any[] => {
      if (!payrollDoc) return [];
      // Real extractor shape
      const fromExtracted = payrollDoc.extractedData?.[group];
      if (Array.isArray(fromExtracted)) return fromExtracted;
      // PayrollFallbackData shape
      if (Array.isArray(payrollDoc[group])) return payrollDoc[group];
      // Legacy { accounts: [] } shape
      if (Array.isArray(payrollDoc[group]?.accounts)) return payrollDoc[group].accounts;
      // Alternate legacy alias "ownerComp"
      if (group === 'ownerCompensation') {
        if (Array.isArray(payrollDoc.ownerComp)) return payrollDoc.ownerComp;
        if (Array.isArray(payrollDoc.ownerComp?.accounts)) return payrollDoc.ownerComp.accounts;
        if (Array.isArray(payrollDoc.extractedData?.ownerComp)) return payrollDoc.extractedData.ownerComp;
      }
      return [];
    };

    const sumYearScopedMonthly = (accounts: any[]): { total: number; yearScoped: boolean; annualTotal: number } => {
      let total = 0;
      let annualTotal = 0;
      let anyYearKey = false;
      for (const a of accounts) {
        const monthly = a?.monthlyValues || {};
        for (const k of Object.keys(monthly)) {
          const v = Math.abs(Number(monthly[k]) || 0);
          annualTotal += v;
          if (k.startsWith(yearMonthPrefix)) {
            total += v;
            anyYearKey = true;
          }
        }
      }
      return { total, yearScoped: anyYearKey, annualTotal };
    };

    // Owner Compensation should reflect ONLY wages/salary paid to officer(s) —
    // line 7 of Form 1120-S. Exclude rows that look like employer-side payroll
    // taxes (FICA/Medicare/FUTA/SUTA/unemployment/workers comp), which some
    // payroll extracts bundle into the ownerCompensation group.
    const isPayrollTaxRow = (name: unknown): boolean => {
      const s = String(name ?? '').toLowerCase();
      if (!s) return false;
      return /(fica|medicare|social security|payroll tax|unemploy|futa|suta|workers? comp|sui|fui)/i.test(s);
    };
    const getPayrollOwnerComp = (): ExtFallback => {
      const all = resolvePayrollAccounts('ownerCompensation');
      const accounts = all.filter((a: any) => !isPayrollTaxRow(a?.name ?? a?.account ?? a?.label));
      if (!accounts.length) {
        return { total: 0, yearScoped: false, source: "Payroll — Owner Compensation (uploaded)" };
      }
      const { total, yearScoped, annualTotal } = sumYearScopedMonthly(accounts);
      if (total > 0) return { total, yearScoped, source: "Payroll — Owner Compensation (uploaded)" };
      if (annualTotal > 0) return { total: annualTotal, yearScoped: false, source: "Payroll — Owner Compensation (uploaded; no year scoping)" };
      return { total: 0, yearScoped: false, source: "Payroll — Owner Compensation (uploaded)" };
    };

    const getPayrollSalaries = (): ExtFallback => {
      const accounts = resolvePayrollAccounts('salaryWages');
      if (accounts.length) {
        const { total, yearScoped, annualTotal } = sumYearScopedMonthly(accounts);
        if (total > 0) return { total, yearScoped, source: "Payroll Reports (uploaded)" };
        if (annualTotal > 0) return { total: annualTotal, yearScoped: false, source: "Payroll Reports (uploaded; no year scoping)" };
      }
      // Last-ditch: an employees array
      const arr = Array.isArray(payrollDoc) ? payrollDoc : payrollDoc?.employees;
      if (Array.isArray(arr)) {
        const total = arr.reduce((s: number, e: any) =>
          s + (Number(e.salary) || Number(e.totalCompensation) || Number(e.grossPay) || Number(e.wages) || 0), 0);
        if (total > 0) return { total, yearScoped: false, source: "Payroll Reports (uploaded; no year scoping)" };
      }
      return { total: 0, yearScoped: false, source: "Payroll Reports (uploaded)" };
    };

    const resolveFixedAssetList = (): any[] => {
      if (!fixedAssetsDoc) return [];
      if (Array.isArray(fixedAssetsDoc)) return fixedAssetsDoc;
      if (Array.isArray(fixedAssetsDoc.assets)) return fixedAssetsDoc.assets;
      if (Array.isArray(fixedAssetsDoc.extractedData?.assets)) return fixedAssetsDoc.extractedData.assets;
      return [];
    };

    const getFixedAssetDepreciation = (): ExtFallback => {
      const list = resolveFixedAssetList();
      if (!list.length) return { total: 0, yearScoped: false, source: "Fixed Assets Schedule (uploaded)" };
      let yearTotal = 0;
      let anyComputed = false;
      for (const a of list) {
        // Prefer precomputed fields if extractor populates them in the future
        const precomputed = Number(a.currentYearDepreciation) || Number(a.annualDepreciation) || 0;
        const cost = Math.abs(Number(a.cost) || 0);
        // usefulLife may be "7 years", "7", or numeric
        const lifeRaw = a.usefulLife ?? a.life ?? a.usefulLifeYears;
        const life = typeof lifeRaw === 'number' ? lifeRaw : parseInt(String(lifeRaw ?? ''), 10);
        const annual = precomputed > 0 ? precomputed : (life > 0 && cost > 0 ? cost / life : 0);
        if (annual <= 0) continue;
        const acqStr = a.dateAcquired || a.acquisitionDate || a.acquiredOn || a.inServiceDate;
        const acqYear = a.inServiceYear ? Number(a.inServiceYear)
          : (acqStr ? new Date(acqStr).getFullYear() : NaN);
        const disposalYear = a.disposalYear ? Number(a.disposalYear)
          : (a.disposalDate ? new Date(a.disposalDate).getFullYear() : null);
        // Include if acquired by tax year, not disposed before tax year,
        // and not fully depreciated by tax year (acqYear + life > taxYear).
        const fullyDepYear = Number.isFinite(acqYear) && life > 0 ? acqYear + life : Infinity;
        const inService = !Number.isFinite(acqYear) || acqYear <= taxYear;
        const notDisposed = disposalYear === null || disposalYear >= taxYear;
        const stillDepreciating = fullyDepYear > taxYear;
        if (inService && notDisposed && stillDepreciating) {
          yearTotal += annual;
          anyComputed = true;
        }
      }
      if (anyComputed) return { total: yearTotal, yearScoped: true, source: "Fixed Assets Schedule (uploaded)" };
      return { total: 0, yearScoped: false, source: "Fixed Assets Schedule (uploaded)" };
    };

    const resolveDebtList = (): any[] => {
      if (!debtScheduleDoc) return [];
      if (Array.isArray(debtScheduleDoc)) return debtScheduleDoc;
      if (Array.isArray(debtScheduleDoc.debts)) return debtScheduleDoc.debts;
      if (Array.isArray(debtScheduleDoc.extractedData?.debts)) return debtScheduleDoc.extractedData.debts;
      return [];
    };

    const getDebtScheduleInterest = (): ExtFallback => {
      const list = resolveDebtList();
      if (!list.length) return { total: 0, yearScoped: false, source: "Debt Schedule (uploaded)" };
      let yearTotal = 0;
      let anyByYear = false;
      let estimated = 0;
      for (const d of list) {
        // Year-specific precomputed field if available
        const byYear = d.interestByYear?.[taxYear] ?? d.annualInterestByYear?.[taxYear];
        if (byYear !== undefined && byYear !== null) {
          yearTotal += Math.abs(Number(byYear) || 0);
          anyByYear = true;
          continue;
        }
        const precomputed = Number(d.annualInterest) || Number(d.interestExpense) || 0;
        const maturityYear = d.maturityDate ? new Date(d.maturityDate).getFullYear() : null;
        const originationYear = d.originationDate ? new Date(d.originationDate).getFullYear() : null;
        // Include if debt was outstanding during tax year
        const outstanding =
          (maturityYear === null || maturityYear >= taxYear) &&
          (originationYear === null || originationYear <= taxYear);
        if (!outstanding) continue;
        if (precomputed > 0) {
          estimated += Math.abs(precomputed);
        } else {
          const rate = Number(d.interestRate) || 0;
          const orig = Math.abs(Number(d.originalAmount) || 0);
          const curr = Math.abs(Number(d.currentBalance) || 0);
          const avg = orig && curr ? (orig + curr) / 2 : (orig || curr);
          const annual = avg * (rate / 100);
          if (annual > 0) estimated += annual;
        }
      }
      if (anyByYear && yearTotal > 0) {
        return { total: yearTotal, yearScoped: true, source: "Debt Schedule (uploaded)" };
      }
      if (estimated > 0) {
        return { total: estimated, yearScoped: false, source: "Debt Schedule (uploaded, estimated from rate × avg balance)" };
      }
      return { total: 0, yearScoped: false, source: "Debt Schedule (uploaded)" };
    };

    const EXT_FALLBACKS: Record<string, () => ExtFallback> = {
      officerCompensation: getPayrollOwnerComp,
      salariesWages: getPayrollSalaries,
      depreciation: getFixedAssetDepreciation,
      interestExpense: getDebtScheduleInterest,
    };
    // Distinguish "doc missing" (actionable upload tip) from "doc uploaded but had no
    // matching rows for this year" (extraction review needed).
    const EXT_DOC_PRESENT: Record<string, () => boolean> = {
      officerCompensation: () => resolvePayrollAccounts('ownerCompensation').length > 0,
      salariesWages: () => resolvePayrollAccounts('salaryWages').length > 0
        || Array.isArray(payrollDoc) || Array.isArray(payrollDoc?.employees),
      depreciation: () => resolveFixedAssetList().length > 0,
      interestExpense: () => resolveDebtList().length > 0,
    };
    const EXT_TIP_MISSING: Record<string, string> = {
      officerCompensation: "Tip: upload a payroll register or W-3 for this year to enable a direct comparison.",
      salariesWages: "Tip: upload a payroll register or W-3 for this year to enable a direct comparison.",
      depreciation: "Tip: upload a fixed assets / depreciation schedule for this year to enable a direct comparison.",
      interestExpense: "Tip: upload a debt schedule for this year to enable a direct comparison.",
    };
    const EXT_TIP_EMPTY: Record<string, string> = {
      officerCompensation: "Note: uploaded payroll register had no Owner Compensation rows for this year — extraction may need review.",
      salariesWages: "Note: uploaded payroll register had no Salaries & Wages rows for this year — extraction may need review.",
      depreciation: "Note: uploaded fixed assets schedule had no assets depreciating in this year — extraction may need review.",
      interestExpense: "Note: uploaded debt schedule had no debts outstanding in this year — extraction may need review.",
    };


    // Pseudo-GL synthesis: when no canonical_transactions exist for the year
    // (e.g. qbtojson-only or quickbooks_api-only projects), populate glByAccount
    // from the normalized Income Statement so matchAccounts() works in branches
    // that don't already fall back to IS (Distributions, Interest income,
    // Charitable, COGS purchases).
    if (!hasGL && hasIS && incomeStatement) {
      for (const group of ["revenue", "otherIncome", "cogs", "expenses"] as const) {
        const accts = (incomeStatement as any)[group]?.accounts;
        if (!Array.isArray(accts)) continue;
        for (const a of accts) {
          const name = String(a?.name || a?.accountName || "").trim();
          if (!name) continue;
          const monthly = a?.monthlyValues || {};
          let yearTotal = 0;
          for (const k of Object.keys(monthly)) {
            if (k.startsWith(yearMonthPrefix)) yearTotal += Math.abs(Number(monthly[k]) || 0);
          }
          if (yearTotal === 0) continue;
          const cur = glByAccount.get(name) || { signed: 0, abs: 0, type: group };
          cur.signed += yearTotal;
          cur.abs += yearTotal;
          glByAccount.set(name, cur);
        }
      }
      if (glByAccount.size > 0) {
        hasGL = true;
        skippedFields.push({
          field: "GL source",
          reason: `Synthesized from normalized Income Statement for ${taxYear} (no canonical_transactions present)`,
        });
      }
    }

    // TB-only diagnostic: surface the gap when BS is missing but TB exists
    if (!processedData.balance_sheet && processedData.trial_balance) {
      skippedFields.push({
        field: "Schedule L (source)",
        reason: `Balance Sheet missing for ${taxYear}; Trial Balance present but BS comparisons require account-level EOY balances`,
      });
    }


    // ============ PAGE 1 — DEDUCTIONS ============
    if (hasGL || hasIS) {
      const deductionRows: Array<[string, string, keyof typeof PL_MATCHERS, number?]> = [
        ["Officer Compensation (7)", "officerCompensation", "officerCompensation", 0.10],
        ["Salaries & Wages (8)", "salariesWages", "salariesWages", 0.10],
        ["Repairs & Maintenance (9)", "repairs", "repairs", 0.10],
        ["Bad Debts (10)", "badDebts", "badDebts", 0.10],
        ["Rents (11)", "rent", "rent", 0.05],
        ["Taxes & Licenses (12)", "taxes", "taxes", 0.10],
        ["Interest (13)", "interestExpense", "interestExpense", 0.05],
        ["Depreciation (14)", "depreciation", "depreciation", 0.05],
        ["Depletion (15)", "depletion", "depletion", 0.10],
        ["Advertising (16)", "advertising", "advertising", 0.10],
        ["Pension (17)", "pension", "pension", 0.10],
        ["Employee Benefits (18)", "employeeBenefit", "employeeBenefit", 0.10],
      ];
      // Track payroll-line outcomes so we can emit a combined Officer+Salaries fallback row
      // when an S-corp books everything to a single payroll bucket.
      const payrollOutcome: Record<'officerCompensation' | 'salariesWages', { taxVal: number; bookVal: number } | null> = {
        officerCompensation: null,
        salariesWages: null,
      };
      for (const [label, taxKey, matcherKey, thr] of deductionRows) {
        const taxVal = (extractedData as any)[taxKey] as number | null;
        if (taxVal === null || taxVal === undefined) continue;
        const m = PL_MATCHERS[matcherKey];
        // Prefer GL if it has a hit; else fall back to year-scoped IS accounts
        let matched = hasGL ? matchAccounts(m.match, m.exclude || []) : { total: 0, accounts: [] as string[] };
        let sourceLabel = matched.accounts.length
          ? `GL (${matched.accounts.length} acct${matched.accounts.length === 1 ? '' : 's'})`
          : "";
        if (matched.total === 0 && hasIS) {
          matched = matchISAccounts(m.match, m.exclude || []);
          sourceLabel = matched.accounts.length
            ? `Income Statement ${taxYear} (${matched.accounts.length} acct${matched.accounts.length === 1 ? '' : 's'})`
            : (hasGL ? "GL — no matching account" : `Income Statement ${taxYear} — no matching account`);
        }
        if (taxKey === 'officerCompensation' || taxKey === 'salariesWages') {
          payrollOutcome[taxKey] = { taxVal, bookVal: matched.total };
        }
        if (matched.total === 0) {
          // Before giving up, try the per-line external-document fallback (payroll,
          // fixed assets, debt schedule) for the four tax keys we support.
          const fallbackFn = EXT_FALLBACKS[taxKey];
          if (fallbackFn) {
            const ext = fallbackFn();
            if (ext.total > 0) {
              if (taxKey === 'officerCompensation' || taxKey === 'salariesWages') {
                payrollOutcome[taxKey] = { taxVal, bookVal: ext.total };
              }
              const yearNote = ext.yearScoped ? '' : ' — variance may reflect multi-year totals';
              // If the tax return reports $0 for this line AND our books-side value is only
              // an estimate (e.g. debt-schedule rate × avg balance), treat the row as
              // informational. A -100% "variance" against an estimate is not a real finding.
              const isEstimated = /\bestimated\b/i.test(ext.source);
              const informational = taxVal === 0 && isEstimated;
              pushCompare({
                field: label,
                taxValue: taxVal,
                comparisonValue: ext.total,
                source: ext.source,
                category: "deductions_p1",
                threshold: thr,
                excludeFromScore: informational || undefined,
                note: informational
                  ? `Tax return reports $0 for ${label}; books value is an estimate from the uploaded ${ext.source.replace(/ \(.*\)/, '')}. Informational only — excluded from consistency score.`
                  : undefined,
                flagMessage: informational
                  ? undefined
                  : `${label}: books had $0 for this line; matched against uploaded ${ext.source}${yearNote}. Variance vs. tax exceeds ${(thr! * 100).toFixed(0)}%.`,
              });
              continue;
            }
          }
          const reason = hasGL && hasIS
            ? `No GL or Income Statement account matched "${matcherKey}" for ${taxYear}`
            : hasGL
              ? `No GL account matched "${matcherKey}" for ${taxYear}`
              : `No Income Statement account matched "${matcherKey}" for ${taxYear}`;
          skippedFields.push({ field: label, reason });
          // Surface up to 5 expense accounts the matcher considered but rejected, so the
          // user can spot misclassifications (e.g. "Contract Labor" not matched as wages).
          const considered = hasIS ? listISExpenseAccountNames() : [];
          const hint = considered.length
            ? ` Considered accounts that did not match: ${considered.slice(0, 5).map((n) => `"${n}"`).join(', ')}${considered.length > 5 ? `, +${considered.length - 5} more` : ''}.`
            : '';
          const docPresent = EXT_DOC_PRESENT[taxKey]?.() ?? false;
          const tipText = EXT_FALLBACKS[taxKey]
            ? (docPresent ? EXT_TIP_EMPTY[taxKey] : EXT_TIP_MISSING[taxKey])
            : '';
          const tip = tipText ? ` ${tipText}` : '';
          pushReviewOnly({
            field: label,
            taxValue: taxVal,
            category: "deductions",
            note: `Tax return reports ${taxVal.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} but books show $0 for any account matching "${matcherKey}" in ${taxYear}.${hint}${tip}`,
          });
          continue;
        }


        pushCompare({
          field: label,
          taxValue: taxVal,
          comparisonValue: matched.total,
          source: sourceLabel,
          category: "deductions_p1",
          threshold: thr,
          matchedAccounts: matched.accounts,
          flagMessage: `${label} variance vs. books exceeds ${(thr! * 100).toFixed(0)}%`,
        });
      }

      // S-corp combined-payroll fallback: when both Officer Comp and Salaries are present on
      // the return but at least one came up $0 in books, run a single combined match so the
      // headline score isn't dragged down by a structural book-side split that doesn't exist.
      const oc = payrollOutcome.officerCompensation;
      const sw = payrollOutcome.salariesWages;
      if (oc && sw && (oc.bookVal === 0 || sw.bookVal === 0)) {
        const combinedMatchers = [
          ...PL_MATCHERS.officerCompensation.match,
          ...PL_MATCHERS.salariesWages.match,
        ];
        const combinedExcludes = (PL_MATCHERS.salariesWages.exclude || []).filter(
          (rx) => !/officer|owner|shareholder/i.test(rx.source)
        );
        let combined = hasGL ? matchAccounts(combinedMatchers, combinedExcludes) : { total: 0, accounts: [] as string[] };
        let combinedSource = combined.accounts.length
          ? `GL (${combined.accounts.length} acct${combined.accounts.length === 1 ? '' : 's'})`
          : '';
        if (combined.total === 0 && hasIS) {
          combined = matchISAccounts(combinedMatchers, combinedExcludes);
          combinedSource = combined.accounts.length
            ? `Income Statement ${taxYear} (${combined.accounts.length} acct${combined.accounts.length === 1 ? '' : 's'})`
            : '';
        }
        // If books are still empty, sum uploaded payroll documents (owner comp + salaries).
        if (combined.total === 0) {
          const ocExt = getPayrollOwnerComp();
          const swExt = getPayrollSalaries();
          const extTotal = ocExt.total + swExt.total;
          if (extTotal > 0) {
            combined = { total: extTotal, accounts: [] };
            const yearScoped = ocExt.yearScoped && swExt.yearScoped;
            combinedSource = `Payroll Reports (uploaded${yearScoped ? '' : '; no year scoping'})`;
          }
        }
        if (combined.total > 0) {
          pushCompare({
            field: "Combined Payroll (Officer + Salaries) — fallback",
            taxValue: oc.taxVal + sw.taxVal,
            comparisonValue: combined.total,
            source: combinedSource,
            category: "deductions_p1",
            threshold: 0.10,
            matchedAccounts: combined.accounts,
            flagMessage: "Combined payroll variance vs. books exceeds 10% — books may not split officer/staff compensation",
          });
        }
      }
    } else {

      // Fall back to processed_data fallbacks for the key deduction lines we previously supported
      const payrollData = wizardData.payroll || processedData.payroll;
      if (extractedData.salariesWages !== null && payrollData) {
        let payrollTotal = 0;
        if (payrollData.salaryWages?.accounts) {
          payrollTotal = payrollData.salaryWages.accounts.reduce((s: number, acc: any) =>
            s + (Object.values(acc.monthlyValues || {}) as number[]).reduce((a: number, b) => a + (Number(b) || 0), 0), 0);
        } else if (Array.isArray(payrollData)) {
          payrollTotal = payrollData.reduce((s: number, e: any) => s + (Number(e.salary) || Number(e.totalCompensation) || 0), 0);
        } else if (payrollData.employees) {
          payrollTotal = payrollData.employees.reduce((s: number, e: any) => s + (Number(e.salary) || Number(e.totalCompensation) || 0), 0);
        }
        pushCompare({
          field: "Salaries & Wages (8)",
          taxValue: extractedData.salariesWages,
          comparisonValue: payrollTotal > 0 ? payrollTotal : null,
          source: "Payroll Reports",
          category: "deductions_p1",
          threshold: 0.10,
        });
      }
      if (extractedData.officerCompensation !== null && payrollData?.ownerComp?.accounts) {
        const ownerCompTotal = payrollData.ownerComp.accounts.reduce((s: number, acc: any) =>
          s + (Object.values(acc.monthlyValues || {}) as number[]).reduce((a: number, b) => a + (Number(b) || 0), 0), 0);
        pushCompare({
          field: "Officer Compensation (7)",
          taxValue: extractedData.officerCompensation,
          comparisonValue: ownerCompTotal > 0 ? ownerCompTotal : null,
          source: "Payroll — Owner Comp",
          category: "deductions_p1",
          threshold: 0.10,
        });
      }
      const fixedAssets = wizardData.fixedAssets || processedData.fixed_assets;
      if (extractedData.depreciation !== null && fixedAssets) {
        const list = Array.isArray(fixedAssets) ? fixedAssets : fixedAssets.assets || [];
        const depTotal = list.reduce((s: number, a: any) => s + (Number(a.currentYearDepreciation) || Number(a.annualDepreciation) || 0), 0);
        pushCompare({
          field: "Depreciation (14)",
          taxValue: extractedData.depreciation,
          comparisonValue: depTotal > 0 ? depTotal : null,
          source: "Fixed Assets Schedule",
          category: "deductions_p1",
          threshold: 0.05,
        });
      }
      const debtSchedule = wizardData.debtSchedule || processedData.debt_schedule;
      if (extractedData.interestExpense !== null && debtSchedule) {
        const list = Array.isArray(debtSchedule) ? debtSchedule : debtSchedule.debts || [];
        const interestTotal = list.reduce((s: number, d: any) => s + (Number(d.annualInterest) || Number(d.interestExpense) || 0), 0);
        pushCompare({
          field: "Interest (13)",
          taxValue: extractedData.interestExpense,
          comparisonValue: interestTotal > 0 ? interestTotal : null,
          source: "Debt Schedule",
          category: "deductions_p1",
          threshold: 0.05,
        });
      }
    }

    // Internal tie-out: Total Deductions = sum of lines 7-19
    if (extractedData.totalDeductions !== null) {
      const sumLines = [
        extractedData.officerCompensation, extractedData.salariesWages, extractedData.repairs,
        extractedData.badDebts, extractedData.rent, extractedData.taxes, extractedData.interestExpense,
        extractedData.depreciation, extractedData.depletion, extractedData.advertising,
        extractedData.pension, extractedData.employeeBenefit, extractedData.otherDeductions,
      ].reduce((s: number, v) => s + (Number(v) || 0), 0);
      if (sumLines > 0) {
        pushCompare({
          field: "Total Deductions (20) tie-out",
          taxValue: extractedData.totalDeductions,
          comparisonValue: sumLines,
          source: "Calculated from lines 7–19",
          category: "deductions_p1",
          threshold: 0.01,
        });
      }
    }

    // Internal tie-out: Ordinary Business Income = Total Income − Total Deductions
    if (extractedData.ordinaryBusinessIncome !== null) {
      const totalIncome = extractedData.totalIncome ?? ((extractedData.grossProfit ?? 0) + (extractedData.otherIncome ?? 0));
      const calc = totalIncome - (extractedData.totalDeductions ?? 0);
      if (Math.abs(calc) > 0) {
        pushCompare({
          field: "Ordinary Business Income (21) tie-out",
          taxValue: extractedData.ordinaryBusinessIncome,
          comparisonValue: calc,
          source: "Calculated from Page 1",
          category: "income_p1",
          threshold: 0.01,
        });
      }
    }

    // ============ SCHEDULE L (EOY balance sheet) ============
    if (extractedData.scheduleL?.endOfYear) {
      const eoy = extractedData.scheduleL.endOfYear;
      const bsAvailable = !!(wizardData.balanceSheet || processedData.balance_sheet);
      const bsLabel = processedDataPeriodMismatch.balance_sheet ? "Balance Sheet (period mismatch)" : "Balance Sheet";

      const schLRows: Array<[string, keyof typeof eoy, keyof typeof BS_MATCHERS, number?]> = [
        ["Cash (L-1)", "cash", "cash", 0.05],
        ["A/R (L-2)", "accountsReceivable", "accountsReceivable", 0.05],
        ["Inventories (L-3)", "inventories", "inventories", 0.05],
        ["Loans to Shareholders (L-6)", "loansToShareholders", "loansToShareholders", 0.05],
        ["Buildings (L-9a)", "buildings", "buildings", 0.10],
        ["Depreciable Assets (L-10a)", "depreciableAssets", "depreciableAssets", 0.10],
        ["Accumulated Depreciation (L-10b)", "accumulatedDepreciation", "accumulatedDepreciation", 0.10],
        ["Land (L-12)", "land", "land", 0.05],
        ["Accounts Payable (L-16)", "accountsPayable", "accountsPayable", 0.05],
        ["Mortgages/Notes Payable (L-17/L-19)", "mortgagesPayable", "mortgagesPayable", 0.05],
        ["Loans from Shareholders (L-18)", "loansFromShareholders", "loansFromShareholders", 0.05],
        ["Capital Stock (L-22)", "capitalStock", "capitalStock", 0.01],
        ["Retained Earnings (L-24)", "retainedEarnings", "retainedEarnings", 0.05],
      ];

      if (bsAvailable) {
        for (const [label, eoyKey, matcherKey, thr] of schLRows) {
          const taxVal = eoy[eoyKey];
          if (taxVal === null || taxVal === undefined) continue;
          const matched = getBsEoyByMatcher(BS_MATCHERS[matcherKey]);
          if (matched.total === 0) {
            skippedFields.push({
              field: label,
              reason: `No Balance Sheet account matched "${matcherKey}" at EOY ${taxYear}`,
            });
            continue;
          }

          pushCompare({
            field: label,
            taxValue: taxVal,
            comparisonValue: matched.total,
            source: bsLabel,
            category: "schedule_l",
            threshold: thr,
            matchedAccounts: matched.accounts,
          });
        }
      }

      // Total Assets — preserve original comparison (more sources)
      const balanceSheet = wizardData.balanceSheet || processedData.balance_sheet;
      if (eoy.totalAssets !== null && balanceSheet) {
        let bsTotalAssets = 0;
        if (balanceSheet.totalAssets !== undefined) {
          bsTotalAssets = Number(balanceSheet.totalAssets) || 0;
        } else if (balanceSheet.assets?.accounts) {
          bsTotalAssets = balanceSheet.assets.accounts.reduce((sum: number, acc: any) => {
            const values = Object.values(acc.monthlyValues || {}) as number[];
            return sum + (Number(values[values.length - 1]) || 0);
          }, 0);
        }
        pushCompare({
          field: "Total Assets (L-15)",
          taxValue: eoy.totalAssets,
          comparisonValue: bsTotalAssets > 0 ? bsTotalAssets : null,
          source: bsLabel,
          category: "schedule_l",
          threshold: 0.05,
          flagMessage: `Schedule L total assets differ from Balance Sheet`,
        });
      }

      // AR aging cross-check
      const arAging = processedData.ar_aging;
      if (eoy.accountsReceivable !== null && arAging) {
        const arTotal = Number(arAging.total) || Number(arAging.totalReceivable) ||
          (Array.isArray(arAging) ? arAging.reduce((s: number, r: any) => s + (Number(r.amount) || Number(r.balance) || 0), 0) : 0) ||
          (Array.isArray(arAging.entries) ? arAging.entries.reduce((s: number, r: any) => s + (Number(r.amount) || Number(r.balance) || 0), 0) : 0);
        pushCompare({
          field: "A/R (L-2) vs AR Aging",
          taxValue: eoy.accountsReceivable,
          comparisonValue: arTotal > 0 ? arTotal : null,
          source: "AR Aging Report",
          category: "schedule_l",
          threshold: 0.05,
        });
      }

      // AP aging cross-check
      const apAging = processedData.ap_aging;
      if (eoy.accountsPayable !== null && apAging) {
        const apTotal = Number(apAging.total) || Number(apAging.totalPayable) ||
          (Array.isArray(apAging) ? apAging.reduce((s: number, r: any) => s + (Number(r.amount) || Number(r.balance) || 0), 0) : 0) ||
          (Array.isArray(apAging.entries) ? apAging.entries.reduce((s: number, r: any) => s + (Number(r.amount) || Number(r.balance) || 0), 0) : 0);
        pushCompare({
          field: "A/P (L-16) vs AP Aging",
          taxValue: eoy.accountsPayable,
          comparisonValue: apTotal > 0 ? apTotal : null,
          source: "AP Aging Report",
          category: "schedule_l",
          threshold: 0.05,
        });
      }
    }

    // ============ SCHEDULE M-1 (book/tax recon) ============
    const m1 = extractedData.scheduleM1;
    if (m1?.netIncomePerBooks !== null && m1?.netIncomePerBooks !== undefined && incomeStatement && isNetIncome !== 0) {
      pushCompare({
        field: "Net Income per Books (M-1, line 1)",
        taxValue: m1.netIncomePerBooks,
        comparisonValue: isNetIncome,
        source: isSourceLabel,
        category: "schedule_m",
        threshold: 0.05,
      });
    }
    // Internal: line 4 = line 1 + line 2 + line 3
    if (m1 && m1.netIncomePerBooks !== null) {
      const calcLine4 = (Number(m1.netIncomePerBooks) || 0) + (Number(m1.incomeOnBooksNotOnReturn) || 0) + (Number(m1.expensesOnBooksNotDeducted) || 0);
      const k = m1.incomePerScheduleK;
      const calcK = calcLine4 - (Number(m1.incomeOnReturnNotOnBooks) || 0) - (Number(m1.deductionsNotChargedToBooks) || 0);
      if (k !== null && k !== undefined && Math.abs(calcK) > 0) {
        pushCompare({
          field: "Income per Schedule K (M-1 tie-out)",
          taxValue: k,
          comparisonValue: calcK,
          source: "M-1 arithmetic",
          category: "schedule_m",
          threshold: 0.01,
        });
      }
    }
    // Reconciling items have no GL counterpart — review-only
    if (m1) {
      pushReviewOnly({ field: "Income on books, not on return (M-1, line 2)", taxValue: m1.incomeOnBooksNotOnReturn, category: "schedule_m", note: "No automated GL counterpart — confirm with M-1 detail" });
      pushReviewOnly({ field: "Expenses on books, not deducted (M-1, line 3)", taxValue: m1.expensesOnBooksNotDeducted, category: "schedule_m", note: "Includes non-deductible meals, fines, etc." });
      pushReviewOnly({ field: "Income on return, not on books (M-1, line 5)", taxValue: m1.incomeOnReturnNotOnBooks, category: "schedule_m", note: "Tax-only income items" });
      pushReviewOnly({ field: "Deductions not charged to books (M-1, line 6)", taxValue: m1.deductionsNotChargedToBooks, category: "schedule_m", note: "Tax-only deductions" });
    }

    // ============ SCHEDULE M-2 (AAA) ============
    const m2 = extractedData.scheduleM2;
    if (m2?.beginningAAA !== null && m2?.endingAAA !== null && m2?.beginningAAA !== undefined && m2?.endingAAA !== undefined) {
      const calcEnding = (Number(m2.beginningAAA) || 0)
        + (Number(m2.ordinaryIncome) || 0)
        + (Number(m2.otherAdditions) || 0)
        - (Number(m2.lossDeductions) || 0)
        - (Number(m2.otherReductions) || 0)
        - (Number(m2.distributionsCash) || 0)
        - (Number(m2.distributionsProperty) || 0);
      pushCompare({
        field: "Ending AAA (M-2, line 8) tie-out",
        taxValue: m2.endingAAA,
        comparisonValue: calcEnding,
        source: "M-2 roll-forward",
        category: "schedule_m",
        threshold: 0.01,
        flagMessage: "Schedule M-2 AAA roll-forward does not foot",
      });
    }
    // M-2 distributions vs GL distribution accounts
    if (m2 && hasGL) {
      const totalDistributions = (Number(m2.distributionsCash) || 0) + (Number(m2.distributionsProperty) || 0);
      if (totalDistributions > 0) {
        const matched = matchAccounts(
          [/distribution/i, /owner.?(?:s)? draw/i, /shareholder.?(?:s)? draw/i, /dividend/i],
          [/dividend income/i]
        );
        if (matched.total === 0) {
          skippedFields.push({
            field: "Shareholder Distributions (M-2/K-16d)",
            reason: `No GL account matched distribution/draw/dividend for ${taxYear}`,
          });
        } else {
          pushCompare({
            field: "Shareholder Distributions (M-2/K-16d)",
            taxValue: totalDistributions,
            comparisonValue: matched.total,
            source: `GL (${matched.accounts.length} acct${matched.accounts.length === 1 ? '' : 's'})`,
            category: "schedule_m",
            threshold: 0.05,
            matchedAccounts: matched.accounts,
          });
        }

      }
    } else if (extractedData.scheduleK?.distributions && extractedData.scheduleK.distributions > 0) {
      pushReviewOnly({
        field: "Shareholder Distributions (K-16d)",
        taxValue: extractedData.scheduleK.distributions,
        category: "schedule_k",
        note: "No GL distributions account available — verify against bank records",
      });
      const ratio = extractedData.scheduleK.distributions / (extractedData.grossReceipts || 1);
      if (ratio > 0.3) flags.push(`High shareholder distributions: ${(ratio * 100).toFixed(0)}% of gross receipts`);
    }

    // ============ SCHEDULE K ============
    const k = extractedData.scheduleK;
    if (k) {
      // K-1 Ordinary income ↔ Page 1, line 21
      if (k.ordinaryBusinessIncome !== null && extractedData.ordinaryBusinessIncome !== null) {
        pushCompare({
          field: "Ordinary Income (K-1) vs Page 1 line 21",
          taxValue: k.ordinaryBusinessIncome,
          comparisonValue: extractedData.ordinaryBusinessIncome,
          source: "Page 1",
          category: "schedule_k",
          threshold: 0.01,
        });
      }
      // K-4 Interest income vs GL
      if (k.interestIncome !== null && hasGL) {
        const matched = matchAccounts([/interest income/i, /investment income/i]);
        pushCompare({
          field: "Interest Income (K-4)",
          taxValue: k.interestIncome,
          comparisonValue: matched.total > 0 ? matched.total : null,
          source: matched.accounts.length ? "GL" : "GL — no matching account",
          category: "schedule_k",
          threshold: 0.10,
          matchedAccounts: matched.accounts,
        });
      }
      // K-12a Charitable contributions vs GL
      if (k.charitableContributions !== null && hasGL) {
        const matched = matchAccounts([/charit/i, /donat/i, /contribution/i], [/capital contribution/i]);
        pushCompare({
          field: "Charitable Contributions (K-12a)",
          taxValue: k.charitableContributions,
          comparisonValue: matched.total > 0 ? matched.total : null,
          source: matched.accounts.length ? "GL" : "GL — no matching account",
          category: "schedule_k",
          threshold: 0.10,
          matchedAccounts: matched.accounts,
        });
      }
      // Low-signal K items → review-only
      pushReviewOnly({ field: "Ordinary Dividends (K-5a)", taxValue: k.ordinaryDividends, category: "schedule_k", note: "Verify against brokerage 1099-DIV" });
      pushReviewOnly({ field: "Net ST Capital Gain (K-7)", taxValue: k.netShortTermCapitalGain, category: "schedule_k", note: "Trace to Form 8949" });
      pushReviewOnly({ field: "Net LT Capital Gain (K-8a)", taxValue: k.netLongTermCapitalGain, category: "schedule_k", note: "Trace to Form 8949" });
      pushReviewOnly({ field: "Sec 1231 Gain (K-9)", taxValue: k.netSection1231Gain, category: "schedule_k", note: "Trace to Form 4797" });
      pushReviewOnly({ field: "Section 179 Deduction (K-11)", taxValue: k.section179Deduction, category: "schedule_k", note: "Trace to Form 4562" });
      pushReviewOnly({ field: "Nondeductible Expenses (K-16c)", taxValue: k.nondeductibleExpenses, category: "schedule_k", note: "Typically 50% meals, fines, club dues" });
      pushReviewOnly({ field: "Foreign Taxes Paid (K-17f)", taxValue: k.foreignTaxesPaid, category: "schedule_k", note: "Verify against foreign withholding statements" });
    }

    // ============ 1125-A COGS ============
    const cogs = extractedData.cogsDetails;
    if (cogs && extractedData.costOfGoodsSold !== null) {
      const calcCOGS = (Number(cogs.beginningInventory) || 0)
        + (Number(cogs.purchases) || 0)
        + (Number(cogs.costOfLabor) || 0)
        + (Number(cogs.additionalSection263ACosts) || 0)
        + (Number(cogs.otherCosts) || 0)
        - (Number(cogs.endingInventory) || 0);
      if (calcCOGS > 0) {
        pushCompare({
          field: "Total COGS (1125-A tie-out)",
          taxValue: extractedData.costOfGoodsSold,
          comparisonValue: calcCOGS,
          source: "Form 1125-A line 1–7",
          category: "cogs",
          threshold: 0.01,
        });
      }
      // Inventory beginning/ending vs TB / BS inventory
      if (cogs.beginningInventory !== null || cogs.endingInventory !== null) {
        const matched = getBsEoyByMatcher(BS_MATCHERS.inventories);
        if (cogs.endingInventory !== null && matched.total > 0) {
          pushCompare({
            field: "Ending Inventory (1125-A line 7)",
            taxValue: cogs.endingInventory,
            comparisonValue: matched.total,
            source: "Balance Sheet inventory",
            category: "cogs",
            threshold: 0.05,
            matchedAccounts: matched.accounts,
          });
        }
      }
      // Purchases vs GL purchases accounts
      if (cogs.purchases !== null && hasGL) {
        const matched = matchAccounts([/purchases/i, /cost of goods/i, /materials/i, /supplies.*cogs/i]);
        if (matched.total > 0) {
          pushCompare({
            field: "Purchases (1125-A line 2)",
            taxValue: cogs.purchases,
            comparisonValue: matched.total,
            source: "GL purchases accounts",
            category: "cogs",
            threshold: 0.10,
            matchedAccounts: matched.accounts,
          });
        }
      }
    }

    // ============ TAXABLE INCOME / NET INCOME ============
    if (extractedData.taxableIncome !== null && incomeStatement && isNetIncome !== 0) {
      pushCompare({
        field: "Taxable Income vs Book Net Income",
        taxValue: extractedData.taxableIncome,
        comparisonValue: isNetIncome,
        source: isSourceLabel,
        category: "reconciliation",
        threshold: 0.15,
        flagMessage: "Significant book-tax difference — review M-1 adjustments",
      });
    }

    // ============ Calculate overall score ============
    let matchCount = 0;
    let totalComparisons = 0;
    for (const comp of comparisons) {
      if (comp.status === 'missing_data' || comp.status === 'review_only') continue;
      if (comp.excludeFromScore) continue;
      totalComparisons += 1;
      if (comp.status === 'match') matchCount += 1;
      else if (comp.status === 'minor_variance') matchCount += 0.7;
    }
    const overallScore: number | null = totalComparisons > 0
      ? Math.round((matchCount / totalComparisons) * 100)
      : null;

    // ============ Generate summary ============
    let summary = "";
    if (overallScore === null) {
      summary = `${extractedData.formType} for ${extractedData.taxYear} extracted successfully. No matching financial data found for ${extractedData.taxYear} to compare against — upload trial balance, balance sheet, or general ledger for this period to enable cross-validation. `;
    } else if (overallScore >= 90) {
      summary = `${extractedData.formType} for ${extractedData.taxYear} is highly consistent with financial records across ${totalComparisons} cross-checks. `;
    } else if (overallScore >= 70) {
      summary = `Tax return shows reasonable consistency across ${totalComparisons} cross-checks with some variances requiring review. `;
    } else {
      summary = `Significant discrepancies found across ${totalComparisons} cross-checks — detailed review recommended. `;
    }
    const schedulesSummary = [];
    if (extractedData.scheduleK) schedulesSummary.push("Schedule K");
    if (extractedData.scheduleL) schedulesSummary.push("Schedule L");
    if (extractedData.scheduleM1) schedulesSummary.push("M-1");
    if (extractedData.scheduleM2) schedulesSummary.push("M-2");
    if (extractedData.cogsDetails) schedulesSummary.push("1125-A");
    if (schedulesSummary.length > 0) summary += `Extracted: ${schedulesSummary.join(", ")}. `;
    if (flags.length > 0) summary += `Key findings: ${flags.slice(0, 2).join("; ")}.`;
    else if (overallScore !== null) summary += "No significant variances flagged.";


    // Build diagnostics that explain *why* we got the score we did.
    const diagSources: AnalysisDiagnostics['sources'] = [];
    const describe = (dtype: string, label: string) => {
      const kind = processedDataSourceKind[dtype];
      if (!kind) {
        diagSources.push({ dataType: label, status: 'missing', detail: `No ${label} found for project` });
        return;
      }
      if (kind === 'in_year') diagSources.push({ dataType: label, status: 'in_year', detail: `Period inside ${taxYear}` });
      else if (kind === 'aggregate') diagSources.push({ dataType: label, status: 'aggregate', detail: `Multi-year aggregate, scoped to ${taxYear} months` });
      else diagSources.push({ dataType: label, status: 'period_mismatch', detail: `Only out-of-year data available — flagged as period mismatch` });
    };
    describe('income_statement', 'Income Statement');
    describe('balance_sheet', 'Balance Sheet');
    describe('trial_balance', 'Trial Balance');
    describe('general_ledger', 'General Ledger');
    describe('ar_aging', 'A/R Aging');
    describe('ap_aging', 'A/P Aging');

    const glSourceTypes = Object.entries(sourceTypeRows).map(([source_type, rows]) => ({
      source_type,
      rows,
      usedForGL: GL_SOURCE_TYPES.includes(source_type),
    }));

    // Source-level reasons (appended to per-field reasons already collected during comparisons)
    if (!hasGL && !hasIS) {
      skippedFields.push({ field: 'P&L Deductions (source)', reason: `No GL or year-scoped Income Statement available for ${taxYear}` });
    } else if (!hasGL && hasIS) {
      skippedFields.push({ field: 'P&L Deductions (source)', reason: `No detailed General Ledger for ${taxYear} — using Income Statement aggregates instead` });
    }
    if (!processedDataSourceKind.balance_sheet) {
      skippedFields.push({ field: 'Schedule L (source)', reason: `No Balance Sheet available for ${taxYear}` });
    } else if (processedDataPeriodMismatch.balance_sheet) {
      skippedFields.push({ field: 'Schedule L (source)', reason: `Balance Sheet is out-of-year for ${taxYear} (period mismatch)` });
    }


    const analysisDiagnostics: AnalysisDiagnostics = {
      taxYear,
      sources: diagSources,
      glSourceTypes,
      hasGL,
      glFallback: (!hasGL && hasIS) ? 'income_statement_aggregate' : null,
      skippedFields,
    };

    const analysis: TaxReturnAnalysis = {
      extractedData,
      comparisons,
      overallScore,
      flags,
      summary,
      analyzedAt: new Date().toISOString(),
      documentId,
      extractionSource,
      analysisDiagnostics,
    };


    // Get user_id for storing processed data
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || document.user_id;

    // Store the analysis in processed_data
    // First, try to delete any existing record for this document
    await supabase
      .from("processed_data")
      .delete()
      .eq("project_id", projectId)
      .eq("data_type", "tax_return_analysis")
      .eq("source_document_id", documentId);

    // Then insert the new analysis
    const { error: insertError } = await supabase
      .from("processed_data")
      .insert({
        project_id: projectId,
        user_id: userId,
        data_type: "tax_return_analysis",
        source_type: extractionSource,
        source_document_id: documentId,
        data: analysis,
        period_start: `${extractedData.taxYear}-01-01`,
        period_end: `${extractedData.taxYear}-12-31`,
        validation_status: overallScore !== null && overallScore >= 70 ? "valid" : "needs_review",
      });

    if (insertError) {
      console.error("Failed to store analysis:", insertError);
    }

    // Update document status with enhanced summary
    await supabase
      .from("documents")
      .update({
        processing_status: "completed",
        parsed_summary: {
          taxYear: extractedData.taxYear,
          formType: extractedData.formType,
          taxpayerName: extractedData.taxpayerName,
          grossReceipts: extractedData.grossReceipts,
          ordinaryBusinessIncome: extractedData.ordinaryBusinessIncome,
          taxableIncome: extractedData.taxableIncome,
          totalTax: extractedData.totalTax,
          hasScheduleK: !!extractedData.scheduleK,
          hasScheduleL: !!extractedData.scheduleL,
          hasScheduleM1: !!extractedData.scheduleM1,
          hasScheduleM2: !!extractedData.scheduleM2,
          comparisonScore: overallScore,
          extractionSource,
        },
      })
      .eq("id", documentId);

    console.log(`Tax return analysis complete. Score: ${overallScore}, Source: ${extractionSource}`);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Tax return processing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
