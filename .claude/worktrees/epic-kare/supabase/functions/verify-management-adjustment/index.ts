import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SearchStrategy {
  searchTerms: string[];
  accountPatterns: string[];
  vendorPatterns: string[];
  amountHints: { monthly?: number; quarterly?: number; annual?: number };
  dateRelevance: string;
}

interface MatchedRecord {
  source: "processed_data" | "document" | "flagged_transaction";
  sourceId: string;
  sourceName: string;
  excerpt: string;
  amount: number | null;
  date: string | null;
  matchedTerms: string[];
}

interface TraceabilityReport {
  score: number;
  status: "validated" | "supported" | "partial" | "insufficient" | "contradictory";
  summary: string;
  supportedAmount: number | null;
  claimedAmount: number;
  corroboratingEvidence: Array<{
    source: string;
    sourceName: string;
    excerpt: string;
    amount: number | null;
    date: string | null;
  }>;
  contradictions: Array<{ description: string; severity: "high" | "medium" | "low" }>;
  dataGaps: Array<{ description: string; severity: "high" | "medium" | "low"; recommendation: string }>;
  scanStats: {
    documentsSearched: number;
    dataRecordsSearched: number;
    flaggedTransactionsSearched: number;
    matchesFound: number;
  };
  searchStrategy: SearchStrategy;
}

