// Admin-only backfill: re-canonicalizes institution / account_label / period
// on existing bank + credit-card documents using the shared normalization
// rules. Idempotent — safe to run repeatedly.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.87.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
import {
  canonicalIssuer,
  extractLast4,
  issuerFromFilename,
  last4FromFilename,
  normalizeAccountLabel,
  normalizeInstitution,
  parsePeriodFromFilename,
} from "../_shared/bankAccountNormalization.ts";

interface DocRow {
  id: string;
  project_id: string;
  name: string | null;
  institution: string | null;
  account_label: string | null;
  period_start: string | null;
  period_end: string | null;
  parsed_summary: Record<string, unknown> | null;
  category: string | null;
  file_size: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller and admin role.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: adminCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .in("role", ["admin"])
      .maybeSingle();
    if (!adminCheck) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const projectId: string | undefined = body.project_id;
    const dryRun = body.dry_run === true;

    let q = admin
      .from("documents")
      .select("id, project_id, name, institution, account_label, period_start, period_end, parsed_summary, category, file_size")
      .in("category", ["bank_statement", "credit_card"]);
    if (projectId) q = q.eq("project_id", projectId);

    const { data: docs, error: docsErr } = await q;
    if (docsErr) throw new Error(docsErr.message);

    // Group target-company lookups per project.
    const projectIds = Array.from(new Set((docs || []).map((d) => d.project_id).filter(Boolean)));
    const targetByProject = new Map<string, string | null>();
    if (projectIds.length) {
      const { data: projs } = await admin
        .from("projects")
        .select("id, target_company")
        .in("id", projectIds);
      for (const p of projs || []) targetByProject.set(p.id, (p as { target_company: string | null }).target_company);
    }

    const changes: Array<{ id: string; before: Partial<DocRow>; after: Record<string, unknown> }> = [];

    for (const raw of (docs || []) as DocRow[]) {
      const targetCompany = targetByProject.get(raw.project_id) || null;

      const filenameIssuer = issuerFromFilename(raw.name);
      const filenameLast4 = last4FromFilename(raw.name);

      let canonicalInst = "";
      for (const c of [raw.institution, filenameIssuer]) {
        const canon = canonicalIssuer(c || "");
        if (canon) { canonicalInst = canon; break; }
      }
      if (!canonicalInst) {
        const ni = normalizeInstitution(raw.institution, targetCompany);
        canonicalInst = ni === "Unknown" ? "" : ni;
      }

      const existingLast4 = extractLast4(raw.account_label);
      const summaryAcct = (raw.parsed_summary as { accountNumber?: string } | null)?.accountNumber;
      const summaryLast4 = extractLast4(summaryAcct);
      let resolvedLast4 = summaryLast4 || existingLast4 || filenameLast4 || null;
      if (filenameLast4 && summaryLast4 && filenameLast4 !== summaryLast4) {
        resolvedLast4 = filenameLast4;
      }

      const newLabel = normalizeAccountLabel(canonicalInst, resolvedLast4);

      let newStart = raw.period_start;
      let newEnd = raw.period_end;
      if ((!newStart || !newEnd) && raw.name) {
        const fromName = parsePeriodFromFilename(raw.name);
        if (fromName) {
          newStart = newStart || fromName.periodStart;
          newEnd = newEnd || fromName.periodEnd;
        }
      }

      const update: Record<string, unknown> = {};
      if (canonicalInst && canonicalInst !== raw.institution) update.institution = canonicalInst;
      if (newLabel && newLabel !== raw.account_label) update.account_label = newLabel;
      if (newStart && newStart !== raw.period_start) update.period_start = newStart;
      if (newEnd && newEnd !== raw.period_end) update.period_end = newEnd;

      const prevSummary = (raw.parsed_summary || {}) as Record<string, unknown>;
      const prevVer = Number((prevSummary as { normalization_version?: number }).normalization_version || 0);
      if (Object.keys(update).length > 0 || prevVer < 2) {
        update.parsed_summary = {
          ...prevSummary,
          canonical_last4: resolvedLast4,
          normalization_version: 2,
        };
      }

      if (Object.keys(update).length === 0) continue;

      changes.push({ id: raw.id, before: raw, after: update });

      if (!dryRun) {
        const { error: uErr } = await admin.from("documents").update(update).eq("id", raw.id);
        if (uErr) console.warn("[normalize-bank-docs] update failed for", raw.id, uErr.message);
      }
    }

    return new Response(
      JSON.stringify({
        scanned: docs?.length || 0,
        changed: changes.length,
        dry_run: dryRun,
        sample: changes.slice(0, 20),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
