import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef } from "react";
import { s as supabase, C as Card, b as CardHeader, d as CardTitle, f as CardContent, B as Button, e as CardDescription } from "../main.mjs";
import { P as Progress } from "./progress-DNO9VJ6D.js";
import { A as Alert, b as AlertDescription } from "./alert-FolYmCWY.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { L as Label } from "./label-B2r_8dgk.js";
import { I as Input } from "./input-CSM87NBF.js";
import { Database, Loader2, BookOpen, Trash2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-progress";
import "@radix-ui/react-select";
import "@radix-ui/react-label";
function useRAGStats() {
  const [totalChunks, setTotalChunks] = useState(0);
  const [sourceStats, setSourceStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { count: total, error: countError } = await supabase.from("rag_chunks").select("*", { count: "exact", head: true });
      if (countError) throw countError;
      setTotalChunks(total || 0);
      const { data: allChunks, error: chunksError } = await supabase.from("rag_chunks").select("source, source_title, source_license, authority_weight").limit(1e6);
      if (chunksError) throw chunksError;
      const statsMap = /* @__PURE__ */ new Map();
      for (const chunk of allChunks || []) {
        const source = chunk.source || "unknown";
        const existing = statsMap.get(source);
        if (existing) {
          existing.count++;
        } else {
          statsMap.set(source, {
            source,
            source_title: chunk.source_title,
            source_license: chunk.source_license,
            count: 1,
            authority_weight: chunk.authority_weight || 1
          });
        }
      }
      setSourceStats(Array.from(statsMap.values()).sort((a, b) => b.count - a.count));
    } catch (err) {
      console.error("Error fetching RAG stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  return {
    totalChunks,
    sourceStats,
    isLoading,
    error,
    refetch: fetchStats
  };
}
const LICENSE_OPTIONS = [
  { value: "proprietary", label: "Proprietary" },
  { value: "cc-by", label: "CC BY" },
  { value: "cc-by-sa", label: "CC BY-SA" },
  { value: "cc-by-nc", label: "CC BY-NC" },
  { value: "public-domain", label: "Public Domain" }
];
function AdminRAGUpload() {
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState(null);
  const [isDeleting, setIsDeleting] = useState(null);
  const [selectedSource, setSelectedSource] = useState("");
  const [customSourceKey, setCustomSourceKey] = useState("");
  const [customSourceTitle, setCustomSourceTitle] = useState("");
  const [selectedLicense, setSelectedLicense] = useState("proprietary");
  const [authorityWeight, setAuthorityWeight] = useState("1.0");
  const fileInputRef = useRef(null);
  const { totalChunks, sourceStats, isLoading: statsLoading, refetch: refetchStats } = useRAGStats();
  function handleFileSelect(event) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.endsWith(".json") && !selectedFile.name.endsWith(".jsonl")) {
      toast.error("Please select a .json or .jsonl file");
      return;
    }
    setFile(selectedFile);
    parseFile(selectedFile);
  }
  async function parseFile(file2) {
    try {
      const text = await file2.text();
      let parsedChunks;
      if (file2.name.endsWith(".jsonl")) {
        parsedChunks = text.split("\n").filter((line) => line.trim()).map((line) => JSON.parse(line));
      } else {
        const parsed = JSON.parse(text);
        parsedChunks = Array.isArray(parsed) ? parsed : parsed.chunks;
      }
      if (!Array.isArray(parsedChunks) || parsedChunks.length === 0) {
        throw new Error("No valid chunks found in file");
      }
      const isValid = parsedChunks.every(
        (chunk) => typeof chunk.content === "string" && typeof chunk.chunk_index === "number"
      );
      if (!isValid) {
        throw new Error('Invalid chunk structure. Each chunk needs at least "content" and "chunk_index"');
      }
      setChunks(parsedChunks);
      toast.success(`Loaded ${parsedChunks.length} chunks`);
    } catch (error) {
      console.error("Parse error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to parse file");
      setChunks([]);
    }
  }
  function getEffectiveSource() {
    if (selectedSource === "__new__") return customSourceKey;
    return selectedSource;
  }
  function getSourceTitle() {
    if (selectedSource === "__new__") {
      return customSourceTitle || "Custom Source";
    }
    const match = sourceStats.find((s) => s.source === selectedSource);
    return match?.source_title || selectedSource;
  }
  async function uploadChunks() {
    if (chunks.length === 0) return;
    setIsUploading(true);
    setProgress(0);
    setUploadStats(null);
    const effectiveSource = getEffectiveSource();
    const batchSize = 20;
    const totalBatches = Math.ceil(chunks.length / batchSize);
    let totalSuccessful = 0;
    let totalErrors = 0;
    try {
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        const { data, error } = await supabase.functions.invoke("embed-rag-chunks", {
          body: {
            chunks: batch,
            source: effectiveSource,
            source_title: getSourceTitle(),
            source_license: selectedLicense,
            authority_weight: parseFloat(authorityWeight) || 1
          }
        });
        if (error) {
          console.error(`Batch ${currentBatch} error:`, error);
          totalErrors += batch.length;
        } else if (data) {
          totalSuccessful += data.successful || 0;
          totalErrors += data.errors || 0;
        }
        setProgress(Math.round(currentBatch / totalBatches * 100));
        if (i + batchSize < chunks.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
      setUploadStats({
        total: chunks.length,
        successful: totalSuccessful,
        errors: totalErrors,
        source: effectiveSource
      });
      if (totalErrors === 0) {
        toast.success(`Successfully embedded ${totalSuccessful} chunks for ${effectiveSource}!`);
      } else {
        toast.warning(`Completed with ${totalErrors} errors`);
      }
      refetchStats();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  }
  async function clearSourceChunks(source) {
    if (!confirm(`Are you sure you want to delete all chunks for "${source}"? This cannot be undone.`)) {
      return;
    }
    setIsDeleting(source);
    try {
      const { data, error } = await supabase.functions.invoke("embed-rag-chunks", {
        body: { action: "delete", source }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`All ${source} chunks deleted`);
      refetchStats();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete chunks");
    } finally {
      setIsDeleting(null);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "RAG Knowledge Base" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Multi-source embeddings for the AI analyst" })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Database, { className: "h-5 w-5" }),
        "Knowledge Base Status"
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: statsLoading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        "Loading stats..."
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Total chunks:" }),
          /* @__PURE__ */ jsx(Badge, { variant: totalChunks > 0 ? "default" : "secondary", children: totalChunks })
        ] }),
        sourceStats.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "text-sm font-medium", children: "Sources:" }),
          /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: sourceStats.map((stat) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-center justify-between p-3 rounded-lg border bg-muted/30",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-medium capitalize", children: stat.source }),
                    stat.source_title && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: stat.source_title })
                  ] }),
                  /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
                    stat.count,
                    " chunks"
                  ] }),
                  /* @__PURE__ */ jsxs(Badge, { variant: "secondary", children: [
                    "Authority: ",
                    stat.authority_weight
                  ] }),
                  stat.source_license && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "text-xs", children: stat.source_license })
                ] }),
                /* @__PURE__ */ jsx(
                  Button,
                  {
                    variant: "ghost",
                    size: "sm",
                    onClick: () => clearSourceChunks(stat.source),
                    disabled: isDeleting === stat.source,
                    className: "text-destructive hover:text-destructive",
                    children: isDeleting === stat.source ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ]
            },
            stat.source
          )) })
        ] }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No sources loaded yet" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Upload, { className: "h-5 w-5" }),
          "Upload New Source"
        ] }),
        /* @__PURE__ */ jsx(CardDescription, { children: "Upload a JSON or JSONL file containing processed book chunks" })
      ] }),
      /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "source", children: "Source" }),
            /* @__PURE__ */ jsxs(Select, { value: selectedSource, onValueChange: setSelectedSource, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select source" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                sourceStats.map((stat) => /* @__PURE__ */ jsx(SelectItem, { value: stat.source, children: stat.source_title || stat.source }, stat.source)),
                /* @__PURE__ */ jsx(SelectItem, { value: "__new__", children: "+ New Source" })
              ] })
            ] })
          ] }),
          selectedSource === "__new__" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "customKey", children: "Source Key" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "customKey",
                  value: customSourceKey,
                  onChange: (e) => setCustomSourceKey(e.target.value),
                  placeholder: "e.g., oglove"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: "customTitle", children: "Source Title" }),
              /* @__PURE__ */ jsx(
                Input,
                {
                  id: "customTitle",
                  value: customSourceTitle,
                  onChange: (e) => setCustomSourceTitle(e.target.value),
                  placeholder: "e.g., Quality of Earnings by O'Glove"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "license", children: "License" }),
            /* @__PURE__ */ jsxs(Select, { value: selectedLicense, onValueChange: setSelectedLicense, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select license" }) }),
              /* @__PURE__ */ jsx(SelectContent, { children: LICENSE_OPTIONS.map((option) => /* @__PURE__ */ jsx(SelectItem, { value: option.value, children: option.label }, option.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx(Label, { htmlFor: "authority", children: "Authority Weight" }),
            /* @__PURE__ */ jsxs(Select, { value: authorityWeight, onValueChange: setAuthorityWeight, children: [
              /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select weight" }) }),
              /* @__PURE__ */ jsxs(SelectContent, { children: [
                /* @__PURE__ */ jsx(SelectItem, { value: "1.0", children: "1.0 (Primary)" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "0.8", children: "0.8 (High)" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "0.5", children: "0.5 (Secondary)" }),
                /* @__PURE__ */ jsx(SelectItem, { value: "0.3", children: "0.3 (Supplementary)" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "Higher = more influential in retrieval" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors",
            onClick: () => fileInputRef.current?.click(),
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: fileInputRef,
                  type: "file",
                  accept: ".json,.jsonl",
                  onChange: handleFileSelect,
                  className: "hidden"
                }
              ),
              file ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2", children: [
                /* @__PURE__ */ jsx(FileText, { className: "h-5 w-5 text-primary" }),
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: file.name }),
                /* @__PURE__ */ jsxs(Badge, { children: [
                  chunks.length,
                  " chunks"
                ] })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(Upload, { className: "h-8 w-8 mx-auto text-muted-foreground" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Click to select chunks.json or chunks.jsonl" })
              ] })
            ]
          }
        ),
        chunks.length > 0 && /* @__PURE__ */ jsxs("div", { className: "text-sm space-y-2", children: [
          /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Preview:" }),
          /* @__PURE__ */ jsxs("div", { className: "bg-muted rounded-lg p-3 max-h-32 overflow-auto text-xs font-mono", children: [
            chunks.slice(0, 3).map((chunk, i) => /* @__PURE__ */ jsxs("div", { className: "mb-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
                "Chunk ",
                chunk.chunk_index,
                ":"
              ] }),
              " ",
              chunk.chapter && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
                "[",
                chunk.chapter,
                "] "
              ] }),
              chunk.content.slice(0, 100),
              "..."
            ] }, i)),
            chunks.length > 3 && /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
              "... and ",
              chunks.length - 3,
              " more chunks"
            ] })
          ] })
        ] }),
        isUploading && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
              "Embedding chunks for ",
              getEffectiveSource(),
              "..."
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              progress,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsx(Progress, { value: progress })
        ] }),
        uploadStats && /* @__PURE__ */ jsxs(Alert, { variant: uploadStats.errors === 0 ? "default" : "destructive", children: [
          uploadStats.errors === 0 ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxs(AlertDescription, { children: [
            "Processed ",
            uploadStats.total,
            " chunks for ",
            uploadStats.source,
            ": ",
            uploadStats.successful,
            " successful, ",
            uploadStats.errors,
            " errors"
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          Button,
          {
            onClick: uploadChunks,
            disabled: chunks.length === 0 || isUploading || !getEffectiveSource(),
            className: "w-full",
            children: isUploading ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }),
              "Uploading..."
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Upload, { className: "h-4 w-4 mr-2" }),
              "Upload & Embed ",
              chunks.length > 0 ? `${chunks.length} Chunks${getEffectiveSource() ? ` to ${getEffectiveSource()}` : ""}` : "Chunks"
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Card, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Expected File Format" }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("pre", { className: "bg-muted rounded-lg p-3 text-xs overflow-auto", children: `// JSON format:
{
  "chunks": [
    {
      "content": "chunk text...",
      "chapter": "Chapter 1",
      "section": "Section 1.1",  // Optional
      "page_number": 1,
      "chunk_index": 0,
      "token_count": 600,
      "topic_tags": ["ebitda", "adjustments"]  // Optional
    }
  ]
}

// Or JSONL format (one per line):
{"content": "chunk 1...", "chunk_index": 0, "chapter": "Ch1", ...}
{"content": "chunk 2...", "chunk_index": 1, "chapter": "Ch1", ...}` }) })
    ] })
  ] });
}
export {
  AdminRAGUpload as default
};
