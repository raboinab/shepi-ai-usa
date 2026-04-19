import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key, x-service-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Transaction {
  id: string;
  amount: number;
  memo: string;
  name: string;
  date: string;
}

interface ClassifiedTransaction {
  id: string;
  category: "interbank" | "owner" | "operating";
}

interface PeriodClassification {
  interbank: number;
  owner: number;
  transactions: ClassifiedTransaction[];
}

const BATCH_SIZE = 200;

async function classifyBatch(
  transactions: Transaction[],
  companyName: string,
  apiKey: string
): Promise<ClassifiedTransaction[]> {
  const txnList = transactions
    .map((t) => `- id:"${t.id}" | $${t.amount.toFixed(2)} | ${t.memo}`)
    .join("\n");

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are classifying bank transactions for "${companyName}".

Classify each transaction into exactly one category:

INTERBANK: Transfers between the company's own bank accounts.
  - "Online Transfer to/from" the company or its subsidiaries/holdings
  - Wire transfers between business accounts the company owns
  - Internal sweeps or concentration account transfers

OWNER: Personal expenses, owner draws, or owner-related payments from the business account.
  - Credit card payments for personal cards (Chase, Amex, Barclaycard, etc.)
  - Consumer auto/loan payments (auto pay, mortgage, student loans)
  - Transfers to owner's personal checking/savings accounts
  - Owner capital withdrawals, draws, distributions
  - Owner capital injections (credits coming FROM the owner)
  - Personal insurance payments
  - Personal reimbursements paid from business
  - Any payment referencing the owner's personal name + a personal purpose

OPERATING: Normal business transactions (everything else).
  - Vendor payments, payroll, rent, utilities
  - Customer deposits, merchant processing credits
  - Tax payments, business insurance
  - Business loan payments

When uncertain, default to OPERATING.`,
          },
          {
            role: "user",
            content: `Classify these ${transactions.length} transactions:\n\n${txnList}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_transactions",
              description:
                "Classify each transaction as interbank, owner, or operating.",
              parameters: {
                type: "object",
                properties: {
                  classifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        category: {
                          type: "string",
                          enum: ["interbank", "owner", "operating"],
                        },
                      },
                      required: ["id", "category"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["classifications"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: { name: "classify_transactions" },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[CLASSIFY] AI gateway error ${response.status}:`,
      errorText
    );
    throw new Error(`AI gateway returned ${response.status}`);
  }

  const result = await response.json();
  const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    console.error("[CLASSIFY] No tool call in response:", JSON.stringify(result));
    throw new Error("AI did not return tool call output");
  }

  const parsed = JSON.parse(toolCall.function.arguments);
  return (parsed.classifications || []) as ClassifiedTransaction[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const { project_id } = await req.json();
    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[CLASSIFY] Starting classification for project ${project_id}`
    );

    // Use service role for data access
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Verify project access
    const { data: project, error: projectError } = await adminClient
      .from("projects")
      .select("id, target_company, client_name, name")
      .eq("id", project_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: "Project not found or access denied" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const companyName =
      project.target_company || project.client_name || project.name || "the company";

    // Fetch all bank_transactions records
    const { data: bankRecords, error: bankError } = await adminClient
      .from("processed_data")
      .select("id, period_start, data")
      .eq("project_id", project_id)
      .eq("data_type", "bank_transactions")
      .order("period_start", { ascending: true });

    if (bankError) {
      console.error("[CLASSIFY] Error fetching bank records:", bankError);
      throw bankError;
    }

    if (!bankRecords || bankRecords.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No bank transactions found",
          classifications: {},
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[CLASSIFY] Found ${bankRecords.length} period records to classify`
    );

    const apiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const results: Record<string, PeriodClassification> = {};

    // Process all transactions across all periods in batches
    interface TaggedTransaction extends Transaction {
      periodKey: string;
    }

    const allTransactions: TaggedTransaction[] = [];

    for (const record of bankRecords) {
      const data = record.data as Record<string, unknown>;
      const transactions = (data.transactions as Array<Record<string, unknown>>) || [];
      const periodKey = (record.period_start as string)?.substring(0, 7) || "unknown";

      // Initialize period result
      if (!results[periodKey]) {
        results[periodKey] = { interbank: 0, owner: 0, transactions: [] };
      }

      for (let i = 0; i < transactions.length; i++) {
        const t = transactions[i];
        const memo =
          (t.memo as string) ||
          ((t.descriptionLines as string[]) || []).join(" ") ||
          (t.name as string) ||
          "";
        const amount = Math.abs(Number(t.amount) || 0);

        allTransactions.push({
          id: `${periodKey}_${i}`,
          amount,
          memo: memo.substring(0, 200), // Truncate long descriptions
          name: (t.name as string) || "",
          date: (t.date as string) || "",
          periodKey,
        });
      }
    }

    console.log(
      `[CLASSIFY] Total transactions to classify: ${allTransactions.length}`
    );

    // Batch and classify
    for (let i = 0; i < allTransactions.length; i += BATCH_SIZE) {
      const batch = allTransactions.slice(i, i + BATCH_SIZE);
      console.log(
        `[CLASSIFY] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} transactions)`
      );

      try {
        const classifications = await classifyBatch(batch, companyName, apiKey);

        // Map classifications back to periods
        const classMap = new Map(classifications.map((c) => [c.id, c.category]));

        for (const txn of batch) {
          const category = classMap.get(txn.id) || "operating";
          const periodResult = results[txn.periodKey];

          if (category === "interbank") {
            periodResult.interbank += txn.amount;
          } else if (category === "owner") {
            periodResult.owner += txn.amount;
          }

          periodResult.transactions.push({ id: txn.id, category });
        }
      } catch (batchError) {
        console.error(
          `[CLASSIFY] Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`,
          batchError
        );
        // Mark all as operating on failure
        for (const txn of batch) {
          results[txn.periodKey].transactions.push({
            id: txn.id,
            category: "operating",
          });
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < allTransactions.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    // Store results in processed_data (one record with all periods)
    const { error: upsertError } = await adminClient
      .from("processed_data")
      .upsert(
        {
          project_id,
          user_id: userId,
          source_type: "ai_classification",
          data_type: "transfer_classification",
          data: results,
          record_count: allTransactions.length,
          validation_status: "completed",
        },
        { onConflict: "project_id,data_type,source_type" }
      );

    // If upsert with onConflict fails (no unique constraint), try insert after delete
    if (upsertError) {
      console.log("[CLASSIFY] Upsert failed, trying delete+insert:", upsertError.message);
      await adminClient
        .from("processed_data")
        .delete()
        .eq("project_id", project_id)
        .eq("data_type", "transfer_classification");

      const { error: insertError } = await adminClient
        .from("processed_data")
        .insert({
          project_id,
          user_id: userId,
          source_type: "ai_classification",
          data_type: "transfer_classification",
          data: results,
          record_count: allTransactions.length,
          validation_status: "completed",
        });

      if (insertError) {
        console.error("[CLASSIFY] Insert error:", insertError);
        throw insertError;
      }
    }

    // Build summary
    const summary: Record<string, { interbank: number; owner: number }> = {};
    for (const [period, data] of Object.entries(results)) {
      summary[period] = { interbank: data.interbank, owner: data.owner };
    }

    console.log(`[CLASSIFY] Classification complete. Periods: ${Object.keys(summary).length}`);

    return new Response(
      JSON.stringify({ success: true, classifications: summary }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[CLASSIFY] Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
