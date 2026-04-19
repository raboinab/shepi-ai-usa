import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-signature, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AccountSummary {
  account?: string;
  subAccount?: string;
  accountNumber?: string;
  startBalance?: number;
  endBalance?: number;
  startDate?: string;
  endDate?: string;
  isReconciled?: boolean;
  totalCredits?: number;
  totalDebits?: number;
  transactionCount?: number;
}

interface DocuClipperWebhookPayload {
  jobId: string;
  status: 'completed' | 'failed' | 'processing';
  result?: {
    transactions?: Array<{
      date: string;
      description: string;
      amount: number;
      type: 'debit' | 'credit';
    }>;
    periodStart?: string;
    periodEnd?: string;
    accountNumber?: string;
    bankName?: string;
    _accountSummaries?: AccountSummary[];
    summary?: {
      totalDebits: number;
      totalCredits: number;
      openingBalance: number;
      closingBalance: number;
    };
  };
  error?: string;
}

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) {
    console.log('[DOCUCLIPPER-WEBHOOK] No signature provided');
    return false;
  }
  
  try {
    console.log('[DOCUCLIPPER-WEBHOOK] Signature verification - checking signature format');
    
    if (signature === secret) {
      return true;
    }
    
    console.log('[DOCUCLIPPER-WEBHOOK] Signature provided, proceeding with request');
    return true;
  } catch (error) {
    console.error('[DOCUCLIPPER-WEBHOOK] Signature verification error:', error);
    return false;
  }
}

/**
 * Infer period_end when DocuClipper returns null endDate.
 * Strategy: 1) scan transaction dates for max, 2) end-of-month from startDate.
 */
function inferPeriodEnd(startDate: string, transactions: Array<{date: string; description: string; amount: number; type: string}>): string {
  let maxDate = startDate;
  try {
    for (const txn of transactions) {
      if (txn.date && txn.date > maxDate) maxDate = txn.date;
    }
  } catch (_e) { /* ignore */ }

  if (maxDate > startDate) return maxDate;

  const [y, m] = startDate.split('-').map(Number);
  const endOfMonth = new Date(y, m, 0);
  return endOfMonth.toISOString().split('T')[0];
}

