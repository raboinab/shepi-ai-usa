// insights-chat v7 — RAG-powered project data retrieval, flagged transactions context, streaming
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ============================================================
// TYPES
// ============================================================

type AgentType = 'qoe' | 'cashflow' | 'risk' | 'education';

interface ClassificationResult {
  agents: AgentType[];
  reasoning: string;
}

// ============================================================
// AGENT → DATA TYPE FILTER MAPPING
// ============================================================

const AGENT_DATA_TYPE_FILTERS: Record<AgentType, string[]> = {
  qoe: [
    'trial_balance', 'chart_of_accounts', 'income_statement',
    'payroll', 'general_ledger', 'adjustments', 'reclassifications',
    'bank_transactions', 'credit_card_transactions',
  ],
  cashflow: [
    'trial_balance', 'adjustments',
    'balance_sheet', 'ar_aging', 'ap_aging', 'bank_transactions',
    'cash_flow', 'fixed_assets', 'inventory', 'proof_of_cash',
    'general_ledger', 'credit_card_transactions',
  ],
  risk: [
    'customer_concentration', 'vendor_concentration', 'cim_insights',
    'debt_schedule', 'material_contract', 'tax_return',
    'bank_transactions',
  ],
  education: [],
};

// ============================================================
// FLAGGED TRANSACTIONS CONTEXT LOADER
// ============================================================

interface FlaggedTransactionSummary {
  context: string;
  totalCount: number;
  categories: Record<string, number>;
}

async function loadFlaggedTransactions(
  projectId: string,
  agents: AgentType[],
): Promise<FlaggedTransactionSummary | null> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !projectId) return null;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: flags, error } = await supabase
      .from('flagged_transactions')
      .select('description, account_name, amount, flag_type, flag_reason, flag_category, confidence_score, suggested_adjustment_type, suggested_adjustment_amount, status, classification_context, ai_analysis')
      .eq('project_id', projectId)
      .order('confidence_score', { ascending: false })
      .limit(30);

    if (error || !flags || flags.length === 0) return null;

    // Aggregate by category
    const categories: Record<string, number> = {};
    for (const f of flags) {
      const cat = f.flag_category || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + 1;
    }

    // Build readable context with classification reasoning
    const lines = flags.map((f: any) => {
      const parts = [
        `• ${f.description} (${f.account_name}): $${Number(f.amount || 0).toLocaleString()}`,
        `  Type: ${f.flag_type} | Reason: ${f.flag_reason}`,
        `  Confidence: ${(f.confidence_score * 100).toFixed(0)}% | Status: ${f.status}`,
      ];
      if (f.suggested_adjustment_type) {
        parts.push(`  Suggested: ${f.suggested_adjustment_type} — $${Number(f.suggested_adjustment_amount || 0).toLocaleString()}`);
      }
      // Include RAG classification context if available
      const ctx = f.classification_context;
      if (ctx && typeof ctx === 'object') {
        if (ctx.industry_guidance) parts.push(`  Industry basis: ${String(ctx.industry_guidance).slice(0, 120)}`);
        if (ctx.rag_sources && Array.isArray(ctx.rag_sources)) {
          parts.push(`  Sources: ${ctx.rag_sources.slice(0, 3).join(', ')}`);
        }
      }
      return parts.join('\n');
    });

    const summary = `## Flagged Transactions (${flags.length} items)\nCategories: ${Object.entries(categories).map(([k, v]) => `${k}(${v})`).join(', ')}\n\n${lines.join('\n\n')}`;

    console.log(`[flagged-txns] Loaded ${flags.length} flagged transactions across ${Object.keys(categories).length} categories`);
    return { context: summary, totalCount: flags.length, categories };
  } catch (err) {
    console.error('[flagged-txns] Error:', err);
    return null;
  }
}

// ============================================================
// STEP 1: INTENT CLASSIFIER
// ============================================================

