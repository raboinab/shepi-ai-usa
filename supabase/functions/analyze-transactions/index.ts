import { createClient } from "npm:@supabase/supabase-js@2.87.1";
 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
 
 // ============================================================================
 // CANONICAL TRANSACTION TYPE - Universal schema for all data sources
 // ============================================================================
 interface CanonTxn {
   sourceType: string;
   sourceRecordId: string;
   sourceTxnId?: string;
   date: string;
   description: string;
   amountAbs: number;
   amountSigned?: number;
   accountName?: string;
   accountId?: string;
   payee?: string;
   checkNumber?: string;
   txnType?: string;
   splitAccount?: string;
   memo?: string;
   isYearEnd?: boolean;
 }
 
 // ============================================================================
 // GL-FIRST CORRELATION TYPES
 // ============================================================================
 interface CorrelationIndex {
   glByAmount: Map<number, CanonTxn[]>;
   bankByAmount: Map<number, CanonTxn[]>;
   ccByAmount: Map<number, CanonTxn[]>;
   glEntries: CanonTxn[];
   bankEntries: CanonTxn[];
   ccEntries: CanonTxn[];
 }
 
 interface CorrelationCandidate {
   glTxn: CanonTxn;
   score: number;
   matchReasons: string[];
 }
 
 interface BankProof {
   source_type: string;
   date: string;
   description: string;
   amount: number;
   match_confidence: 'high' | 'medium' | 'low';
   match_reasons: string[];
   gl_candidates?: Array<{ sourceTxnId: string; score: number; accountName: string }>;
 }
 
 type FlagCategory = 'adjustment_candidate' | 'bookkeeping_gap';
 
 interface FlaggedTransaction {
   project_id: string;
   user_id: string;
   transaction_date: string;
   description: string;
   amount: number;
   account_name: string;
   flag_type: string;
   flag_reason: string;
   confidence_score: number;
   suggested_adjustment_type: string;
   suggested_adjustment_amount: number;
   ai_analysis: object;
   source_data: object;
  flag_category?: FlagCategory;
  classification_context?: object;
}

  // The `flagged_transactions` table has a UNIQUE constraint on:
  // (project_id, transaction_date, description, amount)
  // When we upsert a batch that contains duplicates of that key, Postgres errors with:
  // "ON CONFLICT DO UPDATE command cannot affect row a second time".
  // Deduplicate within-batch to keep inserts deterministic and robust.
  function dedupeFlaggedTransactions(rows: FlaggedTransaction[]): FlaggedTransaction[] {
    const byKey = new Map<string, FlaggedTransaction>();

    for (const row of rows) {
      const amountKey = Number.isFinite(row.amount)
        ? row.amount.toFixed(2)
        : String(row.amount);
      const key = `${row.project_id}|${row.transaction_date}|${row.description}|${amountKey}`;

      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, row);
        continue;
      }

      // Prefer actionable flags over bookkeeping gaps, then higher confidence.
      const existingCat = existing.flag_category ?? 'adjustment_candidate';
      const nextCat = row.flag_category ?? 'adjustment_candidate';

      const catScore = (c: FlagCategory) => (c === 'adjustment_candidate' ? 2 : 1);
      const existingRank = catScore(existingCat);
      const nextRank = catScore(nextCat);

      const chooseNext =
        nextRank > existingRank ||
        (nextRank === existingRank && (row.confidence_score ?? 0) > (existing.confidence_score ?? 0));

      const winner = chooseNext ? row : existing;
      const loser = chooseNext ? existing : row;

      // Merge bank proofs if present so we don't lose evidence.
      const wAny = winner.ai_analysis as any;
      const lAny = loser.ai_analysis as any;
      if (wAny && lAny) {
        const wProofs = Array.isArray(wAny.bank_proofs) ? wAny.bank_proofs : [];
        const lProofs = Array.isArray(lAny.bank_proofs) ? lAny.bank_proofs : [];
        if (wProofs.length || lProofs.length) {
          const seen = new Set<string>();
          const merged: any[] = [];
          for (const p of [...wProofs, ...lProofs]) {
            const pk = `${p?.source_type}|${p?.date}|${p?.amount}|${p?.description}`;
            if (seen.has(pk)) continue;
            seen.add(pk);
            merged.push(p);
          }
          wAny.bank_proofs = merged;
        }
      }

      byKey.set(key, winner);
    }

    return [...byKey.values()];
  }
 
 Deno.serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
     const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const authHeader = req.headers.get('Authorization');
     if (!authHeader) {
       return new Response(
         JSON.stringify({ error: 'Missing authorization header' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
     const token = authHeader.replace('Bearer ', '');
     const { data: { user }, error: authError } = await supabase.auth.getUser(token);
     
     if (authError || !user) {
       return new Response(
         JSON.stringify({ error: 'Unauthorized' }),
         { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
       );
     }
 
      const { project_id, analysis_type = 'full', offset = 0, limit = 5000 } = await req.json();
  
      if (!project_id) {
        return new Response(
          JSON.stringify({ error: 'project_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
  
      console.log(`Analyzing transactions for project ${project_id}, type: ${analysis_type}, offset: ${offset}, limit: ${limit}`);
 
      // ── Sequential per-data-type fetching (memory-efficient) ──
      // Instead of loading ALL processed_data JSONB in one query (which exceeds
      // the 150 MB Deno memory limit for large projects), we fetch one data_type
      // at a time. Each type's raw JSONB is released after extraction, keeping
      // peak memory proportional to ONE type's payload + the lightweight CanonTxn
      // accumulator (~200 bytes per entry).
      const DATA_TYPES = [
        'general_ledger', 'journal_entries', 'deposits', 'bills', 'bill_payments',
        'bank_transactions', 'credit_card_transactions',
        'trial_balance', 'income_statement', 'balance_sheet'
      ];

      const allTransactions: CanonTxn[] = [];
      const countsBySource: Record<string, number> = {};
      let totalRecords = 0;
      let fetchFailed = false;

      for (const dtype of DATA_TYPES) {
        // 1. Count records for this type (no data column loaded)
        const { count, error: countError } = await supabase
          .from('processed_data')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', project_id)
          .eq('data_type', dtype);

        if (countError) {
          console.error(`Error counting ${dtype}:`, countError);
          fetchFailed = true;
          continue;
        }

        const total = count || 0;
        if (total === 0) continue;

        totalRecords += total;

        // 2. Fetch and process ONE record at a time to stay under 150MB Deno limit
        for (let i = 0; i < total; i++) {
          const { data: batch, error: fetchError } = await supabase
            .from('processed_data')
            .select('id, data_type, data, period_end, source_type')
            .eq('project_id', project_id)
            .eq('data_type', dtype)
            .range(i, i);

          if (fetchError) {
            console.error(`Error fetching ${dtype} record ${i}:`, fetchError);
            fetchFailed = true;
            continue;
          }
          if (!batch?.[0]) continue;

          const extracted = extractForDataType(batch[0]);
          if (extracted.length > 0) {
            allTransactions.push(...extracted);
            countsBySource[dtype] = (countsBySource[dtype] || 0) + extracted.length;
          }
          // batch[0] goes out of scope — GC reclaims this single record's JSONB
        }
      }

      console.log('Extracted transactions by source:', JSON.stringify(countsBySource));

      if (totalRecords === 0 && !fetchFailed) {
        return new Response(
          JSON.stringify({ message: 'No transaction data found to analyze', flagged_count: 0 }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (totalRecords === 0 && fetchFailed) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch transaction data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

       // Fetch project industry for AI context
       const { data: projectData } = await supabase
         .from('projects')
         .select('industry')
         .eq('id', project_id)
         .single();
       const industry = projectData?.industry || '';

       console.log(`Extracted ${allTransactions.length} transactions from ${totalRecords} records`);

       const correlationIndex = buildCorrelationIndex(allTransactions);
       const totalEntries = correlationIndex.glEntries.length + correlationIndex.bankEntries.length + correlationIndex.ccEntries.length;
       console.log(`Correlation index: ${correlationIndex.glEntries.length} GL, ${correlationIndex.bankEntries.length} bank, ${correlationIndex.ccEntries.length} CC`);

      // Apply offset/limit chunking to GL entries for large datasets
      const glSliceStart = Math.min(offset, correlationIndex.glEntries.length);
      const glSliceEnd = Math.min(offset + limit, correlationIndex.glEntries.length);
      const chunkedGLEntries = correlationIndex.glEntries.slice(glSliceStart, glSliceEnd);
      
      // For bank/CC, only process on the last chunk (when we've exhausted GL entries)
      const isLastGLChunk = glSliceEnd >= correlationIndex.glEntries.length;
      const bankCCOffset = isLastGLChunk ? Math.max(0, offset - correlationIndex.glEntries.length) : -1;
      
      // Build a scoped index for this chunk
      const chunkIndex: CorrelationIndex = {
        ...correlationIndex,
        glEntries: chunkedGLEntries,
        // Only include bank/CC on the last GL chunk
        bankEntries: isLastGLChunk ? correlationIndex.bankEntries : [],
        ccEntries: isLastGLChunk ? correlationIndex.ccEntries : [],
      };

      // GL-first analysis (AI-powered with deterministic fallback)
      const flaggedTransactions = await analyzeWithGLFirst(chunkIndex, project_id, user.id, analysis_type, industry);
      console.log(`Flagged ${flaggedTransactions.length} potential adjustments (chunk offset=${offset})`);
 
     if (flaggedTransactions.length > 0) {
        const deduped = dedupeFlaggedTransactions(flaggedTransactions);
        if (deduped.length !== flaggedTransactions.length) {
          console.log(`Deduped flagged rows: ${flaggedTransactions.length} -> ${deduped.length}`);
        }
       const { error: insertError } = await supabase
         .from('flagged_transactions')
          .upsert(deduped, { 
           onConflict: 'project_id,transaction_date,description,amount',
           ignoreDuplicates: false 
         });
 
       if (insertError) {
         console.error('Error inserting flagged transactions:', insertError);
         return new Response(
           JSON.stringify({ error: 'Failed to save flagged transactions' }),
           { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
         );
       }
     }

     // Calculate next offset
     const processedUpTo = glSliceEnd;
     const completed = isLastGLChunk; // Bank/CC always processed in full on last chunk
     const nextOffset = completed ? null : processedUpTo;
 
     return new Response(
       JSON.stringify({
         success: true,
         completed,
         next_offset: nextOffset,
         total_entries: totalEntries,
         processed_entries: processedUpTo,
         flagged_count: flaggedTransactions.length,
         message: completed 
           ? `Analysis complete. Found ${flaggedTransactions.length} potential adjustments.`
           : `Chunk processed. Analyzed entries ${glSliceStart}-${glSliceEnd} of ${totalEntries}.`
       }),
       { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
 
   } catch (error: unknown) {
     const errorMessage = error instanceof Error ? error.message : 'Internal server error';
     console.error('Error in analyze-transactions:', error);
     return new Response(
       JSON.stringify({ error: errorMessage }),
       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     );
   }
 });
 
 // ============================================================================
 // CORRELATION INDEX BUILDER - Separate indexes by source type
 // ============================================================================
 function buildCorrelationIndex(transactions: CanonTxn[]): CorrelationIndex {
   const glByAmount = new Map<number, CanonTxn[]>();
   const bankByAmount = new Map<number, CanonTxn[]>();
   const ccByAmount = new Map<number, CanonTxn[]>();
   const glEntries: CanonTxn[] = [];
   const bankEntries: CanonTxn[] = [];
   const ccEntries: CanonTxn[] = [];
 
   for (const tx of transactions) {
     const amountKey = Math.round(tx.amountAbs * 100);
     
     if (['general_ledger', 'journal_entries', 'bills', 'deposits', 'bill_payments'].includes(tx.sourceType)) {
       glEntries.push(tx);
       if (!glByAmount.has(amountKey)) glByAmount.set(amountKey, []);
       glByAmount.get(amountKey)!.push(tx);
     } else if (tx.sourceType === 'bank_transactions') {
       bankEntries.push(tx);
       if (!bankByAmount.has(amountKey)) bankByAmount.set(amountKey, []);
       bankByAmount.get(amountKey)!.push(tx);
     } else if (tx.sourceType === 'credit_card_transactions') {
       ccEntries.push(tx);
       if (!ccByAmount.has(amountKey)) ccByAmount.set(amountKey, []);
       ccByAmount.get(amountKey)!.push(tx);
     }
   }
 
   return { glByAmount, bankByAmount, ccByAmount, glEntries, bankEntries, ccEntries };
 }
 
 // ============================================================================
 // SCORING SYSTEM - Deterministic ranking
 // ============================================================================
 function scoreCorrelation(bankTxn: CanonTxn, glTxn: CanonTxn): { score: number; reasons: string[] } {
   let score = 0;
   const reasons: string[] = [];
 
   // Check number match (+80)
   if (bankTxn.checkNumber && glTxn.checkNumber && 
       bankTxn.checkNumber.trim() === glTxn.checkNumber.trim()) {
     score += 80;
     reasons.push('check_number_match');
   }
 
   // Amount matching
   const amountDiff = Math.abs(bankTxn.amountAbs - glTxn.amountAbs);
   if (amountDiff === 0) {
     score += 50;
     reasons.push('amount_exact');
   } else if (amountDiff <= 0.01) {
     score += 45;
     reasons.push('amount_penny_diff');
   } else if (amountDiff <= Math.min(5, bankTxn.amountAbs * 0.01)) {
     score += 30;
     reasons.push('amount_within_tolerance');
   }
 
   // Date matching
   const dayDiff = Math.abs(dateDiffDays(bankTxn.date, glTxn.date));
   if (dayDiff === 0) {
     score += 30;
     reasons.push('date_exact');
   } else if (dayDiff === 1) {
     score += 20;
     reasons.push('date_one_day');
   } else if (dayDiff <= 3) {
     score += 10;
     reasons.push('date_within_3_days');
   }
 
   // Description similarity
   const bankDesc = (bankTxn.description + ' ' + (bankTxn.payee || '')).toLowerCase();
   const glDesc = (glTxn.description + ' ' + (glTxn.payee || '')).toLowerCase();
   if (findCommonWords(bankDesc, glDesc).length >= 2) {
     score += 10;
     reasons.push('description_similar');
   }
 
   return { score, reasons };
 }
 
 function dateDiffDays(date1: string, date2: string): number {
   try {
     const d1 = new Date(date1);
     const d2 = new Date(date2);
     return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
   } catch { return 999; }
 }
 
 function findCommonWords(str1: string, str2: string): string[] {
   const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 3));
   const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 3));
   return [...words1].filter(w => words2.has(w));
 }
 
 // ============================================================================
 // FIND GL CANDIDATES FOR BANK TRANSACTION - Ranked candidates
 // ============================================================================
 function findGLCandidates(bankTxn: CanonTxn, index: CorrelationIndex, maxCandidates = 5): CorrelationCandidate[] {
   const candidates: CorrelationCandidate[] = [];
   const amountKey = Math.round(bankTxn.amountAbs * 100);
   const tolerance = Math.min(500, Math.round(bankTxn.amountAbs));
   
   const exactMatches = index.glByAmount.get(amountKey) || [];
   const nearbyMatches: CanonTxn[] = [];
   
   for (let delta = 1; delta <= tolerance; delta++) {
     nearbyMatches.push(...(index.glByAmount.get(amountKey + delta) || []));
     nearbyMatches.push(...(index.glByAmount.get(amountKey - delta) || []));
   }
   
   for (const glTxn of [...exactMatches, ...nearbyMatches]) {
     const dayDiff = Math.abs(dateDiffDays(bankTxn.date, glTxn.date));
     if (dayDiff > 3 && !(bankTxn.checkNumber && glTxn.checkNumber)) continue;
     
     const { score, reasons } = scoreCorrelation(bankTxn, glTxn);
     if (score < 40) continue;
     
     candidates.push({ glTxn, score, matchReasons: reasons });
   }
   
   candidates.sort((a, b) => b.score - a.score);
   return candidates.slice(0, maxCandidates);
 }
 
 function determineConfidence(candidates: CorrelationCandidate[]): 'high' | 'medium' | 'low' {
   if (candidates.length === 0) return 'low';
   const topScore = candidates[0].score;
   const secondScore = candidates.length > 1 ? candidates[1].score : 0;
   if (topScore >= 120 && (topScore - secondScore) >= 30) return 'high';
   if (topScore >= 80) return 'medium';
   return 'low';
 }
 
 // ============================================================================
 // MONEY PARSING
 // ============================================================================
 function parseMoneySigned(v?: string | number): { absAmount: number; signedAmount: number } {
   if (v === undefined || v === null) return { absAmount: 0, signedAmount: 0 };
   if (typeof v === 'number') return { absAmount: Math.abs(v), signedAmount: v };
   
   const s = String(v).trim();
   if (!s) return { absAmount: 0, signedAmount: 0 };
 
   const parenNeg = /^\(.*\)$/.test(s);
   const minusNeg = /^-/.test(s);
   const cleaned = s.replace(/[()$,]/g, '').replace(/^-/, '').trim();
   const absAmount = Number.parseFloat(cleaned) || 0;
   const signedAmount = (parenNeg || minusNeg) ? -absAmount : absAmount;
 
   return { absAmount, signedAmount };
 }
 
 // ============================================================================
 // COLUMN INDEX BUILDER
 // ============================================================================
 interface ColumnIndex {
   date: number; txnType: number; num: number; name: number;
   memo: number; split: number; amount: number; balance: number;
   debit?: number; credit?: number;
 }
 
 function buildColumnIndex(columns: any[] | undefined): ColumnIndex {
   const defaults: ColumnIndex = { date: 0, txnType: 1, num: 2, name: 3, memo: 4, split: 5, amount: 6, balance: 7 };
   if (!columns || !Array.isArray(columns) || columns.length === 0) return defaults;
 
   const index: ColumnIndex = { ...defaults };
   const synonyms: Record<string, string[]> = {
     date: ['date', 'trans date', 'transaction date'],
     txnType: ['transaction type', 'txn type', 'type'],
     num: ['num', 'no', 'ref', 'check', 'doc num'],
     name: ['name', 'vendor', 'customer', 'payee'],
     memo: ['memo', 'description', 'memo/description'],
     split: ['split', 'account', 'distribution'],
     amount: ['amount', 'net amount'],
     balance: ['balance', 'running balance'],
     debit: ['debit', 'dr'],
     credit: ['credit', 'cr']
   };
 
   columns.forEach((col, i) => {
     const title = (col.colTitle || '').toLowerCase().trim();
     for (const [field, keywords] of Object.entries(synonyms)) {
       if (keywords.some(kw => title.includes(kw))) {
         (index as any)[field] = i;
         break;
       }
     }
   });
   return index;
 }
 
 function parseDate(dateVal: string | undefined): string | null {
   if (!dateVal) return null;
   const lower = dateVal.toLowerCase();
   if (lower.includes('beginning') || lower.includes('total') || lower.includes('balance')) return null;
   try {
     const parsed = new Date(dateVal);
     if (isNaN(parsed.getTime())) return null;
     return parsed.toISOString().split('T')[0];
   } catch { return null; }
 }
 
 // ============================================================================
 // EXTRACTORS
 // ============================================================================
 function extractQBGeneralLedger(data: any, recordId: string, periodEnd: string): CanonTxn[] {
   const transactions: CanonTxn[] = [];
   const colIndex = buildColumnIndex(data?.columns?.column);
   const accountSections = data?.rows?.row || [];
   
   for (const section of accountSections) {
     const accountName = section?.header?.colData?.[0]?.value || section?.colData?.[0]?.value || 'Unknown';
     const accountId = section?.header?.colData?.[0]?.id || section?.colData?.[0]?.id;
     const txRows = section?.rows?.row || [];
     
     for (const tx of txRows) {
       if ((tx.type || '').toUpperCase() !== 'DATA') continue;
       
       const cols = tx.colData || [];
       const parsedDate = parseDate(cols[colIndex.date]?.value);
       if (!parsedDate) continue;
       
       let absAmount: number, signedAmount: number;
       if (colIndex.debit !== undefined && colIndex.credit !== undefined) {
         const debit = parseMoneySigned(cols[colIndex.debit]?.value);
         const credit = parseMoneySigned(cols[colIndex.credit]?.value);
         signedAmount = credit.absAmount - debit.absAmount;
         absAmount = Math.abs(signedAmount);
       } else {
         const parsed = parseMoneySigned(cols[colIndex.amount]?.value);
         absAmount = parsed.absAmount;
         signedAmount = parsed.signedAmount;
       }
       if (absAmount === 0) continue;
       
       transactions.push({
         sourceType: 'general_ledger',
         sourceRecordId: recordId,
         sourceTxnId: cols[colIndex.txnType]?.id || `${parsedDate}-${absAmount}`,
         date: parsedDate,
         description: cols[colIndex.memo]?.value || cols[colIndex.name]?.value || '',
         amountAbs: absAmount,
         amountSigned: signedAmount,
         accountName,
         accountId,
         payee: cols[colIndex.name]?.value,
         checkNumber: cols[colIndex.num]?.value,
         txnType: cols[colIndex.txnType]?.value,
         splitAccount: cols[colIndex.split]?.value,
         isYearEnd: isNearPeriodEnd(parsedDate, periodEnd)
       });
     }
   }
   return transactions;
 }
 
 function extractDocuClipperTransactions(data: any, recordId: string, sourceType: string): CanonTxn[] {
   const transactions: CanonTxn[] = [];
   const directTxns = data?.transactions || [];
   const nestedTxns = data?.rawData?.accounts?.flatMap((a: any) => a?.bankMode?.transactions || []) || [];
   const allTxns = directTxns.length > 0 ? directTxns : nestedTxns;
   const accountInfo = data?.accountNumber || data?.bankName || '';
   
   for (const tx of allTxns) {
     const parsed = parseMoneySigned(tx.amount);
     if (parsed.absAmount === 0) continue;
     const parsedDate = parseDate(tx.date);
     if (!parsedDate) continue;
     
     transactions.push({
       sourceType,
       sourceRecordId: recordId,
       sourceTxnId: `${parsedDate}-${parsed.absAmount}-${(tx.description || '').slice(0,20)}`,
       date: parsedDate,
       description: tx.description || tx.memo || '',
       amountAbs: parsed.absAmount,
       amountSigned: parsed.signedAmount,
       accountName: accountInfo,
       payee: tx.payee,
       checkNumber: tx.checkNumber
     });
   }
   return transactions;
 }
 
 function extractQBTransactionReport(data: any, recordId: string, dataType: string, periodEnd: string): CanonTxn[] {
   const transactions: CanonTxn[] = [];
   const colIndex = buildColumnIndex(data?.columns?.column);
   const rows = data?.rows?.row || [];
   
   for (const row of rows) {
     if ((row.type || '').toUpperCase() !== 'DATA') continue;
     const cols = row.colData || [];
     const parsedDate = parseDate(cols[colIndex.date]?.value);
     if (!parsedDate) continue;
     const parsed = parseMoneySigned(cols[colIndex.amount]?.value);
     if (parsed.absAmount === 0) continue;
     
     transactions.push({
       sourceType: dataType,
       sourceRecordId: recordId,
       sourceTxnId: cols[colIndex.txnType]?.id || `${parsedDate}-${parsed.absAmount}`,
       date: parsedDate,
       description: cols[colIndex.memo]?.value || cols[colIndex.name]?.value || '',
       amountAbs: parsed.absAmount,
       amountSigned: parsed.signedAmount,
       payee: cols[colIndex.name]?.value,
       checkNumber: cols[colIndex.num]?.value,
       txnType: cols[colIndex.txnType]?.value,
       isYearEnd: isNearPeriodEnd(parsedDate, periodEnd)
     });
   }
   return transactions;
 }
 
 function extractLegacyGL(data: any, recordId: string, periodEnd: string): CanonTxn[] {
   const transactions: CanonTxn[] = [];
   if (!Array.isArray(data?.accounts)) return transactions;
   
   for (const account of data.accounts) {
     const accountName = account.accountName || account.name || 'Unknown';
     const txns = account.transactions || account.entries || [];
     if (!Array.isArray(txns)) continue;
     
     for (const tx of txns) {
       const parsed = parseMoneySigned(tx.debit || tx.credit || tx.amount);
       if (parsed.absAmount === 0) continue;
       
       transactions.push({
         sourceType: 'general_ledger', sourceRecordId: recordId,
         date: tx.date || periodEnd,
         description: tx.memo || tx.description || '',
         amountAbs: parsed.absAmount, amountSigned: parsed.signedAmount,
         accountName,
         payee: tx.name || tx.payee,
         checkNumber: tx.num || tx.docNum,
         txnType: tx.txnType || tx.type,
         isYearEnd: isNearPeriodEnd(tx.date || periodEnd, periodEnd)
       });
     }
   }
   return transactions;
 }
 
 function extractLegacyTrialBalance(data: any, recordId: string, periodEnd: string): CanonTxn[] {
   const transactions: CanonTxn[] = [];
   if (!Array.isArray(data?.accounts)) return transactions;
   
   for (const account of data.accounts) {
     const parsed = parseMoneySigned(account.debit || account.credit);
     if (parsed.absAmount === 0) continue;
     
     transactions.push({
       sourceType: 'trial_balance', sourceRecordId: recordId,
       date: periodEnd,
       description: account.name || account.account_name || '',
       amountAbs: parsed.absAmount, amountSigned: parsed.signedAmount,
       accountName: account.account_number || account.name
     });
   }
   return transactions;
 }
 
 function extractLegacyFinancialStatement(data: any, recordId: string, dataType: string, periodEnd: string): CanonTxn[] {
   const transactions: CanonTxn[] = [];
   if (!Array.isArray(data?.line_items)) return transactions;
   
   for (const item of data.line_items) {
     const parsed = parseMoneySigned(item.amount);
     if (parsed.absAmount === 0) continue;
     
     transactions.push({
       sourceType: dataType, sourceRecordId: recordId,
       date: periodEnd,
       description: item.name || item.label || '',
       amountAbs: parsed.absAmount, amountSigned: parsed.signedAmount,
       accountName: item.account || item.category
     });
   }
   return transactions;
 }
 
  // Standalone extractor for a single processed_data record.
  // Used by the sequential per-data-type fetch loop in the main handler.
  function extractForDataType(record: { id: string; data: any; data_type: string; period_end?: string; source_type?: string }): CanonTxn[] {
    const data = record.data;
    const recordId = record.id;
    const periodEnd = record.period_end || new Date().toISOString().split('T')[0];

    switch (record.data_type) {
      case 'general_ledger':
        return data?.rows?.row
          ? extractQBGeneralLedger(data, recordId, periodEnd)
          : extractLegacyGL(data, recordId, periodEnd);
      case 'bank_transactions':
        return extractDocuClipperTransactions(data, recordId, 'bank_transactions');
      case 'credit_card_transactions':
        return extractDocuClipperTransactions(data, recordId, 'credit_card_transactions');
      case 'journal_entries':
      case 'deposits':
      case 'bills':
      case 'bill_payments':
        return data?.rows?.row ? extractQBTransactionReport(data, recordId, record.data_type, periodEnd) : [];
      case 'trial_balance':
        return extractLegacyTrialBalance(data, recordId, periodEnd);
      case 'income_statement':
      case 'balance_sheet':
        return extractLegacyFinancialStatement(data, recordId, record.data_type, periodEnd);
      default:
        return [];
    }
  }
 
 function isNearPeriodEnd(txDate: string, periodEnd: string): boolean {
   try {
     const tx = new Date(txDate);
     const end = new Date(periodEnd);
     const diffDays = Math.abs((end.getTime() - tx.getTime()) / (1000 * 60 * 60 * 24));
     return diffDays <= 14;
   } catch { return false; }
 }
 
  // ============================================================================
  // AI-POWERED GL-FIRST ANALYSIS ENGINE
  // ============================================================================

   const AI_GATEWAY_URL = "https://api.openai.com/v1/chat/completions";
   const GL_AI_MODEL = "gpt-4o";
   const BANK_AI_MODEL = "gpt-4o";
   const GL_BATCH_SIZE = 200;
   const BANK_BATCH_SIZE = 100;

  interface AIFlagResult {
    index: number;
    flag_type: string;
    flag_reason: string;
    confidence_score: number;
    suggested_adjustment_type: string;
    is_reclassification: boolean;
    suggested_from_line_item?: string;
    suggested_to_line_item?: string;
  }

  interface BankAIResult {
    index: number;
    flag_type: string;
    flag_reason: string;
    confidence_score: number;
    suggested_adjustment_type: string;
  }

   async function callAI(messages: Array<{role: string; content: string}>, model: string = GL_AI_MODEL): Promise<string | null> {
     const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
     if (!OPENAI_API_KEY) {
       console.warn("OPENAI_API_KEY not configured, falling back to deterministic analysis");
       return null;
     }
 
     try {
       const response = await fetch(AI_GATEWAY_URL, {
         method: "POST",
         headers: {
           Authorization: `Bearer ${OPENAI_API_KEY}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           model,
           messages,
           temperature: 0.1,
         }),
       });

      if (!response.ok) {
        console.warn(`AI gateway error ${response.status}, falling back to deterministic`);
        return null;
      }

      const result = await response.json();
      return result.choices?.[0]?.message?.content || null;
    } catch (err) {
      console.warn("AI call failed, falling back to deterministic:", err);
      return null;
    }
  }

  function extractJSONFromResponse(text: string): any {
    // Try direct parse
    try { return JSON.parse(text); } catch {}
    // Try extracting from markdown code block
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { return JSON.parse(match[1].trim()); } catch {}
    }
    // Try finding array
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (arrMatch) {
      try { return JSON.parse(arrMatch[0]); } catch {}
    }
    return null;
  }

  // ============================================================================
  // AI GL BATCH ANALYSIS
  // ============================================================================
  async function analyzeGLBatchWithAI(
    batch: CanonTxn[],
    industry: string
  ): Promise<AIFlagResult[]> {
    const txnSummaries = batch.map((tx, i) => ({
      index: i,
      date: tx.date,
      description: tx.description,
      amount: tx.amountSigned ?? tx.amountAbs,
      account: tx.accountName || "Unknown",
      payee: tx.payee || "",
      type: tx.txnType || "",
      split_account: tx.splitAccount || "",
      is_year_end: tx.isYearEnd || false,
    }));

    const systemPrompt = `You are a senior Quality of Earnings (QoE) analyst reviewing General Ledger transactions for a due diligence engagement. The target company is in the ${industry || "general business"} industry.

When flagging items, consider typical industry patterns (e.g., SaaS capitalization rules, Manufacturing inventory methods, Healthcare revenue recognition).


For each transaction, determine if it should be flagged for any of these reasons:
- owner_compensation: Owner/shareholder compensation, distributions, guaranteed payments, officer bonuses that may need normalization
- related_party: Related party transactions, intercompany transfers, management fees from affiliates
- non_recurring: One-time, non-recurring items like settlements, lawsuits, restructuring, severance
- discretionary: Discretionary expenses including travel, entertainment, meals, golf, country club, personal items
- rent_adjustment: Rent or lease payments that may need market rate adjustment
- professional_fees: Accounting, legal, consulting fees that may be non-recurring or inflated
- insurance: Insurance premiums that may include non-essential personal coverage (life, key man)
- depreciation: Depreciation/amortization that is an EBITDA add-back
- interest: Interest expense/income that is a debt-free adjustment
- journal_entry_review: Year-end journal entries or adjusting entries that need scrutiny
- personal_expense: Personal expenses running through the business
- reclass_depreciation_in_opex: Depreciation booked in operating expenses needing reclassification
- reclass_interest_in_opex: Interest expense booked in operating expenses needing reclassification
- reclass_gain_loss_in_revenue: Gains/losses booked in revenue needing reclassification
- reclass_owner_comp: Officer salary in payroll needing separate presentation

ONLY flag transactions that genuinely warrant review. Do NOT flag routine business expenses. Be selective and precise.

Return a JSON array of flagged items. Each item must have:
- index (number): the transaction index from the input
- flag_type (string): one of the types listed above
- flag_reason (string): a specific, contextual explanation (not generic)
- confidence_score (number): 0.0-1.0 reflecting how confident you are
- suggested_adjustment_type (string): e.g. "EBITDA Add-back", "Non-recurring Adjustment", "Reclassification", "Personal Expense Review", etc.
- is_reclassification (boolean): true if this is a reclassification issue
- suggested_from_line_item (string, optional): for reclassifications, the current line item
- suggested_to_line_item (string, optional): for reclassifications, the target line item

If no transactions warrant flagging, return an empty array [].
Return ONLY the JSON array, no other text.`;

    const content = await callAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(txnSummaries) },
    ]);

    if (!content) return [];

    const parsed = extractJSONFromResponse(content);
    if (!Array.isArray(parsed)) {
      console.warn("AI returned non-array response for GL batch, skipping");
      return [];
    }

    // Validate and sanitize results
    return parsed.filter((item: any) =>
      typeof item.index === "number" &&
      item.index >= 0 &&
      item.index < batch.length &&
      typeof item.flag_type === "string" &&
      typeof item.flag_reason === "string"
    ).map((item: any) => ({
      index: item.index,
      flag_type: item.flag_type,
      flag_reason: item.flag_reason,
      confidence_score: Math.min(0.95, Math.max(0.1, Number(item.confidence_score) || 0.5)),
      suggested_adjustment_type: item.suggested_adjustment_type || "Review Required",
      is_reclassification: !!item.is_reclassification,
      suggested_from_line_item: item.suggested_from_line_item,
      suggested_to_line_item: item.suggested_to_line_item,
    }));
  }

  // ============================================================================
  // AI BANK/CC PATTERN ANALYSIS
  // ============================================================================
  async function analyzeBankBatchWithAI(
    batch: CanonTxn[],
    industry: string
  ): Promise<BankAIResult[]> {
    const txnSummaries = batch.map((tx, i) => ({
      index: i,
      date: tx.date,
      description: tx.description,
      amount: tx.amountAbs,
      payee: tx.payee || "",
      check_number: tx.checkNumber || "",
      source: tx.sourceType,
    }));

    const systemPrompt = `You are a senior QoE analyst reviewing bank and credit card statement transactions for a ${industry || "general business"} company.

Identify transactions that may represent:
- personal_expense: Personal expenses (ATM withdrawals, P2P transfers like Venmo/Zelle, personal retail, dining, travel with personal component)
- owner_draw: Owner draws or distributions appearing on bank statements
- unusual_payment: Unusually large or suspicious payments

ONLY flag transactions that genuinely look suspicious. Routine business payments should NOT be flagged. Consider the industry context.

Return a JSON array. Each item must have:
- index (number): the transaction index
- flag_type (string): one of the types above
- flag_reason (string): specific contextual explanation
- confidence_score (number): 0.0-1.0
- suggested_adjustment_type (string): e.g. "Personal Expense", "Owner Draw Review"

If nothing is suspicious, return [].
Return ONLY the JSON array.`;

     const content = await callAI([
       { role: "system", content: systemPrompt },
       { role: "user", content: JSON.stringify(txnSummaries) },
     ], BANK_AI_MODEL);

    if (!content) return [];

    const parsed = extractJSONFromResponse(content);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item: any) =>
      typeof item.index === "number" &&
      item.index >= 0 &&
      item.index < batch.length &&
      typeof item.flag_type === "string"
    ).map((item: any) => ({
      index: item.index,
      flag_type: item.flag_type,
      flag_reason: item.flag_reason || "Flagged for review",
      confidence_score: Math.min(0.95, Math.max(0.1, Number(item.confidence_score) || 0.5)),
      suggested_adjustment_type: item.suggested_adjustment_type || "Review Required",
    }));
  }

  // ============================================================================
  // DETERMINISTIC FALLBACKS (used when AI is unavailable)
  // ============================================================================
  function findBankPatternDeterministic(txn: CanonTxn): { type: string; keywords: string[]; reason: string } | null {
    const patterns = [
      { type: 'personal_expense_atm', keywords: ['atm', 'cash withdrawal', 'cash back'], threshold: 200, reason: 'ATM/cash withdrawal may indicate personal use' },
      { type: 'personal_expense_p2p', keywords: ['venmo', 'zelle', 'paypal', 'cash app'], threshold: 100, reason: 'P2P transfer may be personal' },
      { type: 'personal_expense_retail', keywords: ['amazon', 'target', 'walmart', 'costco', 'home depot'], threshold: 100, reason: 'Retail purchase may include personal items' },
      { type: 'personal_expense_dining', keywords: ['restaurant', 'starbucks', 'mcdonalds', 'uber eats', 'doordash'], threshold: 50, reason: 'Dining expense may be personal' },
      { type: 'personal_expense_travel', keywords: ['airline', 'hotel', 'airbnb', 'delta', 'united', 'marriott'], threshold: 200, reason: 'Travel may include personal component' }
    ];
    const combined = ((txn.description || '') + ' ' + (txn.payee || '')).toLowerCase();
    for (const pattern of patterns) {
      if (txn.amountAbs < pattern.threshold) continue;
      const matched = pattern.keywords.filter(kw => combined.includes(kw));
      if (matched.length > 0) return { type: pattern.type, keywords: matched, reason: pattern.reason };
    }
    return null;
  }

  function analyzeGLTransactionDeterministic(tx: CanonTxn, projectId: string, userId: string): FlaggedTransaction[] {
    const flags: FlaggedTransaction[] = [];
    const descLower = (tx.description || '').toLowerCase();
    const accountLower = (tx.accountName || '').toLowerCase();
    const payeeLower = (tx.payee || '').toLowerCase();
    const amount = tx.amountAbs;

    const glPatterns: Array<{ type: string; keywords: string[]; threshold: number; reason: string; requiresYearEnd?: boolean }> = [
      { type: 'owner_compensation', keywords: ['owner', 'shareholder', 'member distribution', 'guaranteed payment', 'officer salary', 'bonus'], threshold: 10000, reason: 'Owner compensation may need normalization' },
      { type: 'related_party', keywords: ['related party', 'affiliated', 'intercompany', 'management fee'], threshold: 5000, reason: 'Related party transaction review' },
      { type: 'non_recurring', keywords: ['one-time', 'non-recurring', 'settlement', 'lawsuit', 'restructuring', 'severance'], threshold: 5000, reason: 'Non-recurring expense adjustment' },
      { type: 'discretionary', keywords: ['travel', 'entertainment', 'meal', 'golf', 'country club', 'personal', 'vacation'], threshold: 2500, reason: 'Discretionary expense may include personal use' },
      { type: 'depreciation', keywords: ['depreciation', 'amortization'], threshold: 10000, reason: 'Depreciation EBITDA add-back' },
      { type: 'interest', keywords: ['interest expense', 'interest income', 'finance charge'], threshold: 5000, reason: 'Interest debt-free adjustment' },
    ];

    for (const pattern of glPatterns) {
      if (pattern.requiresYearEnd && !tx.isYearEnd) continue;
      const matchedKeywords = pattern.keywords.filter(kw => descLower.includes(kw) || accountLower.includes(kw) || payeeLower.includes(kw));
      if (matchedKeywords.length > 0 && amount >= pattern.threshold) {
        let confidence = 0.5 + Math.min(0.3, matchedKeywords.length * 0.1);
        if (amount > pattern.threshold * 5) confidence += 0.1;
        confidence = Math.min(0.95, confidence);

        flags.push({
          project_id: projectId, user_id: userId,
          transaction_date: tx.date,
          description: tx.description,
          amount: tx.amountSigned ?? tx.amountAbs,
          account_name: tx.accountName || '',
          flag_type: pattern.type,
          flag_reason: pattern.reason,
          confidence_score: confidence,
          suggested_adjustment_type: mapToAdjustmentType(pattern.type),
          suggested_adjustment_amount: tx.amountSigned ?? tx.amountAbs,
          flag_category: 'adjustment_candidate',
          ai_analysis: { matched_keywords: matchedKeywords, source_type: tx.sourceType, is_reclassification: false, has_bank_proof: false, analysis_mode: 'deterministic_fallback' },
          source_data: { original_transaction: tx }
        });
        return flags;
      }
    }
    return flags;
  }

  // ============================================================================
  // MAIN ANALYSIS ORCHESTRATOR (async, AI-first with deterministic fallback)
  // ============================================================================
  async function analyzeWithGLFirst(
    index: CorrelationIndex,
    projectId: string,
    userId: string,
    analysisType: string,
    industry: string = ""
  ): Promise<FlaggedTransaction[]> {
    const flagged: FlaggedTransaction[] = [];
    const hasAIKey = !!Deno.env.get("OPENAI_API_KEY");

    // ── STEP 1: GL ANALYSIS ──
    if (hasAIKey && index.glEntries.length > 0) {
       console.log(`AI mode: analyzing ${index.glEntries.length} GL entries in batches of ${GL_BATCH_SIZE}`);
       
       // Batch GL entries
       for (let i = 0; i < index.glEntries.length; i += GL_BATCH_SIZE) {
        const batch = index.glEntries.slice(i, i + GL_BATCH_SIZE);
        try {
          const aiResults = await analyzeGLBatchWithAI(batch, industry);
          
          for (const result of aiResults) {
            const tx = batch[result.index];
            if (!tx) continue;

            flagged.push({
              project_id: projectId,
              user_id: userId,
              transaction_date: tx.date,
              description: tx.description,
              amount: tx.amountSigned ?? tx.amountAbs,
              account_name: tx.accountName || '',
              flag_type: result.flag_type,
              flag_reason: result.flag_reason,
              confidence_score: result.confidence_score,
              suggested_adjustment_type: result.suggested_adjustment_type,
              suggested_adjustment_amount: tx.amountSigned ?? tx.amountAbs,
              flag_category: 'adjustment_candidate',
              ai_analysis: {
                source_type: tx.sourceType,
                is_reclassification: result.is_reclassification,
                suggested_from_line_item: result.suggested_from_line_item,
                suggested_to_line_item: result.suggested_to_line_item,
                has_bank_proof: false,
                analysis_mode: 'ai',
              },
              classification_context: {
                industry: industry || 'general',
                source: 'GL Transaction Analysis',
                rules_applied: [result.flag_type, result.is_reclassification ? 'reclassification' : 'adjustment']
              },
              source_data: { original_transaction: tx },
            });
          }
        } catch (err) {
          console.warn(`AI batch failed for GL entries ${i}-${i + batch.length}, using deterministic fallback:`, err);
          for (const tx of batch) {
            flagged.push(...analyzeGLTransactionDeterministic(tx, projectId, userId));
          }
        }
      }
    } else {
      // Deterministic fallback
      console.log(`Deterministic mode: analyzing ${index.glEntries.length} GL entries`);
      for (const glTxn of index.glEntries) {
        flagged.push(...analyzeGLTransactionDeterministic(glTxn, projectId, userId));
      }
    }
    console.log(`GL analysis found: ${flagged.length} flags`);

    // ── STEP 2: BANK/CC ANALYSIS WITH GL CORRELATION ──
    const bankCCEntries = [...index.bankEntries, ...index.ccEntries];
    let correlatedCount = 0, unrecordedCount = 0;

    if (hasAIKey && bankCCEntries.length > 0) {
      // AI-powered bank analysis
      const bankAIFlags = new Map<number, BankAIResult>();
      
       for (let i = 0; i < bankCCEntries.length; i += BANK_BATCH_SIZE) {
         const batch = bankCCEntries.slice(i, i + BANK_BATCH_SIZE);
        try {
          const aiResults = await analyzeBankBatchWithAI(batch, industry);
          for (const r of aiResults) {
            bankAIFlags.set(i + r.index, r);
          }
        } catch (err) {
          console.warn(`AI bank batch failed for entries ${i}-${i + batch.length}:`, err);
        }
      }

      for (let idx = 0; idx < bankCCEntries.length; idx++) {
        const bankTxn = bankCCEntries[idx];
        const aiFlag = bankAIFlags.get(idx);
        
        // Use AI flag if available, otherwise try deterministic
        const matchedPattern = aiFlag
          ? { type: aiFlag.flag_type, reason: aiFlag.flag_reason, keywords: [] as string[] }
          : findBankPatternDeterministic(bankTxn);
        
        if (!matchedPattern) continue;

        const candidates = findGLCandidates(bankTxn, index);
        const confidence = determineConfidence(candidates);

        if (candidates.length > 0 && confidence !== 'low') {
          const topGL = candidates[0].glTxn;
          const bankProof: BankProof = {
            source_type: bankTxn.sourceType,
            date: bankTxn.date,
            description: bankTxn.description,
            amount: bankTxn.amountAbs,
            match_confidence: confidence,
            match_reasons: candidates[0].matchReasons,
            gl_candidates: candidates.map(c => ({
              sourceTxnId: c.glTxn.sourceTxnId || '',
              score: c.score,
              accountName: c.glTxn.accountName || ''
            }))
          };

          flagged.push({
            project_id: projectId,
            user_id: userId,
            transaction_date: topGL.date,
            description: topGL.description,
            amount: topGL.amountSigned ?? topGL.amountAbs,
            account_name: topGL.accountName || '',
            flag_type: matchedPattern.type,
            flag_reason: `${matchedPattern.reason} (verified by ${bankTxn.sourceType === 'bank_transactions' ? 'bank' : 'credit card'} statement)`,
            confidence_score: aiFlag ? aiFlag.confidence_score : (confidence === 'high' ? 0.85 : 0.70),
            suggested_adjustment_type: aiFlag?.suggested_adjustment_type || mapToAdjustmentType(matchedPattern.type),
            suggested_adjustment_amount: topGL.amountSigned ?? topGL.amountAbs,
            flag_category: 'adjustment_candidate',
            ai_analysis: {
              matched_keywords: matchedPattern.keywords,
              source_type: topGL.sourceType,
              has_bank_proof: true,
              bank_proofs: [bankProof],
              correlation_confidence: confidence,
              is_reclassification: false,
              analysis_mode: aiFlag ? 'ai' : 'deterministic_fallback',
            },
            source_data: { original_gl_transaction: topGL, bank_evidence: bankTxn }
          });
          correlatedCount++;
        } else if (bankTxn.amountAbs >= 500) {
          flagged.push({
            project_id: projectId,
            user_id: userId,
            transaction_date: bankTxn.date,
            description: bankTxn.description,
            amount: bankTxn.amountSigned ?? bankTxn.amountAbs,
            account_name: bankTxn.accountName || 'Unknown',
            flag_type: 'unrecorded_bank_item',
            flag_reason: `${matchedPattern.reason} - No matching GL entry found.`,
            confidence_score: 0.50,
            suggested_adjustment_type: 'Bookkeeping Review',
            suggested_adjustment_amount: 0,
            flag_category: 'bookkeeping_gap',
            ai_analysis: {
              matched_keywords: matchedPattern.keywords,
              source_type: bankTxn.sourceType,
              has_bank_proof: false,
              is_unrecorded: true,
              missing_from: 'general_ledger',
              is_reclassification: false,
              analysis_mode: aiFlag ? 'ai' : 'deterministic_fallback',
            },
            classification_context: {
              industry: industry || 'general',
              source: 'Bank Transaction Analysis',
              rules_applied: aiFlag ? [aiFlag.flag_type] : []
            },
            source_data: { original_transaction: bankTxn }
          });
          unrecordedCount++;
        }
      }
    } else {
      // Full deterministic fallback for bank/CC
      for (const bankTxn of bankCCEntries) {
        const matchedPattern = findBankPatternDeterministic(bankTxn);
        if (!matchedPattern) continue;

        const candidates = findGLCandidates(bankTxn, index);
        const confidence = determineConfidence(candidates);

        if (candidates.length > 0 && confidence !== 'low') {
          const topGL = candidates[0].glTxn;
          const bankProof: BankProof = {
            source_type: bankTxn.sourceType, date: bankTxn.date,
            description: bankTxn.description, amount: bankTxn.amountAbs,
            match_confidence: confidence, match_reasons: candidates[0].matchReasons,
            gl_candidates: candidates.map(c => ({ sourceTxnId: c.glTxn.sourceTxnId || '', score: c.score, accountName: c.glTxn.accountName || '' }))
          };
          flagged.push({
            project_id: projectId, user_id: userId,
            transaction_date: topGL.date, description: topGL.description,
            amount: topGL.amountSigned ?? topGL.amountAbs,
            account_name: topGL.accountName || '',
            flag_type: matchedPattern.type,
            flag_reason: `${matchedPattern.reason} (verified by ${bankTxn.sourceType === 'bank_transactions' ? 'bank' : 'credit card'} statement)`,
            confidence_score: confidence === 'high' ? 0.85 : 0.70,
            suggested_adjustment_type: mapToAdjustmentType(matchedPattern.type),
            suggested_adjustment_amount: topGL.amountSigned ?? topGL.amountAbs,
            flag_category: 'adjustment_candidate',
            ai_analysis: { matched_keywords: matchedPattern.keywords, source_type: topGL.sourceType, has_bank_proof: true, bank_proofs: [bankProof], correlation_confidence: confidence, is_reclassification: false, analysis_mode: 'deterministic_fallback' },
            source_data: { original_gl_transaction: topGL, bank_evidence: bankTxn }
          });
          correlatedCount++;
        } else if (bankTxn.amountAbs >= 500) {
          flagged.push({
            project_id: projectId, user_id: userId,
            transaction_date: bankTxn.date, description: bankTxn.description,
            amount: bankTxn.amountSigned ?? bankTxn.amountAbs,
            account_name: bankTxn.accountName || 'Unknown',
            flag_type: 'unrecorded_bank_item',
            flag_reason: `${matchedPattern.reason} - No matching GL entry found.`,
            confidence_score: 0.50,
            suggested_adjustment_type: 'Bookkeeping Review',
            suggested_adjustment_amount: 0,
            flag_category: 'bookkeeping_gap',
            ai_analysis: { matched_keywords: matchedPattern.keywords, source_type: bankTxn.sourceType, has_bank_proof: false, is_unrecorded: true, missing_from: 'general_ledger', is_reclassification: false, analysis_mode: 'deterministic_fallback' },
            classification_context: {
              industry: industry || 'general',
              source: 'Bank Transaction Analysis (Deterministic)',
              rules_applied: [matchedPattern.type]
            },
            source_data: { original_transaction: bankTxn }
          });
          unrecordedCount++;
        }
      }
    }
    console.log(`Bank/CC correlated: ${correlatedCount}, unrecorded: ${unrecordedCount}`);

    // Sort: adjustment_candidates first, then by confidence
    flagged.sort((a, b) => {
      if (a.flag_category !== b.flag_category) {
        return a.flag_category === 'adjustment_candidate' ? -1 : 1;
      }
      return b.confidence_score - a.confidence_score;
    });

    return flagged;
  }

  function mapToAdjustmentType(flagType: string): string {
    const mapping: Record<string, string> = {
      'owner_compensation': 'EBITDA Add-back',
      'related_party': 'Related Party Normalization',
      'non_recurring': 'Non-recurring Adjustment',
      'discretionary': 'Discretionary Expense',
      'rent_adjustment': 'Rent Normalization',
      'professional_fees': 'Professional Fees Review',
      'insurance': 'Insurance Normalization',
      'depreciation': 'EBITDA Add-back',
      'interest': 'Debt-free Adjustment',
      'journal_entry_review': 'Journal Entry Review',
      'memo_keyword_scan': 'Personal Expense Review',
      'personal_expense': 'Personal Expense',
      'personal_expense_atm': 'Personal Expense',
      'personal_expense_p2p': 'Personal Expense',
      'personal_expense_retail': 'Personal Expense',
      'personal_expense_dining': 'Personal Expense',
      'personal_expense_travel': 'Personal Expense',
      'owner_draw': 'Owner Draw Review',
      'unusual_payment': 'Unusual Payment Review',
      'unrecorded_bank_item': 'Bookkeeping Review'
    };
    return mapping[flagType] || 'Review Required';
  }