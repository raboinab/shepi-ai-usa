import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import { OpenAI } from "npm:openai@4.65.0";

// Classification-focused query aligned to actual misclassification patterns
// (COA line-item placement follows the same rules regardless of industry)
const classificationQuery =
  'account classification financial statements depreciation amortization ' +
  'cost of goods sold operating expenses interest expense owner compensation ' +
  'gains losses revenue bad debt expense rent lease reclassification';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BATCH_SIZE = 60;
const BATCH_TIMEOUT_MS = 150_000;
const MAX_RETRIES = 1;
const RETRY_BACKOFF_MS = 3_000;

// Helper function to get classification context via RAG
async function getClassificationContext(supabase: any, params: {
  projectId: string,
  industry: string,
  openai?: OpenAI
}) {
  try {
    // If no OpenAI instance provided, skip RAG and return empty context
    if (!params.openai) {
      return {
        industryGuidance: '',
        companyContext: '',
        industry: params.industry,
        contextSources: { qoe_chunks: 0, project_chunks: 0 }
      };
    }

    // Use classification-focused query (not industry-specific)
    const contextQuery = `${classificationQuery} account classification financial statement mapping`;

    console.log(`[RAG] Getting classification context (industry: ${params.industry})`);

    const embedding = await params.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: contextQuery,
    });

    // Query both general RAG (all textbook sources) and project-specific RAG in parallel
    const [qoeContext, projectContext] = await Promise.all([
      // General classification guidance from all indexed textbooks
      supabase.rpc('match_rag_chunks', {
        query_embedding: embedding.data[0].embedding,
        source_filter: ['oglove', 'edwards', 'openstax'],
        match_count: 5,
        match_threshold: 0.65,
      }),
      // Project-specific context and patterns
      supabase.rpc('match_project_chunks', {
        project_id: params.projectId,
        query_embedding: JSON.stringify(embedding.data[0].embedding),
        data_type_filter: ['trial_balance', 'chart_of_accounts', 'adjustments'],
        match_count: 5,
        match_threshold: 0.65
      })
    ]);

    // Extract and format context
    const industryGuidance = qoeContext.data?.map((chunk: any) => 
      `[${chunk.source_title || chunk.source} - ${chunk.chapter || 'General'}]: ${chunk.content.substring(0, 300)}...`
    ).join('\n\n') || '';

    const companyContext = projectContext.data?.map((chunk: any) => 
      `[${chunk.data_type} - ${chunk.period || 'Recent'}]: ${chunk.content.substring(0, 200)}...`
    ).join('\n\n') || '';

    console.log(`[RAG] Retrieved ${qoeContext.data?.length || 0} QoE chunks, ${projectContext.data?.length || 0} project chunks`);

    return {
      industryGuidance,
      companyContext,
      industry: params.industry,
      contextSources: {
        qoe_chunks: qoeContext.data?.length || 0,
        project_chunks: projectContext.data?.length || 0
      }
    };
  } catch (error) {
    console.error('[RAG] Error getting classification context:', error);
    return {
      industryGuidance: '',
      companyContext: '',
      industry: params.industry,
      contextSources: { qoe_chunks: 0, project_chunks: 0 }
    };
  }
}

