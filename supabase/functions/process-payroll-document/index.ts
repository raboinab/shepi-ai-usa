import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface Period {
  id: string;
  label: string;
  year: number;
  month: number;
}

interface MultiPeriodAccount {
  id: string;
  name: string;
  category?: string;
  monthlyValues: Record<string, number>;
}

interface PayrollExtractionResult {
  success: boolean;
  confidence: 'high' | 'medium' | 'low';
  extractedData: {
    salaryWages: MultiPeriodAccount[];
    payrollTaxes: MultiPeriodAccount[];
    benefits: MultiPeriodAccount[];
    ownerCompensation: MultiPeriodAccount[];
  };
  warnings: string[];
  rawFindings: string;
  periodCoverage: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, projectId, periods } = await req.json() as {
      documentId: string;
      projectId: string;
      periods: Period[];
    };

    if (!documentId || !projectId) {
      return new Response(
        JSON.stringify({ error: 'documentId and projectId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing payroll document: ${documentId} for project: ${projectId}`);
    console.log(`Periods provided: ${periods?.length || 0}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found document: ${document.name}, file_path: ${document.file_path}`);

    // Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('Failed to download file:', downloadError);
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to download file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Downloaded file, size: ${fileData.size} bytes`);

    // Convert file to base64 for PDFs/images or text for CSV/Excel
    const arrayBuffer = await fileData.arrayBuffer();
    const fileType = document.file_type?.toLowerCase() || '';
    
    let fileContent: string;
    let contentType: 'image' | 'text' = 'text';
    
    if (['pdf', 'jpg', 'jpeg', 'png', 'webp'].includes(fileType)) {
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      let mimeType = 'application/pdf';
      if (['jpg', 'jpeg'].includes(fileType)) mimeType = 'image/jpeg';
      else if (fileType === 'png') mimeType = 'image/png';
      else if (fileType === 'webp') mimeType = 'image/webp';
      
      fileContent = `data:${mimeType};base64,${base64Data}`;
      contentType = 'image';
    } else {
      // For CSV/Excel, decode as text
      try {
        fileContent = new TextDecoder().decode(new Uint8Array(arrayBuffer));
      } catch {
        fileContent = 'Unable to decode file as text';
      }
    }

    // Build period context for AI
    const periodContext = periods && periods.length > 0
      ? `The analysis periods are:\n${periods.map(p => `- ${p.id}: ${p.label} (${p.month}/${p.year})`).join('\n')}\n\nMap extracted data to the appropriate period IDs based on dates found in the document.`
      : 'No specific periods provided. Extract data grouped by month/year found in the document.';

    // Build the AI prompt for payroll extraction
    const systemPrompt = `You are a payroll document extraction specialist for Quality of Earnings (QoE) analysis in M&A due diligence.

Your task is to extract payroll data from the uploaded document and categorize it into exactly 4 categories:

1. **Salary & Wages** (salaryWages):
   - Officers' Salary
   - Regular Wages & Salaries
   - Bonuses & Commissions
   - Contract Labor / 1099 payments
   - Overtime pay

2. **Payroll Taxes** (payrollTaxes):
   - FICA / Social Security & Medicare (employer portion)
   - FUTA (Federal Unemployment Tax)
   - SUTA (State Unemployment Tax)
   - Other employer payroll taxes

3. **Benefits** (benefits):
   - Health Insurance (employer contribution)
   - Retirement / 401(k) contributions (employer match)
   - Life & Disability Insurance
   - Workers' Compensation
   - Other employee benefits

4. **Owner/Management Compensation** (ownerCompensation):
   - Owner salaries (separate from regular employees)
   - Owner bonuses
   - Owner benefits
   - Distributions / Draws to owners
   - Management fees

${periodContext}

**IMPORTANT:**
- Extract ALL payroll-related line items from the document
- Group similar items appropriately
- If the document contains multiple periods (months/quarters), map values to correct period IDs
- If you cannot determine the exact period, use reasonable inference based on dates
- Include a confidence assessment

Return your response as a valid JSON object with this exact structure:
{
  "success": true,
  "confidence": "high" | "medium" | "low",
  "extractedData": {
    "salaryWages": [
      { "id": "uuid", "name": "Line item name", "monthlyValues": { "period_id": amount } }
    ],
    "payrollTaxes": [...],
    "benefits": [...],
    "ownerCompensation": [...]
  },
  "warnings": ["Any issues or uncertainties"],
  "rawFindings": "Brief summary of what was found in the document",
  "periodCoverage": ["2024-01", "2024-02"]
}

- Use unique UUIDs for each account id (generate random ones)
- monthlyValues should map period IDs to dollar amounts (numbers, not strings)
- If a period ID is not clear, use format "YYYY-MM" (e.g., "2024-01")`;

    // Build user content based on file type
    const userContent: unknown[] = [];
    
    if (contentType === 'image') {
      userContent.push({
        type: 'image_url',
        image_url: { url: fileContent }
      });
      userContent.push({
        type: 'text',
        text: `Extract all payroll data from this ${fileType.toUpperCase()} payroll document named "${document.name}".`
      });
    } else {
      // Truncate very long text files
      const truncatedContent = fileContent.length > 100000 
        ? fileContent.substring(0, 100000) + '\n\n[TRUNCATED - Document exceeds 100KB]'
        : fileContent;
      
      userContent.push({
        type: 'text',
        text: `Extract all payroll data from this payroll document named "${document.name}":\n\n${truncatedContent}`
      });
    }

    console.log('Calling OpenAI for payroll extraction...');

    // Call OpenAI
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      // Handle rate limiting
      if (aiResponse.status === 429) {
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', documentId);
        
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a few minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        await supabase
          .from('documents')
          .update({ processing_status: 'failed' })
          .eq('id', documentId);
        
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', documentId);
      
      return new Response(
        JSON.stringify({ error: 'AI extraction failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, parsing...');

    // Parse the AI response
    let extractionResult: PayrollExtractionResult = {
      success: false,
      confidence: 'low',
      extractedData: {
        salaryWages: [],
        payrollTaxes: [],
        benefits: [],
        ownerCompensation: [],
      },
      warnings: ['Failed to parse AI response'],
      rawFindings: '',
      periodCoverage: [],
    };

    try {
      // Find JSON in the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        extractionResult = {
          success: parsed.success ?? true,
          confidence: parsed.confidence || 'medium',
          extractedData: {
            salaryWages: parsed.extractedData?.salaryWages || [],
            payrollTaxes: parsed.extractedData?.payrollTaxes || [],
            benefits: parsed.extractedData?.benefits || [],
            ownerCompensation: parsed.extractedData?.ownerCompensation || [],
          },
          warnings: parsed.warnings || [],
          rawFindings: parsed.rawFindings || '',
          periodCoverage: parsed.periodCoverage || [],
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      extractionResult.warnings = [`JSON parse error: ${parseError}`];
      extractionResult.rawFindings = aiContent.substring(0, 500);
    }

    // Count extracted items
    const totalItems = 
      extractionResult.extractedData.salaryWages.length +
      extractionResult.extractedData.payrollTaxes.length +
      extractionResult.extractedData.benefits.length +
      extractionResult.extractedData.ownerCompensation.length;

    console.log(`Extracted ${totalItems} payroll line items with ${extractionResult.confidence} confidence`);

    // ── Cross-validation against project financial data ──────────────
    interface PayrollComparison {
      field: string;
      payrollValue: number | null;
      financialValue: number | null;
      source: string;
      variance: number | null;
      variancePercent: number | null;
      status: 'match' | 'variance' | 'missing_data';
    }

    const comparisons: PayrollComparison[] = [];
    const flags: string[] = [];

    // Helper: sum all monthly values for an array of accounts
    const sumCategory = (accounts: MultiPeriodAccount[]): number =>
      accounts.reduce((total, acct) =>
        total + Object.values(acct.monthlyValues).reduce((s, v) => s + (v || 0), 0), 0);

    const totalSalaryWages = sumCategory(extractionResult.extractedData.salaryWages);
    const totalPayrollTaxes = sumCategory(extractionResult.extractedData.payrollTaxes);
    const totalBenefits = sumCategory(extractionResult.extractedData.benefits);
    const totalOwnerComp = sumCategory(extractionResult.extractedData.ownerCompensation);
    const totalPayroll = totalSalaryWages + totalPayrollTaxes + totalBenefits + totalOwnerComp;

    try {
      // Fetch project wizard_data for IS / TB comparisons
      const { data: projectRow } = await supabase
        .from('projects')
        .select('wizard_data')
        .eq('id', projectId)
        .maybeSingle();

      const wizardData = (projectRow?.wizard_data || {}) as Record<string, unknown>;

      // ── Compare vs Income Statement salary/wages line ──
      const isData = wizardData.incomeStatement as Record<string, unknown> | undefined;
      if (isData) {
        const salaryLine = (isData as Record<string, unknown>)?.salaryExpense ??
          (isData as Record<string, unknown>)?.totalPayroll ?? null;
        if (salaryLine !== null && typeof salaryLine === 'number') {
          const variance = Math.abs(totalSalaryWages) - Math.abs(salaryLine);
          const variancePct = Math.abs(salaryLine) > 0 ? (variance / Math.abs(salaryLine)) * 100 : null;
          comparisons.push({
            field: 'Total Salary & Wages',
            payrollValue: totalSalaryWages,
            financialValue: salaryLine as number,
            source: 'Income Statement',
            variance,
            variancePercent: variancePct,
            status: variancePct !== null && Math.abs(variancePct) < 5 ? 'match' : 'variance',
          });
          if (variancePct !== null && Math.abs(variancePct) > 10) {
            flags.push(`Salary & Wages differs from Income Statement by ${Math.abs(variancePct).toFixed(1)}%`);
          }
        } else {
          comparisons.push({
            field: 'Total Salary & Wages',
            payrollValue: totalSalaryWages,
            financialValue: null,
            source: 'Income Statement',
            variance: null,
            variancePercent: null,
            status: 'missing_data',
          });
        }
      }

      // ── Compare vs Tax Return (officer comp / distributions) ──
      const { data: taxReturns } = await supabase
        .from('processed_data')
        .select('data')
        .eq('project_id', projectId)
        .eq('data_type', 'tax_return_analysis')
        .order('created_at', { ascending: false })
        .limit(1);

      if (taxReturns && taxReturns.length > 0) {
        const taxData = taxReturns[0].data as Record<string, unknown>;
        const extracted = taxData?.extractedData as Record<string, unknown> | undefined;
        if (extracted) {
          const officerComp = (extracted.officersCompensation ?? extracted.officerCompensation ?? null) as number | null;
          if (officerComp !== null) {
            const variance = Math.abs(totalOwnerComp) - Math.abs(officerComp);
            const variancePct = Math.abs(officerComp) > 0 ? (variance / Math.abs(officerComp)) * 100 : null;
            comparisons.push({
              field: 'Owner/Officer Compensation',
              payrollValue: totalOwnerComp,
              financialValue: officerComp,
              source: 'Tax Return (Officers Comp)',
              variance,
              variancePercent: variancePct,
              status: variancePct !== null && Math.abs(variancePct) < 5 ? 'match' : 'variance',
            });
            if (variancePct !== null && Math.abs(variancePct) > 10) {
              flags.push(`Owner compensation differs from Tax Return by ${Math.abs(variancePct).toFixed(1)}%`);
            }
          }
        }
      }

      // ── Flag if owner comp is unusually high ──
      if (totalPayroll > 0 && totalOwnerComp / totalPayroll > 0.5) {
        flags.push(`Owner compensation is ${((totalOwnerComp / totalPayroll) * 100).toFixed(0)}% of total payroll — review for normalization`);
      }

      // ── Flag zero-value categories ──
      if (totalPayrollTaxes === 0 && totalSalaryWages > 0) {
        flags.push('No payroll taxes detected — verify if employer taxes are captured');
      }
      if (totalBenefits === 0 && totalSalaryWages > 50000) {
        flags.push('No benefits detected — verify if employer-paid benefits exist');
      }
    } catch (crossValError) {
      console.error('Payroll cross-validation error (non-fatal):', crossValError);
      flags.push('Cross-validation could not complete — financial data may not be available yet');
    }

    // Compute overall score
    const totalComparisons = comparisons.filter(c => c.status !== 'missing_data').length;
    const matchCount = comparisons.filter(c => c.status === 'match').length;
    const overallScore = totalComparisons > 0
      ? Math.round((matchCount / totalComparisons) * 100)
      : -1; // -1 = no data to compare

    console.log(`Payroll cross-validation: ${matchCount}/${totalComparisons} match, ${flags.length} flags`);

    // Derive period_start / period_end from periodCoverage
    let periodStart: string | null = null;
    let periodEnd: string | null = null;
    if (extractionResult.periodCoverage && extractionResult.periodCoverage.length > 0) {
      const sorted = [...extractionResult.periodCoverage].sort();
      const first = sorted[0]; // e.g. "2024-01"
      const last = sorted[sorted.length - 1]; // e.g. "2024-12"
      periodStart = `${first}-01`; // first day of first month
      // Last day of last month
      const [lastYear, lastMonth] = last.split('-').map(Number);
      const lastDay = new Date(lastYear, lastMonth, 0).getDate();
      periodEnd = `${last}-${String(lastDay).padStart(2, '0')}`;
      console.log(`Derived period coverage: ${periodStart} to ${periodEnd}`);
    }

    // Store in processed_data
    const { error: insertError } = await supabase
      .from('processed_data')
      .insert({
        project_id: projectId,
        user_id: document.user_id,
        source_type: 'ai_payroll_extraction',
        data_type: 'payroll',
        source_document_id: documentId,
        period_start: periodStart,
        period_end: periodEnd,
        data: {
          ...extractionResult,
          documentName: document.name,
          extractedAt: new Date().toISOString(),
          crossValidation: {
            comparisons,
            flags,
            overallScore,
            totals: {
              salaryWages: totalSalaryWages,
              payrollTaxes: totalPayrollTaxes,
              benefits: totalBenefits,
              ownerCompensation: totalOwnerComp,
              totalPayroll,
            },
          },
        },
        record_count: totalItems,
        validation_status: extractionResult.confidence === 'high' ? 'validated' : 'pending',
      });

    if (insertError) {
      console.error('Failed to insert processed_data:', insertError);
    } else {
      console.log('Successfully stored payroll extraction in processed_data');
    }

    // Update document status
    await supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        period_start: periodStart,
        period_end: periodEnd,
        parsed_summary: {
          type: 'payroll_extraction',
          confidence: extractionResult.confidence,
          totalItems,
          warnings: extractionResult.warnings,
          extractedAt: new Date().toISOString(),
        },
      })
      .eq('id', documentId);

    // Fire-and-forget: embed project data for RAG
    try {
      fetch(`${supabaseUrl}/functions/v1/embed-project-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ project_id: projectId, data_types: ["payroll"], source: "upload" }),
      }).catch((e) => console.error("[process-payroll-document] embed error:", e));
    } catch (e) { console.error("[process-payroll-document] embed trigger error:", e); }

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        confidence: extractionResult.confidence,
        extractedData: extractionResult.extractedData,
        warnings: extractionResult.warnings,
        totalItems,
        periodCoverage: extractionResult.periodCoverage,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Payroll extraction error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
