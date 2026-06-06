/**
 * commit-workbook-upload
 *
 * Three-way merge of offline edits (mine) against the current DB state (theirs),
 * using the base snapshot embedded at export time. If the same field changed
 * both online and offline, returns a CONFLICTS response unless `force=true`
 * or per-conflict resolutions are supplied.
 *
 * Atomic write — re-checks revision counter at update time and bumps it on success.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BaseAdjustment {
  id: string;
  type: string;
  label: string;
  tbAccountNumber?: string;
  intent?: string;
  notes?: string;
  periodValues: Record<string, number>;
}

interface BaseFixedAsset {
  description: string;
  category: string;
  acquisitionDate: string;
  cost: number;
  accumulatedDepreciation: number;
  netBookValue: number;
}

interface CommitPayload {
  projectId: string;
  exportedFromRevision: number;
  force?: boolean;
  base: {
    trialBalance: Record<string, Record<string, number>>;
    adjustments: Record<string, BaseAdjustment>;
    fixedAssets: Record<string, BaseFixedAsset>;
  };
  mine: {
    trialBalance: Record<string, Record<string, number>>;
    adjustmentsChanged: Record<string, Record<string, number>>;
    adjustmentsDeleted: string[];
    adjustmentsAdded: BaseAdjustment[];
    fixedAssetsChanged: Record<string, Partial<BaseFixedAsset>>;
    fixedAssetsDeleted: string[];
    fixedAssetsAdded: BaseFixedAsset[];
  };
  /** Optional per-conflict resolutions: conflictId -> "mine" | "theirs" */
  resolutions?: Record<string, "mine" | "theirs">;
}

interface FieldConflict {
  kind:
    | "tb"
    | "adjustment_amount"
    | "adjustment_deleted_vs_edited"
    | "fixed_asset_field"
    | "fixed_asset_deleted_vs_edited";
  label: string;
  conflictId: string;
  base: number | string | null;
  mine: number | string | null;
  theirs: number | string | null;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Extract current TB and adjustments from wizard_data into a normalized shape. */
function extractCurrentState(wd: Record<string, unknown>): {
  trialBalance: Record<string, Record<string, number>>;
  adjustments: Record<string, BaseAdjustment>;
  adjustmentsArrayPath: "ddAdjustments" | "top";
} {
  // Trial balance — may live as an array of entries at wd.trialBalance
  const tbSource = (wd.trialBalance ?? []) as Array<Record<string, unknown>>;
  const trialBalance: Record<string, Record<string, number>> = {};
  if (Array.isArray(tbSource)) {
    for (const e of tbSource) {
      const id = String(e.accountId ?? "");
      if (!id) continue;
      const balances = (e.balances as Record<string, unknown>) || {};
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(balances)) {
        const n = Number(v);
        if (Number.isFinite(n)) out[k] = n;
      }
      trialBalance[id] = out;
    }
  }

  let adjustmentsArrayPath: "ddAdjustments" | "top" = "ddAdjustments";
  let rawAdj: Array<Record<string, unknown>> = [];
  const ddAdj = wd.ddAdjustments as Record<string, unknown> | undefined;
  if (ddAdj?.adjustments && Array.isArray(ddAdj.adjustments)) {
    rawAdj = ddAdj.adjustments as Array<Record<string, unknown>>;
    adjustmentsArrayPath = "ddAdjustments";
  } else if (Array.isArray(wd.adjustments)) {
    rawAdj = wd.adjustments as Array<Record<string, unknown>>;
    adjustmentsArrayPath = "top";
  }

  const adjustments: Record<string, BaseAdjustment> = {};
  for (const a of rawAdj) {
    const id = String(a.id ?? "");
    if (!id) continue;
    const pv = (a.periodValues ?? a.periodAmounts ?? a.amounts ?? {}) as Record<string, unknown>;
    const periodValues: Record<string, number> = {};
    for (const [k, v] of Object.entries(pv)) {
      const n = Number(v);
      if (Number.isFinite(n)) periodValues[k] = n;
    }
    adjustments[id] = {
      id,
      type: String(a.type ?? a.block ?? ""),
      label: String(a.label ?? a.description ?? ""),
      tbAccountNumber: a.tbAccountNumber ? String(a.tbAccountNumber) : undefined,
      intent: a.intent ? String(a.intent) : undefined,
      notes: a.notes ? String(a.notes) : undefined,
      periodValues,
    };
  }

  return { trialBalance, adjustments, adjustmentsArrayPath };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const payload = await req.json().catch(() => null) as CommitPayload | null;
    if (!payload?.projectId || !payload?.base || !payload?.mine) {
      return jsonResponse({ ok: false, error: "Invalid payload" }, 400);
    }
    const resolutions = payload.resolutions ?? {};

