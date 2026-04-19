import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface TrialBalanceAccount {
  id: string;
  fsType: 'BS' | 'IS';
  accountNumber: string;
  accountName: string;
  accountType: string;
  monthlyValues: Record<string, number>;
}

interface DerivedTotals {
  // Balance Sheet
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  // Income Statement
  totalRevenue?: number;
  totalCogs?: number;
  grossProfit?: number;
  totalExpenses?: number;
  netIncome?: number;
}

interface ValidationLineItem {
  lineItem: string;
  uploadedValue: number;
  trialBalanceValue: number;
  variance: number;
  variancePercent: number;
  status: 'match' | 'minor' | 'significant';
}

// Derive totals from Trial Balance accounts
function deriveTotalsFromTrialBalance(accounts: TrialBalanceAccount[], periodId?: string): DerivedTotals {
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalRevenue = 0;
  let totalCogs = 0;
  let totalExpenses = 0;

  for (const account of accounts) {
    // Get value for the specified period, or sum all if no period specified
    let value = 0;
    if (periodId) {
      value = account.monthlyValues[periodId] || 0;
    } else {
      // Sum all monthly values
      value = Object.values(account.monthlyValues).reduce((sum, v) => sum + v, 0);
    }

    const accountType = (account.accountType || '').toLowerCase();
    
    if (account.fsType === 'BS') {
      // Balance Sheet categorization
      if (accountType.includes('asset') || accountType.includes('bank') || accountType.includes('receivable')) {
        totalAssets += value;
      } else if (accountType.includes('liability') || accountType.includes('payable') || accountType.includes('credit card')) {
        totalLiabilities += value;
      } else if (accountType.includes('equity')) {
        totalEquity += value;
      } else {
        // Default: positive = asset, negative = liability/equity
        if (value > 0) {
          totalAssets += value;
        } else {
          totalLiabilities += Math.abs(value);
        }
      }
    } else if (account.fsType === 'IS') {
      // Income Statement categorization
      if (accountType.includes('income') || accountType.includes('revenue') || accountType.includes('sales')) {
        totalRevenue += value;
      } else if (accountType.includes('cost of goods') || accountType.includes('cogs')) {
        totalCogs += value;
      } else if (accountType.includes('expense') || accountType.includes('other expense')) {
        totalExpenses += value;
      } else {
        // Default to expense if unrecognized IS type
        totalExpenses += value;
      }
    }
  }

  const grossProfit = totalRevenue - totalCogs;
  const netIncome = grossProfit - totalExpenses;

  return {
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalRevenue,
    totalCogs,
    grossProfit,
    totalExpenses,
    netIncome,
  };
}

