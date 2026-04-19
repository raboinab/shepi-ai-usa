// ─── Clustering ─────────────────────────────────────────────────────

import type { RawTransaction, TransactionCluster } from "./types.ts";
import { normalizeDescription } from "./normalize.ts";

/**
 * Group ambiguous transactions by normalized description for batch LLM classification.
 * Sorted by total dollars descending so most material clusters are processed first.
 */
export function clusterAmbiguousTransactions(txns: RawTransaction[]): TransactionCluster[] {
  const groups = new Map<string, RawTransaction[]>();

  for (const t of txns) {
    const key = normalizeDescription(t.memo) || "__blank__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const clusters: TransactionCluster[] = [];
  let clusterId = 0;

  for (const [normalized, txnList] of groups) {
    if (txnList.length === 0) continue;
    const totalDollars = txnList.reduce((sum, t) => sum + t.amount, 0);
    clusters.push({
      cluster_id: `cluster_${++clusterId}`,
      normalized_description: normalized,
      transaction_ids: txnList.map(t => t.id),
      transactions: txnList,
      total_dollars: totalDollars,
    });
  }

  clusters.sort((a, b) => Math.abs(b.total_dollars) - Math.abs(a.total_dollars));
  return clusters;
}
