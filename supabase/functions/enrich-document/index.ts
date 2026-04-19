import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Parse Cloud Run extracted_data format:
 * { "<jobId>": { "metadata": [], "<accountNumber>": { "_summary": {...}, "bankMode": { "transactions": [...] } } } }
 *
 * Also handles the direct DocuClipper webhook format for future-proofing.
 */
interface AccountSummary {
  startDate?: string | null;
  endDate?: string | null;
  startBalance?: number;
  endBalance?: number;
  accountNumber?: string;
  isReconciled?: boolean;
  totalCredits?: number;
  totalDebits?: number;
  transactionCount?: number;
}

interface ParsedResult {
  accountNumber: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalance: number | null;
  closingBalance: number | null;
  totalDebits: number;
  totalCredits: number;
  isReconciled: boolean | null;
  transactionCount: number;
  transactions: Array<Record<string, unknown>>;
  bankName: string | null;
}

/** Convert MM-DD-YYYY or MM/DD/YYYY to YYYY-MM-DD */
function normalizeDateToISO(dateStr: string): string | null {
  if (!dateStr) return null;

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.split('T')[0];

  // MM-DD-YYYY or MM/DD/YYYY
  const parts = dateStr.split(/[-\\/]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    // If first part is 4 digits, it's YYYY-MM-DD already
    if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
    // Otherwise MM-DD-YYYY
    return `${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
  }

  return null;
}

/** Infer period_end from transactions or end-of-month of periodStart */
function inferPeriodEnd(periodStart: string, transactions: Array<Record<string, unknown>>): string {
  let maxDate = periodStart;
  for (const txn of transactions) {
    const txnDate = typeof txn.date === 'string' ? normalizeDateToISO(txn.date) : null;
    if (txnDate && txnDate > maxDate) maxDate = txnDate;
  }
  if (maxDate > periodStart) return maxDate;

  // Fall back to end-of-month
  const [y, m] = periodStart.split('-').map(Number);
  const endOfMonth = new Date(y, m, 0);
  return endOfMonth.toISOString().split('T')[0];
}

/**
 * Parse extracted_data from Cloud Run proxy format.
 * Structure: { "<jobId>": { "metadata": [...], "<accountNumber>": { "_summary": {...}, "bankMode": { "transactions": [...] } } } }
 */
function parseCloudRunFormat(extracted: Record<string, unknown>): ParsedResult | null {
  // Find the job-level key (skip known non-job keys)
  const topKeys = Object.keys(extracted);

  for (const jobKey of topKeys) {
    const jobData = extracted[jobKey];
    if (!jobData || typeof jobData !== 'object') continue;

    const jobObj = jobData as Record<string, unknown>;

    // Find account key (skip 'metadata')
    for (const accountKey of Object.keys(jobObj)) {
      if (accountKey === 'metadata') continue;

      const accountData = jobObj[accountKey];
      if (!accountData || typeof accountData !== 'object') continue;

      const accountObj = accountData as Record<string, unknown>;
      const summary = accountObj._summary as AccountSummary | undefined;

      if (!summary) continue;

      const periodStart = normalizeDateToISO(summary.startDate || '');
      const transactions = ((accountObj.bankMode as Record<string, unknown>)?.transactions as Array<Record<string, unknown>>) || [];
      let periodEnd = summary.endDate ? normalizeDateToISO(summary.endDate) : null;

      if (periodStart && !periodEnd) {
        periodEnd = inferPeriodEnd(periodStart, transactions);
      }

      return {
        accountNumber: summary.accountNumber || accountKey || null,
        periodStart,
        periodEnd,
        openingBalance: summary.startBalance ?? null,
        closingBalance: summary.endBalance ?? null,
        totalDebits: summary.totalDebits || 0,
        totalCredits: summary.totalCredits || 0,
        isReconciled: summary.isReconciled ?? null,
        transactionCount: summary.transactionCount || transactions.length,
        transactions,
        bankName: null,
      };
    }
  }

  return null;
}

/**
 * Parse invoiceMode format used by DocuClipper for credit card statements.
 * Structure: { "<jobId>": { "metadata": [...], "invoiceMode": [{ "date": "...", "dueDate": "...", "total": 3603.67, "lines": [...] }] } }
 */
function parseInvoiceModeFormat(extracted: Record<string, unknown>): ParsedResult | null {
  // Check top-level for invoiceMode, or nested under a jobId key
  const candidates: Array<Record<string, unknown>> = [];

  if (Array.isArray(extracted.invoiceMode)) {
    candidates.push(extracted);
  } else {
    for (const key of Object.keys(extracted)) {
      const val = extracted[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const obj = val as Record<string, unknown>;
        if (Array.isArray(obj.invoiceMode)) {
          candidates.push(obj);
        }
      }
    }
  }

  if (candidates.length === 0) return null;

  const container = candidates[0];
  const invoices = container.invoiceMode as Array<Record<string, unknown>>;
  if (!invoices || invoices.length === 0) return null;

  // Aggregate across all invoice entries (multi-month statements)
  let earliestDate: string | null = null;
  let latestDate: string | null = null;
  let totalAmount = 0;
  let totalLineCount = 0;
  const allTransactions: Array<Record<string, unknown>> = [];

  for (const invoice of invoices) {
    const dateStr = normalizeDateToISO(String(invoice.date || ''));
    if (dateStr) {
      if (!earliestDate || dateStr < earliestDate) earliestDate = dateStr;
      if (!latestDate || dateStr > latestDate) latestDate = dateStr;
    }

    const total = typeof invoice.total === 'number' ? invoice.total : parseFloat(String(invoice.total || '0')) || 0;
    totalAmount += total;

    const lines = Array.isArray(invoice.lines) ? invoice.lines as Array<Record<string, unknown>> : [];
    totalLineCount += lines.length;

    // Convert lines to transaction format
    for (const line of lines) {
      allTransactions.push({
        description: line.item || line.description || 'Unknown',
        amount: typeof line.unitPrice === 'number' ? line.unitPrice : parseFloat(String(line.unitPrice || '0')) || 0,
        date: dateStr,
      });
    }
  }

  // Infer periodStart: start of the month of the earliest date
  let periodStart: string | null = null;
  if (earliestDate) {
    const [y, m] = earliestDate.split('-').map(Number);
    periodStart = `${y}-${String(m).padStart(2, '0')}-01`;
  }

  return {
    accountNumber: null, // CC statements don't include account numbers in invoiceMode
    periodStart,
    periodEnd: latestDate,
    openingBalance: null,
    closingBalance: null,
    totalDebits: totalAmount,
    totalCredits: 0,
    isReconciled: null,
    transactionCount: totalLineCount,
    transactions: allTransactions,
    bankName: null,
  };
}

/**
 * Parse direct DocuClipper webhook format (for completeness).
 * Structure: { transactions: [...], periodStart, periodEnd, accountNumber, bankName, _accountSummaries: [...], summary: {...} }
 */
function parseDocuClipperFormat(extracted: Record<string, unknown>): ParsedResult | null {
  const hasTransactions = Array.isArray(extracted.transactions) && (extracted.transactions as unknown[]).length > 0;
  const hasSummaries = Array.isArray(extracted._accountSummaries) && (extracted._accountSummaries as unknown[]).length > 0;
  if (!hasTransactions && !hasSummaries) return null;

  const summaries = extracted._accountSummaries as AccountSummary[] | undefined;
  const transactions = (extracted.transactions as Array<Record<string, unknown>>) || [];

  let accountNumber = (extracted.accountNumber as string) || null;
  let openingBalance: number | null = null;
  let closingBalance: number | null = null;
  let isReconciled: boolean | null = null;
  let totalCredits = (extracted.summary as Record<string, number>)?.totalCredits || 0;
  let totalDebits = (extracted.summary as Record<string, number>)?.totalDebits || 0;

  if (summaries && summaries.length > 0) {
    openingBalance = summaries[0].startBalance ?? null;
    closingBalance = summaries[0].endBalance ?? null;
    accountNumber = summaries[0].accountNumber || accountNumber;
    isReconciled = summaries[0].isReconciled ?? null;
    totalCredits = summaries.reduce((sum, s) => sum + (s.totalCredits || 0), 0) || totalCredits;
    totalDebits = summaries.reduce((sum, s) => sum + (s.totalDebits || 0), 0) || totalDebits;
  } else {
    const summary = extracted.summary as Record<string, number> | undefined;
    openingBalance = summary?.openingBalance ?? null;
    closingBalance = summary?.closingBalance ?? null;
  }

  let periodStart = normalizeDateToISO((extracted.periodStart as string) || '');
  let periodEnd = normalizeDateToISO((extracted.periodEnd as string) || '');

  if (periodStart && !periodEnd) {
    periodEnd = inferPeriodEnd(periodStart, transactions);
  }

  return {
    accountNumber,
    periodStart,
    periodEnd,
    openingBalance,
    closingBalance,
    totalDebits,
    totalCredits,
    isReconciled,
    transactionCount: transactions.length,
    transactions,
    bankName: (extracted.bankName as string) || null,
  };
}

serve(async (req) => {
  console.log('[ENRICH-DOCUMENT] Request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const documentId: string | undefined = body.document_id || body.record?.id;

    if (!documentId) {
      console.error('[ENRICH-DOCUMENT] Missing document_id');
      return new Response(
        JSON.stringify({ error: 'document_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ENRICH-DOCUMENT] Processing document:', documentId);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the document
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, project_id, user_id, extracted_data, account_label, account_type, period_start, period_end, parsed_summary, institution, job_id')
      .eq('id', documentId)
      .maybeSingle();

    if (docError || !doc) {
      console.error('[ENRICH-DOCUMENT] Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!doc.extracted_data) {
      console.log('[ENRICH-DOCUMENT] No extracted_data, skipping');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'no extracted_data' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Skip if already enriched (has account_label AND period_start AND parsed_summary)
    if (doc.account_label && doc.period_start && doc.parsed_summary) {
      console.log('[ENRICH-DOCUMENT] Already enriched, skipping');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'already enriched' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const extracted = doc.extracted_data as Record<string, unknown>;

    // Try Cloud Run format first, then DocuClipper format, then invoiceMode (credit cards)
    let parsed = parseCloudRunFormat(extracted);
    if (!parsed) {
      parsed = parseDocuClipperFormat(extracted);
    }
    if (!parsed) {
      parsed = parseInvoiceModeFormat(extracted);
    }

    if (!parsed) {
      console.warn('[ENRICH-DOCUMENT] Could not parse extracted_data format');
      return new Response(
        JSON.stringify({ skipped: true, reason: 'unrecognized format' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ENRICH-DOCUMENT] Parsed:', {
      accountNumber: parsed.accountNumber,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      transactionCount: parsed.transactionCount,
    });

    // Update the document
    const docUpdate: Record<string, unknown> = {
      processing_status: 'completed',
      period_start: parsed.periodStart,
      period_end: parsed.periodEnd,
      institution: parsed.bankName || doc.institution || null,
      parsed_summary: {
        transactionCount: parsed.transactionCount,
        totalDebits: parsed.totalDebits,
        totalCredits: parsed.totalCredits,
        openingBalance: parsed.openingBalance,
        closingBalance: parsed.closingBalance,
        accountNumber: parsed.accountNumber,
        isReconciled: parsed.isReconciled,
      },
    };

    // Auto-populate account_label if not set
    if (parsed.accountNumber && !doc.account_label) {
      docUpdate.account_label = parsed.accountNumber;
    }

    const { error: updateDocError } = await supabase
      .from('documents')
      .update(docUpdate)
      .eq('id', doc.id);

    if (updateDocError) {
      console.error('[ENRICH-DOCUMENT] Error updating document:', updateDocError);
      throw new Error(updateDocError.message);
    }

    // Check if processed_data already exists for this document
    const { data: existingPD } = await supabase
      .from('processed_data')
      .select('id')
      .eq('source_document_id', doc.id)
      .limit(1);

    if (!existingPD || existingPD.length === 0) {
      const dataType = doc.account_type === 'credit_card' ? 'credit_card_transactions' : 'bank_transactions';

      const { error: pdError } = await supabase
        .from('processed_data')
        .insert({
          project_id: doc.project_id,
          user_id: doc.user_id,
          source_type: 'docuclipper',
          data_type: dataType,
          source_document_id: doc.id,
          period_start: parsed.periodStart,
          period_end: parsed.periodEnd,
          data: {
            transactions: parsed.transactions,
            summary: {
              totalDebits: parsed.totalDebits,
              totalCredits: parsed.totalCredits,
              openingBalance: parsed.openingBalance,
              closingBalance: parsed.closingBalance,
              accountNumber: parsed.accountNumber,
              isReconciled: parsed.isReconciled,
            },
          },
          record_count: parsed.transactionCount,
          validation_status: 'pending',
        });

      if (pdError) {
        console.error('[ENRICH-DOCUMENT] Error inserting processed_data:', pdError);
      } else {
        console.log('[ENRICH-DOCUMENT] Created processed_data record');
      }
    } else {
      console.log('[ENRICH-DOCUMENT] processed_data already exists, skipping insert');
    }

    // Update docuclipper_jobs status if applicable
    if (doc.job_id) {
      const { error: jobUpdateError } = await supabase
        .from('docuclipper_jobs')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('job_id', doc.job_id.toString());

      if (jobUpdateError) {
        console.warn('[ENRICH-DOCUMENT] Failed to update docuclipper_jobs status:', jobUpdateError);
      } else {
        console.log('[ENRICH-DOCUMENT] Updated docuclipper_jobs status to completed for job_id:', doc.job_id);
      }
    }

    console.log('[ENRICH-DOCUMENT] Successfully enriched document:', doc.id);

    return new Response(
      JSON.stringify({
        success: true,
        document_id: doc.id,
        account_label: docUpdate.account_label || doc.account_label,
        period_start: parsed.periodStart,
        period_end: parsed.periodEnd,
        transaction_count: parsed.transactionCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ENRICH-DOCUMENT] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