    const { data: row, error: readErr } = await supabase
      .from("projects")
      .select("id, revision, wizard_data")
      .eq("id", payload.projectId)
      .maybeSingle();

    if (readErr || !row) {
      return jsonResponse({ ok: false, error: "Project not found or access denied" }, 403);
    }

    const currentRevision = (row.revision as number | null) ?? 0;
    const wd = (row.wizard_data as Record<string, unknown>) || {};
    const current = extractCurrentState(wd);
    const { base, mine } = payload;
    const autoMerged = currentRevision !== payload.exportedFromRevision;

    // ---- Three-way merge ----
    const conflicts: FieldConflict[] = [];

    // TB cell conflicts
    const finalTB: Record<string, Record<string, number>> = {};
    // Start from current state (theirs)
    for (const [acct, cells] of Object.entries(current.trialBalance)) {
      finalTB[acct] = { ...cells };
    }
    // Apply mine edits with conflict detection
    for (const [acct, cells] of Object.entries(mine.trialBalance)) {
      const baseRow = base.trialBalance?.[acct] ?? {};
      const theirsRow = current.trialBalance[acct] ?? {};
      for (const [pid, mineVal] of Object.entries(cells)) {
        const baseVal = baseRow[pid] ?? 0;
        const theirsVal = theirsRow[pid] ?? 0;
        const theirsChanged = Math.abs(theirsVal - baseVal) > 0.005;
        if (theirsChanged && Math.abs(theirsVal - mineVal) > 0.005) {
          const conflictId = `tb::${acct}::${pid}`;
          const pick = resolutions[conflictId];
          if (pick === "mine") {
            finalTB[acct] = { ...(finalTB[acct] ?? {}), [pid]: mineVal };
          } else if (pick === "theirs") {
            // already in finalTB
          } else if (payload.force) {
            finalTB[acct] = { ...(finalTB[acct] ?? {}), [pid]: mineVal };
          } else {
            conflicts.push({
              kind: "tb",
              label: `TB ${acct} · ${pid}`,
              conflictId,
              base: baseVal,
              mine: mineVal,
              theirs: theirsVal,
            });
          }
        } else {
          // No conflict — apply mine
          finalTB[acct] = { ...(finalTB[acct] ?? {}), [pid]: mineVal };
        }
      }
    }

    // Adjustment conflicts (amount changes)
    const finalAdj: Record<string, BaseAdjustment> = {};
    for (const [id, a] of Object.entries(current.adjustments)) {
      finalAdj[id] = { ...a, periodValues: { ...a.periodValues } };
    }

    for (const [id, mineCells] of Object.entries(mine.adjustmentsChanged)) {
      const baseAdj = base.adjustments?.[id];
      const theirsAdj = current.adjustments[id];
      if (!theirsAdj) {
        // Adjustment was deleted online; mine edited it — flag conflict
        const conflictId = `adj_del::${id}`;
        const pick = resolutions[conflictId];
        if (pick === "mine" || payload.force) {
          // Resurrect with mine values, using base as scaffolding
          if (baseAdj) {
            finalAdj[id] = { ...baseAdj, periodValues: { ...baseAdj.periodValues, ...mineCells } };
          }
        } else if (pick === "theirs") {
          // already absent
        } else {
          conflicts.push({
            kind: "adjustment_deleted_vs_edited",
            label: `Adjustment "${baseAdj?.label ?? id}" deleted online but edited offline`,
            conflictId,
            base: "exists",
            mine: "edited",
            theirs: "deleted",
          });
        }
        continue;
      }
      for (const [pid, mineVal] of Object.entries(mineCells)) {
        const baseVal = baseAdj?.periodValues?.[pid] ?? 0;
        const theirsVal = theirsAdj.periodValues[pid] ?? 0;
        const theirsChanged = Math.abs(theirsVal - baseVal) > 0.005;
        if (theirsChanged && Math.abs(theirsVal - mineVal) > 0.005) {
          const conflictId = `adj::${id}::${pid}`;
          const pick = resolutions[conflictId];
          if (pick === "mine" || payload.force) {
            finalAdj[id].periodValues[pid] = mineVal;
          } else if (pick === "theirs") {
            // keep theirs
          } else {
            conflicts.push({
              kind: "adjustment_amount",
              label: `${theirsAdj.type} · ${theirsAdj.label} · ${pid}`,
              conflictId,
              base: baseVal,
              mine: mineVal,
              theirs: theirsVal,
            });
          }
        } else {
          finalAdj[id].periodValues[pid] = mineVal;
        }
      }
    }