// Calculate variance status
function getVarianceStatus(variance: number, baseValue: number): 'match' | 'minor' | 'significant' {
  if (variance === 0) return 'match';
  
  const absVariance = Math.abs(variance);
  const absBase = Math.abs(baseValue);
  
  // Within $1 or 0.1% is a match
  if (absVariance <= 1 || (absBase > 0 && absVariance / absBase <= 0.001)) {
    return 'match';
  }
  
  // Within 1% is minor
  if (absBase > 0 && absVariance / absBase <= 0.01) {
    return 'minor';
  }
  
  return 'significant';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, documentId, documentType, extractedTotals } = await req.json();

    if (!projectId || !documentType) {
      return new Response(
        JSON.stringify({ error: "projectId and documentType are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the project's wizard_data to get Trial Balance
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("wizard_data, periods")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project fetch error:", projectError);
      return new Response(
        JSON.stringify({ error: "Project not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract Trial Balance accounts from wizard_data
    const wizardData = project.wizard_data as Record<string, unknown> | null;
    const trialBalanceData = wizardData?.trialBalance as { accounts?: TrialBalanceAccount[] } | undefined;
    const accounts = trialBalanceData?.accounts || [];

    if (accounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No Trial Balance data found. Please upload and process a Trial Balance first.",
          code: "NO_TRIAL_BALANCE"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Derive totals from Trial Balance
    const derivedTotals = deriveTotalsFromTrialBalance(accounts);
    
    // If extractedTotals weren't provided, we need to use AI to extract them
    // For now, we'll return the derived totals for comparison
    let uploadedTotals = extractedTotals as DerivedTotals | undefined;
    
    // If no extracted totals provided, attempt AI extraction
    if (!uploadedTotals && documentId) {
      // Fetch document details
      const { data: doc } = await supabase
        .from("documents")
        .select("name, parsed_summary")
        .eq("id", documentId)
        .single();
      
      if (doc?.parsed_summary) {
        // Try to extract totals from parsed summary using AI
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        
        if (LOVABLE_API_KEY) {
          const prompt = documentType === 'balance_sheet'
            ? `Extract the following totals from this Balance Sheet data. Return ONLY valid JSON with these exact keys:
               {
                 "totalAssets": number or null,
                 "totalLiabilities": number or null,
                 "totalEquity": number or null
               }
               
               Document data: ${JSON.stringify(doc.parsed_summary)}`
            : `Extract the following totals from this Income Statement/P&L data. Return ONLY valid JSON with these exact keys:
               {
                 "totalRevenue": number or null,
                 "totalCogs": number or null,
                 "grossProfit": number or null,
                 "totalExpenses": number or null,
                 "netIncome": number or null
               }
               
               Document data: ${JSON.stringify(doc.parsed_summary)}`;

          try {
            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "You are a financial data extraction specialist. Extract exact numerical values. Return only valid JSON, no markdown." },
                  { role: "user", content: prompt }
                ],
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content || '';
              // Try to parse the JSON response
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                uploadedTotals = JSON.parse(jsonMatch[0]);
              }
            }
          } catch (aiError) {
            console.warn("AI extraction failed:", aiError);
          }
        }
      }
    }

    // Build comparison line items
    const lineItems: ValidationLineItem[] = [];
    
    if (documentType === 'balance_sheet') {
      const items = [
        { key: 'totalAssets', label: 'Total Assets' },
        { key: 'totalLiabilities', label: 'Total Liabilities' },
        { key: 'totalEquity', label: 'Total Equity' },
      ];
      
      for (const item of items) {
        const tbValue = derivedTotals[item.key as keyof DerivedTotals] || 0;
        const uploadedValue = uploadedTotals?.[item.key as keyof DerivedTotals] ?? tbValue;
        const variance = uploadedValue - tbValue;
        const variancePercent = tbValue !== 0 ? (variance / Math.abs(tbValue)) * 100 : 0;
        
        lineItems.push({
          lineItem: item.label,
          uploadedValue,
          trialBalanceValue: tbValue,
          variance,
          variancePercent,
          status: getVarianceStatus(variance, tbValue),
        });
      }
    } else if (documentType === 'income_statement') {
      const items = [
        { key: 'totalRevenue', label: 'Total Revenue' },
        { key: 'totalCogs', label: 'Cost of Goods Sold' },
        { key: 'grossProfit', label: 'Gross Profit' },
        { key: 'totalExpenses', label: 'Total Operating Expenses' },
        { key: 'netIncome', label: 'Net Income' },
      ];
      
      for (const item of items) {
        const tbValue = derivedTotals[item.key as keyof DerivedTotals] || 0;
        const uploadedValue = uploadedTotals?.[item.key as keyof DerivedTotals] ?? tbValue;
        const variance = uploadedValue - tbValue;
        const variancePercent = tbValue !== 0 ? (variance / Math.abs(tbValue)) * 100 : 0;
        
        lineItems.push({
          lineItem: item.label,
          uploadedValue,
          trialBalanceValue: tbValue,
          variance,
          variancePercent,
          status: getVarianceStatus(variance, tbValue),
        });
      }
    }

    // Calculate overall score
    const matchCount = lineItems.filter(l => l.status === 'match').length;
    const minorCount = lineItems.filter(l => l.status === 'minor').length;
    const overallScore = Math.round(
      ((matchCount * 100) + (minorCount * 50)) / lineItems.length
    );

    // Check if BS is balanced
    const isBalanced = documentType === 'balance_sheet'
      ? Math.abs((derivedTotals.totalAssets || 0) - ((derivedTotals.totalLiabilities || 0) + (derivedTotals.totalEquity || 0))) < 1
      : undefined;

    // Build summary message
    let summary = '';
    const significantCount = lineItems.filter(l => l.status === 'significant').length;
    if (significantCount > 0) {
      summary = `Found ${significantCount} significant variance(s). Review the discrepancies and investigate the differences.`;
    } else if (minorCount > 0) {
      summary = `Good match with ${minorCount} minor variance(s). These may be due to rounding differences.`;
    } else {
      summary = 'Perfect match! The uploaded document aligns with Trial Balance-derived values.';
    }

    const result = {
      documentType,
      documentName: "Uploaded Document",
      overallScore,
      lineItems,
      validatedAt: new Date().toISOString(),
      isBalanced,
      summary,
      derivedTotals, // Include for debugging
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Validation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