// Helper function to create enhanced system prompt with RAG context
function createEnhancedSystemPrompt(context: any) {
  let basePrompt = `You are a senior M&A due diligence analyst reviewing a company's Chart of Accounts for reclassification issues.

Your task: Review each account and identify any that are MISCLASSIFIED — i.e., sitting under the wrong financial statement line item or category.`;

  // Add industry-specific context if available
  if (context.industryGuidance) {
    basePrompt += `\n\nINDUSTRY CONTEXT (${context.industry.toUpperCase()}):\n${context.industryGuidance}`;
  }

  // Add company historical patterns if available
  if (context.companyContext) {
    basePrompt += `\n\nCOMPANY HISTORICAL PATTERNS:\n${context.companyContext}`;
  }

  // Add the standard classification patterns
  basePrompt += `\n\nCommon reclassification patterns to look for:
- Depreciation/amortization booked under Operating Expenses instead of its own line
- Interest expense mixed into OpEx instead of Below-the-Line
- Owner compensation hidden in regular payroll or G&A
- Gains/losses on asset sales recorded as Revenue
- COGS items classified as OpEx (or vice versa)
- Bad debt expense in OpEx instead of contra-revenue or its own line
- Rent/lease payments that should be separated
- One-time/non-recurring items mixed into recurring categories`;

  if (context.industryGuidance || context.companyContext) {
    basePrompt += `\n\nUSE THE ABOVE CONTEXT to provide more accurate classifications and educational explanations that reference industry practices and company patterns.`;
  }

  basePrompt += `\n\nFor each misclassification found, return a JSON object using the tool provided.
Only flag accounts where you have meaningful confidence (>= 0.6) the classification is wrong.
If no reclassifications are needed, return an empty suggestions array.`;

  return basePrompt;
}

const systemPrompt = `You are a senior M&A due diligence analyst reviewing a company's Chart of Accounts for reclassification issues.

Your task: Review each account and identify any that are MISCLASSIFIED — i.e., sitting under the wrong financial statement line item or category.

Common reclassification patterns to look for:
- Depreciation/amortization booked under Operating Expenses instead of its own line
- Interest expense mixed into OpEx instead of Below-the-Line
- Owner compensation hidden in regular payroll or G&A
- Gains/losses on asset sales recorded as Revenue
- COGS items classified as OpEx (or vice versa)
- Bad debt expense in OpEx instead of contra-revenue or its own line
- Rent/lease payments that should be separated
- One-time/non-recurring items mixed into recurring categories

For each misclassification found, return a JSON object using the tool provided.
Only flag accounts where you have meaningful confidence (>= 0.6) the classification is wrong.
If no reclassifications are needed, return an empty suggestions array.`;

const toolDefinition = {
  type: "function" as const,
  function: {
    name: "suggest_reclassifications",
    description: "Return reclassification suggestions for misclassified accounts",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              account_name: { type: "string", description: "The account name as provided" },
              flag_type: {
                type: "string",
                enum: [
                  "reclass_depreciation_in_opex",
                  "reclass_amortization_mixed",
                  "reclass_interest_in_opex",
                  "reclass_rent_vs_lease",
                  "reclass_gain_loss_in_revenue",
                  "reclass_cogs_opex_boundary",
                  "reclass_payroll_owner_comp",
                  "reclass_bad_debt_in_opex",
                  "reclass_other",
                ],
              },
              from_line_item: { type: "string", description: "Current FS line item / category" },
              to_line_item: { type: "string", description: "Suggested correct FS line item / category" },
              reason: { type: "string", description: "Why this account is misclassified" },
              confidence: { type: "number", description: "Confidence score 0-1" },
              balance: { type: "number", description: "The account balance amount" },
            },
            required: ["account_name", "flag_type", "from_line_item", "to_line_item", "reason", "confidence", "balance"],
            additionalProperties: false,
          },
        },
      },
      required: ["suggestions"],
      additionalProperties: false,
    },
  },
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function slimAccounts(accounts: any[]): any[] {
  return accounts.map((a) => ({
    name: a.name,
    fsType: a.fsType,
    category: a.category,
    classification: a.classification,
    subtype: a.subtype,
    totalBalance: a.totalBalance,
  }));
}

