import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Document types that use the external batch processing service
const BATCH_PROCESSING_TYPES = ['bank_statement', 'credit_card'];

async function resubmitDocument(
  supabase: ReturnType<typeof createClient>,
  supabaseUrl: string,
  serviceKey: string,
  doc: { id: string; name: string; project_id: string; account_type: string | null },
): Promise<{ action: string; status: string }> {
  const isBatchType = BATCH_PROCESSING_TYPES.includes(doc.account_type || '');

  // Reset document status to pending
  await supabase
    .from('documents')
    .update({ processing_status: 'pending', parsed_summary: null, extracted_data: null, status: null })
    .eq('id', doc.id);

  // Also reset any docuclipper_jobs record
  await supabase
    .from('docuclipper_jobs')
    .update({ status: 'pending', error_message: null, extracted_data: null })
    .eq('document_id', doc.id);

  if (isBatchType) {
    // Re-submit via create-processing-tasks
    const response = await fetch(`${supabaseUrl}/functions/v1/create-processing-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ documentIds: [doc.id], projectId: doc.project_id }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[RECOVER-STALE] Resubmit failed for ${doc.id}:`, errText);
      return { action: 'resubmit_failed', status: 'create_tasks_error' };
    }

    return { action: 'resubmitted', status: 'sent_to_batch_processor' };
  }

  // Non-batch types: mark as pending so user can retry from UI
  return { action: 'reset_to_pending', status: 'ready_for_retry' };
}

