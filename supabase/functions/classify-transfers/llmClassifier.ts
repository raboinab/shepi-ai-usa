// ─── Anthropic Claude LLM Classifier ────────────────────────────────

import type { TransactionCluster, ClusterClassification, BatchClusterClassification } from "./types.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

/**
 * Classify a single cluster via Anthropic Claude with structured tool-call output.
 * Returns confidence, supporting/contradictory evidence, and recommended action.
 */
export async function classifyClusterLLM(
  cluster: TransactionCluster,
  companyName: string,
  relatedPartyNames: string[],
  apiKey: string,
): Promise<ClusterClassification> {
  const sampleTxns = cluster.transactions.slice(0, 5).map(t =>
    `  - $${t.amount.toFixed(2)} on ${t.date}: ${t.memo}`
  ).join("\n");

  const clusterSummary = `Cluster: "${cluster.normalized_description}"
Count: ${cluster.transactions.length} transactions
Total dollars: $${Math.abs(cluster.total_dollars).toFixed(2)}
Sample transactions:
${sampleTxns}`;

  const relatedPartyContext = relatedPartyNames.length > 0
    ? `\nKnown related parties / owner names: ${relatedPartyNames.join(", ")}`
    : "";

  const systemPrompt = `You are classifying AMBIGUOUS bank transaction clusters for "${companyName}".
These transactions were NOT resolved by deterministic rules and need your judgment.${relatedPartyContext}

IMPORTANT: Bank memo subfields (INDN, NAME, DES) are bank-specific and LOW-TRUST. Many banks populate ACH fields with the account holder's name for ALL transactions, not just owner draws. The presence of a person's name in a memo does NOT prove owner involvement. When a transaction's vendor is a known business vendor (e.g., shipping companies, utilities, telecom, insurance), default to OPERATING regardless of personal names in the memo.

Classify the cluster as:
- INTERBANK: Internal transfers between the company's own bank accounts
- OWNER: Owner draws, personal expenses, related-party payments — requires evidence BEYOND just a person's name in the memo
- OPERATING: Normal business activity (default when uncertain)

Provide your confidence (0-1), what evidence supports your classification, what contradicts it, and what review action you recommend.
When uncertain, default to OPERATING with lower confidence.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Classify this transaction cluster:\n\n${clusterSummary}`,
        },
      ],
      tools: [
        {
          name: "classify_cluster",
          description: "Classify a cluster of similar bank transactions.",
          input_schema: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: ["interbank", "owner", "operating"],
                description: "The classification category for this cluster.",
              },
              confidence: {
                type: "number",
                description: "Confidence score from 0 to 1. Use 0.5-0.7 for uncertain, 0.7-0.85 for likely, 0.85+ for very confident.",
              },
              supporting_evidence: {
                type: "array",
                items: { type: "string" },
                description: "List of specific reasons supporting this classification.",
              },
              contradictory_evidence: {
                type: "array",
                items: { type: "string" },
                description: "List of factors that contradict or weaken this classification.",
              },
              recommended_action: {
                type: "string",
                enum: ["accept", "review", "analyst_escalation"],
                description: "Whether the cluster can be auto-accepted, needs review, or needs analyst escalation.",
              },
            },
            required: ["category", "confidence", "supporting_evidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "classify_cluster" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[CLASSIFY] Anthropic API error ${response.status}:`, errorText);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded — will retry on next chain");
    }
    if (response.status === 402 || response.status === 400) {
      // Check if it's a billing/credits issue
      if (errorText.includes("credit") || errorText.includes("billing")) {
        throw new Error("Anthropic API credits exhausted — classification paused");
      }
    }
    throw new Error(`Anthropic API returned ${response.status}`);
  }

  const result = await response.json();

  // Anthropic Messages API: tool_use blocks are in content array
  const toolUseBlock = result.content?.find(
    (block: { type: string }) => block.type === "tool_use"
  );

  if (!toolUseBlock?.input) {
    console.warn("[CLASSIFY] No tool_use block in Anthropic response, defaulting to operating");
    return {
      cluster_id: cluster.cluster_id,
      category: "operating",
      confidence: 0.50,
      supporting_evidence: ["LLM did not return structured output"],
      contradictory_evidence: [],
      recommended_action: "review",
    };
  }

  try {
    const args = toolUseBlock.input;
    return {
      cluster_id: cluster.cluster_id,
      category: args.category || "operating",
      confidence: typeof args.confidence === "number" ? Math.max(0, Math.min(1, args.confidence)) : 0.50,
      supporting_evidence: Array.isArray(args.supporting_evidence) ? args.supporting_evidence : [],
      contradictory_evidence: Array.isArray(args.contradictory_evidence) ? args.contradictory_evidence : [],
      recommended_action: args.recommended_action || "review",
    };
  } catch (parseErr) {
    console.warn("[CLASSIFY] Failed to parse Anthropic tool_use input:", parseErr);
    return {
      cluster_id: cluster.cluster_id,
      category: "operating",
      confidence: 0.45,
      supporting_evidence: ["LLM response could not be parsed"],
      contradictory_evidence: [],
      recommended_action: "review",
    };
  }
}

/**
 * Classify up to 50 clusters in a single Anthropic API call.
 * Returns an array of classifications mapped back by cluster index.
 */