async function callAIBatchOnce(
  slimmed: any[],
  batchIndex: number,
  totalBatches: number,
  lovableApiKey: string,
  enhancedSystemPrompt: string,
): Promise<{ suggestions: any[]; durationMs: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BATCH_TIMEOUT_MS);

  const userPrompt = `Here are ${slimmed.length} accounts (batch ${batchIndex + 1}/${totalBatches}) from the target company's Chart of Accounts with their Trial Balance totals:

${JSON.stringify(slimmed)}

Review each account's current classification (fsType, category, classification, subtype) and identify any that appear to be under the wrong FS line item. Consider the account name, subtype, and balance magnitude.`;

  const startTime = Date.now();
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: enhancedSystemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "suggest_reclassifications" } },
        max_completion_tokens: 24000,
      }),
      signal: controller.signal,
    });

    const durationMs = Date.now() - startTime;
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      const retryable = response.status === 429 || response.status >= 500;
      const err = new Error(`AI gateway ${response.status}: ${errText}`);
      (err as any).retryable = retryable;
      throw err;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return { suggestions: [], durationMs };

    const parsed = JSON.parse(toolCall.function.arguments);
    return { suggestions: parsed.suggestions || [], durationMs };
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      const e = new Error(`Batch ${batchIndex + 1}/${totalBatches} timed out after ${BATCH_TIMEOUT_MS / 1000}s`);
      (e as any).retryable = true;
      throw e;
    }
    throw err;
  }
}