async function classifyIntent(
  userMessage: string,
  currentSection: { phase: number; section: number; sectionName: string } | null,
  apiKey: string
): Promise<ClassificationResult> {
  const lower = userMessage.toLowerCase();

  // Flagged transaction explanation queries — route to relevant domain agent
  const flagExplanationSignals = ['why was', 'why is', 'why did you flag', 'explain the flag',
    'flagged transaction', 'why flagged', 'classification reason', 'how was this classified',
    'why was this classified', 'explain this finding', 'what triggered'];
  const isFlagExplanation = flagExplanationSignals.some(s => lower.includes(s)) &&
    (lower.includes('flag') || lower.includes('classif') || lower.includes('trigger') || lower.includes('finding'));

  if (isFlagExplanation) {
    // Route to QoE + Risk for comprehensive explanation
    return { agents: ['qoe', 'risk'], reasoning: 'Flagged transaction explanation request' };
  }

  // Keyword heuristics for financial data queries — route to data-aware agents
  const financialKeywords = ['loan', 'eidl', 'sba', 'debt', 'payment', 'payoff', 'principal',
    'interest expense', 'note payable', 'credit line', 'line of credit', 'mortgage',
    'lease payment', 'amortization', 'bank statement', 'deposit', 'withdrawal',
    'transfer', 'wire', 'check', 'ach', 'transaction', 'general ledger', 'gl',
    'free cash flow', 'fcf', 'ebitda', 'working capital', 'capex', 'cash conversion', 'nwc'];
  const isFinancialDataQuery = financialKeywords.some(s => lower.includes(s));

  if (isFinancialDataQuery) {
    return { agents: ['qoe', 'cashflow'], reasoning: `Financial data query (keyword: ${financialKeywords.find(s => lower.includes(s))})` };
  }

  // Pure definitional / educational questions
  const educationSignals = ['what is', 'what are', 'define', 'meaning of', 'explain the concept',
    'how does', 'what does', 'tell me about', 'why is', 'difference between'];
  const isEducational = educationSignals.some(s => lower.includes(s)) &&
    !lower.includes('my data') && !lower.includes('our') && !lower.includes('the company') &&
    !isFlagExplanation && !isFinancialDataQuery;

  if (isEducational) {
    return { agents: ['education'], reasoning: 'Definitional/conceptual question' };
  }

  // Section-based heuristic routing
  if (currentSection) {
    const { phase, section } = currentSection;
    const sectionKey = `${phase}-${section}`;

    const sectionAgentMap: Record<string, AgentType[]> = {
      '2-1': ['qoe'], '2-2': ['qoe'],
      '3-1': ['qoe'], '3-2': ['qoe'],
      '3-3': ['cashflow'], '3-4': ['cashflow'],
      '3-5': ['qoe'], '3-6': ['cashflow'], '3-7': ['qoe'],
      '4-1': ['risk'], '4-2': ['risk'],
      '5-1': ['qoe'], '5-2': ['cashflow'],
      '5-3': ['qoe'], '5-5': ['cashflow'],
      '5-6': ['cashflow'], '5-7': ['cashflow'],
      '6-1': ['qoe', 'risk'],
    };

    const dataSignals = ['my', 'our', 'the data', 'this', 'these', 'look at', 'analyze',
      'review', 'check', 'validate', 'flag', 'issue', 'problem', 'concern'];
    const isDataQuestion = dataSignals.some(s => lower.includes(s));

    if (isDataQuestion && sectionAgentMap[sectionKey]) {
      return { agents: sectionAgentMap[sectionKey], reasoning: `Data question in section ${sectionKey}` };
    }
  }

  // LLM classifier for ambiguous queries
  try {
    const classifyAbort = AbortSignal.timeout(8000);
    const classifyResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: classifyAbort,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: `Classify this QoE analysis question into one or more agent categories. Pick the minimum set needed.

Categories:
- qoe: EBITDA adjustments, earnings quality, normalization, trial balance, chart of accounts, income statement, reclassifications, payroll normalization
- cashflow: Working capital, FCF, proof of cash, AR/AP aging, DSO/DPO/DIO, balance sheet, liquidity, cash conversion
- risk: Customer/vendor concentration, CIM insights, debt schedule, material contracts, red flags, related party transactions
- education: Pure concept explanations, definitions, general QoE methodology (no company-specific data needed)

Respond with ONLY valid JSON, no markdown, no explanation:
{"agents": ["qoe"|"cashflow"|"risk"|"education"], "reasoning": "one sentence"}`
          },
          { role: "user", content: userMessage }
        ],
      }),
    });

    if (classifyResponse.ok) {
      const data = await classifyResponse.json();
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed.agents) && parsed.agents.length > 0) {
            console.log(`[classifier] LLM classified as: ${parsed.agents.join(', ')} — ${parsed.reasoning}`);
            return parsed as ClassificationResult;
          }
        }
      } catch (parseErr) {
        console.error("[classifier] JSON parse error:", parseErr, "content:", content);
      }
    } else {
      const errText = await classifyResponse.text();
      console.error("[classifier] LLM error:", classifyResponse.status, errText);
    }
  } catch (err) {
    console.error("[classifier] Error:", err);
  }

  return { agents: ['qoe'], reasoning: 'Fallback: could not classify — defaulting to data-aware agent' };
}

// ============================================================
// STEP 2: PROJECT DATA RAG RETRIEVAL
// ============================================================

const TOKEN_BUDGET = 20000;

async function retrieveProjectData(
  projectId: string,
  userQuery: string,
  agents: AgentType[],
  openaiKey: string
): Promise<{ dataContext: string; chunkCount: number; tokenCount: number }> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !projectId) {
    return { dataContext: '', chunkCount: 0, tokenCount: 0 };
  }

  // Build data_type_filter from agents
  const filterSet = new Set<string>();
  for (const agent of agents) {
    const types = AGENT_DATA_TYPE_FILTERS[agent] || [];
    for (const t of types) filterSet.add(t);
  }
  const dataTypeFilter = [...filterSet];
  if (dataTypeFilter.length === 0) {
    return { dataContext: '', chunkCount: 0, tokenCount: 0 };
  }

  try {
    // Embed user query
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: userQuery }),
    });
    if (!embeddingRes.ok) {
      console.error("[project-rag] Embedding error:", embeddingRes.status);
      return { dataContext: '', chunkCount: 0, tokenCount: 0 };
    }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // Call match_project_chunks RPC
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    console.log(`[project-rag] Embedding generated: ${queryEmbedding?.length} dimensions, querying ${dataTypeFilter.join(', ')}`);
    const { data: chunks, error } = await supabase.rpc('match_project_chunks', {
      _project_id: projectId,
      query_embedding: JSON.stringify(queryEmbedding),  // String serialization — PostgREST casts reliably to vector
      match_threshold: 0.55, // slightly lower than default to get more recall
      match_count: 25,       // fetch more, then trim by token budget
      data_type_filter: dataTypeFilter,
    });

    if (error) {
      console.error("[project-rag] RPC error:", error);
      return { dataContext: '', chunkCount: 0, tokenCount: 0 };
    }

    if (!chunks || chunks.length === 0) {
      console.log("[project-rag] No chunks found for filter:", dataTypeFilter.join(', '));
      return { dataContext: '', chunkCount: 0, tokenCount: 0 };
    }

    // Apply token budget — chunks are already sorted by priority/similarity
    let totalTokens = 0;
    const selectedChunks: typeof chunks = [];
    for (const chunk of chunks) {
      const tokens = chunk.token_count || Math.ceil(chunk.content.length / 4);
      if (totalTokens + tokens > TOKEN_BUDGET && selectedChunks.length > 0) break;
      selectedChunks.push(chunk);
      totalTokens += tokens;
    }

    // Format chunks into dataContext
    const dataContext = selectedChunks.map((c: any) => c.content).join('\n\n');
    const dataTypes = [...new Set(selectedChunks.map((c: any) => c.data_type))];
    console.log(`[project-rag] Retrieved ${selectedChunks.length}/${chunks.length} chunks (${totalTokens} tokens). Types: ${dataTypes.join(', ')}`);

    return { dataContext, chunkCount: selectedChunks.length, tokenCount: totalTokens };
  } catch (err) {
    console.error("[project-rag] Error:", err);
    return { dataContext: '', chunkCount: 0, tokenCount: 0 };
  }
}

