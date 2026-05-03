/**
 * Per-slide AI narrative editor. Lets analysts generate, edit, and save
 * the AI-written commentary that appears in the PDF export.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Save } from "lucide-react";
import { toast } from "sonner";
import {
  NARRATIVE_SLIDES,
  serializeGrid,
  serializeAttentionItems,
  generateNarrative,
  getProjectNarratives,
  saveNarrativeEdit,
  type NarrativeContent,
  type NarrativeRecord,
} from "@/lib/pdf/narratives";
import type { GridData } from "@/lib/workbook-types";

interface Props {
  projectId: string;
  grids: Record<string, GridData>;
  attentionItems?: Array<{
    title: string; description?: string; rationale?: string;
    followUp?: string; severity?: string; ebitdaImpact?: number;
  }>;
}

export function NarrativePanel({ projectId, grids, attentionItems }: Props) {
  const [narratives, setNarratives] = useState<Record<string, NarrativeContent>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [records, setRecords] = useState<NarrativeRecord[]>([]);

  useEffect(() => {
    if (!projectId) return;
    getProjectNarratives(projectId).then((rs) => {
      setRecords(rs);
      const map: Record<string, NarrativeContent> = {};
      for (const r of rs) map[r.slide_key] = r.content;
      setNarratives(map);
    }).catch(console.error);
  }, [projectId]);

  const buildRawData = (slideKey: string, gridKeys?: string[]): string => {
    if (slideKey === "attention_areas") return serializeAttentionItems(attentionItems || []);
    return (gridKeys || []).map((k) => serializeGrid(k, grids[k])).filter(Boolean).join("\n\n");
  };

  const handleGenerate = async (slide: typeof NARRATIVE_SLIDES[number]) => {
    const rawData = buildRawData(slide.key, slide.gridKeys);
    if (!rawData) {
      toast.error(`No data available for ${slide.title}`);
      return;
    }
    setLoading((s) => ({ ...s, [slide.key]: true }));
    try {
      const res = await generateNarrative({
        projectId, slideKey: slide.key, slideTitle: slide.title,
        rawData, style: slide.style,
      });
      setNarratives((n) => ({ ...n, [slide.key]: res.content }));
      toast.success(`Generated narrative for ${slide.title}`);
    } catch (e) {
      toast.error(`Generation failed: ${(e as Error).message}`);
    } finally {
      setLoading((s) => ({ ...s, [slide.key]: false }));
    }
  };

  const handleSave = async (slideKey: string) => {
    try {
      await saveNarrativeEdit({ projectId, slideKey, content: narratives[slideKey] });
      toast.success("Saved");
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    }
  };

  const updateField = (slideKey: string, updater: (c: NarrativeContent) => NarrativeContent) => {
    setNarratives((n) => ({ ...n, [slideKey]: updater(n[slideKey] || {}) }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Analyst Commentary
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Generate Kyle/AKB-style narrative for each slide. Numbers are auto-verified against your data;
          unverified figures are stripped. Edit freely before exporting.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {NARRATIVE_SLIDES.map((slide) => {
          const content = narratives[slide.key] || {};
          const rec = records.find((r) => r.slide_key === slide.key);
          const isLoading = loading[slide.key];
          return (
            <div key={slide.key} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{slide.title}</span>
                  <Badge variant="outline" className="text-xs">{slide.style}</Badge>
                  {rec?.edited_at && <Badge variant="secondary" className="text-xs">edited</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={isLoading} onClick={() => handleGenerate(slide)}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {rec ? "Regenerate" : "Generate"}
                  </Button>
                  {rec && (
                    <Button size="sm" variant="default" onClick={() => handleSave(slide.key)}>
                      <Save className="h-4 w-4 mr-1" /> Save
                    </Button>
                  )}
                </div>
              </div>

              {slide.style === "bullets" && content.bullets && (
                <Textarea
                  className="min-h-[100px] text-sm"
                  value={(content.bullets || []).join("\n")}
                  onChange={(e) => updateField(slide.key, (c) => ({
                    ...c, bullets: e.target.value.split("\n").filter(Boolean),
                  }))}
                  placeholder="One bullet per line"
                />
              )}

              {slide.style === "bullets" && content.callouts && content.callouts.length > 0 && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Callouts (LABEL: text)</div>
                  <Textarea
                    className="min-h-[80px] text-sm font-mono"
                    value={(content.callouts || []).map((c) => `${c.label}: ${c.text}`).join("\n")}
                    onChange={(e) => updateField(slide.key, (c) => ({
                      ...c,
                      callouts: e.target.value.split("\n").filter(Boolean).map((line) => {
                        const idx = line.indexOf(":");
                        return idx > 0
                          ? { label: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() }
                          : { label: "", text: line.trim() };
                      }),
                    }))}
                  />
                </div>
              )}

              {slide.style === "paragraphs" && content.paragraphs && content.paragraphs.map((p, idx) => (
                <div key={idx} className="space-y-1 border-l-2 border-primary pl-3">
                  <input
                    className="w-full text-sm font-medium bg-transparent border-b focus:outline-none"
                    value={p.topic}
                    onChange={(e) => updateField(slide.key, (c) => {
                      const next = [...(c.paragraphs || [])];
                      next[idx] = { ...next[idx], topic: e.target.value };
                      return { ...c, paragraphs: next };
                    })}
                  />
                  <Textarea
                    className="text-sm"
                    placeholder="Observation"
                    value={p.observation}
                    onChange={(e) => updateField(slide.key, (c) => {
                      const next = [...(c.paragraphs || [])];
                      next[idx] = { ...next[idx], observation: e.target.value };
                      return { ...c, paragraphs: next };
                    })}
                  />
                  <Textarea
                    className="text-sm"
                    placeholder="Recommendation (optional)"
                    value={p.recommendation || ""}
                    onChange={(e) => updateField(slide.key, (c) => {
                      const next = [...(c.paragraphs || [])];
                      next[idx] = { ...next[idx], recommendation: e.target.value };
                      return { ...c, paragraphs: next };
                    })}
                  />
                </div>
              ))}

              {!rec && (
                <p className="text-xs text-muted-foreground">No narrative yet. Click Generate.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
