/**
 * Client helpers for the AI narrative layer (PDF deliverable).
 * Generates per-slide narratives via the generate-narrative edge function,
 * persists them to project_narratives, and serializes grids into a
 * compact "source data" string used as the LLM input + verification ground truth.
 */
import { supabase } from "@/integrations/supabase/client";
import type { GridData } from "@/lib/workbook-types";

export interface NarrativeBullet { text: string }
export interface NarrativeCallout { label: string; text: string }
export interface NarrativeParagraph {
  topic: string;
  observation: string;
  recommendation?: string;
}
export interface NarrativeContent {
  bullets?: string[];
  callouts?: NarrativeCallout[];
  paragraphs?: NarrativeParagraph[];
}

export interface NarrativeRecord {
  id: string;
  project_id: string;
  slide_key: string;
  content: NarrativeContent;
  source_hash: string | null;
  model: string | null;
  generated_at: string;
  edited_at: string | null;
}

/** Slides we generate narratives for (Kyle-style bullets unless noted). */
export const NARRATIVE_SLIDES: Array<{
  key: string;
  title: string;
  style: "bullets" | "paragraphs";
  gridKeys?: string[];
}> = [
  { key: "qoe", title: "Quality of Earnings", style: "bullets", gridKeys: ["qoeAnalysis"] },
  { key: "revenue_detail", title: "Revenue Detail", style: "bullets", gridKeys: ["salesDetail"] },
  { key: "cogs_detail", title: "COGS Detail", style: "bullets", gridKeys: ["cogsDetail"] },
  { key: "opex_detail", title: "Operating Expenses", style: "bullets", gridKeys: ["opexDetail"] },
  { key: "working_capital", title: "Working Capital", style: "bullets", gridKeys: ["workingCapital", "nwcAnalysis"] },
  { key: "free_cash_flow", title: "Free Cash Flow", style: "bullets", gridKeys: ["freeCashFlow"] },
  { key: "attention_areas", title: "Attention Areas", style: "paragraphs" },
];

// ── Serializers ──────────────────────────────────────────────────────────

/** Compact human-readable serialization of a grid; doubles as the LLM ground truth. */
export function serializeGrid(title: string, grid: GridData | undefined): string {
  if (!grid || grid.rows.length === 0) return "";
  const cols = grid.columns;
  const header = cols.map((c) => c.label || c.key).join(" | ");
  const lines: string[] = [`### ${title}`, header];
  for (const row of grid.rows) {
    const cells = cols.map((c) => {
      const v = row.cells?.[c.key];
      if (v === null || v === undefined || v === "") return "";
      if (typeof v === "number") {
        const colKey = (c.key || "").toLowerCase();
        const colLabel = (c.label || "").toLowerCase();
        const isPct = colKey.includes("pct") || colKey.includes("percent")
          || colKey.includes("margin") || colLabel.includes("%");
        if (isPct) {
          const p = Math.abs(v) < 1 ? v * 100 : v;
          return `${p.toFixed(1)}%`;
        }
        return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
      }
      return String(v);
    });
    lines.push(cells.join(" | "));
  }
  return lines.join("\n");
}

export function serializeAttentionItems(items: Array<{
  title: string; description?: string; rationale?: string;
  followUp?: string; severity?: string; ebitdaImpact?: number;
}>): string {
  return items.map((it, i) => {
    const sev = it.severity ? ` [${it.severity.toUpperCase()}]` : "";
    const impact = it.ebitdaImpact != null ? ` (EBITDA impact: $${it.ebitdaImpact.toLocaleString("en-US", { maximumFractionDigits: 0 })})` : "";
    const detail = it.rationale || it.description || "";
    return `${i + 1}. ${it.title}${sev}${impact}\n${detail}`;
  }).join("\n\n");
}

// ── API ──────────────────────────────────────────────────────────────────

export async function generateNarrative(args: {
  projectId: string;
  slideKey: string;
  slideTitle: string;
  rawData: string;
  style: "bullets" | "paragraphs";
}): Promise<{ content: NarrativeContent; sourceHash: string; model: string }> {
  const { data, error } = await supabase.functions.invoke("generate-narrative", {
    body: args,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getProjectNarratives(projectId: string): Promise<NarrativeRecord[]> {
  const { data, error } = await supabase
    .from("project_narratives")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw error;
  return (data || []) as NarrativeRecord[];
}

export async function saveNarrativeEdit(args: {
  projectId: string;
  slideKey: string;
  content: NarrativeContent;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("project_narratives")
    .upsert({
      project_id: args.projectId,
      slide_key: args.slideKey,
      content: args.content,
      edited_by: user?.id,
      edited_at: new Date().toISOString(),
    }, { onConflict: "project_id,slide_key" });
  if (error) throw error;
}