// ============================================================
// INLINE WIZARD DATA (small user-created analysis data)
// ============================================================

function loadInlineWizardData(wizardData: any): string {
  if (!wizardData || typeof wizardData !== 'object') return '';
  const parts: string[] = [];

  // Adjustments — always inline (user-created, small)
  // Check all known keys: ddAdjustments (actual key), qoeAnalysis.adjustments, adjustments
  let adjustments: any[] | null = null;
  const ddAdj = wizardData?.ddAdjustments;
  if (ddAdj && typeof ddAdj === 'object' && !Array.isArray(ddAdj)) {
    // ddAdjustments is typically an object with adjustment entries as values
    adjustments = Object.values(ddAdj).filter((v: any) => v && typeof v === 'object' && (v.name || v.description || v.amount));
  }
  if (!adjustments || adjustments.length === 0) {
    adjustments = wizardData?.qoeAnalysis?.adjustments || wizardData?.adjustments || null;
  }
  if (Array.isArray(adjustments) && adjustments.length > 0) {
    const INTENT_SIGN: Record<string, number> = {
      remove_expense: 1, remove_revenue: -1, add_expense: -1,
      add_revenue: 1, normalize_up_expense: -1, normalize_down_expense: 1, other: 1,
    };
    let totalImpact = 0;
    let approvedCount = 0;
    for (const adj of adjustments) {
      const sign = INTENT_SIGN[adj.intent as string] ?? 1;
      totalImpact += (Number(adj.amount) || 0) * sign;
      if (adj.approved) approvedCount++;
    }
    parts.push(`## QoE Adjustments (${adjustments.length} total, ${approvedCount} approved)\n- Net EBITDA Impact: $${totalImpact.toLocaleString()}\n${adjustments.slice(0, 20).map((adj: any) => {
      const s = INTENT_SIGN[adj.intent as string] ?? 1;
      return `- ${adj.name || adj.description}: $${((adj.amount || 0) * s).toLocaleString()} (${adj.category || 'Uncategorized'})${adj.approved ? ' ✓' : ''}`;
    }).join('\n')}`);
  }

  // Reclassifications — always inline
  const reclassifications = wizardData?.reclassifications;
  if (Array.isArray(reclassifications) && reclassifications.length > 0) {
    parts.push(`## Reclassifications (${reclassifications.length} entries)\n${reclassifications.slice(0, 15).map((r: any) =>
      `- ${r.description || r.name || 'Unnamed'}: $${(Number(r.amount) || 0).toLocaleString()} (${r.fromLine || '?'} → ${r.toLine || '?'})`
    ).join('\n')}`);
  }

  // Deal parameters — always inline (tiny)
  const dp = wizardData?.dealParameters;
  if (dp) {
    const dpParts = [];
    if (dp.transactionType) dpParts.push(`Type: ${dp.transactionType}`);
    if (dp.purchasePrice) dpParts.push(`Price: $${Number(dp.purchasePrice).toLocaleString()}`);
    if (dp.multiple) dpParts.push(`Multiple: ${dp.multiple}x`);
    if (dpParts.length > 0) parts.push(`## Deal Parameters\n${dpParts.join(' | ')}`);
  }

  return parts.join('\n\n');
}

// ============================================================
// EDUCATION DATA LOADER (unchanged — static content)
// ============================================================