export async function classifyClusterBatchLLM(
  clusters: TransactionCluster[],
  companyName: string,
  relatedPartyNames: string[],
  apiKey: string,
): Promise<Map<string, ClusterClassification>> {
  const results = new Map<string, ClusterClassification>();

  // Build the numbered cluster list for the prompt
  const clusterDescriptions = clusters.map((cluster, idx) => {
    const sampleTxns = cluster.transactions.slice(0, 3).map(t =>
      `    - $${t.amount.toFixed(2)} on ${t.date}: ${t.memo}`
    ).join("\n");

    return `[${idx}] "${cluster.normalized_description}"
  Count: ${cluster.transactions.length} txns | Total: $${Math.abs(cluster.total_dollars).toFixed(2)}
  Samples:
${sampleTxns}`;
  }).join("\n\n");

  const relatedPartyContext = relatedPartyNames.length > 0
    ? `\nKnown related parties / owner names: ${relatedPartyNames.join(", ")}`
    : "";

  const systemPrompt = `You are classifying AMBIGUOUS bank transaction clusters for "${companyName}".
These transactions were NOT resolved by deterministic rules and need your judgment.${relatedPartyContext}

IMPORTANT: Bank memo subfields (INDN, NAME, DES) are bank-specific and LOW-TRUST. Many banks populate ACH fields with the account holder's name for ALL transactions, not just owner draws. The presence of a person's name in a memo does NOT prove owner involvement. When a transaction's vendor is a known business vendor (e.g., shipping companies, utilities, telecom, insurance), default to OPERATING regardless of personal names in the memo.

Classify each cluster as:
- INTERBANK: Internal transfers between the company's own bank accounts
- OWNER: Owner draws, personal expenses, related-party payments — requires evidence BEYOND just a person's name in the memo
- OPERATING: Normal business activity (default when uncertain)

You will receive multiple clusters numbered [0] through [${clusters.length - 1}]. Classify ALL of them in one response.
When uncertain, default to OPERATING with lower confidence.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Classify ALL ${clusters.length} transaction clusters below:\n\n${clusterDescriptions}`,
        },
      ],
      tools: [
        {
          name: "classify_clusters_batch",
          description: "Classify multiple clusters of similar bank transactions at once.",
          input_schema: {
            type: "object",
            properties: {
              classifications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cluster_index: {
                      type: "integer",
                      description: "The index [N] of the cluster being classified.",
                    },
                    category: {
                      type: "string",
                      enum: ["interbank", "owner", "operating"],
                    },
                    confidence: {
                      type: "number",
                      description: "Confidence 0-1.",
                    },
                    supporting_evidence: {
                      type: "array",
                      items: { type: "string" },
                    },
                    contradictory_evidence: {
                      type: "array",
                      items: { type: "string" },
                    },
                    recommended_action: {
                      type: "string",
                      enum: ["accept", "review", "analyst_escalation"],
                    },
                  },
                  required: ["cluster_index", "category", "confidence", "supporting_evidence"],
                },
                description: `Array of ${clusters.length} classifications, one per cluster.`,
              },
            },
            required: ["classifications"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "classify_clusters_batch" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[CLASSIFY-BATCH] Anthropic API error ${response.status}:`, errorText);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded — will retry on next chain");
    }
    throw new Error(`Anthropic API returned ${response.status}`);
  }

  const result = await response.json();
  const toolUseBlock = result.content?.find(
    (block: { type: string }) => block.type === "tool_use"
  );

  if (!toolUseBlock?.input?.classifications) {
    console.warn("[CLASSIFY-BATCH] No classifications in response, defaulting all to operating");
    for (const cluster of clusters) {
      results.set(cluster.cluster_id, {
        cluster_id: cluster.cluster_id,
        category: "operating",
        confidence: 0.50,
        supporting_evidence: ["Batch LLM did not return structured output"],
        contradictory_evidence: [],
        recommended_action: "review",
      });
    }
    return results;
  }

  const classifications: BatchClusterClassification[] = toolUseBlock.input.classifications;

  // Index the returned classifications by cluster_index
  const classMap = new Map<number, BatchClusterClassification>();
  for (const c of classifications) {
    if (typeof c.cluster_index === "number") {
      classMap.set(c.cluster_index, c);
    }
  }

  // Map results back to cluster IDs, filling defaults for any missing
  for (let i = 0; i < clusters.length; i++) {
    const cluster = clusters[i];
    const c = classMap.get(i);

    if (c) {
      results.set(cluster.cluster_id, {
        cluster_id: cluster.cluster_id,
        category: c.category || "operating",
        confidence: typeof c.confidence === "number" ? Math.max(0, Math.min(1, c.confidence)) : 0.50,
        supporting_evidence: Array.isArray(c.supporting_evidence) ? c.supporting_evidence : [],
        contradictory_evidence: Array.isArray(c.contradictory_evidence) ? c.contradictory_evidence : [],
        recommended_action: c.recommended_action || "review",
      });
    } else {
      results.set(cluster.cluster_id, {
        cluster_id: cluster.cluster_id,
        category: "operating",
        confidence: 0.45,
        supporting_evidence: ["Cluster not returned in batch response"],
        contradictory_evidence: [],
        recommended_action: "review",
      });
    }
  }

  console.log(`[CLASSIFY-BATCH] Processed ${clusters.length} clusters, got ${classifications.length} responses`);
  return results;
}
