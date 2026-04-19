import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

import type {
  RawTransaction, ClassifiedTransaction, PeriodClassification,
  ClassificationMeta, RelatedPartyEntry, CandidateType, EvidenceAtom,
} from "./types.ts";
import { MAX_EXECUTION_MS, RULES_VERSION, LLM_BATCH_SIZE, MAX_LLM_BATCHES_PER_INVOCATION } from "./constants.ts";
import { contentHash, deriveAccountKey } from "./normalize.ts";
import { buildRelatedPartyRegistryFromTransactions } from "./registry.ts";
import { runRuleEngine } from "./ruleEngine.ts";
import { clusterAmbiguousTransactions } from "./clustering.ts";
import { classifyClusterLLM, classifyClusterBatchLLM } from "./llmClassifier.ts";
import { buildCreditCardRegistry, suppressCreditCardFalsePositives } from "./creditCardCorroboration.ts";
import { buildGLVendorRegistry, suppressGLVendorFalsePositives } from "./glCorroboration.ts";
import { buildVendorFamilyCases } from "./caseBuilder.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Access Verification ────────────────────────────────────────────

async function verifyProjectAccess(
  adminClient: any,
  projectId: string,
  userId: string,
  userEmail: string | undefined,
): Promise<{ project: any } | { error: string; status: number }> {
  const { data: project, error: projectError } = await adminClient
    .from("projects")
    .select("id, user_id, target_company, client_name, name")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { error: "Project not found or access denied", status: 403 };
  }

  if (project.user_id !== userId) {
    let hasAccess = false;
    const { data: shareByUserId } = await adminClient
      .from("project_shares")
      .select("id")
      .eq("project_id", projectId)
      .eq("shared_with_user_id", userId)
      .maybeSingle();
    hasAccess = !!shareByUserId;

    if (!hasAccess && userEmail) {
      const { data: shareByEmail } = await adminClient
        .from("project_shares")
        .select("id")
        .eq("project_id", projectId)
        .eq("shared_with_email", userEmail)
        .maybeSingle();
      hasAccess = !!shareByEmail;
    }

    if (!hasAccess) {
      const { data: adminRole } = await adminClient
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!adminRole) {
        return { error: "Project not found or access denied", status: 403 };
      }
    }
  }

  return { project };
}

// ─── Self-Chain ─────────────────────────────────────────────────────