// ── Step 1: AI Search Strategist ──────────────────────────────────────
async function generateSearchStrategy(
  adjustment: { description: string; category: string; intent: string; linkedAccountName?: string; amount: number; periodRange?: string },
  apiKey: string,
): Promise<SearchStrategy> {
  const prompt = `You are a financial due diligence search strategist. Given an adjustment from a Quality of Earnings analysis, generate search terms to find corroborating transactions in a company's financial records (general ledger, trial balance, bills, purchases, deposits, journal entries).

ADJUSTMENT:
- Description: ${adjustment.description}
- Category: ${adjustment.category}
- Intent: ${adjustment.intent}
- Linked Account: ${adjustment.linkedAccountName || "not specified"}
- Claimed Amount: $${adjustment.amount?.toLocaleString() || 0}
- Period: ${adjustment.periodRange || "all periods"}

Return a JSON object with:
- searchTerms: array of keywords/phrases to search transaction descriptions, memos, and line items (include abbreviations, synonyms, common misspellings)
- accountPatterns: array of partial account name matches (e.g., "retirement", "benefits")
- vendorPatterns: array of likely vendor/payee names associated with this type of expense
- amountHints: object with monthly/quarterly/annual expected amounts based on the claimed total
- dateRelevance: "all_periods" or "specific_range"

Respond with ONLY valid JSON, no markdown.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Search strategy AI error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty search strategy response");

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in search strategy response");

  return JSON.parse(jsonMatch[0]);
}

function fallbackSearchStrategy(description: string, amount: number): SearchStrategy {
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  return {
    searchTerms: words,
    accountPatterns: words.slice(0, 3),
    vendorPatterns: [],
    amountHints: { annual: amount, monthly: Math.round(amount / 12) },
    dateRelevance: "all_periods",
  };
}

// ── Step 2: Deterministic Search ──────────────────────────────────────
function textMatchesTerms(text: string, terms: string[]): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t.toLowerCase()));
}

function searchJsonData(data: unknown, terms: string[], accountPatterns: string[], vendorPatterns: string[]): { matched: string[]; excerpt: string; amount: number | null; date: string | null } {
  const allTerms = [...terms, ...accountPatterns, ...vendorPatterns];
  const jsonStr = JSON.stringify(data).toLowerCase();
  const matched = allTerms.filter((t) => jsonStr.includes(t.toLowerCase()));
  if (matched.length === 0) return { matched: [], excerpt: "", amount: null, date: null };

  // Try to extract amount and date from data
  let amount: number | null = null;
  let date: string | null = null;
  if (typeof data === "object" && data !== null) {
    const flat = data as Record<string, unknown>;
    // Look for amount-like fields
    for (const key of ["amount", "total", "debit", "credit", "value", "balance"]) {
      if (key in flat && typeof flat[key] === "number") {
        amount = flat[key] as number;
        break;
      }
    }
    // Look for date-like fields
    for (const key of ["date", "txn_date", "transaction_date", "period", "posting_date"]) {
      if (key in flat && flat[key]) {
        date = String(flat[key]);
        break;
      }
    }
  }

  const excerpt = jsonStr.slice(0, 2000);
  return { matched, excerpt, amount, date };
}

async function deterministicSearch(
  supabase: ReturnType<typeof createClient>,
  projectId: string,
  strategy: SearchStrategy,
): Promise<{ matches: MatchedRecord[]; stats: TraceabilityReport["scanStats"] }> {
  const matches: MatchedRecord[] = [];
  const stats = { documentsSearched: 0, dataRecordsSearched: 0, flaggedTransactionsSearched: 0, matchesFound: 0 };

  // Search processed_data
  const { data: processedData } = await supabase
    .from("processed_data")
    .select("id, data, data_type, period_start, period_end")
    .eq("project_id", projectId);

  if (processedData) {
    stats.dataRecordsSearched = processedData.length;
    for (const record of processedData) {
      // For records with array data (GL entries, transactions), search each item
      const dataPayload = record.data;
      if (Array.isArray(dataPayload)) {
        for (const item of dataPayload) {
          const result = searchJsonData(item, strategy.searchTerms, strategy.accountPatterns, strategy.vendorPatterns);
          if (result.matched.length > 0) {
            matches.push({
              source: "processed_data",
              sourceId: record.id,
              sourceName: `${record.data_type} (${record.period_start || "unknown"})`,
              excerpt: result.excerpt.slice(0, 500),
              amount: result.amount,
              date: result.date || record.period_start,
              matchedTerms: result.matched,
            });
          }
        }
      } else {
        const result = searchJsonData(dataPayload, strategy.searchTerms, strategy.accountPatterns, strategy.vendorPatterns);
        if (result.matched.length > 0) {
          matches.push({
            source: "processed_data",
            sourceId: record.id,
            sourceName: `${record.data_type} (${record.period_start || "unknown"})`,
            excerpt: result.excerpt.slice(0, 500),
            amount: result.amount,
            date: result.date || record.period_start,
            matchedTerms: result.matched,
          });
        }
      }
    }
  }

  // Search documents (parsed_summary)
  const { data: documents } = await supabase
    .from("documents")
    .select("id, name, parsed_summary, category, period_start, period_end")
    .eq("project_id", projectId);

  if (documents) {
    stats.documentsSearched = documents.length;
    for (const doc of documents) {
      const summaryStr = doc.parsed_summary ? JSON.stringify(doc.parsed_summary) : "";
      const nameMatches = textMatchesTerms(doc.name, [...strategy.searchTerms, ...strategy.accountPatterns]);
      const summaryMatches = textMatchesTerms(summaryStr, [...strategy.searchTerms, ...strategy.accountPatterns, ...strategy.vendorPatterns]);
      const allMatched = [...new Set([...nameMatches, ...summaryMatches])];

      if (allMatched.length > 0) {
        matches.push({
          source: "document",
          sourceId: doc.id,
          sourceName: doc.name,
          excerpt: summaryStr.slice(0, 1500),
          amount: null,
          date: doc.period_start,
          matchedTerms: allMatched,
        });
      }
    }
  }

  // Search flagged_transactions
  const { data: flagged } = await supabase
    .from("flagged_transactions")
    .select("id, description, account_name, amount, transaction_date, flag_reason")
    .eq("project_id", projectId);

  if (flagged) {
    stats.flaggedTransactionsSearched = flagged.length;
    for (const tx of flagged) {
      const descMatches = textMatchesTerms(tx.description, strategy.searchTerms);
      const acctMatches = textMatchesTerms(tx.account_name, [...strategy.searchTerms, ...strategy.accountPatterns]);
      const allMatched = [...new Set([...descMatches, ...acctMatches])];

      if (allMatched.length > 0) {
        matches.push({
          source: "flagged_transaction",
          sourceId: tx.id,
          sourceName: `${tx.account_name}: ${tx.description}`,
          excerpt: `${tx.description} | Account: ${tx.account_name} | Reason: ${tx.flag_reason}`,
          amount: Number(tx.amount),
          date: tx.transaction_date,
          matchedTerms: allMatched,
        });
      }
    }
  }

  // Sort by number of matched terms (relevance) and cap at 50
  matches.sort((a, b) => b.matchedTerms.length - a.matchedTerms.length);
  const capped = matches.slice(0, 50);
  stats.matchesFound = capped.length;

  return { matches: capped, stats };
}

// ── Step 3: AI Evidence Analyst ───────────────────────────────────────
async function analyzeEvidence(
  adjustment: { description: string; category: string; intent: string; amount: number; periodRange?: string },
  matches: MatchedRecord[],
  strategy: SearchStrategy,
  apiKey: string,
): Promise<Omit<TraceabilityReport, "scanStats" | "searchStrategy">> {
  const matchSummary = matches.map((m, i) => {
    let line = `[${i + 1}] Source: ${m.source} | Name: ${m.sourceName}`;
    if (m.amount !== null) line += ` | Amount: $${m.amount}`;
    if (m.date) line += ` | Date: ${m.date}`;
    line += `\nExcerpt: ${m.excerpt.slice(0, 300)}`;
    return line;
  }).join("\n\n");

  const prompt = `You are a senior Quality of Earnings analyst performing traceability verification.

ADJUSTMENT CLAIM:
- Description: ${adjustment.description}
- Category: ${adjustment.category}
- Intent: ${adjustment.intent}
- Claimed Amount: $${adjustment.amount?.toLocaleString() || 0}
- Period: ${adjustment.periodRange || "all periods"}

SEARCH STRATEGY USED:
${JSON.stringify(strategy, null, 2)}

MATCHED EVIDENCE (${matches.length} records found):
${matchSummary}

ANALYZE:
1. Do the matched transactions support the claimed amount? Sum up amounts across months/years.
2. Is there a consistent pattern (monthly, quarterly, annual)?
3. Are there contradictions (e.g., transactions continuing past a stated cutoff)?
4. What evidence is missing?

Respond with ONLY valid JSON:
{
  "score": <0-100>,
  "status": "<validated|supported|partial|insufficient|contradictory>",
  "summary": "<2-3 sentence professional summary>",
  "supportedAmount": <total dollar amount supported by evidence, or null>,
  "corroboratingEvidence": [{"source": "<source type>", "sourceName": "<name>", "excerpt": "<key excerpt>", "amount": <number or null>, "date": "<date or null>"}],
  "contradictions": [{"description": "<text>", "severity": "<high|medium|low>"}],
  "dataGaps": [{"description": "<text>", "severity": "<high|medium|low>", "recommendation": "<text>"}]
}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Evidence analysis AI error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty evidence analysis response");

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in evidence analysis response");

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    score: parsed.score ?? 50,
    status: parsed.status ?? "partial",
    summary: parsed.summary ?? "Analysis completed.",
    supportedAmount: parsed.supportedAmount ?? null,
    claimedAmount: adjustment.amount,
    corroboratingEvidence: parsed.corroboratingEvidence ?? [],
    contradictions: parsed.contradictions ?? [],
    dataGaps: parsed.dataGaps ?? [],
  };
}

