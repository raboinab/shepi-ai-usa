/**
 * commit-workbook-upload
 *
 * Applies a resolved diff payload from parse-workbook-upload to projects.wizard_data.
 * Re-checks the revision counter at write time and rejects if the project advanced
 * since parse (unless `force: true`). Always bumps `projects.revision` on success.
 *
 * Phase 1: handles adjustment amount changes only.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CommitPayload {
  projectId: string;
  exportedFromRevision: number;
  force?: boolean;
  adjustmentDiffs: Array<{
    id: string;
    changes: { periodId: string; newValue: number }[];
  }>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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
    if (!payload?.projectId || !Array.isArray(payload.adjustmentDiffs)) {
      return jsonResponse({ ok: false, error: "Invalid payload" }, 400);
    }

    // Lock-free optimistic concurrency: read revision, check, write, re-check.
    const { data: row, error: readErr } = await supabase
      .from("projects")
      .select("id, revision, wizard_data")
      .eq("id", payload.projectId)
      .maybeSingle();

    if (readErr || !row) {
      return jsonResponse({ ok: false, error: "Project not found or access denied" }, 403);
    }

    const currentRevision = (row.revision as number | null) ?? 0;
    if (!payload.force && currentRevision !== payload.exportedFromRevision) {
      return jsonResponse({
        ok: false,
        error: "REVISION_DRIFT",
        message: "The workbook was modified online while you were editing offline. Re-review the diff or pass force=true.",
        currentRevision,
        exportedFromRevision: payload.exportedFromRevision,
      }, 409);
    }

    // Apply adjustment changes to wizard_data
    const wd = (row.wizard_data as Record<string, unknown>) || {};
    const ddAdj = (wd.ddAdjustments as Record<string, unknown>) || {};
    const adjustments = ((ddAdj.adjustments ?? wd.adjustments ?? []) as Array<Record<string, unknown>>).map(a => ({ ...a }));

    let applied = 0;
    const adjById = new Map<string, Record<string, unknown>>();
    for (const a of adjustments) {
      if (a?.id) adjById.set(String(a.id), a);
    }

    for (const diff of payload.adjustmentDiffs) {
      const adj = adjById.get(diff.id);
      if (!adj) continue;
      const periodValues = { ...((adj.periodValues ?? adj.periodAmounts ?? adj.amounts ?? {}) as Record<string, unknown>) };
      for (const change of diff.changes) {
        periodValues[change.periodId] = change.newValue;
        applied++;
      }
      adj.periodValues = periodValues;
      // Keep legacy aliases in sync if they existed
      if ("periodAmounts" in adj) adj.periodAmounts = periodValues;
      if ("amounts" in adj && !("periodValues" in adj)) adj.amounts = periodValues;
    }

    const nextDdAdj = { ...ddAdj, adjustments };
    const nextWizard = { ...wd, ddAdjustments: nextDdAdj };
    // Mirror at top level if that was the source path
    if (wd.adjustments && !wd.ddAdjustments) {
      (nextWizard as Record<string, unknown>).adjustments = adjustments;
    }

    const nextRevision = currentRevision + 1;

    const { error: updateErr } = await supabase
      .from("projects")
      .update({ wizard_data: nextWizard, revision: nextRevision })
      .eq("id", payload.projectId)
      .eq("revision", currentRevision); // atomic check

    if (updateErr) {
      return jsonResponse({ ok: false, error: "Failed to save changes", details: updateErr.message }, 500);
    }

    return jsonResponse({
      ok: true,
      newRevision: nextRevision,
      adjustmentChangesApplied: applied,
    }, 200);
  } catch (err) {
    console.error("commit-workbook-upload error:", err);
    return jsonResponse({ ok: false, error: "Server error", details: String(err) }, 500);
  }
});