async function selfChain(
  projectId: string,
  userId: string,
  cursor: number,
  runId: string,
  llmCursor?: number,
  llmClusters?: string,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const url = `${supabaseUrl}/functions/v1/classify-transfers`;
  console.log(`[CLASSIFY] Self-chaining: cursor=${cursor} llm_cursor=${llmCursor ?? "none"} run_id=${runId}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
        "x-service-chain": "true",
      },
      body: JSON.stringify({
        project_id: projectId,
        cursor,
        user_id: userId,
        run_id: runId,
        llm_cursor: llmCursor,
        llm_clusters: llmClusters,
        _chained: true,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      console.log("[CLASSIFY] Self-chain dispatched (timed out waiting for response — expected)");
    } else {
      console.error("[CLASSIFY] Self-chain fetch failed:", err);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Meta Helper ────────────────────────────────────────────────────

async function updateMeta(
  adminClient: any,
  projectId: string,
  userId: string,
  meta: ClassificationMeta,
) {
  const { data: existing } = await adminClient
    .from("processed_data")
    .select("id, data")
    .eq("project_id", projectId)
    .eq("data_type", "transfer_classification")
    .maybeSingle();

  if (existing) {
    const existingData = (existing.data as any) || {};
    existingData._meta = meta;
    await adminClient
      .from("processed_data")
      .update({ data: existingData, validation_status: meta.status === "completed" ? "completed" : "partial" })
      .eq("id", existing.id);
  }
}

// ─── Main Handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { project_id, cursor: inputCursor, action, _chained, user_id: chainedUserId, run_id: chainedRunId, llm_cursor: inputLlmCursor, llm_clusters: inputLlmClusters } = body;

    // ── POLL MODE ──────────────────────────────────────────────
    if (action === "poll") {
      if (!project_id) {
        return new Response(
          JSON.stringify({ error: "project_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const { data: record, error: pollError } = await adminClient
        .from("processed_data")
        .select("data, validation_status")
        .eq("project_id", project_id)
        .eq("data_type", "transfer_classification")
        .maybeSingle();

      if (pollError) {
        console.error("[CLASSIFY] Poll error:", pollError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch status" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (!record) {
        return new Response(
          JSON.stringify({ status: "not_started", processed: 0, total: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const meta = (record.data as any)?._meta as ClassificationMeta | undefined;
      const summary: Record<string, { interbank: number; owner: number }> = {};
      if (record.data && typeof record.data === "object") {
        for (const [period, pData] of Object.entries(record.data as Record<string, any>)) {
          if (period === "_meta") continue;
          summary[period] = { interbank: pData.interbank || 0, owner: pData.owner || 0 };
        }
      }

      return new Response(
        JSON.stringify({
          status: meta?.status || record.validation_status || "unknown",
          processed: meta?.processedTxnCount || 0,
          total: meta?.totalTxnCount || 0,
          cursor: meta?.cursor || 0,
          totalRecords: meta?.totalRecords || 0,
          error: meta?.error,
          classifications: summary,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── CLASSIFY MODE ──────────────────────────────────────────
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let userId: string;

    if (_chained && chainedUserId) {
      userId = chainedUserId;
      console.log(`[CLASSIFY] Chained invocation for user=${userId}`);
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing authorization" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await userClient.auth.getUser();

      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;

      const accessResult = await verifyProjectAccess(adminClient, project_id, userId, user.email);
      if ("error" in accessResult) {
        return new Response(
          JSON.stringify({ error: accessResult.error }),
          { status: accessResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const cursor = typeof inputCursor === "number" ? inputCursor : 0;
    console.log(`[CLASSIFY] Start project=${project_id} user=${userId} cursor=${cursor} chained=${!!_chained}`);

    // Get project info
    const { data: project } = await adminClient
      .from("projects")
      .select("target_company, client_name, name")
      .eq("id", project_id)
      .maybeSingle();

    const companyName = project?.target_company || project?.client_name || project?.name || "the company";

    // ── Determine run_id ──────────────────────────────────────
    let runId: string;
    if (cursor === 0) {
      runId = crypto.randomUUID();
      console.log(`[CLASSIFY] New run started: run_id=${runId}`);
    } else if (chainedRunId) {
      runId = chainedRunId;
    } else {
      const { data: existingForRunId } = await adminClient
        .from("processed_data")
        .select("data")
        .eq("project_id", project_id)
        .eq("data_type", "transfer_classification")
        .maybeSingle();
      runId = (existingForRunId?.data as any)?._meta?.run_id || crypto.randomUUID();
    }

    // Fetch ALL bank_transactions records
    const { data: bankRecords, error: bankError } = await adminClient
      .from("processed_data")
      .select("id, period_start, data")
      .eq("project_id", project_id)
      .eq("data_type", "bank_transactions")
      .order("period_start", { ascending: true })
      .order("id", { ascending: true });

    if (bankError) {
      console.error("[CLASSIFY] Error fetching bank records:", bankError);
      throw bankError;
    }

    if (!bankRecords || bankRecords.length === 0) {
      console.log("[CLASSIFY] No bank transactions found");
      return new Response(
        JSON.stringify({ success: true, started: true, done: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const totalRecords = bankRecords.length;
    let totalTxnCount = 0;
    for (const rec of bankRecords) {
      const d = rec.data as Record<string, unknown>;
      const txns = (d.transactions as Array<unknown>) || [];
      totalTxnCount += txns.length;
    }

    console.log(`[CLASSIFY] ${totalRecords} bank records, ${totalTxnCount} total txns, cursor=${cursor}`);

    if (cursor >= totalRecords) {
      await updateMeta(adminClient, project_id, userId, {
        cursor: totalRecords, totalRecords, totalTxnCount,
        processedTxnCount: totalTxnCount, status: "completed",
        startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        version: 2, rules_version: RULES_VERSION,
      });
      return new Response(
        JSON.stringify({ success: true, started: true, done: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY")!;

    // ── Global prepass on cursor=0: build registry from ALL transactions ──
    if (cursor === 0) {
      const allTxnsForRegistry: RawTransaction[] = [];
      for (const rec of bankRecords) {
        const d = rec.data as Record<string, unknown>;
        const txns = (d.transactions as Array<Record<string, unknown>>) || [];
        for (const t of txns) {
          allTxnsForRegistry.push({
            id: "", amount: 0, amountSigned: 0, direction: "credit",
            memo: ((t.description as string) || (t.memo as string) || "").substring(0, 200),
            name: (t.name as string) || "",
            date: (t.date as string) || "",
            periodKey: "", recordId: "",
          });
        }
      }
      const globalRegistry = buildRelatedPartyRegistryFromTransactions(
        allTxnsForRegistry,
        project?.target_company,
        project?.client_name,
        project?.name,
      );
      console.log(`[CLASSIFY] Global prepass: ${allTxnsForRegistry.length} txns scanned, ${globalRegistry.length} related parties: ${globalRegistry.map(rp => rp.full_name).join(", ")}`);

      const initialMeta: ClassificationMeta = {
        cursor: 0, totalRecords, totalTxnCount,
        processedTxnCount: 0, status: "running",
        startedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        version: 2, rules_version: RULES_VERSION,
        run_id: runId,
        global_registry: globalRegistry,
      };

      const { data: existingRecord } = await adminClient
        .from("processed_data")
        .select("id")
        .eq("project_id", project_id)
        .eq("data_type", "transfer_classification")
        .maybeSingle();

      if (existingRecord) {
        await adminClient
          .from("processed_data")
          .update({
            data: { _meta: initialMeta },
            validation_status: "partial",
            user_id: userId,
            source_type: "ai_classification",
          })
          .eq("id", existingRecord.id);
      } else {
        await adminClient
          .from("processed_data")
          .insert({
            project_id,
            user_id: userId,
            source_type: "ai_classification",
            data_type: "transfer_classification",
            data: { _meta: initialMeta },
            validation_status: "partial",
          });
      }
    }

    // ── Read global registry from _meta ──────────────────────
    const { data: metaRecord } = await adminClient
      .from("processed_data")
      .select("id, data")
      .eq("project_id", project_id)
      .eq("data_type", "transfer_classification")
      .maybeSingle();

    // ── Stale chain check ────────────────────────────────────
    const existingRunId = (metaRecord?.data as any)?._meta?.run_id;
    if (existingRunId && existingRunId !== runId) {
      console.warn(`[CLASSIFY] Stale chain detected: record run_id=${existingRunId}, our run_id=${runId}. Aborting.`);
      return new Response(
        JSON.stringify({ success: false, error: "Stale chain — newer run superseded this one" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const relatedParties: RelatedPartyEntry[] = (metaRecord?.data as any)?._meta?.global_registry || [];
    console.log(`[CLASSIFY] Using ${relatedParties.length} related parties from global registry`);

    // ── Normalize all transactions for this chunk ──────────────
    const allTxnsThisChunk: RawTransaction[] = [];
    let recordsProcessed = 0;
    const seenHashes = new Map<string, number>();

    for (let ri = cursor; ri < totalRecords; ri++) {
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_EXECUTION_MS) {
        console.warn(`[CLASSIFY] Budget exhausted at ${elapsed}ms after ${recordsProcessed} records`);
        break;
      }

      const record = bankRecords[ri];
      const data = record.data as Record<string, unknown>;
      const transactions = (data.transactions as Array<Record<string, unknown>>) || [];
      const periodKey = (record.period_start as string)?.substring(0, 7) || "unknown";
      const accountKey = deriveAccountKey(record as { id: string; data: Record<string, unknown> });

      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        const memo =
          (t.description as string) ||
          (t.memo as string) ||
          ((t.descriptionLines as string[]) || []).join(" ") ||
          (t.name as string) ||
          "";
        const rawAmount = Number(t.amount) || 0;

        let txnId = contentHash(rawAmount, (t.date as string) || "", memo, accountKey);
        const collisionCount = seenHashes.get(txnId) || 0;
        if (collisionCount > 0) {
          // Same content hash within the same chunk = duplicate transaction; skip it
          seenHashes.set(txnId, collisionCount + 1);
          continue;
        }
        seenHashes.set(txnId, 1);

        allTxnsThisChunk.push({
          id: txnId,
          amount: Math.abs(rawAmount),
          amountSigned: rawAmount,
          direction: rawAmount < 0 ? "debit" : "credit",
          memo: memo.substring(0, 200),
          name: (t.name as string) || "",
          date: (t.date as string) || "",
          periodKey,
          recordId: accountKey,
        });
      }

      recordsProcessed++;
    }

    console.log(`[CLASSIFY] Normalized ${allTxnsThisChunk.length} txns from ${recordsProcessed} records`);

    // ── Run Rule Engine ──────────────────────────────────────
    const { classified: ruleClassified, ambiguous } = runRuleEngine(allTxnsThisChunk, relatedParties);

    // ── Credit Card Corroboration ────────────────────────────
    // Suppress false-positive owner classifications for payments to known business credit cards
    const ccRegistry = await buildCreditCardRegistry(adminClient, project_id);
    const ruleClassifiedArray = [...ruleClassified.values()];
    const ccSuppressed = suppressCreditCardFalsePositives(ruleClassifiedArray, ccRegistry);
    if (ccSuppressed > 0) {
      console.log(`[CLASSIFY] Credit card corroboration: suppressed ${ccSuppressed} false owner classifications`);
      // Rebuild the map after mutations
      ruleClassified.clear();
      for (const ct of ruleClassifiedArray) {
        ruleClassified.set(ct.id, ct);
      }
    }

    // ── GL Vendor Corroboration ──────────────────────────────
    // Suppress false-positive owner classifications for payments to known GL business vendors
    const glVendorRegistry = await buildGLVendorRegistry(adminClient, project_id);
    const glSuppressed = suppressGLVendorFalsePositives(ruleClassifiedArray, glVendorRegistry);
    if (glSuppressed > 0) {
      console.log(`[CLASSIFY] GL corroboration: suppressed ${glSuppressed} false owner classifications`);
      // Rebuild the map after mutations
      ruleClassified.clear();
      for (const ct of ruleClassifiedArray) {
        ruleClassified.set(ct.id, ct);
      }
    }

    const ruleStats = {
      total: allTxnsThisChunk.length,
      ruleClassified: ruleClassified.size,
      ambiguous: ambiguous.length,
      interbank: [...ruleClassified.values()].filter(c => c.category === "interbank").length,
      owner: [...ruleClassified.values()].filter(c => c.category === "owner").length,
      operating: [...ruleClassified.values()].filter(c => c.category === "operating").length,
      ccSuppressed,
      glSuppressed,
    };
    console.log(`[CLASSIFY] Rule engine: ${JSON.stringify(ruleStats)}`);

    // ── LLM for ambiguous items (batch mode) ───────────────────
    let caseCounter = ruleClassified.size;
    const llmClassified = new Map<string, ClassifiedTransaction>();
    let needsLlmChain = false;
    let nextLlmCursor: number | undefined;
    let serializedClusters: string | undefined;

    if (ambiguous.length > 0) {
      // If we have a resumed llm_cursor, deserialize the cluster list
      let clusters: ReturnType<typeof clusterAmbiguousTransactions>;
      let llmCursor = 0;

      if (typeof inputLlmCursor === "number" && inputLlmClusters) {
        // Resuming LLM classification from a previous chain
        try {
          clusters = JSON.parse(inputLlmClusters);
          llmCursor = inputLlmCursor;
          console.log(`[CLASSIFY] Resuming LLM from cursor=${llmCursor}, ${clusters.length} total clusters`);
        } catch {
          clusters = clusterAmbiguousTransactions(ambiguous);
          llmCursor = 0;
        }
      } else {
        clusters = clusterAmbiguousTransactions(ambiguous);
        llmCursor = 0;
      }

      console.log(`[CLASSIFY] Clustered ${ambiguous.length} ambiguous txns into ${clusters.length} groups, llm_cursor=${llmCursor}`);

      const relatedPartyNames = relatedParties.map(rp => rp.full_name);
      let batchesProcessed = 0;

      while (llmCursor < clusters.length && batchesProcessed < MAX_LLM_BATCHES_PER_INVOCATION) {
        const batchEnd = Math.min(llmCursor + LLM_BATCH_SIZE, clusters.length);
        const batch = clusters.slice(llmCursor, batchEnd);

        try {
          const batchResults = await classifyClusterBatchLLM(batch, companyName, relatedPartyNames, anthropicApiKey);

          for (const cluster of batch) {
            const clusterResult = batchResults.get(cluster.cluster_id);
            if (!clusterResult) continue;

            for (const txn of cluster.transactions) {
              const candidateType: CandidateType =
                clusterResult.category === "interbank" ? "external_bank_like_transfer" :
                clusterResult.category === "owner" ? "owner_related" : "operating";

              const evidence: EvidenceAtom[] = [
                {
                  type: "llm_classification",
                  model: "claude-sonnet-4",
                  llm_confidence: clusterResult.confidence,
                  weight: clusterResult.confidence * 0.8,
                },
              ];

              for (const ev of clusterResult.supporting_evidence) {
                evidence.push({ type: "llm_reasoning", value: ev, weight: 0.10 });
              }
              for (const ev of clusterResult.contradictory_evidence) {
                evidence.push({ type: "llm_contradiction", value: ev, weight: -0.05 });
              }

              llmClassified.set(txn.id, {
                id: txn.id,
                category: clusterResult.category,
                candidate_type: candidateType,
                confidence: clusterResult.confidence,
                method: "llm_cluster",
                evidence,
                cluster_id: cluster.cluster_id,
                case_id: `case_cluster_${cluster.cluster_id}`,
                amount: txn.amount,
                memo: txn.memo,
                date: txn.date,
                account_record_id: txn.recordId,
                period_key: txn.periodKey,
              });
            }
          }

          console.log(`[CLASSIFY] Batch ${batchesProcessed + 1}: classified clusters ${llmCursor}-${batchEnd - 1} (${batch.length} clusters)`);
        } catch (err) {
          console.error(`[CLASSIFY] Batch LLM failed at cursor=${llmCursor}:`, err);
          // Default failed batch to operating
          for (const cluster of batch) {
            for (const txn of cluster.transactions) {
              llmClassified.set(txn.id, {
                id: txn.id,
                category: "operating",
                candidate_type: "operating",
                confidence: 0.40,
                method: "llm_cluster",
                evidence: [{ type: "llm_error", weight: 0, error: (err as Error).message }],
                cluster_id: cluster.cluster_id,
                case_id: `case_error_${cluster.cluster_id}`,
                amount: txn.amount,
                memo: txn.memo,
                date: txn.date,
                account_record_id: txn.recordId,
                period_key: txn.periodKey,
              });
            }
          }
          // If rate limited, break and chain
          if ((err as Error).message?.includes("Rate limit")) {
            llmCursor = batchEnd;
            needsLlmChain = true;
            break;
          }
        }

        llmCursor = batchEnd;
        batchesProcessed++;
      }

      // If there are remaining clusters, we need to chain for LLM continuation
      if (llmCursor < clusters.length) {
        needsLlmChain = true;
        nextLlmCursor = llmCursor;
        // Serialize clusters without the transactions array (too large) — 
        // we'll re-cluster from ambiguous on the next chain
        // Actually, we need to pass the full clusters to maintain ordering.
        // Strip transactions to save payload size — they'll be re-attached from ambiguous.
        const lightClusters = clusters.map(c => ({
          cluster_id: c.cluster_id,
          normalized_description: c.normalized_description,
          transaction_ids: c.transaction_ids,
          transactions: c.transactions.map(t => ({
            id: t.id, amount: t.amount, amountSigned: t.amountSigned,
            direction: t.direction, memo: t.memo, name: t.name,
            date: t.date, periodKey: t.periodKey, recordId: t.recordId,
          })),
          total_dollars: c.total_dollars,
        }));
        serializedClusters = JSON.stringify(lightClusters);
        console.log(`[CLASSIFY] LLM needs chaining: ${clusters.length - llmCursor} clusters remaining, serialized=${(serializedClusters.length / 1024).toFixed(1)}KB`);
      }
    }

    // ── Build vendor-family cases for owner transactions ────
    const allClassified = new Map([...ruleClassified, ...llmClassified]);
    const allClassifiedArray = [...allClassified.values()];
    buildVendorFamilyCases(allClassifiedArray);

    // ── Merge into period structure ──────────────────────────
    const chunkResults: Record<string, PeriodClassification> = {};

    for (const ct of allClassifiedArray) {
      const pk = ct.period_key || "unknown";

      if (!chunkResults[pk]) {
        chunkResults[pk] = { interbank: 0, owner: 0, transactions: [] };
      }
      const p = chunkResults[pk];
      if (ct.category === "interbank") p.interbank += ct.amount;
      else if (ct.category === "owner") p.owner += ct.amount;
      p.transactions.push(ct);
    }

    const nextCursor = cursor + recordsProcessed;
    const recordsDone = nextCursor >= totalRecords;
    const done = recordsDone && !needsLlmChain;
    const processedTxnCount = allClassified.size;

    console.log(`[CLASSIFY] Chunk complete: ${recordsProcessed} records, ${processedTxnCount} txns, cursor ${cursor}->${nextCursor}, recordsDone=${recordsDone}, llmChainNeeded=${needsLlmChain}, done=${done}`);

    // ── Progressive merge-save ──────────────────────────────
    const existing = metaRecord;

    const existingData = (existing?.data as Record<string, PeriodClassification>) || {};
    const merged: Record<string, any> = {};

    for (const [key, val] of Object.entries(existingData)) {
      if (key !== "_meta") merged[key] = val;
    }

    for (const [period, chunkPeriod] of Object.entries(chunkResults)) {
      if (merged[period]) {
        // Deduplicate by txn.id when merging chunks
        const existingIds = new Set(
          (merged[period].transactions || []).map((t: ClassifiedTransaction) => t.id),
        );
        const newTxns = chunkPeriod.transactions.filter(
          (t: ClassifiedTransaction) => !existingIds.has(t.id),
        );
        merged[period] = {
          interbank: merged[period].interbank + newTxns.filter((t: ClassifiedTransaction) => t.category === "interbank").reduce((s: number, t: ClassifiedTransaction) => s + t.amount, 0),
          owner: merged[period].owner + newTxns.filter((t: ClassifiedTransaction) => t.category === "owner").reduce((s: number, t: ClassifiedTransaction) => s + t.amount, 0),
          transactions: [...merged[period].transactions, ...newTxns],
        };
      } else {
        merged[period] = chunkPeriod;
      }
    }

    const processedSoFar = Object.values(merged).reduce(
      (sum: number, p: any) => sum + (p.transactions?.length || 0), 0,
    );

    const meta: ClassificationMeta = {
      cursor: nextCursor,
      totalRecords,
      totalTxnCount,
      processedTxnCount: processedSoFar,
      status: done ? "completed" : "running",
      startedAt: (existingData as any)?._meta?.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 2,
      rules_version: RULES_VERSION,
      model_version: "claude-sonnet-4",
      run_id: runId,
      global_registry: (existingData as any)?._meta?.global_registry,
    };
    merged._meta = meta;

    const recordPayload = {
      project_id,
      user_id: userId,
      source_type: "ai_classification",
      data_type: "transfer_classification",
      data: merged,
      record_count: processedSoFar,
      validation_status: done ? "completed" : "partial",
    };

    if (existing) {
      const { error: updateError } = await adminClient
        .from("processed_data")
        .update(recordPayload)
        .eq("id", existing.id);
      if (updateError) {
        console.error("[CLASSIFY] Update error:", updateError);
        throw updateError;
      }
    } else {
      const { error: insertError } = await adminClient
        .from("processed_data")
        .insert(recordPayload);
      if (insertError) {
        console.error("[CLASSIFY] Insert error:", insertError);
        throw insertError;
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`[CLASSIFY] Done in ${elapsed}ms. cursor=${nextCursor}/${totalRecords}, done=${done}, txns=${processedSoFar}/${totalTxnCount}, rule=${ruleStats.ruleClassified}, llm=${llmClassified.size}`);

    if (!done) {
      if (needsLlmChain && recordsDone) {
        // Records are all processed, but LLM batches remain — chain with same cursor but llm_cursor
        await selfChain(project_id, userId, nextCursor, runId, nextLlmCursor, serializedClusters);
      } else {
        await selfChain(project_id, userId, nextCursor, runId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        started: true,
        done,
        cursor: nextCursor,
        processed: processedSoFar,
        total: totalTxnCount,
        ruleClassified: ruleStats.ruleClassified,
        llmClassified: llmClassified.size,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[CLASSIFY] Error after ${elapsed}ms:`, error);

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const adminClient = createClient(supabaseUrl, serviceKey);
      const body2 = JSON.parse(await req.clone().text().catch(() => "{}"));
      if (body2.project_id) {
        const { data: existingRec } = await adminClient
          .from("processed_data")
          .select("id, data")
          .eq("project_id", body2.project_id)
          .eq("data_type", "transfer_classification")
          .maybeSingle();

        if (existingRec) {
          const existingDataObj = (existingRec.data as any) || {};
          existingDataObj._meta = {
            ...existingDataObj._meta,
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error",
            updatedAt: new Date().toISOString(),
          };
          await adminClient
            .from("processed_data")
            .update({ data: existingDataObj, validation_status: "error" })
            .eq("id", existingRec.id);
        }
      }
    } catch (metaErr) {
      console.error("[CLASSIFY] Failed to save error meta:", metaErr);
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
