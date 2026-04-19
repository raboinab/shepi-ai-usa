/**
 * analyze-wip
 * Runs structured WIP analysis via OpenAI (gpt-4o-mini).
 * Detects: margin outliers, over-billing concentration, near-complete jobs,
 *          TB-vs-schedule variance.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface WIPJobInput {
  id: string;
  jobName: string;
  contractValue: number;
  costsToDate: number;
  billingsToDate: number;
  status?: string;
}

interface RequestBody {
  jobs: WIPJobInput[];
  tbBalances?: {
    contractAssets?: { accountName: string; balance: number };
    contractLiabilities?: { accountName: string; balance: number };
    jobCostsInProcess?: { accountName: string; balance: number };
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body.jobs || !Array.isArray(body.jobs) || body.jobs.length === 0) {
      return new Response(JSON.stringify({ error: "No WIP jobs provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pre-compute aggregates to feed the model
    const enrichedJobs = body.jobs.map(j => {
      const pctComplete = j.contractValue > 0 ? j.costsToDate / j.contractValue : 0;
      const earnedRevenue = j.contractValue * pctComplete;
      const overUnder = j.billingsToDate - earnedRevenue;
      return { ...j, pctComplete, earnedRevenue, overUnder };
    });

    const totalContract = enrichedJobs.reduce((s, j) => s + j.contractValue, 0);
    const totalOverBilled = enrichedJobs.filter(j => j.overUnder > 0).reduce((s, j) => s + j.overUnder, 0);
    const totalUnderBilled = enrichedJobs.filter(j => j.overUnder < 0).reduce((s, j) => s + j.overUnder, 0);
    const netOverUnder = totalOverBilled + totalUnderBilled;

    const jobLines = enrichedJobs.map(j =>
      `- "${j.jobName}" | contract=$${j.contractValue.toFixed(0)} | costs=$${j.costsToDate.toFixed(0)} | billings=$${j.billingsToDate.toFixed(0)} | %complete=${(j.pctComplete * 100).toFixed(1)}% | over/(under)=$${j.overUnder.toFixed(0)} | status=${j.status ?? "active"}`
    ).join("\n");

    const tbContext = body.tbBalances
      ? `\n\n**Mapped Trial Balance balances (compare to schedule totals):**\n` +
        (body.tbBalances.contractAssets ? `- Contract Assets ("${body.tbBalances.contractAssets.accountName}"): $${body.tbBalances.contractAssets.balance.toFixed(0)} (schedule under-billed total: $${Math.abs(totalUnderBilled).toFixed(0)})\n` : "") +
        (body.tbBalances.contractLiabilities ? `- Contract Liabilities ("${body.tbBalances.contractLiabilities.accountName}"): $${body.tbBalances.contractLiabilities.balance.toFixed(0)} (schedule over-billed total: $${totalOverBilled.toFixed(0)})\n` : "") +
        (body.tbBalances.jobCostsInProcess ? `- Job Costs in Process ("${body.tbBalances.jobCostsInProcess.accountName}"): $${body.tbBalances.jobCostsInProcess.balance.toFixed(0)}\n` : "")
      : "";

    const systemPrompt = `You are an M&A due diligence specialist analyzing Work in Progress schedules for construction and project-based businesses. You produce concise, decision-grade findings.`;

    const userPrompt = `Analyze this WIP Schedule and surface diligence findings.

**Portfolio totals:**
- Contract value: $${totalContract.toFixed(0)}
- Over-billed (Contract Liabilities): $${totalOverBilled.toFixed(0)}
- Under-billed (Contract Assets): $${Math.abs(totalUnderBilled).toFixed(0)}
- Net over/(under): $${netOverUnder.toFixed(0)}

**Jobs:**
${jobLines}${tbContext}

Identify findings in these categories — only emit a finding if it is materially noteworthy:
1. **margin_outlier** — jobs whose %complete suggests cost overruns vs contract value (>100% complete, or unusually high cost growth)
2. **over_billing_concentration** — single job representing >40% of total over-billing
3. **near_complete** — jobs >90% complete (cutoff/revenue recognition risk)
4. **tb_variance** — material variance between schedule totals and mapped TB balances (>10%)
5. **stale_or_inactive** — non-active jobs with significant remaining contract value
6. **data_quality** — missing names, zero contract value, negative figures

Be conservative. Empty findings array is acceptable for a clean schedule.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_findings",
              description: "Report WIP analysis findings",
              parameters: {
                type: "object",
                properties: {
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: {
                          type: "string",
                          enum: ["margin_outlier", "over_billing_concentration", "near_complete", "tb_variance", "stale_or_inactive", "data_quality"],
                        },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                        title: { type: "string", description: "Short title (max 80 chars)" },
                        narrative: { type: "string", description: "2-3 sentence explanation" },
                        affectedJobIds: { type: "array", items: { type: "string" } },
                        estimatedImpact: { type: "number", description: "Dollar impact if applicable, else 0" },
                      },
                      required: ["category", "severity", "title", "narrative", "affectedJobIds", "estimatedImpact"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "1-2 sentence portfolio assessment" },
                },
                required: ["findings", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_findings" } },
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      return new Response(JSON.stringify({ error: `OpenAI error: ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No findings returned" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        ...result,
        portfolioMetrics: {
          totalContract,
          totalOverBilled,
          totalUnderBilled,
          netOverUnder,
          jobCount: enrichedJobs.length,
        },
        analyzedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("analyze-wip error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
