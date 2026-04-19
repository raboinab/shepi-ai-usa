import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface ProcessRequest {
  projectId: string;
  filePath: string;
  documentName: string;
  documentType?: string;
}

// Document types that should be sent to DocuClipper for parsing
// Note: tax_return removed - DocuClipper doesn't support Form extraction, using AI only
const DOCUCLIPPER_TYPES = ["bank_statement", "credit_card"];

// Document types that should be sent to qbToJson for parsing
const QUICKBOOKS_TYPES = [
  "chart_of_accounts",
  "balance_sheet",
  "income_statement",
  "profit_loss",
  "trial_balance",
  "cash_flow",
  "general_ledger",
  "journal_entries",
  "accounts_payable",
  "accounts_receivable",
  "customer_concentration",
  "vendor_concentration",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const docuClipperApiUrl = Deno.env.get("DOCUCLIPPER_API_URL")?.trim().replace(/\/+$/, "");
    const docuClipperApiKey = Deno.env.get("DOCUCLIPPER_API_KEY")?.trim();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { projectId, filePath, documentName, documentType } = await req.json() as ProcessRequest;

    console.log(`[PROCESS-STATEMENT] Processing document: ${documentName} for project: ${projectId}, type: ${documentType}`);

    // Find the document record
    const { data: docs, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('file_path', filePath);

    if (docError || !docs || docs.length === 0) {
      console.error("[PROCESS-STATEMENT] Document not found:", docError);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const doc = docs[0];
    const docType = documentType || doc.account_type;

    // Check if this document type should be parsed
    if (!DOCUCLIPPER_TYPES.includes(docType as string)) {
      console.log(`[PROCESS-STATEMENT] Document type '${docType}' does not require parsing - marking as completed`);
      
      await supabase
        .from('documents')
        .update({
          processing_status: "completed",
          parsed_summary: { note: "Document stored successfully. This document type does not require parsing." }
        })
        .eq('id', doc.id);

      // Fire-and-forget: embed project data for RAG
      fireEmbedProjectData(supabaseUrl, supabaseServiceKey, projectId, docType as string);

      // Fire-and-forget: trigger analysis for GL and JE document types
      if (docType === "general_ledger") {
        fireAnalysis(supabaseUrl, supabaseServiceKey, "analyze-general-ledger", projectId);
      }
      if (docType === "journal_entries") {
        fireAnalysis(supabaseUrl, supabaseServiceKey, "analyze-journal-entries", projectId);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Document stored successfully. This document type does not require parsing.",
          documentId: doc.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to processing
    await supabase
      .from('documents')
      .update({ processing_status: "processing" })
      .eq('id', doc.id);

    // Check if DocuClipper API is configured
    if (!docuClipperApiUrl || !docuClipperApiKey) {
      console.log("[PROCESS-STATEMENT] DocuClipper API not configured - marking as pending");
      
      await supabase
        .from('documents')
        .update({
          processing_status: "pending",
          parsed_summary: { note: "DocuClipper API not configured" }
        })
        .eq('id', doc.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Document uploaded. DocuClipper API integration pending configuration.",
          documentId: doc.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the project to retrieve company name
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    const companyName = project?.target_company || project?.name || projectId;

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError || !fileData) {
      console.error("[PROCESS-STATEMENT] Failed to download file:", downloadError);
      await supabase
        .from('documents')
        .update({
          processing_status: "failed",
          parsed_summary: { error: "Failed to download file from storage" }
        })
        .eq('id', doc.id);
      
      throw new Error("Failed to download file from storage");
    }

    // Build webhook URL for async callback
    const webhookUrl = `${supabaseUrl}/functions/v1/docuclipper-webhook`;

    // Send file to DocuClipper async endpoint
    console.log(`[PROCESS-STATEMENT] Calling DocuClipper ASYNC API at ${docuClipperApiUrl}/process-statements-async`);
    console.log(`[PROCESS-STATEMENT] Webhook URL: ${webhookUrl}`);
    
    const formData = new FormData();
    formData.append("project_id", projectId);
    formData.append("company_name", companyName as string);
    formData.append("document_type", docType as string);
    formData.append("files", fileData, documentName);
    formData.append("format", "json");
    formData.append("webhook_url", webhookUrl);

    const parserResponse = await fetch(`${docuClipperApiUrl}/process-statements-async`, {
      method: "POST",
      headers: {
        "X-API-Key": docuClipperApiKey!,
      },
      body: formData,
    });
    
    console.log(`[PROCESS-STATEMENT] Async response status: ${parserResponse.status}`);

    if (!parserResponse.ok) {
      const errorText = await parserResponse.text();
      console.error("[PROCESS-STATEMENT] DocuClipper async API error:", errorText);
      
      await supabase
        .from('documents')
        .update({
          processing_status: "failed",
          parsed_summary: { error: `DocuClipper API error: ${errorText}` }
        })
        .eq('id', doc.id);

      throw new Error(`DocuClipper API error: ${errorText}`);
    }

    const asyncResponse = await parserResponse.json();
    const jobId = asyncResponse.job_id || asyncResponse.jobId;
    console.log(`[PROCESS-STATEMENT] Async job submitted, job_id: ${jobId}`);

    // Create docuclipper_jobs record with status 'processing'
    if (jobId) {
      const { error: jobError } = await supabase
        .from('docuclipper_jobs')
        .insert({
          job_id: jobId,
          document_id: doc.id,
          project_id: projectId,
          user_id: doc.user_id,
          status: "processing",
        });

      if (jobError) {
        console.error("[PROCESS-STATEMENT] Failed to create docuclipper_jobs record:", jobError);
      } else {
        console.log(`[PROCESS-STATEMENT] Created docuclipper_jobs record for job_id: ${jobId}`);
      }

      // Update document with job reference
      await supabase
        .from('documents')
        .update({ docuclipper_job_id: jobId })
        .eq('id', doc.id);
    }

    console.log(`[PROCESS-STATEMENT] Document ${doc.id} submitted for async processing`);

    return new Response(
      JSON.stringify({ 
        success: true,
        async: true,
        documentId: doc.id,
        jobId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[PROCESS-STATEMENT] Error processing statement:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function fireEmbedProjectData(supabaseUrl: string, serviceKey: string, projectId: string, dataType: string) {
  try {
    fetch(`${supabaseUrl}/functions/v1/embed-project-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        project_id: projectId,
        data_types: [dataType],
        source: "upload",
      }),
    }).catch((e) => console.error("[PROCESS-STATEMENT] embed-project-data error:", e));
  } catch (e) {
    console.error("[PROCESS-STATEMENT] Failed to trigger embed-project-data:", e);
  }
}

function fireAnalysis(supabaseUrl: string, serviceKey: string, functionName: string, projectId: string) {
  try {
    fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ projectId }),
    }).catch((e) => console.error(`[PROCESS-STATEMENT] ${functionName} trigger error:`, e));
  } catch (e) {
    console.error(`[PROCESS-STATEMENT] Failed to trigger ${functionName}:`, e);
  }
}