async function callAIBatch(
  accounts: any[],
  batchIndex: number,
  totalBatches: number,
  lovableApiKey: string,
  enhancedSystemPrompt: string,
): Promise<{ suggestions: any[]; durationMs: number }> {
  const slimmed = slimAccounts(accounts);
  const promptChars = JSON.stringify(slimmed).length + enhancedSystemPrompt.length;
  console.log(`[reclass-job] Batch ${batchIndex + 1}/${totalBatches}: ${slimmed.length} accounts, ~${promptChars} chars`);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callAIBatchOnce(slimmed, batchIndex, totalBatches, lovableApiKey, enhancedSystemPrompt);
    } catch (err: any) {
      if (attempt < MAX_RETRIES && err.retryable) {
        console.warn(`[reclass-job] Batch ${batchIndex + 1} attempt ${attempt + 1} failed (retryable), backing off ${RETRY_BACKOFF_MS}ms`);
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Unreachable");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("OPENAI_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const supabase = createClient(supabaseUrl, serviceKey);

  let jobId: string | undefined;

  try {
    const body = await req.json();
    jobId = body.job_id;
    const batchIndex: number = body.batch_index ?? 0;

    if (!jobId) {
      return new Response(JSON.stringify({ error: "job_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[reclass-job] Starting job ${jobId}, batch_index=${batchIndex}`);

    // Read the job
    const { data: job, error: jobError } = await supabase
      .from("reclassification_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: if job is already completed or failed, skip
    if (job.status === "completed" || job.status === "failed") {
      console.log(`[reclass-job] Job ${jobId} already ${job.status}, skipping`);
      return new Response(JSON.stringify({ status: job.status, message: "Job already finished" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: check if this batch was already processed
    const existingResult = (job.result as any) || {};
    const batchesCompleted = existingResult.batches_completed || 0;
    if (batchIndex < batchesCompleted) {
      console.log(`[reclass-job] Batch ${batchIndex} already completed (${batchesCompleted} done), skipping`);
      return new Response(JSON.stringify({ status: "skipped", message: "Batch already processed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as processing on first batch
    if (batchIndex === 0) {
      await supabase
        .from("reclassification_jobs")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    if (!lovableApiKey) {
      await supabase
        .from("reclassification_jobs")
        .update({ status: "failed", error_message: "OPENAI_API_KEY not configured", updated_at: new Date().toISOString() })
        .eq("id", jobId);
      return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputPayload = job.input_payload as any;
    const accountSummary = inputPayload?.account_summary || [];
    const industry = inputPayload?.industry || 'general';
    const batches = chunkArray(accountSummary, BATCH_SIZE);
    const totalBatches = batches.length;

    // Get RAG context for enhanced classification (only on first batch to avoid redundant calls)
    let classificationContext: any = {};
    let enhancedSystemPrompt = systemPrompt;
    
    if (batchIndex === 0) {
      console.log(`[RAG] Getting classification context for industry: ${industry}`);
      const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : undefined;
      
      classificationContext = await getClassificationContext(supabase, {
        projectId: job.project_id,
        industry,
        openai
      });
      
      enhancedSystemPrompt = createEnhancedSystemPrompt(classificationContext);
      
      // Store context in job result for later batches
      await supabase
        .from("reclassification_jobs")
        .update({
          result: {
            ...existingResult,
            classification_context: classificationContext,
            enhanced_prompt_chars: enhancedSystemPrompt.length
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", jobId);
        
      console.log(`[RAG] Context retrieved: ${classificationContext.contextSources.qoe_chunks} QoE + ${classificationContext.contextSources.project_chunks} project chunks`);
    } else {
      // Use context from previous batches
      classificationContext = existingResult.classification_context || {};
      enhancedSystemPrompt = createEnhancedSystemPrompt(classificationContext);
    }

    if (batchIndex >= totalBatches) {
      console.log(`[reclass-job] batch_index ${batchIndex} >= totalBatches ${totalBatches}, finalizing`);
      // Jump to finalization
    }

    // ─── Process ONE batch ───
    let batchSuggestions: any[] = [];
    let aiDurationMs = 0;

    if (batchIndex < totalBatches) {
      const batch = batches[batchIndex];
      const startIdx = batchIndex * BATCH_SIZE + 1;
      const endIdx = startIdx + batch.length - 1;
      console.log(`[reclass-job] Processing batch ${batchIndex + 1}/${totalBatches} (accounts ${startIdx}-${endIdx})`);

      const result = await callAIBatch(batch, batchIndex, totalBatches, lovableApiKey, enhancedSystemPrompt);
      batchSuggestions = result.suggestions;
      aiDurationMs = result.durationMs;

      console.log(`[reclass-job] Batch ${batchIndex + 1}/${totalBatches}: ${batchSuggestions.length} suggestions in ${aiDurationMs}ms`);
    }

    // ─── Accumulate partial results ───
    const priorSuggestions = existingResult.partial_suggestions || [];
    const allSuggestions = [...priorSuggestions, ...batchSuggestions];
    const priorAiDuration = existingResult.ai_duration_ms || 0;
    const newBatchesCompleted = batchIndex + 1;

    // ─── Check if more batches remain ───
    if (newBatchesCompleted < totalBatches) {
      // Save checkpoint and chain to next batch
      await supabase
        .from("reclassification_jobs")
        .update({
          result: {
            partial_suggestions: allSuggestions,
            batches_completed: newBatchesCompleted,
            total_batches: totalBatches,
            accounts_analyzed: accountSummary.length,
            ai_duration_ms: priorAiDuration + aiDurationMs,
            classification_context: classificationContext,
            enhanced_prompt_chars: enhancedSystemPrompt.length,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      // Self-chain: invoke next batch
      const nextUrl = `${supabaseUrl}/functions/v1/process-reclassification-job`;
      console.log(`[reclass-job] Chaining to batch ${newBatchesCompleted + 1}/${totalBatches}`);

      try {
        const chainController = new AbortController();
        // 5s is plenty to get HTTP response headers back (confirms request received)
        const chainTimeout = setTimeout(() => chainController.abort(), 5000);

        const resp = await fetch(nextUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ job_id: jobId, batch_index: newBatchesCompleted }),
          signal: chainController.signal,
        });
        clearTimeout(chainTimeout);
        console.log(`[reclass-job] Chain dispatched, status: ${resp.status}`);
      } catch (err) {
        // AbortError after 5s is fine — request was already sent and received
        const isAbort = err instanceof DOMException && (err as DOMException).name === 'AbortError';
        console.log(`[reclass-job] Chain dispatch ${isAbort ? 'sent (timeout ok)' : 'error'}: ${err}`);
      }

      return new Response(JSON.stringify({
        status: "processing",
        batch_completed: newBatchesCompleted,
        total_batches: totalBatches,
        suggestions_so_far: allSuggestions.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── FINALIZE: All batches done ───
    console.log(`[reclass-job] All ${totalBatches} batches done. Total suggestions: ${allSuggestions.length}. Finalizing...`);

    // Re-check job status to prevent duplicate finalization
    const { data: currentJob } = await supabase
      .from("reclassification_jobs")
      .select("status")
      .eq("id", jobId)
      .single();

    if (currentJob?.status === "completed") {
      console.log(`[reclass-job] Job already completed (race condition), skipping finalization`);
      return new Response(JSON.stringify({ status: "completed", message: "Already finalized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete existing reclassification candidates for this project
    await supabase
      .from("flagged_transactions")
      .delete()
      .eq("project_id", job.project_id)
      .eq("flag_category", "adjustment_candidate")
      .eq("suggested_adjustment_type", "reclassification");

    // Insert new suggestions
    let insertedCount = 0;
    let filteredByConfidence = 0;
    let insertErrors = 0;

    for (const s of allSuggestions) {
      if (s.confidence < 0.6) {
        filteredByConfidence++;
        continue;
      }

      const { error: insertError } = await supabase
        .from("flagged_transactions")
        .insert({
          project_id: job.project_id,
          user_id: job.user_id,
          transaction_date: new Date().toISOString().split("T")[0],
          description: s.reason,
          amount: Math.abs(s.balance || 0),
          account_name: s.account_name,
          flag_type: s.flag_type,
          flag_reason: s.reason,
          confidence_score: s.confidence,
          suggested_adjustment_type: "reclassification",
          suggested_adjustment_amount: Math.abs(s.balance || 0),
          status: "pending",
          flag_category: "adjustment_candidate",
          classification_context: {
            industry: classificationContext.industry || 'general',
            context_sources: classificationContext.contextSources || { qoe_chunks: 0, project_chunks: 0 },
            from_line_item: s.from_line_item,
            to_line_item: s.to_line_item,
            has_industry_context: !!(classificationContext.industryGuidance),
            has_company_context: !!(classificationContext.companyContext),
            enhanced_analysis: true
          },
          ai_analysis: {
            is_reclassification: true,
            suggested_from_line_item: s.from_line_item,
            suggested_to_line_item: s.to_line_item,
            model: "gpt-4o-mini",
            analysis_type: "enhanced_coa_review_with_rag",
            rag_enhanced: !!(classificationContext.industryGuidance || classificationContext.companyContext),
          },
          source_data: {
            analysis_source: "enhanced_chart_of_accounts_review",
            classification_context_used: !!(classificationContext.industryGuidance || classificationContext.companyContext)
          },
        });

      if (!insertError) {
        insertedCount++;
      } else {
        insertErrors++;
        console.error(`[reclass-job] Insert error for "${s.account_name}": ${insertError.message}`);
      }
    }

    console.log(`[reclass-job] Inserted ${insertedCount} of ${allSuggestions.length} suggestions (${filteredByConfidence} filtered, ${insertErrors} errors)`);

    // Mark job completed
    await supabase
      .from("reclassification_jobs")
      .update({
        status: "completed",
        result: {
          flagged_count: insertedCount,
          total_suggestions: allSuggestions.length,
          accounts_analyzed: accountSummary.length,
          batches_processed: totalBatches,
          ai_duration_ms: priorAiDuration + aiDurationMs,
          filtered_by_confidence: filteredByConfidence,
          insert_errors: insertErrors,
          classification_context: classificationContext,
          rag_enhanced: !!(classificationContext.industryGuidance || classificationContext.companyContext),
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    return new Response(JSON.stringify({
      flagged_count: insertedCount,
      total_suggestions: allSuggestions.length,
      accounts_analyzed: accountSummary.length,
      batches_processed: totalBatches,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(`[reclass-job] Error:`, err);

    if (jobId) {
      await supabase
        .from("reclassification_jobs")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
