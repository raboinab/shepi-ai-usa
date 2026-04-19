// ─── Rule Engine ─────────────────────────────────────────────────────

import type { RawTransaction, ClassifiedTransaction, EvidenceAtom, RelatedPartyEntry } from "./types.ts";
import { normalizeDescription, hasKeyword, dateDiffDays } from "./normalize.ts";
import {
  TRANSFER_KEYWORDS, OWNER_KEYWORDS, PERSONAL_APP_KEYWORDS,
  CONSUMER_CREDIT_KEYWORDS, NEGATIVE_CLASS_PATTERNS, PROMOTION_THRESHOLD,
  BUSINESS_VENDOR_PATTERNS, detectVendorSubtype,
} from "./constants.ts";

function checkNegativeClass(memo: string): { label: string; weight: number } | null {
  for (const { pattern, label } of NEGATIVE_CLASS_PATTERNS) {
    if (pattern.test(memo)) {
      return { label, weight: -0.40 };
    }
  }
  return null;
}

function fuzzyNameMatch(text: string, names: string[]): { name: string; similarity: number } | null {
  const lower = text.toLowerCase();
  let best: { name: string; similarity: number } | null = null;
  for (const name of names) {
    const nameLower = name.toLowerCase();
    if (!nameLower || nameLower.length < 3) continue;
    if (lower.includes(nameLower)) {
      const sim = nameLower.length / Math.max(lower.length, 1);
      const score = Math.min(sim * 2, 1.0);
      if (!best || score > best.similarity) {
        best = { name, similarity: Math.max(score, 0.85) };
      }
    } else {
      const nameWords = nameLower.split(/\s+/).filter(w => w.length >= 3);
      for (const word of nameWords) {
        if (lower.includes(word)) {
          const score = 0.60;
          if (!best || score > best.similarity) {
            best = { name, similarity: score };
          }
        }
      }
    }
  }
  return best;
}

/**
 * Stage 1: Interbank pair matching with staged tolerance ladder.
 */
function findInterbankPairs(
  txns: RawTransaction[],
): Map<string, { paired_with: string; score: number; evidence: EvidenceAtom[] }> {
  const pairs = new Map<string, { paired_with: string; score: number; evidence: EvidenceAtom[] }>();
  const used = new Set<string>();

  const byAmount = new Map<number, RawTransaction[]>();
  for (const t of txns) {
    const key = Math.round(t.amount * 100);
    if (!byAmount.has(key)) byAmount.set(key, []);
    byAmount.get(key)!.push(t);
  }

  for (const [_amountKey, group] of byAmount) {
    if (group.length < 2) continue;
    const debits = group.filter(t => t.direction === "debit" && !used.has(t.id));
    const credits = group.filter(t => t.direction === "credit" && !used.has(t.id));

    for (const debit of debits) {
      if (used.has(debit.id)) continue;
      for (const credit of credits) {
        if (used.has(credit.id)) continue;
        if (debit.recordId === credit.recordId) continue;

        const dayDiff = Math.abs(dateDiffDays(debit.date, credit.date));
        if (dayDiff > 3) continue;

        const evidence: EvidenceAtom[] = [];
        let score = 0;

        if (dayDiff === 0) {
          score = 0.95;
          evidence.push({ type: "amount_match_exact", paired_txn_id: credit.id, weight: 0.45 });
          evidence.push({ type: "date_within_days", paired_txn_id: credit.id, days: 0, weight: 0.30 });
        } else {
          score = 0.85;
          evidence.push({ type: "amount_match_exact", paired_txn_id: credit.id, weight: 0.40 });
          evidence.push({ type: "date_within_days", paired_txn_id: credit.id, days: dayDiff, weight: 0.20 });
        }

        evidence.push({ type: "cross_account", source_record_id: debit.recordId, target_record_id: credit.recordId, weight: 0.20 });

        const debitKw = hasKeyword(debit.memo, TRANSFER_KEYWORDS);
        const creditKw = hasKeyword(credit.memo, TRANSFER_KEYWORDS);
        if (debitKw && creditKw) {
          score = Math.min(score + 0.10, 1.0);
          evidence.push({ type: "keyword_match", value: debitKw, weight: 0.10 });
        } else if (debitKw || creditKw) {
          score = Math.min(score + 0.05, 1.0);
          evidence.push({ type: "keyword_match", value: (debitKw || creditKw)!, weight: 0.05 });
        }

        if (debit.amount === Math.round(debit.amount)) {
          score = Math.min(score + 0.03, 1.0);
          evidence.push({ type: "round_dollar", weight: 0.03 });
        }

        used.add(debit.id);
        used.add(credit.id);
        pairs.set(debit.id, { paired_with: credit.id, score, evidence });
        pairs.set(credit.id, { paired_with: debit.id, score, evidence: [...evidence] });
        break;
      }
    }
  }

  // Stage 3: near-amount matching ($5 tolerance for bank fees)
  for (const t of txns) {
    if (used.has(t.id)) continue;
    if (!hasKeyword(t.memo, TRANSFER_KEYWORDS)) continue;

    for (const candidate of txns) {
      if (used.has(candidate.id)) continue;
      if (candidate.id === t.id) continue;
      if (candidate.recordId === t.recordId) continue;
      if (candidate.direction === t.direction) continue;

      const amountDiff = Math.abs(t.amount - candidate.amount);
      if (amountDiff > 5) continue;

      const dayDiff = Math.abs(dateDiffDays(t.date, candidate.date));
      if (dayDiff > 3) continue;

      const evidence: EvidenceAtom[] = [
        { type: "amount_match_near", paired_txn_id: candidate.id, delta: amountDiff, weight: 0.30 },
        { type: "date_within_days", paired_txn_id: candidate.id, days: dayDiff, weight: 0.20 },
        { type: "cross_account", source_record_id: t.recordId, target_record_id: candidate.recordId, weight: 0.20 },
        { type: "keyword_match", value: "transfer", weight: 0.10 },
      ];

      used.add(t.id);
      used.add(candidate.id);
      pairs.set(t.id, { paired_with: candidate.id, score: 0.75, evidence });
      pairs.set(candidate.id, { paired_with: t.id, score: 0.75, evidence: [...evidence] });
      break;
    }
  }

  return pairs;
}

