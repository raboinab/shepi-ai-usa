import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

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
  status: 'match' | 'minor_variance' | 'significant_variance' | 'missing_data';
  category?: string;
}

interface TaxReturnAnalysis {
  extractedData: TaxReturnData;
  comparisons: ComparisonResult[];
  overallScore: number;
  flags: string[];
  summary: string;
  analyzedAt: string;
  documentId: string;
  extractionSource?: string;
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
  
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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
    
    const extractedData = await extractWithAI(base64, mimeType, LOVABLE_API_KEY);

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
      .select("data_type, data, period_start, period_end")
      .eq("project_id", projectId);

    if (pdError) {
      console.warn("Failed to fetch processed data:", pdError);
    }

    const processedData: Record<string, any> = {};
    for (const record of processedRecords || []) {
      processedData[record.data_type] = record.data;
    }

    // Build comparisons
    const comparisons: ComparisonResult[] = [];
    const flags: string[] = [];

    // Helper to get comparison status
    const getComparisonStatus = (variance: number | null, threshold: number = 0.05): ComparisonResult['status'] => {
      if (variance === null) return 'missing_data';
      const absVariance = Math.abs(variance);
      if (absVariance <= threshold) return 'match';
      if (absVariance <= 0.1) return 'minor_variance';
      return 'significant_variance';
    };

