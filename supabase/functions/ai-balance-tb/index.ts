// ai-balance-tb — AI agent that reclassifies CoA, edits TB amounts, creates
// accounts, and posts plug entries to drive BS+IS=0 (debits=credits) per period.
// Snapshots wizard_data before/after for one-click undo.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
import Anthropic from "npm:@anthropic-ai/sdk@0.88.0";
import { ensureZdrEnabled } from "../_shared/zdrGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_STEPS = 24;
const BALANCE_TOLERANCE = 1; // dollars

interface TBAccount {
  id: string;
  fsType: "BS" | "IS";
  accountNumber?: string;
  accountName: string;
  accountType?: string;
  accountSubtype?: string;
  monthlyValues: Record<string, number>;
}

interface CoaAccount {
  id?: string;
  accountNumber?: string;
  accountName: string;
  fsType: "BS" | "IS";
  category?: string;
}

interface Period { id: string; label?: string }

interface WizardData {
  trialBalance?: { accounts?: TBAccount[]; [k: string]: unknown };
  chartOfAccounts?: CoaAccount[];
  [k: string]: unknown;
}

function balanceByPeriod(accounts: TBAccount[], periods: Period[]) {
  return periods.map((p) => {
    let bs = 0, is = 0;
    for (const a of accounts) {
      const v = a.monthlyValues?.[p.id] || 0;
      if (a.fsType === "BS") bs += v; else is += v;
    }
    return { periodId: p.id, label: p.label || p.id, bs, is, check: bs + is };
  });
}

export type TbStructureReason =
  | "no_is_accounts"
  | "no_bs_accounts"
  | "is_all_zero"
  | "imbalance_is_noise";

export interface TbStructureResult {
  status: "ok" | "degenerate";
  reason?: TbStructureReason;
  diagnostics: {
    bsAccounts: number;
    isAccounts: number;
    maxAbsImbalance: number;
    periodsChecked: number;
    maxAbsIsRowSum: number;
  };
  message?: string;
}

export function validateTbStructure(
  accounts: TBAccount[],
  periods: Period[],
  tolerance = BALANCE_TOLERANCE,
): TbStructureResult {
  const bsAccounts = accounts.filter((a) => a.fsType === "BS").length;
  const isAccounts = accounts.filter((a) => a.fsType === "IS").length;

  const balances = balanceByPeriod(accounts, periods);
  const maxAbsImbalance = balances.reduce((m, b) => Math.max(m, Math.abs(b.check)), 0);

  // Largest single IS account magnitude (summed across periods, absolute value)
  let maxAbsIsRowSum = 0;
  for (const a of accounts) {
    if (a.fsType !== "IS") continue;
    let s = 0;
    for (const p of periods) s += a.monthlyValues?.[p.id] || 0;
    const abs = Math.abs(s);
    if (abs > maxAbsIsRowSum) maxAbsIsRowSum = abs;
  }

  const diagnostics = {
    bsAccounts,
    isAccounts,
    maxAbsImbalance,
    periodsChecked: periods.length,
    maxAbsIsRowSum,
  };

  if (bsAccounts === 0) {
    return {
      status: "degenerate",
      reason: "no_bs_accounts",
      diagnostics,
      message:
        "Trial balance has no Balance Sheet accounts. Upload a Balance Sheet or rebuild the TB from the General Ledger before auto-balancing.",
    };
  }

  if (isAccounts === 0) {
    return {
      status: "degenerate",
      reason: "no_is_accounts",
      diagnostics,
      message:
        `Trial balance has ${bsAccounts} Balance Sheet accounts and 0 Income Statement accounts. The TB appears to have been derived from a Balance Sheet only — net income was folded into Retained Earnings instead of decomposed into revenue/expense rows. Rebuild the TB from the General Ledger before auto-balancing.`,
    };
  }

  if (maxAbsIsRowSum === 0) {
    return {
      status: "degenerate",
      reason: "is_all_zero",
      diagnostics,
      message:
        "Income Statement accounts exist but all values are zero across every period. Revenue and expense appear to be lumped into Retained Earnings. Rebuild the TB from the General Ledger before auto-balancing.",
    };
  }

  // Noise gate: imbalance is trivially small vs. the largest IS row, and any
  // plug would just absorb rounding error rather than reveal a real issue.
  if (
    maxAbsImbalance > tolerance &&
    maxAbsIsRowSum > 0 &&
    maxAbsImbalance < 0.001 * maxAbsIsRowSum
  ) {
    return {
      status: "degenerate",
      reason: "imbalance_is_noise",
      diagnostics,
      message:
        "Trial balance is balanced within rounding tolerance relative to the underlying revenue/expense magnitudes. Any AI plug would just absorb rounding noise — no action needed.",
    };
  }

  return { status: "ok", diagnostics };
}