serve(async (req) => {
  console.log('[RECOVER-STALE] Request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const projectId: string | undefined = body.project_id;
    const maxAgeMinutes: number = body.max_age_minutes || 30;
    const autoResubmit: boolean = body.auto_resubmit !== false; // default true

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const docuClipperApiUrl = Deno.env.get("DOCUCLIPPER_API_URL")?.trim().replace(/\/+$/, "");
    const docuClipperApiKey = Deno.env.get("DOCUCLIPPER_API_KEY")?.trim();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find stale documents
    let query = supabase
      .from('documents')
      .select('id, project_id, user_id, name, file_path, processing_status, created_at, job_id, docuclipper_job_id, account_type')
      .in('processing_status', ['processing', 'downloading'])
      .lt('created_at', new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString());

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: staleDocs, error: queryError } = await query.limit(500);

    if (queryError) {
      console.error('[RECOVER-STALE] Query error:', queryError);
      throw new Error(queryError.message);
    }

    if (!staleDocs || staleDocs.length === 0) {
      console.log('[RECOVER-STALE] No stale documents found');
      return new Response(
        JSON.stringify({ recovered: 0, failed: 0, skipped: 0, resubmitted: 0, details: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[RECOVER-STALE] Found ${staleDocs.length} stale document(s)`);

    const results: Array<{ documentId: string; name: string; action: string; status: string }> = [];
    let recovered = 0;
    let failed = 0;
    let skipped = 0;
    let resubmitted = 0;

    for (const doc of staleDocs) {
      const jobId = doc.job_id || doc.docuclipper_job_id;

      // Also check docuclipper_jobs table for the job_id
      let effectiveJobId = jobId;
      if (!effectiveJobId) {
        const { data: jobRecord } = await supabase
          .from('docuclipper_jobs')
          .select('job_id')
          .eq('document_id', doc.id)
          .limit(1)
          .maybeSingle();

        if (jobRecord?.job_id) {
          effectiveJobId = jobRecord.job_id;
        }
      }

      if (!effectiveJobId) {
        if (autoResubmit) {
          console.log(`[RECOVER-STALE] No job_id for document ${doc.id} (${doc.name}) - resubmitting`);
          const result = await resubmitDocument(supabase, supabaseUrl, supabaseServiceKey, doc);
          results.push({ documentId: doc.id, name: doc.name, ...result });
          if (result.action === 'resubmitted' || result.action === 'reset_to_pending') resubmitted++;
          else failed++;
        } else {
          await supabase
            .from('documents')
            .update({
              processing_status: 'failed',
              parsed_summary: { error: 'No job ID found - processing was lost. Please re-upload.' },
            })
            .eq('id', doc.id);
          results.push({ documentId: doc.id, name: doc.name, action: 'marked_failed', status: 'no_job_id' });
          failed++;
        }
        continue;
      }

      // Check Cloud Run proxy for job status
      if (!docuClipperApiUrl || !docuClipperApiKey) {
        if (autoResubmit) {
          console.log(`[RECOVER-STALE] API not configured, resubmitting ${doc.name}`);
          const result = await resubmitDocument(supabase, supabaseUrl, supabaseServiceKey, doc);
          results.push({ documentId: doc.id, name: doc.name, ...result });
          if (result.action === 'resubmitted' || result.action === 'reset_to_pending') resubmitted++;
          else failed++;
        } else {
          results.push({ documentId: doc.id, name: doc.name, action: 'skipped', status: 'api_not_configured' });
          skipped++;
        }
        continue;
      }

      try {
        console.log(`[RECOVER-STALE] Checking job status for ${effectiveJobId} (document: ${doc.name})`);
        const statusResponse = await fetch(`${docuClipperApiUrl}/job-status/${effectiveJobId}`, {
          method: 'GET',
          headers: { 'X-API-Key': docuClipperApiKey },
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          console.warn(`[RECOVER-STALE] Job status check failed for ${effectiveJobId}:`, errorText);

          if (statusResponse.status === 404) {
            // Job doesn't exist on external service - resubmit
            if (autoResubmit) {
              console.log(`[RECOVER-STALE] Job not found for ${doc.name} - resubmitting`);
              const result = await resubmitDocument(supabase, supabaseUrl, supabaseServiceKey, doc);
              results.push({ documentId: doc.id, name: doc.name, ...result });
              if (result.action === 'resubmitted' || result.action === 'reset_to_pending') resubmitted++;
              else failed++;
            } else {
              await supabase
                .from('documents')
                .update({
                  processing_status: 'failed',
                  parsed_summary: { error: 'Processing job not found. Please re-upload.' },
                })
                .eq('id', doc.id);
              results.push({ documentId: doc.id, name: doc.name, action: 'marked_failed', status: 'job_not_found' });
              failed++;
            }
          } else {
            results.push({ documentId: doc.id, name: doc.name, action: 'skipped', status: `status_check_error_${statusResponse.status}` });
            skipped++;
          }
          continue;
        }

        const jobStatus = await statusResponse.json();
        console.log(`[RECOVER-STALE] Job ${effectiveJobId} status:`, jobStatus.status || 'unknown');

        if (jobStatus.status === 'completed' && jobStatus.result) {
          // Job completed - write extracted_data (DB trigger will handle enrichment)
          console.log(`[RECOVER-STALE] Recovering completed job ${effectiveJobId} for document ${doc.name}`);

          const { error: updateError } = await supabase
            .from('documents')
            .update({
              extracted_data: jobStatus.result,
              status: 'completed',
            })
            .eq('id', doc.id);

          if (updateError) {
            console.error(`[RECOVER-STALE] Failed to write extracted_data for ${doc.id}:`, updateError);
            results.push({ documentId: doc.id, name: doc.name, action: 'recovery_failed', status: 'db_write_error' });
            failed++;
          } else {
            results.push({ documentId: doc.id, name: doc.name, action: 'recovered', status: 'extracted_data_written' });
            recovered++;
          }
        } else if (jobStatus.status === 'failed' || jobStatus.status === 'error') {
          if (autoResubmit) {
            console.log(`[RECOVER-STALE] Job failed for ${doc.name} - resubmitting`);
            const result = await resubmitDocument(supabase, supabaseUrl, supabaseServiceKey, doc);
            results.push({ documentId: doc.id, name: doc.name, ...result });
            if (result.action === 'resubmitted' || result.action === 'reset_to_pending') resubmitted++;
            else failed++;
          } else {
            await supabase
              .from('documents')
              .update({
                processing_status: 'failed',
                parsed_summary: { error: `Cloud processing failed: ${jobStatus.error || 'Unknown error'}` },
              })
              .eq('id', doc.id);
            results.push({ documentId: doc.id, name: doc.name, action: 'marked_failed', status: 'job_failed' });
            failed++;
          }
        } else if (jobStatus.status === 'processing' || jobStatus.status === 'pending') {
          // Still processing - skip for now
          console.log(`[RECOVER-STALE] Job ${effectiveJobId} still processing - skipping`);
          results.push({ documentId: doc.id, name: doc.name, action: 'skipped', status: 'still_processing' });
          skipped++;
        } else {
          // Unknown status - resubmit if very old (>2 hours)
          const createdAt = new Date(doc.created_at).getTime();
          const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

          if (createdAt < twoHoursAgo) {
            if (autoResubmit) {
              const result = await resubmitDocument(supabase, supabaseUrl, supabaseServiceKey, doc);
              results.push({ documentId: doc.id, name: doc.name, ...result });
              if (result.action === 'resubmitted' || result.action === 'reset_to_pending') resubmitted++;
              else failed++;
            } else {
              await supabase
                .from('documents')
                .update({
                  processing_status: 'failed',
                  parsed_summary: { error: 'Processing timed out after 2 hours. Please re-upload.' },
                })
                .eq('id', doc.id);
              results.push({ documentId: doc.id, name: doc.name, action: 'marked_failed', status: 'timeout' });
              failed++;
            }
          } else {
            results.push({ documentId: doc.id, name: doc.name, action: 'skipped', status: `unknown_status_${jobStatus.status}` });
            skipped++;
          }
        }
      } catch (fetchError) {
        console.error(`[RECOVER-STALE] Error checking job ${effectiveJobId}:`, fetchError);
        results.push({ documentId: doc.id, name: doc.name, action: 'skipped', status: 'fetch_error' });
        skipped++;
      }
    }

    console.log(`[RECOVER-STALE] Complete: recovered=${recovered}, failed=${failed}, skipped=${skipped}, resubmitted=${resubmitted}`);

    return new Response(
      JSON.stringify({ recovered, failed, skipped, resubmitted, details: results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[RECOVER-STALE] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