    // Compare Gross Receipts vs Income Statement Revenue
    const incomeStatement = wizardData.incomeStatement || processedData.income_statement;
    if (extractedData.grossReceipts !== null && incomeStatement) {
      let isRevenue = 0;
      
      if (incomeStatement.revenue?.accounts) {
        isRevenue = incomeStatement.revenue.accounts.reduce((sum: number, acc: any) => {
          const values = Object.values(acc.monthlyValues || {}) as number[];
          return sum + values.reduce((a, b) => a + (Number(b) || 0), 0);
        }, 0);
      } else if (incomeStatement.data?.monthlyReports) {
        for (const report of incomeStatement.data.monthlyReports) {
          if (report.rows?.row) {
            for (const row of report.rows.row) {
              if ((row.group === 'TotalIncome' || row.group === 'Income') && row.summary?.colData) {
                const val = row.summary.colData.find((c: any) => c.value);
                if (val) isRevenue += parseFloat(String(val.value).replace(/[,$]/g, '')) || 0;
              }
            }
          }
        }
      }

      if (isRevenue > 0) {
        const variance = (extractedData.grossReceipts - isRevenue) / isRevenue;
        comparisons.push({
          field: "Gross Receipts / Revenue",
          taxReturnValue: extractedData.grossReceipts,
          comparisonValue: isRevenue,
          source: "Income Statement",
          variance: extractedData.grossReceipts - isRevenue,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance),
          category: "income",
        });

        if (Math.abs(variance) > 0.05) {
          flags.push(`Revenue variance of ${(variance * 100).toFixed(1)}% between tax return ($${extractedData.grossReceipts.toLocaleString()}) and Income Statement ($${isRevenue.toLocaleString()})`);
        }
      }
    }

    // Compare Salaries/Wages vs Payroll
    const payrollData = wizardData.payroll || processedData.payroll;
    if (extractedData.salariesWages !== null && payrollData) {
      let payrollTotal = 0;
      
      if (payrollData.salaryWages?.accounts) {
        payrollTotal = payrollData.salaryWages.accounts.reduce((sum: number, acc: any) => {
          const values = Object.values(acc.monthlyValues || {}) as number[];
          return sum + values.reduce((a, b) => a + (Number(b) || 0), 0);
        }, 0);
      } else if (Array.isArray(payrollData)) {
        payrollTotal = payrollData.reduce((sum: number, e: any) => 
          sum + (Number(e.salary) || Number(e.totalCompensation) || 0), 0);
      } else if (payrollData.employees) {
        payrollTotal = payrollData.employees.reduce((sum: number, e: any) => 
          sum + (Number(e.salary) || Number(e.totalCompensation) || 0), 0);
      }

      if (payrollTotal > 0) {
        const variance = (extractedData.salariesWages - payrollTotal) / payrollTotal;
        comparisons.push({
          field: "Salaries & Wages",
          taxReturnValue: extractedData.salariesWages,
          comparisonValue: payrollTotal,
          source: "Payroll Reports",
          variance: extractedData.salariesWages - payrollTotal,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.1),
          category: "payroll",
        });

        if (Math.abs(variance) > 0.1) {
          flags.push(`Payroll variance of ${(variance * 100).toFixed(1)}% - review for proper accrual`);
        }
      }
    }

    // Compare Officer Compensation vs Payroll (for owner compensation)
    if (extractedData.officerCompensation !== null && payrollData?.ownerComp?.accounts) {
      let ownerCompTotal = payrollData.ownerComp.accounts.reduce((sum: number, acc: any) => {
        const values = Object.values(acc.monthlyValues || {}) as number[];
        return sum + values.reduce((a, b) => a + (Number(b) || 0), 0);
      }, 0);

      if (ownerCompTotal > 0) {
        const variance = (extractedData.officerCompensation - ownerCompTotal) / ownerCompTotal;
        comparisons.push({
          field: "Officer/Owner Compensation",
          taxReturnValue: extractedData.officerCompensation,
          comparisonValue: ownerCompTotal,
          source: "Payroll - Owner Comp",
          variance: extractedData.officerCompensation - ownerCompTotal,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.1),
          category: "payroll",
        });
      }
    }

    // Compare Depreciation vs Fixed Assets
    const fixedAssets = wizardData.fixedAssets || processedData.fixed_assets;
    if (extractedData.depreciation !== null && fixedAssets) {
      let depreciationTotal = 0;
      
      if (fixedAssets.assets && Array.isArray(fixedAssets.assets)) {
        depreciationTotal = fixedAssets.assets.reduce((sum: number, a: any) => 
          sum + (Number(a.currentYearDepreciation) || Number(a.annualDepreciation) || 0), 0);
      } else if (Array.isArray(fixedAssets)) {
        depreciationTotal = fixedAssets.reduce((sum: number, a: any) => 
          sum + (Number(a.currentYearDepreciation) || Number(a.annualDepreciation) || 0), 0);
      }

      if (depreciationTotal > 0) {
        const variance = (extractedData.depreciation - depreciationTotal) / depreciationTotal;
        comparisons.push({
          field: "Depreciation",
          taxReturnValue: extractedData.depreciation,
          comparisonValue: depreciationTotal,
          source: "Fixed Assets Schedule",
          variance: extractedData.depreciation - depreciationTotal,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.02),
          category: "assets",
        });

        if (Math.abs(variance) > 0.02) {
          flags.push(`Depreciation mismatch - may indicate timing differences or method changes`);
        }
      }
    }

    // Compare Interest Expense vs Debt Schedule
    const debtSchedule = wizardData.debtSchedule || processedData.debt_schedule;
    if (extractedData.interestExpense !== null && debtSchedule) {
      let interestTotal = 0;
      
      if (debtSchedule.debts && Array.isArray(debtSchedule.debts)) {
        interestTotal = debtSchedule.debts.reduce((sum: number, d: any) => 
          sum + (Number(d.annualInterest) || Number(d.interestExpense) || 0), 0);
      } else if (Array.isArray(debtSchedule)) {
        interestTotal = debtSchedule.reduce((sum: number, d: any) => 
          sum + (Number(d.annualInterest) || Number(d.interestExpense) || 0), 0);
      }

      if (interestTotal > 0) {
        const variance = (extractedData.interestExpense - interestTotal) / interestTotal;
        comparisons.push({
          field: "Interest Expense",
          taxReturnValue: extractedData.interestExpense,
          comparisonValue: interestTotal,
          source: "Debt Schedule",
          variance: extractedData.interestExpense - interestTotal,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.05),
          category: "debt",
        });

        if (Math.abs(variance) > 0.05) {
          flags.push(`Interest expense variance - verify debt terms match recorded obligations`);
        }
      }
    }

    // Compare Schedule L Total Assets vs Balance Sheet
    const balanceSheet = wizardData.balanceSheet || processedData.balance_sheet;
    if (extractedData.scheduleL?.endOfYear?.totalAssets !== null && balanceSheet) {
      let bsTotalAssets = 0;
      
      if (balanceSheet.totalAssets !== undefined) {
        bsTotalAssets = Number(balanceSheet.totalAssets) || 0;
      } else if (balanceSheet.assets?.accounts) {
        bsTotalAssets = balanceSheet.assets.accounts.reduce((sum: number, acc: any) => {
          const values = Object.values(acc.monthlyValues || {}) as number[];
          const lastValue = values[values.length - 1] || 0;
          return sum + (Number(lastValue) || 0);
        }, 0);
      }

      if (bsTotalAssets > 0 && extractedData.scheduleL?.endOfYear?.totalAssets) {
        const variance = (extractedData.scheduleL.endOfYear.totalAssets - bsTotalAssets) / bsTotalAssets;
        comparisons.push({
          field: "Total Assets (Schedule L)",
          taxReturnValue: extractedData.scheduleL.endOfYear.totalAssets,
          comparisonValue: bsTotalAssets,
          source: "Balance Sheet",
          variance: extractedData.scheduleL.endOfYear.totalAssets - bsTotalAssets,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.05),
          category: "balance_sheet",
        });

        if (Math.abs(variance) > 0.1) {
          flags.push(`Schedule L total assets differ from Balance Sheet by ${(variance * 100).toFixed(1)}%`);
        }
      }
    }

    // Compare Schedule K Distributions vs Cash Flow or Bank Records
    if (extractedData.scheduleK?.distributions !== null && extractedData.scheduleK?.distributions !== undefined) {
      const distributions = extractedData.scheduleK.distributions;
      if (distributions > 0) {
        // Flag significant distributions for review
        const grossReceipts = extractedData.grossReceipts || 0;
        if (grossReceipts > 0) {
          const distributionRatio = distributions / grossReceipts;
          if (distributionRatio > 0.3) {
            flags.push(`High shareholder distributions: ${(distributionRatio * 100).toFixed(0)}% of gross receipts - verify cash flow capacity`);
          }
        }
        
        comparisons.push({
          field: "Shareholder Distributions (K)",
          taxReturnValue: distributions,
          comparisonValue: null,
          source: "Review Required",
          variance: null,
          variancePercent: null,
          status: 'missing_data',
          category: "schedule_k",
        });
      }
    }

    // Compare M-1 Net Income per Books vs Income Statement
    const m1NetIncome = extractedData.scheduleM1?.netIncomePerBooks;
    if (m1NetIncome !== null && m1NetIncome !== undefined && incomeStatement) {
      let netIncome = 0;
      
      if (incomeStatement.netIncome !== undefined) {
        netIncome = Number(incomeStatement.netIncome) || 0;
      }

      if (netIncome !== 0) {
        const variance = (m1NetIncome - netIncome) / Math.abs(netIncome);
        comparisons.push({
          field: "Net Income per Books (M-1)",
          taxReturnValue: m1NetIncome,
          comparisonValue: netIncome,
          source: "Income Statement",
          variance: m1NetIncome - netIncome,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.05),
          category: "reconciliation",
        });
      }
    }

    // Compare Ordinary Business Income
    if (extractedData.ordinaryBusinessIncome !== null) {
      const grossReceipts = extractedData.grossReceipts || 0;
      const totalDeductions = extractedData.totalDeductions || 0;
      const calculatedIncome = grossReceipts - (extractedData.costOfGoodsSold || 0) - totalDeductions + (extractedData.otherIncome || 0);
      
      if (Math.abs(calculatedIncome) > 0) {
        const variance = (extractedData.ordinaryBusinessIncome - calculatedIncome) / Math.abs(calculatedIncome);
        if (Math.abs(variance) > 0.01) {
          comparisons.push({
            field: "Ordinary Business Income (calc check)",
            taxReturnValue: extractedData.ordinaryBusinessIncome,
            comparisonValue: calculatedIncome,
            source: "Calculated from lines",
            variance: extractedData.ordinaryBusinessIncome - calculatedIncome,
            variancePercent: variance * 100,
            status: getComparisonStatus(variance, 0.01),
            category: "income",
          });
        }
      }
    }

    // Compare COGS details if present
    if (extractedData.cogsDetails && extractedData.costOfGoodsSold !== null) {
      const calculatedCOGS = (extractedData.cogsDetails.beginningInventory || 0) +
                             (extractedData.cogsDetails.purchases || 0) +
                             (extractedData.cogsDetails.costOfLabor || 0) +
                             (extractedData.cogsDetails.otherCosts || 0) -
                             (extractedData.cogsDetails.endingInventory || 0);
      
      if (calculatedCOGS > 0) {
        const variance = (extractedData.costOfGoodsSold - calculatedCOGS) / calculatedCOGS;
        comparisons.push({
          field: "COGS (1125-A tie-out)",
          taxReturnValue: extractedData.costOfGoodsSold,
          comparisonValue: calculatedCOGS,
          source: "Form 1125-A Detail",
          variance: extractedData.costOfGoodsSold - calculatedCOGS,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.01),
          category: "cogs",
        });
      }
    }

    // Taxable Income vs Net Income (book/tax difference)
    if (extractedData.taxableIncome !== null && incomeStatement) {
      let netIncome = 0;
      
      if (incomeStatement.netIncome !== undefined) {
        netIncome = Number(incomeStatement.netIncome) || 0;
      } else if (wizardData.qoeSummary?.adjustedEbitda) {
        netIncome = Number(wizardData.qoeSummary.adjustedEbitda) || 0;
      }

      if (netIncome !== 0) {
        const variance = (extractedData.taxableIncome - netIncome) / Math.abs(netIncome);
        comparisons.push({
          field: "Taxable Income / Net Income",
          taxReturnValue: extractedData.taxableIncome,
          comparisonValue: netIncome,
          source: "Income Statement",
          variance: extractedData.taxableIncome - netIncome,
          variancePercent: variance * 100,
          status: getComparisonStatus(variance, 0.15),
          category: "reconciliation",
        });

        if (Math.abs(variance) > 0.2) {
          flags.push(`Significant book-tax difference of ${(variance * 100).toFixed(1)}% - review M-1/M-3 adjustments`);
        }
      }
    }

    // Check AAA reconciliation (M-2)
    if (extractedData.scheduleM2) {
      const m2 = extractedData.scheduleM2;
      if (m2.beginningAAA !== null && m2.endingAAA !== null) {
        const calculatedEnding = (m2.beginningAAA || 0) + (m2.ordinaryIncome || 0) + (m2.otherAdditions || 0) 
                                 - (m2.lossDeductions || 0) - (m2.otherReductions || 0) 
                                 - (m2.distributionsCash || 0) - (m2.distributionsProperty || 0);
        
        const variance = m2.endingAAA !== 0 ? (m2.endingAAA - calculatedEnding) / Math.abs(m2.endingAAA) : 0;
        if (Math.abs(variance) > 0.01) {
          flags.push(`Schedule M-2 AAA calculation variance of ${(variance * 100).toFixed(1)}%`);
        }
      }
    }

    // Calculate overall score
    let matchCount = 0;
    let totalComparisons = comparisons.length;
    
    for (const comp of comparisons) {
      if (comp.status === 'match') matchCount += 1;
      else if (comp.status === 'minor_variance') matchCount += 0.7;
      else if (comp.status === 'missing_data') totalComparisons -= 1;
    }

    const overallScore = totalComparisons > 0 ? Math.round((matchCount / totalComparisons) * 100) : 0;

    // Generate summary
    let summary = "";
    if (overallScore >= 90) {
      summary = `${extractedData.formType} for ${extractedData.taxYear} is highly consistent with financial records. `;
    } else if (overallScore >= 70) {
      summary = `Tax return shows reasonable consistency with some variances requiring review. `;
    } else {
      summary = `Significant discrepancies found between tax return and financial records - detailed review recommended. `;
    }

    // Add schedule extraction info
    const schedulesSummary = [];
    if (extractedData.scheduleK) schedulesSummary.push("Schedule K");
    if (extractedData.scheduleL) schedulesSummary.push("Schedule L");
    if (extractedData.scheduleM1) schedulesSummary.push("M-1");
    if (extractedData.scheduleM2) schedulesSummary.push("M-2");
    if (extractedData.cogsDetails) schedulesSummary.push("1125-A");
    
    if (schedulesSummary.length > 0) {
      summary += `Extracted: ${schedulesSummary.join(", ")}. `;
    }

    if (flags.length > 0) {
      summary += `Key findings: ${flags.slice(0, 2).join("; ")}.`;
    } else {
      summary += "No significant variances flagged.";
    }

    const analysis: TaxReturnAnalysis = {
      extractedData,
      comparisons,
      overallScore,
      flags,
      summary,
      analyzedAt: new Date().toISOString(),
      documentId,
      extractionSource,
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
        validation_status: overallScore >= 70 ? "valid" : "needs_review",
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