function findAccount(accounts: TBAccount[], ref: string): TBAccount | undefined {
  const r = (ref || "").toString().trim().toLowerCase();
  return accounts.find((a) =>
    a.id === ref ||
    (a.accountNumber || "").toString().toLowerCase() === r ||
    (a.accountName || "").toLowerCase() === r,
  );
}

function findCoa(coa: CoaAccount[], ref: string): CoaAccount | undefined {
  const r = (ref || "").toString().trim().toLowerCase();
  return coa.find((a) =>
    a.id === ref ||
    (a.accountNumber || "").toString().toLowerCase() === r ||
    (a.accountName || "").toLowerCase() === r,
  );
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "reclassify_account",
    description: "Change an account's financial-statement type (BS vs IS) and/or category. Updates the matching CoA entry too. Use when an account is mis-classified (e.g. an expense sitting under BS).",
    input_schema: {
      type: "object",
      properties: {
        accountRef: { type: "string", description: "Account id, number, or exact name" },
        newFsType: { type: "string", enum: ["BS", "IS"] },
        newCategory: { type: "string", description: "Optional category, e.g. 'Operating Expenses', 'Current Assets'" },
        reason: { type: "string" },
      },
      required: ["accountRef", "newFsType", "reason"],
    },
  },
  {
    name: "set_tb_amount",
    description: "Overwrite the balance of an account in a specific period. Use sparingly — prefer reclassify_account or post_plug_entry when possible.",
    input_schema: {
      type: "object",
      properties: {
        accountRef: { type: "string" },
        periodId: { type: "string" },
        amount: { type: "number", description: "Signed value following debit-positive / credit-negative convention used elsewhere in the TB" },
        reason: { type: "string" },
      },
      required: ["accountRef", "periodId", "amount", "reason"],
    },
  },
  {
    name: "create_account",
    description: "Create a new account in both CoA and TB (zero balances). Use to add a 'Suspense / Plug' or missing equity account before posting an entry.",
    input_schema: {
      type: "object",
      properties: {
        accountName: { type: "string" },
        fsType: { type: "string", enum: ["BS", "IS"] },
        category: { type: "string" },
        accountNumber: { type: "string" },
        reason: { type: "string" },
      },
      required: ["accountName", "fsType", "reason"],
    },
  },
  {
    name: "post_plug_entry",
    description: "Post a balancing entry to a single account in a specific period to force BS+IS=0. Creates the target account if it doesn't exist. Most common use: plug to 'Retained Earnings' (BS Equity) or a new 'Suspense' account.",
    input_schema: {
      type: "object",
      properties: {
        periodId: { type: "string" },
        amount: { type: "number", description: "Amount to add to the account in that period (signed)" },
        accountName: { type: "string", description: "Existing or new account to plug into" },
        fsType: { type: "string", enum: ["BS", "IS"], description: "Required if creating the account" },
        category: { type: "string" },
        reason: { type: "string" },
      },
      required: ["periodId", "amount", "accountName", "reason"],
    },
  },
  {
    name: "finish",
    description: "Call when the trial balance is acceptably balanced or no further automated fixes are safe. Returns control to the user.",
    input_schema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Short user-facing summary of what was changed and what still needs human review" },
      },
      required: ["message"],
    },
  },
];