/**
 * Stage 2: Owner/related-party heuristic scoring.
 * Now includes business-vendor downweight to prevent
 * stamps, shipping, utilities etc. from auto-promoting to "owner."
 */
function scoreOwnerCandidate(
  txn: RawTransaction,
  relatedParties: RelatedPartyEntry[],
): { score: number; evidence: EvidenceAtom[] } {
  let score = 0;
  const evidence: EvidenceAtom[] = [];
  const normalized = normalizeDescription(txn.memo);

  const ownerKw = hasKeyword(txn.memo, OWNER_KEYWORDS);
  if (ownerKw) {
    score += 0.35;
    evidence.push({ type: "keyword_match", value: ownerKw, weight: 0.35 });
  }

  const appKw = hasKeyword(txn.memo, PERSONAL_APP_KEYWORDS);
  if (appKw) {
    score += 0.15;
    evidence.push({ type: "personal_app_keyword", value: appKw, weight: 0.15 });
  }

  const consumerKw = hasKeyword(txn.memo, CONSUMER_CREDIT_KEYWORDS);
  if (consumerKw) {
    score += 0.20;
    evidence.push({ type: "keyword_match", value: consumerKw, weight: 0.20 });
  }

  const allNames = relatedParties.flatMap(rp => [rp.full_name, ...rp.short_names]);
  const nameMatch = fuzzyNameMatch(normalized, allNames);
  if (nameMatch) {
    const nameWeight = nameMatch.similarity >= 0.85 ? 0.35 : 0.25;
    score += nameWeight;
    evidence.push({ type: "name_match", value: nameMatch.name, similarity: nameMatch.similarity, weight: nameWeight });
  }

  if (txn.amount === Math.round(txn.amount) && txn.amount >= 500) {
    score += 0.05;
    evidence.push({ type: "round_dollar", weight: 0.05 });
  }

  // ── Business-vendor downweight ──────────────────────────────
  // When a strong business vendor signal is present alongside an owner name,
  // reduce the score to prevent auto-promotion of business expenses.
  for (const { pattern, label, weight } of BUSINESS_VENDOR_PATTERNS) {
    if (pattern.test(txn.memo)) {
      score += weight; // weight is negative
      evidence.push({ type: "business_vendor_downweight", value: label, weight });
      break; // only apply strongest match
    }
  }

  return { score: Math.min(Math.max(score, 0), 1.0), evidence };
}

