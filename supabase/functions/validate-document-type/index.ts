import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ValidationRequest {
  fileBase64: string;
  selectedType: string;
  fileName: string;
}

interface ValidationResult {
  isValid: boolean;
  confidence: number;
  detectedType: string;
  suggestedType: string | null;
  reason: string;
}

// Map document types to human-readable names
const TYPE_LABELS: Record<string, string> = {
  bank_statement: "Bank Statement",
  credit_card: "Credit Card Statement",
  tax_return: "Tax Return",
  chart_of_accounts: "Chart of Accounts",
  balance_sheet: "Balance Sheet",
  income_statement: "Income Statement (P&L)",
  trial_balance: "Trial Balance",
  cash_flow: "Cash Flow Statement",
  general_ledger: "General Ledger",
  journal_entries: "Journal Entries",
  accounts_payable: "Accounts Payable",
  accounts_receivable: "Accounts Receivable",
  customer_concentration: "Customer Concentration",
  vendor_concentration: "Vendor Concentration",
  payroll: "Payroll Report",
  cim: "Confidential Information Memorandum",
  lease_agreement: "Lease Agreement",
  inventory: "Inventory Report",
};

// DocuClipper types - expensive to parse
// Note: tax_return removed - DocuClipper doesn't support it
const DOCUCLIPPER_TYPES = ["bank_statement", "credit_card"];

// QuickBooks export types
const QUICKBOOKS_TYPES = [
  "chart_of_accounts", "balance_sheet", "income_statement", "trial_balance",
  "cash_flow", "general_ledger", "journal_entries", "accounts_payable",
  "accounts_receivable", "customer_concentration", "vendor_concentration"
];

function buildPrompt(selectedType: string): string {
  const typeLabel = TYPE_LABELS[selectedType] || selectedType;
  
  if (DOCUCLIPPER_TYPES.includes(selectedType)) {
    return `You are a document classification expert. Analyze this document image and determine if it matches the expected type: "${typeLabel}".

Look for these specific indicators:

For BANK STATEMENTS:
- Bank logo/name in header
- Account number (often partially masked)
- Statement period dates
- Beginning/ending balance
- Transaction list with dates, descriptions, amounts
- Deposits and withdrawals sections

For CREDIT CARD STATEMENTS:
- Credit card company logo
- Card number (masked)
- Statement/billing period
- Payment due date
- Credit limit, available credit
- Transaction list with merchant names
- Minimum payment due

For TAX RETURNS:
- IRS form numbers (1040, 1120, 1065, etc.)
- Tax year header
- Taxpayer identification
- Income sections
- Deduction sections
- Tax computation sections

Respond in JSON format:
{
  "isValid": boolean,
  "confidence": number between 0 and 1,
  "detectedType": "the actual document type you detect",
  "suggestedType": "correct type key if different from selected, null if correct",
  "reason": "brief explanation of your determination"
}

Important: suggestedType should be one of: bank_statement, credit_card, tax_return, or null if the document matches the selected type.`;
  }
  
  if (QUICKBOOKS_TYPES.includes(selectedType)) {
    return `You are a document classification expert specializing in accounting documents. Analyze this document image and determine if it matches the expected type: "${typeLabel}".

Look for these specific indicators:

For CHART OF ACCOUNTS:
- List of account numbers and names
- Account types (Asset, Liability, Equity, Income, Expense)
- Hierarchical structure with parent/child accounts

For BALANCE SHEET:
- "Balance Sheet" header
- Assets section (Current, Fixed)
- Liabilities section (Current, Long-term)
- Equity section
- Total Assets = Total Liabilities + Equity

For INCOME STATEMENT / P&L:
- "Income Statement" or "Profit and Loss" header
- Revenue/Sales section
- Cost of Goods Sold
- Operating Expenses
- Net Income/Loss

For TRIAL BALANCE:
- "Trial Balance" header
- Account names with Debit/Credit columns
- Total Debits = Total Credits

For GENERAL LEDGER:
- Detailed transaction entries
- Account-by-account breakdown
- Running balances

For JOURNAL ENTRIES:
- Date, description, debit, credit columns
- Entry numbers
- Account references

Respond in JSON format:
{
  "isValid": boolean,
  "confidence": number between 0 and 1,
  "detectedType": "the actual document type you detect",
  "suggestedType": "correct type key if different from selected, null if correct",
  "reason": "brief explanation"
}

suggestedType options: chart_of_accounts, balance_sheet, income_statement, trial_balance, cash_flow, general_ledger, journal_entries, accounts_payable, accounts_receivable, customer_concentration, vendor_concentration`;
  }
  
  // CIM and other types - less strict validation
  return `You are a document classification expert. Analyze this document image and determine if it appears to be a "${typeLabel}".

For CIM (Confidential Information Memorandum):
- Business overview sections
- Investment highlights
- Financial summaries
- Management team info
- Industry analysis

Be lenient with these document types - if it appears to be a business document, it's likely acceptable.

Respond in JSON format:
{
  "isValid": boolean,
  "confidence": number between 0 and 1,
  "detectedType": "what you detect this document to be",
  "suggestedType": null,
  "reason": "brief explanation"
}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileBase64, selectedType, fileName } = await req.json() as ValidationRequest;
    
    if (!fileBase64 || !selectedType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fileBase64 and selectedType" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      // Fail open - allow upload if AI not available
      return new Response(
        JSON.stringify({
          isValid: true,
          confidence: 0,
          detectedType: selectedType,
          suggestedType: null,
          reason: "Validation service unavailable - proceeding with upload"
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Validating document: ${fileName} as ${selectedType}`);

    // Determine mime type from base64 or default to PDF
    let mimeType = "application/pdf";
    if (fileBase64.startsWith("data:")) {
      const match = fileBase64.match(/data:([^;]+);/);
      if (match) mimeType = match[1];
    }

    // Strip data URL prefix if present
    const base64Data = fileBase64.includes(',') 
      ? fileBase64.split(',')[1] 
      : fileBase64;

    const prompt = buildPrompt(selectedType);

    // Use gpt-4o-mini for cost-effective vision analysis
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      // Handle rate limits gracefully
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            isValid: true,
            confidence: 0,
            detectedType: selectedType,
            suggestedType: null,
            reason: "Validation temporarily unavailable - proceeding with upload"
          } as ValidationResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Fail open for other errors
      return new Response(
        JSON.stringify({
          isValid: true,
          confidence: 0,
          detectedType: selectedType,
          suggestedType: null,
          reason: "Validation unavailable - proceeding with upload"
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({
          isValid: true,
          confidence: 0,
          detectedType: selectedType,
          suggestedType: null,
          reason: "Could not analyze document"
        } as ValidationResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let result: ValidationResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      result = {
        isValid: true,
        confidence: 0.5,
        detectedType: selectedType,
        suggestedType: null,
        reason: "Could not parse validation result"
      };
    }

    console.log(`Validation result for ${fileName}:`, result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Validation error:", error);
    
    // Fail open - don't block uploads on validation errors
    return new Response(
      JSON.stringify({
        isValid: true,
        confidence: 0,
        detectedType: "unknown",
        suggestedType: null,
        reason: "Validation error - proceeding with upload"
      } as ValidationResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