function loadEducationData(phase: number, section: number, sectionName: string): string {
  const SECTION_EDUCATION: Record<string, { concepts: string[]; description: string; keyTerms: { term: string; definition: string }[] }> = {
    "1-1": {
      concepts: ["Target Company Profile", "Deal Context", "Industry Analysis"],
      description: "Understanding the target company's background is crucial for contextualizing the QoE analysis.",
      keyTerms: [
        { term: "Target Company", definition: "The business being analyzed for potential acquisition or investment" },
        { term: "Transaction Type", definition: "The nature of the deal (acquisition, merger, investment, etc.)" },
      ],
    },
    "2-1": {
      concepts: ["Account Structure", "Account Classification", "Mapping Consistency", "Mapping Validation"],
      description: "The chart of accounts defines how transactions are categorized. Correct account mappings ensure accurate financial statement presentation and EBITDA calculations.",
      keyTerms: [
        { term: "Chart of Accounts", definition: "The organized list of all accounts used to record transactions" },
        { term: "FS Line Item", definition: "The standardized financial statement line where an account appears" },
        { term: "Mapping Validation", definition: "Comparing account classifications against standard mapping rules to identify errors" },
      ],
    },
    "2-2": {
      concepts: ["General Ledger", "Account Mapping", "Period Comparison"],
      description: "The trial balance is the foundation of the QoE analysis.",
      keyTerms: [
        { term: "Trial Balance", definition: "A listing of all general ledger accounts and their balances at a point in time" },
        { term: "Account Mapping", definition: "Categorizing GL accounts into standardized financial statement line items" },
      ],
    },
    "3-1": {
      concepts: ["EBITDA Adjustments", "Normalization", "Pro Forma Adjustments", "Run-Rate"],
      description: "Due diligence adjustments normalize EBITDA by removing non-recurring items.",
      keyTerms: [
        { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization" },
        { term: "Add-back", definition: "An expense added back to EBITDA to increase adjusted earnings" },
        { term: "Run-Rate", definition: "Annualized earnings based on recent performance trends" },
      ],
    },
    "3-2": {
      concepts: ["Reclassification", "Above/Below the Line", "COGS vs OpEx"],
      description: "Reclassifications correct presentation without changing net income.",
      keyTerms: [
        { term: "Reclassification", definition: "Moving an item from one line to another without changing total earnings" },
      ],
    },
    "3-3": {
      concepts: ["DSO Analysis", "Collectibility", "Bad Debt"],
      description: "AR aging analysis assesses receivable quality.",
      keyTerms: [
        { term: "DSO", definition: "Days Sales Outstanding - measures how quickly receivables are collected" },
        { term: "Aging Bucket", definition: "Categories of receivables based on days past due" },
      ],
    },
    "3-4": {
      concepts: ["DPO Analysis", "Vendor Terms", "Cash Management"],
      description: "AP aging reveals payment practices.",
      keyTerms: [
        { term: "DPO", definition: "Days Payable Outstanding - measures how long it takes to pay vendors" },
      ],
    },
    "3-5": {
      concepts: ["PP&E", "Depreciation", "CapEx Analysis"],
      description: "Fixed asset analysis identifies deferred maintenance and CapEx requirements.",
      keyTerms: [
        { term: "CapEx", definition: "Capital Expenditures - spending on property, plant, and equipment" },
        { term: "Maintenance CapEx", definition: "Spending required to maintain current operations" },
      ],
    },
    "3-7": {
      concepts: ["Compensation Analysis", "Owner Compensation", "FTE Analysis"],
      description: "Payroll analysis identifies owner/executive compensation needing normalization.",
      keyTerms: [
        { term: "Owner Compensation", definition: "Salary and benefits paid to owners that may exceed or fall below market rates" },
        { term: "FTE", definition: "Full-Time Equivalent - standardized measure of employee headcount" },
      ],
    },
    "4-1": {
      concepts: ["Customer Concentration", "Revenue Quality"],
      description: "Customer analysis identifies concentration risk.",
      keyTerms: [
        { term: "Customer Concentration", definition: "Percentage of revenue from top customers - often flagged if >20% from one customer" },
      ],
    },
    "4-2": {
      concepts: ["Vendor Concentration", "Supply Chain Risk", "Related Party Transactions"],
      description: "Vendor analysis identifies supply chain risks.",
      keyTerms: [
        { term: "Vendor Concentration", definition: "Reliance on a small number of suppliers for critical inputs" },
        { term: "Related Party", definition: "Entity with ownership or control relationship to the target" },
      ],
    },
    "5-1": {
      concepts: ["Revenue Recognition", "Gross Margin", "EBITDA Margin"],
      description: "The adjusted income statement shows normalized earnings.",
      keyTerms: [
        { term: "Adjusted EBITDA", definition: "EBITDA after normalization adjustments" },
        { term: "EBITDA Margin", definition: "EBITDA as a percentage of revenue" },
      ],
    },
    "5-2": {
      concepts: ["Working Capital", "Net Debt", "Off-Balance Sheet Items"],
      description: "The adjusted balance sheet identifies working capital requirements.",
      keyTerms: [
        { term: "Net Working Capital", definition: "Current assets minus current liabilities (often excludes cash and debt)" },
        { term: "Net Debt", definition: "Total debt minus cash and cash equivalents" },
      ],
    },
    "5-3": {
      concepts: ["EBITDA Bridge", "Adjustment Summary", "Earnings Quality"],
      description: "The QoE summary presents the bridge from reported to adjusted EBITDA.",
      keyTerms: [
        { term: "EBITDA Bridge", definition: "Walkthrough from reported to adjusted EBITDA showing each adjustment" },
      ],
    },
    "5-5": {
      concepts: ["NWC Target", "Peg Calculation", "Seasonal Adjustments"],
      description: "Working capital analysis determines the NWC target for the transaction.",
      keyTerms: [
        { term: "NWC Peg", definition: "The agreed working capital target that affects purchase price adjustments" },
        { term: "True-Up", definition: "Post-closing adjustment based on actual vs. target NWC" },
      ],
    },
    "5-6": {
      concepts: ["Free Cash Flow", "Cash Conversion"],
      description: "FCF analysis shows how efficiently the business converts EBITDA to cash.",
      keyTerms: [
        { term: "Free Cash Flow", definition: "Cash generated after operating expenses and capital expenditures" },
        { term: "Cash Conversion", definition: "Ratio of FCF to EBITDA" },
      ],
    },
    "5-7": {
      concepts: ["Bank Reconciliation", "Cash Verification", "Deposit Analysis"],
      description: "Proof of cash reconciles book cash to bank statements.",
      keyTerms: [
        { term: "Proof of Cash", definition: "Four-way reconciliation of beginning/ending cash and receipts/disbursements" },
      ],
    },
    "6-1": {
      concepts: ["Key Findings", "Deal Considerations", "Risk Factors"],
      description: "The executive summary distills the QoE analysis into key findings.",
      keyTerms: [
        { term: "Key Findings", definition: "Most significant discoveries from the QoE analysis" },
        { term: "Risk Factors", definition: "Items that could negatively impact deal value" },
      ],
    },
  };

  const education = SECTION_EDUCATION[`${phase}-${section}`];
  if (!education) {
    return `Current section: ${sectionName} (Phase ${phase}, Section ${section})`;
  }

  return `## Current Section: ${sectionName} (Phase ${phase}, Section ${section})\n### Key Concepts: ${education.concepts.join(", ")}\n### Purpose: ${education.description}\n### Key Terms:\n${education.keyTerms.map(t => `- **${t.term}**: ${t.definition}`).join("\n")}`;
}

// ============================================================
// STEP 3: SYSTEM PROMPTS
// ============================================================

const RESPONSE_CONTRACT = `
## Response Guidelines
- Never quote more than 25 words from any reference material
- Structure responses: 1) What we see (finding) 2) Why it matters (QoE impact) 3) How to verify
- Reference concepts, not passages. Express ideas in your own analytical voice
- Use light formatting: **bold** for key terms, numbered lists for findings. No headers (##) or horizontal rules.
- **Explanation Mode**: When asked why something was flagged/classified, cite the specific industry standards, RAG sources, and classification context used
- Always explain the reasoning chain: Data → Industry Standard → Classification → Risk Assessment`;

function buildQoEPrompt(projectContext: string, dataContext: string, sectionContext: string, phase?: number, section?: number): string {
  let extraRules = '';
  if (phase === 2 && section === 1) {
    extraRules = `
### Account Mapping Validation Mode
When validating account mappings:
- Compare each account's FS Type against QuickBooks standard mappings
- Flag common misclassifications: Undeposited Funds not as Cash, Accumulated Depreciation outside Fixed Assets, Revenue as Other Income
- Group findings by severity: Critical (affects EBITDA), Moderate (presentation), Minor (cosmetic)
- Focus on Revenue/COGS boundary, Operating vs Other expense, Current vs Long-term`;
  }
  if (phase === 2 && section === 2) {
    extraRules = `
### Trial Balance Validation Mode
When validating Trial Balance:
- Check balance (BS + IS = 0 per period)
- Flag missing period data, sign anomalies, large month-over-month variances (>50%)
- Materiality: flag account variances >10% of revenue, unclassified >5% of assets
- Balance check variances >$100 = data entry errors`;
  }

  return `You are a senior QoE analyst specializing in EBITDA adjustments and earnings quality.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${extraRules}
${RESPONSE_CONTRACT}

Focus on: EBITDA normalization, adjustment analysis, trial balance validation, COA classification, income statement trends, payroll normalization, **flagged transaction explanations**. Always reference the user's actual financial data. When explaining why transactions were flagged, cite the specific classification context and industry standards that triggered the flag.`;
}

function buildCashFlowPrompt(projectContext: string, dataContext: string, sectionContext: string): string {
  return `You are a senior QoE analyst specializing in cash flow analysis and working capital.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${RESPONSE_CONTRACT}

Focus on: Working capital metrics (DSO, DPO, DIO), free cash flow, proof of cash reconciliation, cash conversion, AR/AP aging analysis, balance sheet trends, liquidity assessment, **transfer classification explanations**. Calculate and reference specific metrics from the user's data. When explaining transfer classifications, reference the industry context and QoE standards used.`;
}

function buildRiskPrompt(projectContext: string, dataContext: string, sectionContext: string): string {
  return `You are a senior QoE analyst specializing in deal risk assessment.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${RESPONSE_CONTRACT}

Focus on: Customer/vendor concentration thresholds (flag >20% from single customer), related party transactions, debt covenants, material contract risks, CIM vs. financial data discrepancies, industry benchmarks, **risk factor explanations**. Quantify risk exposure using the user's data. When explaining risk flags, cite the specific thresholds and industry standards that triggered the alert.`;
}

function buildEducationPrompt(projectContext: string, sectionContext: string): string {
  return `You are a senior QoE analyst and educator helping finance professionals understand due diligence concepts.

${projectContext}

${sectionContext}
${RESPONSE_CONTRACT}

Focus on: Explaining QoE concepts clearly with real-world examples, teaching best practices for the current wizard section, defining key terms, describing common pitfalls. Be professional but approachable. Use terminology appropriate for finance professionals.`;
}

// ============================================================
// STEP 4: TEXTBOOK RAG RETRIEVAL (for education agent)
// ============================================================

function determineChunkCount(query: string): number {
  const queryLength = query.split(' ').length;
  const queryLower = query.toLowerCase();
  const isBroad = queryLower.includes('how do') || queryLower.includes('explain') ||
    queryLower.includes('what are the') || queryLower.includes('walk me through') || queryLength > 15;
  const isNarrow = queryLower.includes('what is') || queryLower.includes('define') || queryLength < 8;
  if (isNarrow) return 3;
  if (isBroad) return 7;
  return 5;
}

async function getRelevantContext(
  query: string,
  options: { sources?: string[]; minAuthority?: number; topics?: string[] } = {}
): Promise<{ context: string; sources: string[]; chunkCount: number } | null> {
  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: query }),
    });
    if (!embeddingRes.ok) { console.error("Embedding error:", embeddingRes.status); return null; }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    const matchCount = determineChunkCount(query);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: chunks, error } = await supabase.rpc('match_rag_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: 0.72,
      match_count: matchCount,
      source_filter: options.sources || null,
      min_authority: options.minAuthority || 0.0,
      topic_filter: options.topics || null,
    });

    if (error || !chunks?.length) return null;

    const formatted = chunks.map((c: any) => {
      const location = [c.chapter, c.section].filter(Boolean).join(' / ');
      return `[REFERENCE${location ? ` — ${location}` : ''}]\n${c.content}`;
    }).join('\n\n---\n\n');

    const sourcesUsed = [...new Set(chunks.map((c: any) => c.source || 'unknown'))] as string[];
    console.log(`[rag] Retrieved ${chunks.length} chunks from ${sourcesUsed.join(', ')}`);
    return { context: formatted, sources: sourcesUsed, chunkCount: chunks.length };
  } catch (err) {
    console.error("[rag] Error:", err);
    return null;
  }
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, wizardData, projectInfo, currentSection } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // === Security: Prompt injection guard ===
    const MAX_USER_MSG_LENGTH = 8000;
    const MAX_CONVERSATION_MESSAGES = 20;
    const INJECTION_PATTERNS = [
      /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions|rules|prompts)/i,
      /you\s+are\s+now\s+(a|an|in)/i,
      /^system\s*:/im,
      /\bDAN\b.*\bjailbreak/i,
      /pretend\s+you\s+are\s+(not|no\s+longer)\s+(an?\s+)?AI/i,
    ];

    let rawUserMessage = messages?.length > 0 ? messages[messages.length - 1].content : "";
    
    // Truncate overly long user messages
    if (rawUserMessage.length > MAX_USER_MSG_LENGTH) {
      console.warn(`[security] Truncating user message from ${rawUserMessage.length} to ${MAX_USER_MSG_LENGTH} chars`);
      rawUserMessage = rawUserMessage.slice(0, MAX_USER_MSG_LENGTH);
      if (messages?.length > 0) {
        messages[messages.length - 1].content = rawUserMessage;
      }
    }

    // Check for prompt injection patterns
    for (const pattern of INJECTION_PATTERNS) {
      if (pattern.test(rawUserMessage)) {
        console.warn(`[security] Prompt injection attempt blocked: ${rawUserMessage.slice(0, 100)}`);
        return new Response(
          JSON.stringify({ error: "Your message could not be processed. Please rephrase your question." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Trim conversation history to prevent abuse
    const trimmedMessages = Array.isArray(messages) && messages.length > MAX_CONVERSATION_MESSAGES
      ? messages.slice(-MAX_CONVERSATION_MESSAGES)
      : messages;

    const userMessage = rawUserMessage;
    console.log(`[orchestrator] Request: project=${projectInfo?.name}, section=${currentSection?.sectionName || 'none'}`);

    // === STEP 1: Classify intent ===
    const classification = await classifyIntent(userMessage, currentSection, OPENAI_API_KEY);
    console.log(`[orchestrator] Classification: ${classification.agents.join(', ')} — ${classification.reasoning}`);

    // === STEP 2: Retrieve project data via RAG ===
    const isEducationOnly = classification.agents.length === 1 && classification.agents[0] === 'education';
    const dataAgents = classification.agents.filter(a => a !== 'education');

    let ragDataContext = '';
    let ragChunkCount = 0;
    let ragTokenCount = 0;

    if (dataAgents.length > 0 && projectInfo?.id) {
      const ragResult = await retrieveProjectData(
        projectInfo.id,
        userMessage,
        dataAgents,
        OPENAI_API_KEY
      );
      ragDataContext = ragResult.dataContext;
      ragChunkCount = ragResult.chunkCount;
      ragTokenCount = ragResult.tokenCount;
    }

    // Add inline wizard data (adjustments, reclasses, deal params — always small)
    const inlineData = loadInlineWizardData(wizardData);

    // === STEP 2.5: Load flagged transactions (for explanation and context) ===
    let flaggedContext = '';
    if (dataAgents.length > 0 && projectInfo?.id) {
      const flaggedResult = await loadFlaggedTransactions(projectInfo.id, dataAgents);
      if (flaggedResult) {
        flaggedContext = flaggedResult.context;
        console.log(`[orchestrator] Loaded ${flaggedResult.totalCount} flagged transactions`);
      }
    }

    // === FALLBACK: Direct query processed_data when RAG is empty ===
    let fallbackData = '';
    if (ragChunkCount === 0 && projectInfo?.id && dataAgents.length > 0) {
      console.log(`[orchestrator] RAG empty — attempting fallback direct query (inlineData=${!!inlineData})`);
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
          const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
          const { data: pdRecords } = await sb
            .from('processed_data')
            .select('data_type, data, period_start, period_end')
            .eq('project_id', projectInfo.id)
            .in('data_type', [
              'trial_balance', 'chart_of_accounts', 'income_statement', 'balance_sheet',
              'ar_aging', 'ap_aging', 'payroll', 'fixed_assets', 'general_ledger',
              'customer_concentration', 'vendor_concentration', 'debt_schedule',
              'material_contract', 'bank_transactions', 'credit_card_transactions',
              'proof_of_cash', 'cim_insights', 'tax_return', 'inventory'
            ])
            .order('period_start', { ascending: true })
            .limit(20);

          if (pdRecords && pdRecords.length > 0) {
            const summaries: string[] = [];
            for (const rec of pdRecords) {
              const d = rec.data as any;
              if (!d) continue;
              const period = rec.period_start ? `${rec.period_start} to ${rec.period_end || '?'}` : 'unknown period';

              if (rec.data_type === 'trial_balance') {
                // Recursive flattener for nested QB rows
                const flattenRows = (rows: any[], depth = 0): { name: string; amount: string }[] => {
                  const results: { name: string; amount: string }[] = [];
                  for (const r of rows) {
                    const cols = r.colData || r.ColData || [];
                    const name = cols[0]?.value;
                    const amount = cols[1]?.value;
                    if (name && name !== '' && amount && amount !== '0') {
                      results.push({ name, amount });
                    }
                    // Recurse into sub-rows
                    const subRows = r.rows?.row || r.rows?.Row || r.Rows?.Row || [];
                    if (Array.isArray(subRows) && subRows.length > 0) {
                      results.push(...flattenRows(subRows, depth + 1));
                    }
                  }
                  return results;
                };

                let accounts: string[] = [];
                if (d.monthlyReports && Array.isArray(d.monthlyReports)) {
                  for (const mr of d.monthlyReports.slice(0, 6)) {
                    const rows = mr?.report?.rows?.row || mr?.report?.rows?.Row || [];
                    if (Array.isArray(rows)) {
                      const monthLabel = `${mr.year || ''}-${String(mr.month || '').padStart(2, '0')}`;
                      const flat = flattenRows(rows).slice(0, 40);
                      const monthAccounts = flat.map(a => `${a.name}: $${Number(a.amount).toLocaleString()}`);
                      accounts.push(`### ${monthLabel}\n${monthAccounts.join('\n')}`);
                    }
                  }
                  if (accounts.length > 0) {
                    summaries.push(`## Trial Balance (${period})\n${accounts.join('\n')}`);
                  }
                } else {
                  const flatAccounts = Array.isArray(d) ? d : (d.accounts || d.rows || []);
                  const topAccounts = flatAccounts.slice(0, 30).map((a: any) =>
                    `${a.name || a.accountName || 'Unknown'}: $${Number(a.amount || a.balance || 0).toLocaleString()}`
                  );
                  if (topAccounts.length > 0) summaries.push(`## Trial Balance (${period})\n${topAccounts.join('\n')}`);
                }
              } else if (rec.data_type === 'chart_of_accounts') {
                const accounts = Array.isArray(d) ? d : (d.accounts || []);
                const mapped = accounts.slice(0, 40).map((a: any) =>
                  `${a.name || a.Name || '?'} — ${a.fsType || a.AccountType || a.Classification || '?'}`
                );
                summaries.push(`## Chart of Accounts (${accounts.length} accounts)\n${mapped.join('\n')}`);
              } else if (rec.data_type === 'income_statement' || rec.data_type === 'balance_sheet') {
                // Financial statements — extract line items
                const lines = d.lineItems || d.lines || d.rows || [];
                if (Array.isArray(lines) && lines.length > 0) {
                  const items = lines.slice(0, 30).map((l: any) =>
                    `${l.label || l.name || l.account || '?'}: $${Number(l.amount || l.value || 0).toLocaleString()}`
                  );
                  summaries.push(`## ${rec.data_type.replace('_', ' ').toUpperCase()} (${period})\n${items.join('\n')}`);
                } else {
                  summaries.push(`## ${rec.data_type.replace('_', ' ').toUpperCase()} (${period})\n${JSON.stringify(d).slice(0, 2000)}`);
                }
              } else if (rec.data_type === 'ar_aging' || rec.data_type === 'ap_aging') {
                const entries = d.entries || d.customers || d.vendors || [];
                const label = rec.data_type === 'ar_aging' ? 'AR Aging' : 'AP Aging';
                if (Array.isArray(entries) && entries.length > 0) {
                  const items = entries.slice(0, 20).map((e: any) =>
                    `${e.name || e.customer || e.vendor || '?'}: Current=$${Number(e.current || 0).toLocaleString()}, 30d=$${Number(e['1-30'] || e.thirty || 0).toLocaleString()}, 60d=$${Number(e['31-60'] || e.sixty || 0).toLocaleString()}, 90d+=$${Number(e['90+'] || e.ninety || 0).toLocaleString()}`
                  );
                  summaries.push(`## ${label} (${period})\n${items.join('\n')}`);
                } else {
                  summaries.push(`## ${label} (${period})\n${JSON.stringify(d).slice(0, 1500)}`);
                }
              } else if (rec.data_type === 'payroll') {
                const employees = d.employees || d.items || d.entries || [];
                if (Array.isArray(employees) && employees.length > 0) {
                  const items = employees.slice(0, 20).map((e: any) =>
                    `${e.name || e.employee || '?'}: $${Number(e.totalComp || e.salary || e.amount || 0).toLocaleString()} (${e.role || e.title || e.department || '?'})`
                  );
                  summaries.push(`## Payroll (${period})\n${items.join('\n')}`);
                } else {
                  summaries.push(`## Payroll (${period})\n${JSON.stringify(d).slice(0, 1500)}`);
                }
              } else if (rec.data_type === 'customer_concentration' || rec.data_type === 'vendor_concentration') {
                const label = rec.data_type === 'customer_concentration' ? 'Customer Concentration' : 'Vendor Concentration';
                const items = d.entries || d.customers || d.vendors || d.items || [];
                if (Array.isArray(items) && items.length > 0) {
                  const mapped = items.slice(0, 15).map((e: any) =>
                    `${e.name || '?'}: $${Number(e.revenue || e.amount || e.spend || 0).toLocaleString()} (${e.percentage || e.pct || '?'}%)`
                  );
                  summaries.push(`## ${label} (${period})\n${mapped.join('\n')}`);
                } else {
                  summaries.push(`## ${label} (${period})\n${JSON.stringify(d).slice(0, 1500)}`);
                }
              } else if (rec.data_type === 'fixed_assets') {
                const assets = d.assets || d.items || d.entries || [];
                if (Array.isArray(assets) && assets.length > 0) {
                  const mapped = assets.slice(0, 20).map((a: any) =>
                    `${a.name || a.description || '?'}: Cost=$${Number(a.cost || a.originalCost || 0).toLocaleString()}, Depr=$${Number(a.depreciation || a.accumulatedDepreciation || 0).toLocaleString()}`
                  );
                  summaries.push(`## Fixed Assets (${period})\n${mapped.join('\n')}`);
                } else {
                  summaries.push(`## Fixed Assets (${period})\n${JSON.stringify(d).slice(0, 1500)}`);
                }
              } else if (rec.data_type === 'cim_insights') {
                summaries.push(`## CIM Insights\n${JSON.stringify(d).slice(0, 3000)}`);
              } else {
                // Generic fallback for debt_schedule, material_contract, general_ledger, etc.
                summaries.push(`## ${rec.data_type.replace(/_/g, ' ').toUpperCase()} (${period})\n${JSON.stringify(d).slice(0, 2000)}`);
              }
            }
            fallbackData = summaries.join('\n\n');
            console.log(`[orchestrator] Fallback loaded ${pdRecords.length} processed_data records`);
          }
        }
      } catch (fbErr) {
        console.error('[orchestrator] Fallback query error:', fbErr);
      }
    }

    const dataContext = [ragDataContext, inlineData, flaggedContext, fallbackData].filter(Boolean).join('\n\n');

    console.log(`[orchestrator] Data context: ${ragChunkCount} RAG chunks (${ragTokenCount} tokens) + ${inlineData ? 'inline wizard data' : 'no inline data'}${flaggedContext ? ' + flagged transactions' : ''}${fallbackData ? ' + fallback processed_data' : ''}`);

    // Build project context
    let projectContext = '';
    if (projectInfo) {
      projectContext = `## Project: ${projectInfo.name || 'Unnamed'}\n- Target: ${projectInfo.targetCompany || 'Not specified'}\n- Industry: ${projectInfo.industry || 'Not specified'}\n- Periods: ${projectInfo.periods?.join(', ') || 'Not specified'}`;
      if (projectInfo.industryTraitsJson || projectInfo.industryNarrative) {
        projectContext += `\n## Industry Intelligence\n`;
        if (projectInfo.industryTraitsJson) projectContext += projectInfo.industryTraitsJson + '\n';
        if (projectInfo.industryNarrative) projectContext += projectInfo.industryNarrative + '\n';
      }
    }

    // Build section context
    const sectionContext = currentSection
      ? loadEducationData(currentSection.phase, currentSection.section, currentSection.sectionName)
      : '';

    // Build system prompt based on agent(s)
    let systemPrompt = '';

    if (classification.agents.length === 1) {
      const agent = classification.agents[0];
      switch (agent) {
        case 'qoe':
          systemPrompt = buildQoEPrompt(projectContext, dataContext, sectionContext, currentSection?.phase, currentSection?.section);
          break;
        case 'cashflow':
          systemPrompt = buildCashFlowPrompt(projectContext, dataContext, sectionContext);
          break;
        case 'risk':
          systemPrompt = buildRiskPrompt(projectContext, dataContext, sectionContext);
          break;
        case 'education':
          systemPrompt = buildEducationPrompt(projectContext, sectionContext);
          break;
      }
    } else {
      systemPrompt = `You are a senior QoE analyst. Answer the question using all relevant data below.

${projectContext}

## Financial Data:
${dataContext}

${sectionContext}
${RESPONSE_CONTRACT}

You have expertise across: EBITDA adjustments, cash flow analysis, and risk assessment. Focus on the aspects most relevant to the user's question.`;
    }

    // === STEP 3: Textbook RAG — only for education-only queries ===
    const ragResult = isEducationOnly ? await getRelevantContext(userMessage) : null;

    // === STEP 4: Build messages and stream response ===
    const messagesWithContext = [
      { role: "system", content: systemPrompt },
      ...(ragResult ? [{
        role: "user" as const,
        content: `### Retrieved References (summarize concepts, do not quote verbatim or cite source names):\n\n${ragResult.context}\n\n---\nThe above reference material is for your reasoning only. Use it to inform your analysis but express ideas in your own words. Do not mention or cite any source, author, or textbook by name. Now answer the user's question below.`
      }] : []),
      ...(trimmedMessages || messages),
    ];

    const requestPayload = {
      model: "gpt-5",
      messages: messagesWithContext,
      stream: true,
    };
    const payloadJson = JSON.stringify(requestPayload);
    console.log(`[orchestrator] Sending to AI. Agents: ${classification.agents.join(',')}. Context: ${systemPrompt.length} chars. RAG chunks: project=${ragChunkCount}, textbook=${ragResult?.chunkCount || 0}`);

    const callAI = () => fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: payloadJson,
    });

    let response = await callAI();

    // 1 retry on transient 500
    if (!response.ok && response.status === 500) {
      await response.text();
      await new Promise(r => setTimeout(r, 500));
      response = await callAI();
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("[orchestrator] OpenAI error:", response.status, errText, "| Key prefix:", OPENAI_API_KEY.substring(0, 8));

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[orchestrator] Streaming response from OpenAI`);
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[orchestrator] Error:", error);
    console.error("[orchestrator] Full error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