// ── Main Handler ──────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adjustmentId, adjustment, projectId } = await req.json();

    if (!adjustmentId || !adjustment || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: adjustmentId, adjustment, projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Verifying adjustment ${adjustmentId} for project ${projectId}`);

    // ── Step 1: Search Strategy ──
    let strategy: SearchStrategy;
    try {
      strategy = await generateSearchStrategy(
        {
          description: adjustment.description,
          category: adjustment.category,
          intent: adjustment.intent || "remove_expense",
          linkedAccountName: adjustment.linkedAccountName,
          amount: adjustment.amount,
          periodRange: adjustment.periodRange,
        },
        LOVABLE_API_KEY,
      );
      console.log("Search strategy generated:", JSON.stringify(strategy).slice(0, 200));
    } catch (err) {
      console.warn("Search strategy AI failed, using fallback:", err);
      strategy = fallbackSearchStrategy(adjustment.description, adjustment.amount);
    }

    // ── Step 2: Deterministic Search ──
    const { matches, stats } = await deterministicSearch(supabase, projectId, strategy);
    console.log(`Deterministic search: ${stats.matchesFound} matches from ${stats.dataRecordsSearched} records, ${stats.documentsSearched} docs, ${stats.flaggedTransactionsSearched} flagged`);

    // If no matches, return immediately
    if (matches.length === 0) {
      const noEvidenceReport: TraceabilityReport = {
        score: 0,
        status: "insufficient",
        summary: "No corroborating evidence found in the project's financial records. Consider uploading supporting documents or syncing additional data.",
        supportedAmount: null,
        claimedAmount: adjustment.amount,
        corroboratingEvidence: [],
        contradictions: [],
        dataGaps: [{ description: "No matching transactions found for this adjustment", severity: "high", recommendation: "Upload supporting invoices, contracts, or bank statements" }],
        scanStats: stats,
        searchStrategy: strategy,
      };

      // Save to adjustment_proofs
      await upsertProof(supabase, adjustmentId, projectId, user.id, noEvidenceReport);

      return new Response(JSON.stringify(noEvidenceReport), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Step 3: AI Evidence Analysis ──
    let analysisResult: Omit<TraceabilityReport, "scanStats" | "searchStrategy">;
    try {
      analysisResult = await analyzeEvidence(
        {
          description: adjustment.description,
          category: adjustment.category,
          intent: adjustment.intent || "remove_expense",
          amount: adjustment.amount,
          periodRange: adjustment.periodRange,
        },
        matches,
        strategy,
        LOVABLE_API_KEY,
      );
    } catch (err) {
      console.warn("Evidence analysis AI failed, returning raw matches:", err);
      analysisResult = {
        score: 50,
        status: "partial",
        summary: "AI analysis unavailable. Raw matches returned for manual review.",
        supportedAmount: null,
        claimedAmount: adjustment.amount,
        corroboratingEvidence: matches.slice(0, 10).map((m) => ({
          source: m.source,
          sourceName: m.sourceName,
          excerpt: m.excerpt.slice(0, 300),
          amount: m.amount,
          date: m.date,
        })),
        contradictions: [],
        dataGaps: [{ description: "AI analysis failed — manual review needed", severity: "medium", recommendation: "Review the matched records manually" }],
      };
    }

    const report: TraceabilityReport = {
      ...analysisResult,
      scanStats: stats,
      searchStrategy: strategy,
    };

    // Save to adjustment_proofs
    await upsertProof(supabase, adjustmentId, projectId, user.id, report);

    console.log(`Verification complete. Score: ${report.score}, Status: ${report.status}`);

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in verify-management-adjustment:", error);

    if (error instanceof Error && error.message.includes("429")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (error instanceof Error && error.message.includes("402")) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const msg = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function upsertProof(
  supabase: ReturnType<typeof createClient>,
  adjustmentId: string,
  projectId: string,
  userId: string,
  report: TraceabilityReport,
) {
  const { data: existing } = await supabase
    .from("adjustment_proofs")
    .select("id")
    .eq("adjustment_id", adjustmentId)
    .eq("project_id", projectId)
    .eq("verification_type", "auto_verify")
    .limit(1);

  const proofData = {
    project_id: projectId,
    user_id: userId,
    adjustment_id: adjustmentId,
    validation_score: report.score,
    validation_status: report.status,
    ai_analysis: {
      summary: report.summary,
      supportedAmount: report.supportedAmount,
      claimedAmount: report.claimedAmount,
    },
    key_findings: report.corroboratingEvidence.map((e) => `${e.sourceName}: $${e.amount ?? "N/A"}`).slice(0, 10),
    red_flags: [
      ...report.contradictions.map((c) => c.description),
      ...report.dataGaps.filter((g) => g.severity === "high").map((g) => g.description),
    ],
    validated_at: new Date().toISOString(),
    verification_type: "auto_verify",
    traceability_data: {
      searchStrategy: report.searchStrategy,
      scanStats: report.scanStats,
      corroboratingEvidence: report.corroboratingEvidence,
      contradictions: report.contradictions,
      dataGaps: report.dataGaps,
    },
  };

  if (existing && existing.length > 0) {
    await supabase.from("adjustment_proofs").update(proofData).eq("id", existing[0].id);
  } else {
    await supabase.from("adjustment_proofs").insert(proofData);
  }
}