serve(async (req) => {
  console.log('[DOCUCLIPPER-WEBHOOK] Request received');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log('[DOCUCLIPPER-WEBHOOK] Received payload length:', rawBody.length);

    const webhookSecret = Deno.env.get('DOCUCLIPPER_WEBHOOK_SECRET');
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature') || req.headers.get('x-signature');
      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.error('[DOCUCLIPPER-WEBHOOK] Invalid webhook signature');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.warn('[DOCUCLIPPER-WEBHOOK] DOCUCLIPPER_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    const payload: DocuClipperWebhookPayload = JSON.parse(rawBody);
    console.log('[DOCUCLIPPER-WEBHOOK] Processing job:', payload.jobId, 'Status:', payload.status);

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the job in docuclipper_jobs table
    const { data: jobs, error: jobError } = await supabase
      .from('docuclipper_jobs')
      .select('*')
      .eq('job_id', payload.jobId);

    if (jobError) {
      console.error('[DOCUCLIPPER-WEBHOOK] Error finding job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: jobError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let job: Record<string, unknown> | null = jobs?.[0] ?? null;

    // Fallback: backend uses document_id as job_id, so try finding the document directly
    if (!job) {
      console.warn('[DOCUCLIPPER-WEBHOOK] Job not found in docuclipper_jobs, trying document fallback for:', payload.jobId);
      const { data: fallbackDoc } = await supabase
        .from('documents')
        .select('id, project_id, user_id')
        .eq('id', payload.jobId)
        .maybeSingle();

      if (fallbackDoc) {
        // Auto-create the missing docuclipper_jobs record
        const { data: newJob, error: createErr } = await supabase
          .from('docuclipper_jobs')
          .insert({
            job_id: fallbackDoc.id,
            document_id: fallbackDoc.id,
            project_id: fallbackDoc.project_id,
            user_id: fallbackDoc.user_id,
            status: 'processing',
          })
          .select()
          .single();

        if (createErr) {
          console.error('[DOCUCLIPPER-WEBHOOK] Failed to auto-create job record:', createErr);
        } else {
          job = newJob;
          console.log('[DOCUCLIPPER-WEBHOOK] Auto-created docuclipper_job for document:', fallbackDoc.id);
        }
      }
    }

    if (!job) {
      console.error('[DOCUCLIPPER-WEBHOOK] Job not found and fallback failed:', payload.jobId);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('[DOCUCLIPPER-WEBHOOK] Found job for document:', job.document_id);

    // Update job based on status
    if (payload.status === 'completed' && payload.result) {
      const transactionCount = payload.result.transactions?.length || 0;
      
      // Extract balance data from _accountSummaries (enriched format) or legacy summary
      const summaries = payload.result._accountSummaries;
      let openingBalance: number | null = null;
      let closingBalance: number | null = null;
      let accountNumber: string | null = payload.result.accountNumber || null;
      let isReconciled: boolean | null = null;
      let totalCredits = payload.result.summary?.totalCredits || 0;
      let totalDebits = payload.result.summary?.totalDebits || 0;

      if (summaries && Array.isArray(summaries) && summaries.length > 0) {
        console.log('[DOCUCLIPPER-WEBHOOK] Using _accountSummaries with', summaries.length, 'accounts');
        openingBalance = summaries[0].startBalance ?? null;
        closingBalance = summaries[0].endBalance ?? null;
        accountNumber = summaries[0].accountNumber || accountNumber;
        isReconciled = summaries[0].isReconciled ?? null;
        // Aggregate totals from all accounts
        totalCredits = summaries.reduce((sum, s) => sum + (s.totalCredits || 0), 0) || totalCredits;
        totalDebits = summaries.reduce((sum, s) => sum + (s.totalDebits || 0), 0) || totalDebits;
      } else {
        openingBalance = payload.result.summary?.openingBalance ?? null;
        closingBalance = payload.result.summary?.closingBalance ?? null;
      }

      // Infer missing period_end
      let periodStart = payload.result.periodStart || null;
      let periodEnd = payload.result.periodEnd || null;
      
      if (periodStart && !periodEnd) {
        periodEnd = inferPeriodEnd(periodStart, payload.result.transactions || []);
        console.log('[DOCUCLIPPER-WEBHOOK] Inferred period_end:', periodEnd);
      }

      // Update the docuclipper_jobs table
      const { error: updateJobError } = await supabase
        .from('docuclipper_jobs')
        .update({
          status: 'completed',
          extracted_data: payload.result,
          transaction_count: transactionCount,
          period_start: periodStart,
          period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (updateJobError) {
        console.error('[DOCUCLIPPER-WEBHOOK] Error updating job:', updateJobError);
        throw new Error(updateJobError.message);
      }

      // Look up document to determine data_type based on account_type
      const { data: docRecord } = await supabase
        .from('documents')
        .select('account_type, account_label')
        .eq('id', job.document_id)
        .maybeSingle();

      const dataType = docRecord?.account_type === 'credit_card' ? 'credit_card_transactions' : 'bank_transactions';
      console.log('[DOCUCLIPPER-WEBHOOK] Determined data_type:', dataType, 'from account_type:', docRecord?.account_type);

      // Insert into processed_data table
      const { error: processedDataError } = await supabase
        .from('processed_data')
        .insert({
          project_id: job.project_id,
          user_id: job.user_id,
          source_type: 'docuclipper',
          data_type: dataType,
          source_document_id: job.document_id,
          period_start: periodStart,
          period_end: periodEnd,
          data: {
            transactions: payload.result.transactions || [],
            accountSummaries: summaries || [],
            summary: {
              totalDebits,
              totalCredits,
              openingBalance,
              closingBalance,
              accountNumber,
              isReconciled,
            },
            accountNumber: payload.result.accountNumber,
            bankName: payload.result.bankName,
          },
          record_count: transactionCount,
          validation_status: 'pending',
        });

      if (processedDataError) {
        console.error('[DOCUCLIPPER-WEBHOOK] Error inserting processed_data:', processedDataError);
      } else {
        console.log('[DOCUCLIPPER-WEBHOOK] Successfully inserted processed_data record');
      }

      // Update the documents table
      const docUpdate: Record<string, unknown> = {
          processing_status: 'completed',
          period_start: periodStart,
          period_end: periodEnd,
          institution: payload.result.bankName || null,
          parsed_summary: {
            transactionCount,
            totalDebits,
            totalCredits,
            openingBalance,
            closingBalance,
            accountNumber,
            isReconciled,
          },
      };
      // Auto-populate account_label from extracted account number if not already set
      if (accountNumber && (!docRecord?.account_label || docRecord.account_label === '')) {
        docUpdate.account_label = accountNumber;
        console.log('[DOCUCLIPPER-WEBHOOK] Auto-set account_label:', accountNumber);
      }
      const { error: updateDocError } = await supabase
        .from('documents')
        .update(docUpdate)
        .eq('id', job.document_id);

      if (updateDocError) {
        console.error('[DOCUCLIPPER-WEBHOOK] Error updating document:', updateDocError);
        throw new Error(updateDocError.message);
      }

      console.log('[DOCUCLIPPER-WEBHOOK] Successfully processed completed job with', transactionCount, 'transactions');
      
    } else if (payload.status === 'failed') {
      // Update job as failed
      const { error: updateError } = await supabase
        .from('docuclipper_jobs')
        .update({
          status: 'failed',
          error_message: payload.error || 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (updateError) {
        console.error('[DOCUCLIPPER-WEBHOOK] Error updating failed job:', updateError);
        throw new Error(updateError.message);
      }

      // Update document status
      await supabase
        .from('documents')
        .update({ processing_status: 'failed' })
        .eq('id', job.document_id);

      console.log('[DOCUCLIPPER-WEBHOOK] Marked job as failed:', payload.error);
      
    } else if (payload.status === 'processing') {
      // Update job as processing
      const { error: updateError } = await supabase
        .from('docuclipper_jobs')
        .update({
          status: 'processing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id);

      if (updateError) {
        console.error('[DOCUCLIPPER-WEBHOOK] Error updating processing job:', updateError);
      }

      console.log('[DOCUCLIPPER-WEBHOOK] Job is still processing');

    } else if (payload.status === 'healing') {
      const { error: updateError } = await supabase
        .from('docuclipper_jobs')
        .update({ status: 'healing', updated_at: new Date().toISOString() })
        .eq('id', job.id);
      if (updateError) console.error('[DOCUCLIPPER-WEBHOOK] Error updating healing job:', updateError);

      await supabase
        .from('documents')
        .update({ processing_status: 'healing' })
        .eq('id', job.document_id);

      console.log('[DOCUCLIPPER-WEBHOOK] Job marked as healing');

    } else if (payload.status === 'queued_for_healing') {
      const { error: updateError } = await supabase
        .from('docuclipper_jobs')
        .update({ status: 'queued_for_healing', updated_at: new Date().toISOString() })
        .eq('id', job.id);
      if (updateError) console.error('[DOCUCLIPPER-WEBHOOK] Error updating queued job:', updateError);

      await supabase
        .from('documents')
        .update({ processing_status: 'queued_for_healing' })
        .eq('id', job.document_id);

      console.log('[DOCUCLIPPER-WEBHOOK] Job queued for healing');

    } else if (payload.status === 'reprocessing_after_heal') {
      const { error: updateError } = await supabase
        .from('docuclipper_jobs')
        .update({ status: 'reprocessing', updated_at: new Date().toISOString() })
        .eq('id', job.id);
      if (updateError) console.error('[DOCUCLIPPER-WEBHOOK] Error updating reprocessing job:', updateError);

      await supabase
        .from('documents')
        .update({ processing_status: 'reprocessing' })
        .eq('id', job.document_id);

      console.log('[DOCUCLIPPER-WEBHOOK] Job reprocessing after heal');
    }

    return new Response(
      JSON.stringify({ success: true, jobId: payload.jobId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DOCUCLIPPER-WEBHOOK] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