interface ChangeLog { tool: string; description: string }

function applyTool(
  toolName: string,
  input: Record<string, unknown>,
  wd: WizardData,
  periods: Period[],
): { result: string; change?: ChangeLog } {
  const tb = wd.trialBalance ?? (wd.trialBalance = { accounts: [] });
  const accounts: TBAccount[] = Array.isArray(tb.accounts) ? tb.accounts : (tb.accounts = []);
  const coa: CoaAccount[] = Array.isArray(wd.chartOfAccounts) ? wd.chartOfAccounts : (wd.chartOfAccounts = []);

  switch (toolName) {
    case "reclassify_account": {
      const ref = String(input.accountRef || "");
      const newFsType = input.newFsType as "BS" | "IS";
      const newCategory = input.newCategory as string | undefined;
      const acct = findAccount(accounts, ref);
      const coaEntry = findCoa(coa, ref);
      if (!acct && !coaEntry) return { result: `ERROR: account "${ref}" not found` };
      if (acct) {
        acct.fsType = newFsType;
        if (newCategory) acct.accountType = newCategory;
      }
      if (coaEntry) {
        coaEntry.fsType = newFsType;
        if (newCategory) coaEntry.category = newCategory;
      }
      const name = acct?.accountName || coaEntry?.accountName || ref;
      return {
        result: `OK: reclassified "${name}" -> ${newFsType}${newCategory ? ` / ${newCategory}` : ""}`,
        change: { tool: toolName, description: `Reclassified "${name}" to ${newFsType}${newCategory ? ` / ${newCategory}` : ""}` },
      };
    }
    case "set_tb_amount": {
      const ref = String(input.accountRef || "");
      const periodId = String(input.periodId || "");
      const amount = Number(input.amount);
      if (!Number.isFinite(amount)) return { result: "ERROR: amount must be a number" };
      const acct = findAccount(accounts, ref);
      if (!acct) return { result: `ERROR: TB account "${ref}" not found` };
      if (!periods.some((p) => p.id === periodId)) return { result: `ERROR: period "${periodId}" not found` };
      const prev = acct.monthlyValues?.[periodId] || 0;
      acct.monthlyValues = { ...(acct.monthlyValues || {}), [periodId]: amount };
      return {
        result: `OK: set ${acct.accountName} [${periodId}] = ${amount} (was ${prev})`,
        change: { tool: toolName, description: `Set "${acct.accountName}" in ${periodId} to ${amount.toLocaleString()} (was ${prev.toLocaleString()})` },
      };
    }
    case "create_account": {
      const accountName = String(input.accountName || "").trim();
      if (!accountName) return { result: "ERROR: accountName required" };
      const fsType = input.fsType as "BS" | "IS";
      const category = (input.category as string) || (fsType === "BS" ? "Equity" : "Operating Expenses");
      const accountNumber = (input.accountNumber as string) || "";
      if (findCoa(coa, accountName) || findAccount(accounts, accountName)) {
        return { result: `ERROR: account "${accountName}" already exists` };
      }
      const id = crypto.randomUUID();
      coa.push({ id, accountName, accountNumber, fsType, category });
      accounts.push({
        id, accountName, accountNumber, fsType,
        accountType: category, accountSubtype: "",
        monthlyValues: {},
      });
      return {
        result: `OK: created account "${accountName}" (${fsType} / ${category})`,
        change: { tool: toolName, description: `Created new account "${accountName}" (${fsType} / ${category})` },
      };
    }
    case "post_plug_entry": {
      const periodId = String(input.periodId || "");
      const amount = Number(input.amount);
      const accountName = String(input.accountName || "").trim();
      const fsType = (input.fsType as "BS" | "IS") || "BS";
      const category = (input.category as string) || (fsType === "BS" ? "Equity" : "Other Expense");
      if (!Number.isFinite(amount)) return { result: "ERROR: amount must be a number" };
      if (!accountName) return { result: "ERROR: accountName required" };
      if (!periods.some((p) => p.id === periodId)) return { result: `ERROR: period "${periodId}" not found` };

      let acct = findAccount(accounts, accountName);
      if (!acct) {
        const id = crypto.randomUUID();
        const newCoa: CoaAccount = { id, accountName, fsType, category };
        if (!findCoa(coa, accountName)) coa.push(newCoa);
        acct = { id, accountName, fsType, accountType: category, accountSubtype: "", monthlyValues: {} };
        accounts.push(acct);
      }
      const prev = acct.monthlyValues?.[periodId] || 0;
      acct.monthlyValues = { ...(acct.monthlyValues || {}), [periodId]: prev + amount };
      return {
        result: `OK: posted ${amount} to "${accountName}" in ${periodId} (new balance ${prev + amount})`,
        change: { tool: toolName, description: `Posted plug of ${amount.toLocaleString()} to "${accountName}" in ${periodId}` },
      };
    }
    case "finish":
      return { result: "OK: finished" };
    default:
      return { result: `ERROR: unknown tool ${toolName}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANTHROPIC_KEY = Deno.env.get("VERCEL_AI_GATEWAY_KEY")!;
    if (!ANTHROPIC_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const projectId = body.projectId as string;
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Authorize
    const { data: accessRow } = await admin.rpc("has_project_access", {
      _user_id: user.id, _project_id: projectId,
    });
    if (!accessRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: project, error: projErr } = await admin
      .from("projects")
      .select("id, wizard_data, periods")
      .eq("id", projectId)
      .single();
    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const beforeWd: WizardData = (project.wizard_data as WizardData) || {};
    const workingWd: WizardData = JSON.parse(JSON.stringify(beforeWd));
    const periods: Period[] = Array.isArray(project.periods) ? project.periods as Period[] : [];
    if (periods.length === 0) {
      return new Response(JSON.stringify({ error: "Project has no periods configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accounts: TBAccount[] = workingWd.trialBalance?.accounts || [];
    if (accounts.length === 0) {
      return new Response(JSON.stringify({ error: "Trial balance is empty — nothing to balance" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await ensureZdrEnabled();
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY, baseURL: "https://ai-gateway.vercel.sh" });

    const initialBalances = balanceByPeriod(accounts, periods);
    const outOfBalance = initialBalances.filter((b) => Math.abs(b.check) > BALANCE_TOLERANCE);

    if (outOfBalance.length === 0) {
      return new Response(JSON.stringify({
        ok: true,
        alreadyBalanced: true,
        message: "Trial balance is already in balance across all periods.",
        summary: [],
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const coaSummary = (workingWd.chartOfAccounts || []).slice(0, 200).map((c) =>
      `- ${c.accountNumber || ""} ${c.accountName} [${c.fsType}${c.category ? `/${c.category}` : ""}]`
    ).join("\n");

    const tbSummary = accounts.slice(0, 250).map((a) => {
      const totals = periods.map((p) => `${p.id}=${a.monthlyValues?.[p.id] || 0}`).join(", ");
      return `- ${a.accountNumber || ""} ${a.accountName} [${a.fsType}/${a.accountType || ""}] ${totals}`;
    }).join("\n");

    const systemPrompt = `You are a QoE analyst. The user's trial balance is out of balance (debits ≠ credits, so BS + IS ≠ 0). Use the provided tools to fix it.

CONVENTIONS:
- Trial balance uses signed values: assets and expenses are positive (debit), liabilities/equity/revenue are negative (credit). A balanced period satisfies sum(BS) + sum(IS) = 0.
- Prefer the smallest, most truthful fix in this priority order: (1) reclassify_account when an account is on the wrong statement, (2) post_plug_entry to Retained Earnings or a new "Suspense" Equity account for residuals, (3) set_tb_amount only for obvious typos.
- After each tool call you will see the updated per-period imbalance. Stop as soon as |check| ≤ ${BALANCE_TOLERANCE} for every period, by calling the "finish" tool.
- Hard cap: ${MAX_STEPS} tool calls. Be efficient.

PERIODS: ${periods.map((p) => p.id).join(", ")}

CHART OF ACCOUNTS (${(workingWd.chartOfAccounts || []).length} total, first 200 shown):
${coaSummary || "(none)"}

TRIAL BALANCE (${accounts.length} total, first 250 shown, signed values per period):
${tbSummary}
`;

    let messages: Anthropic.MessageParam[] = [{
      role: "user",
      content: `Per-period imbalance (BS + IS, should be 0):\n${initialBalances.map((b) => `  ${b.label}: BS=${b.bs.toFixed(2)}, IS=${b.is.toFixed(2)}, check=${b.check.toFixed(2)}`).join("\n")}\n\nFix the trial balance using the tools. Call "finish" when done.`,
    }];

    const changes: ChangeLog[] = [];
    let finishMessage = "AI completed without an explicit summary.";
    let steps = 0;

    while (steps < MAX_STEPS) {
      steps++;
      const resp = await anthropic.messages.create({
        model: "anthropic/claude-sonnet-4-6",
        max_tokens: 1500,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      });

      messages.push({ role: "assistant", content: resp.content });

      const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (toolUses.length === 0) {
        // Model returned only text — treat as finish
        const text = resp.content.filter((b) => b.type === "text").map((b: any) => b.text).join("\n");
        if (text) finishMessage = text;
        break;
      }

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      let finished = false;

      for (const tu of toolUses) {
        if (tu.name === "finish") {
          finishMessage = (tu.input as any)?.message || finishMessage;
          finished = true;
          toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: "OK" });
          continue;
        }
        const { result, change } = applyTool(tu.name, tu.input as Record<string, unknown>, workingWd, periods);
        if (change) changes.push(change);
        toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: result });
      }

      const currentAccounts: TBAccount[] = workingWd.trialBalance?.accounts || [];
      const balances = balanceByPeriod(currentAccounts, periods);
      const stillOff = balances.filter((b) => Math.abs(b.check) > BALANCE_TOLERANCE);

      const status = stillOff.length === 0
        ? "ALL PERIODS BALANCED — call finish."
        : `Remaining imbalance:\n${stillOff.map((b) => `  ${b.label}: check=${b.check.toFixed(2)}`).join("\n")}`;

      messages.push({
        role: "user",
        content: [...toolResults, { type: "text", text: status }],
      });

      if (finished) break;
      if (stillOff.length === 0 && resp.stop_reason !== "tool_use") break;
    }

    // Snapshot + persist
    const { data: snap, error: snapErr } = await admin
      .from("ai_edit_snapshots")
      .insert({
        project_id: projectId,
        user_id: user.id,
        kind: "balance_tb",
        summary: changes,
        before_wizard_data: beforeWd,
        after_wizard_data: workingWd,
      })
      .select("id")
      .single();

    if (snapErr) {
      console.error("[ai-balance-tb] snapshot insert failed", snapErr);
      return new Response(JSON.stringify({ error: "Failed to create undo snapshot", detail: snapErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await admin
      .from("projects")
      .update({ wizard_data: workingWd })
      .eq("id", projectId);

    if (updErr) {
      console.error("[ai-balance-tb] project update failed", updErr);
      return new Response(JSON.stringify({ error: "Failed to save changes", detail: updErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalBalances = balanceByPeriod(workingWd.trialBalance?.accounts || [], periods);
    const stillOff = finalBalances.filter((b) => Math.abs(b.check) > BALANCE_TOLERANCE);

    return new Response(JSON.stringify({
      ok: true,
      snapshotId: snap.id,
      message: finishMessage,
      changes,
      steps,
      stillOutOfBalance: stillOff,
      balanced: stillOff.length === 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[ai-balance-tb] error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
