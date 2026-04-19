/**
 * suggest-wip-account
 * Given a list of COA accounts and a WIP slot definition, asks OpenAI (gpt-4o-mini)
 * to suggest the best matching account. Returns structured output.
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

interface AccountInput {
  accountId: string;
  name: string;
  category?: string;
  fsType?: "BS" | "IS";
}

interface RequestBody {
  slotKey: string;
  slotLabel: string;
  slotDescription: string;
  accounts: AccountInput[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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
    if (!body.slotKey || !body.accounts || !Array.isArray(body.accounts)) {
      return new Response(JSON.stringify({ error: "Missing slotKey or accounts" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Restrict to BS accounts to keep the candidate list tight
    const bsAccounts = body.accounts.filter(a => a.fsType === "BS" || !a.fsType);
    if (bsAccounts.length === 0) {
      return new Response(JSON.stringify({ error: "No Balance Sheet accounts available" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountList = bsAccounts
      .map(a => `- id="${a.accountId}" | name="${a.name}"${a.category ? ` | category="${a.category}"` : ""}`)
      .join("\n");

    const systemPrompt = `You are an M&A due diligence accountant specializing in construction and project-based businesses. You map a target company's Chart of Accounts to standard WIP (Work in Progress) accounting slots.`;

    const userPrompt = `Identify the single best Balance Sheet account from this Chart of Accounts that represents:

**Slot:** ${body.slotLabel}
**Definition:** ${body.slotDescription}

**Chart of Accounts (Balance Sheet only):**
${accountList}

Pick the account whose NAME and (if present) CATEGORY most clearly matches the slot definition. If no account is a reasonable match, set confidence to "none" and pick the closest candidate anyway. Be conservative — high confidence only when the name explicitly references the WIP concept (e.g., "Billings in Excess", "Underbillings", "WIP").`;

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
              name: "suggest_account",
              description: "Return the best-matching WIP account from the COA",
              parameters: {
                type: "object",
                properties: {
                  accountId: { type: "string", description: "The id of the chosen account" },
                  accountName: { type: "string", description: "The name of the chosen account" },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low", "none"],
                    description: "Match confidence",
                  },
                  reasoning: { type: "string", description: "1-2 sentence explanation" },
                },
                required: ["accountId", "accountName", "confidence", "reasoning"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_account" } },
        temperature: 0.1,
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
      return new Response(JSON.stringify({ error: "No suggestion returned" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestion = JSON.parse(toolCall.function.arguments);

    // Validate suggested accountId actually exists
    const exists = bsAccounts.find(a => a.accountId === suggestion.accountId);
    if (!exists) {
      // Fallback: try to resolve by name
      const byName = bsAccounts.find(a => a.name.toLowerCase() === String(suggestion.accountName || "").toLowerCase());
      if (byName) {
        suggestion.accountId = byName.accountId;
        suggestion.accountName = byName.name;
      } else {
        return new Response(JSON.stringify({ error: "AI returned invalid accountId", suggestion }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify(suggestion), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("suggest-wip-account error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