    // Adjustment deletions (mine deleted, was theirs edited?)
    for (const id of mine.adjustmentsDeleted) {
      const baseAdj = base.adjustments?.[id];
      const theirsAdj = current.adjustments[id];
      if (!theirsAdj) continue; // already gone
      // Did theirs edit any cell vs base?
      const baseVals = baseAdj?.periodValues ?? {};
      let theirsEdited = false;
      const allKeys = new Set([...Object.keys(baseVals), ...Object.keys(theirsAdj.periodValues)]);
      for (const k of allKeys) {
        if (Math.abs((baseVals[k] ?? 0) - (theirsAdj.periodValues[k] ?? 0)) > 0.005) {
          theirsEdited = true;
          break;
        }
      }
      if (theirsEdited) {
        const conflictId = `adj_del::${id}`;
        const pick = resolutions[conflictId];
        if (pick === "mine" || payload.force) {
          delete finalAdj[id];
        } else if (pick === "theirs") {
          // keep
        } else {
          conflicts.push({
            kind: "adjustment_deleted_vs_edited",
            label: `Adjustment "${theirsAdj.label}" deleted offline but edited online`,
            conflictId,
            base: "exists",
            mine: "deleted",
            theirs: "edited",
          });
        }
      } else {
        delete finalAdj[id];
      }
    }

    // Adjustment additions (always apply — no conflicts possible)
    for (const a of mine.adjustmentsAdded) {
      finalAdj[a.id] = a;
    }

    if (conflicts.length > 0) {
      return jsonResponse({
        ok: false,
        error: "CONFLICTS",
        conflicts,
        exportedFromRevision: payload.exportedFromRevision,
        currentRevision,
      }, 409);
    }

    // ---- Build the new wizard_data ----
    const tbArray: Array<Record<string, unknown>> = [];
    // Preserve existing TB entry metadata (account name, fs type, etc.)
    const existingTbArr = (wd.trialBalance as Array<Record<string, unknown>>) || [];
    const existingTbById = new Map(existingTbArr.map(e => [String(e.accountId ?? ""), e]));
    const tbIds = new Set([...Object.keys(finalTB), ...existingTbById.keys()]);
    for (const id of tbIds) {
      const existing = existingTbById.get(id) ?? { accountId: id };
      tbArray.push({ ...existing, balances: finalTB[id] ?? existing.balances ?? {} });
    }

    // Preserve metadata on existing adjustments
    const existingAdjArr = current.adjustmentsArrayPath === "ddAdjustments"
      ? (((wd.ddAdjustments as Record<string, unknown>)?.adjustments as Array<Record<string, unknown>>) ?? [])
      : ((wd.adjustments as Array<Record<string, unknown>>) ?? []);
    const existingAdjById = new Map(existingAdjArr.map(a => [String(a.id ?? ""), a]));
    const adjArray: Array<Record<string, unknown>> = [];
    for (const [id, a] of Object.entries(finalAdj)) {
      const existing = existingAdjById.get(id) ?? {};
      const merged: Record<string, unknown> = {
        ...existing,
        id,
        type: a.type,
        block: a.type, // legacy alias
        label: a.label,
        description: a.label, // legacy alias
        tbAccountNumber: a.tbAccountNumber ?? existing.tbAccountNumber,
        intent: a.intent ?? existing.intent,
        notes: a.notes ?? existing.notes,
        periodValues: a.periodValues,
        periodAmounts: a.periodValues,
        amounts: a.periodValues,
      };
      adjArray.push(merged);
    }

    const nextWizard: Record<string, unknown> = { ...wd, trialBalance: tbArray };
    if (current.adjustmentsArrayPath === "ddAdjustments") {
      nextWizard.ddAdjustments = {
        ...((wd.ddAdjustments as Record<string, unknown>) ?? {}),
        adjustments: adjArray,
      };
    } else {
      nextWizard.adjustments = adjArray;
    }

    const nextRevision = currentRevision + 1;
    const { error: updateErr } = await supabase
      .from("projects")
      .update({ wizard_data: nextWizard, revision: nextRevision })
      .eq("id", payload.projectId)
      .eq("revision", currentRevision);

    if (updateErr) {
      return jsonResponse({ ok: false, error: "Failed to save changes", details: updateErr.message }, 500);
    }

    const tbCellsApplied = Object.values(mine.trialBalance).reduce((s, m) => s + Object.keys(m).length, 0);
    return jsonResponse({
      ok: true,
      newRevision: nextRevision,
      applied: {
        tbCells: tbCellsApplied,
        adjustmentsChanged: Object.keys(mine.adjustmentsChanged).length,
        adjustmentsAdded: mine.adjustmentsAdded.length,
        adjustmentsDeleted: mine.adjustmentsDeleted.length,
      },
      autoMerged,
    }, 200);
  } catch (err) {
    console.error("commit-workbook-upload error:", err);
    return jsonResponse({ ok: false, error: "Server error", details: String(err) }, 500);
  }
});
