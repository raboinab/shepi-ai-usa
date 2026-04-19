import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ProcessRequest {
  documentIds: string[];
  projectId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const llmExtractorUrl = Deno.env.get("LLM_EXTRACTOR_URL")?.trim().replace(/\/+$/, "");
    const llmExtractorApiKey = Deno.env.get("LLM_EXTRACTOR_API_KEY")?.trim();

    if (!llmExtractorUrl || !llmExtractorApiKey) {
      return new Response(
        JSON.stringify({ error: "LLM Extractor not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { documentIds, projectId } = await req.json() as ProcessRequest;

    if (!documentIds || documentIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[CREATE-TASKS] Processing ${documentIds.length} documents for project ${projectId}`);

    // Fetch all documents
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds);

    if (fetchError || !documents) {
      console.error("[CREATE-TASKS] Failed to fetch documents:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch documents" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get project for company name
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    const companyName = project?.target_company || project?.name || projectId;
    const webhookUrl = `${supabaseUrl}/functions/v1/docuclipper-webhook`;

    // ---- STEP 1: Create docuclipper_jobs records BEFORE calling external API ----
    // This prevents the race condition where webhooks arrive before job records exist.
    for (const doc of documents) {
      const { error: insertError } = await supabase
        .from('docuclipper_jobs')
        .insert({
          job_id: doc.id,
          document_id: doc.id,
          project_id: projectId,
          user_id: doc.user_id,
          status: 'processing',
        });
      if (insertError) {
        console.error(`[CREATE-TASKS] Failed to create docuclipper_job for doc ${doc.id}:`, insertError);
      }

      // Set docuclipper_job_id to the document's own ID (backend convention)
      await supabase
        .from('documents')
        .update({ docuclipper_job_id: doc.id })
        .eq('id', doc.id);
    }

    // ---- STEP 2: Update all document statuses to 'processing' BEFORE the API call ----
    // This eliminates the race where a fast webhook sets 'completed' and then
    // a late bulk update overwrites it back to 'processing'.
    const { error: updateError } = await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .in('id', documentIds);

    if (updateError) {
      console.error("[CREATE-TASKS] Failed to update document statuses:", updateError);
    }

    // ---- STEP 3: NOW call the external batch API ----
    // Any webhook callbacks from here on will correctly transition processing → completed.
    const response = await fetch(`${llmExtractorUrl}/create-tasks-batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": llmExtractorApiKey,
      },
      body: JSON.stringify({
        documents: documents.map(doc => ({
          id: doc.id,
          name: doc.name,
          file_path: doc.file_path,
          document_type: doc.account_type || "bank_statement",
        })),
        project_id: projectId,
        company_name: companyName,
        supabase_url: supabaseUrl,
        supabase_key: supabaseServiceKey,
        db_url: Deno.env.get("SUPABASE_DB_URL"),
        webhook_url: webhookUrl,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[CREATE-TASKS] Batch API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Batch processing request failed", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const batchResult = await response.json();
    console.log(`[CREATE-TASKS] Batch API response:`, JSON.stringify(batchResult));

    const tasksCreated = batchResult.tasks_created ?? batchResult.tasksCreated ?? documents.length;
    console.log(`[CREATE-TASKS] Submitted batch of ${documents.length} documents, tasks created: ${tasksCreated}`);

    return new Response(
      JSON.stringify({
        success: true,
        tasksCreated,
        totalDocuments: documents.length,
        results: [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CREATE-TASKS] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