/**
 * Full rule engine: classify all transactions deterministically.
 */
export function runRuleEngine(
  allTxns: RawTransaction[],
  relatedParties: RelatedPartyEntry[],
): {
  classified: Map<string, ClassifiedTransaction>;
  ambiguous: RawTransaction[];
} {
  const classified = new Map<string, ClassifiedTransaction>();
  const ambiguous: RawTransaction[] = [];

  const interbankPairs = findInterbankPairs(allTxns);

  let caseCounter = 0;
  const pairCaseMap = new Map<string, string>();

  for (const txn of allTxns) {
    const negClass = checkNegativeClass(txn.memo);
    const pairMatch = interbankPairs.get(txn.id);

    if (pairMatch && pairMatch.score >= PROMOTION_THRESHOLD) {
      if (negClass) {
        const adjustedScore = pairMatch.score + negClass.weight;
        if (adjustedScore < PROMOTION_THRESHOLD) {
          ambiguous.push(txn);
          continue;
        }
      }

      let caseId: string;
      const existingCase = pairCaseMap.get(pairMatch.paired_with);
      if (existingCase) {
        caseId = existingCase;
      } else {
        caseId = `case_internal_${++caseCounter}`;
        pairCaseMap.set(txn.id, caseId);
      }

      classified.set(txn.id, {
        id: txn.id,
        category: "interbank",
        candidate_type: "internal_same_entity_transfer",
        confidence: pairMatch.score,
        method: "rule_pair_match",
        evidence: pairMatch.evidence,
        paired_with: pairMatch.paired_with,
        case_id: caseId,
        amount: txn.amount,
        memo: txn.memo,
        date: txn.date,
        account_record_id: txn.recordId,
        period_key: txn.periodKey,
      });
      continue;
    }

    const transferKw = hasKeyword(txn.memo, TRANSFER_KEYWORDS);
    const ownerResult = scoreOwnerCandidate(txn, relatedParties);

    let ownerScore = ownerResult.score;
    let ownerEvidence = [...ownerResult.evidence];
    if (negClass) {
      ownerScore += negClass.weight;
      ownerEvidence.push({ type: "negative_class", value: negClass.label, weight: negClass.weight });
    }

    if (negClass && ownerScore <= 0 && !pairMatch && !transferKw) {
      classified.set(txn.id, {
        id: txn.id,
        category: "operating",
        candidate_type: "operating",
        confidence: 0.95,
        method: "rule_negative_class",
        evidence: [{ type: "negative_class", value: negClass.label, weight: negClass.weight }],
        case_id: `case_excluded_${++caseCounter}`,
        amount: txn.amount,
        memo: txn.memo,
        date: txn.date,
        account_record_id: txn.recordId,
        period_key: txn.periodKey,
      });
      continue;
    }

    if (ownerScore >= PROMOTION_THRESHOLD) {
      classified.set(txn.id, {
        id: txn.id,
        category: "owner",
        candidate_type: "owner_related",
        confidence: ownerScore,
        method: "rule_keyword",
        evidence: ownerEvidence,
        case_id: `case_owner_${++caseCounter}`,
        amount: txn.amount,
        memo: txn.memo,
        date: txn.date,
        account_record_id: txn.recordId,
        period_key: txn.periodKey,
        subtype: detectVendorSubtype(txn.memo),
      });
      continue;
    }

    if (transferKw && !pairMatch) {
      ambiguous.push(txn);
      continue;
    }

    if (ownerScore > 0.30) {
      ambiguous.push(txn);
      continue;
    }

    classified.set(txn.id, {
      id: txn.id,
      category: "operating",
      candidate_type: "operating",
      confidence: 0.90,
      method: "rule_negative_class",
      evidence: negClass ? [{ type: "negative_class", value: negClass.label, weight: negClass.weight }] : [],
      case_id: `case_operating_${++caseCounter}`,
      amount: txn.amount,
      memo: txn.memo,
      date: txn.date,
      account_record_id: txn.recordId,
      period_key: txn.periodKey,
    });
  }

  return { classified, ambiguous };
}
