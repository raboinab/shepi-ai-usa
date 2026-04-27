import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { B as Button, s as supabase } from "../main.mjs";
import { P as Progress } from "./progress-DNO9VJ6D.js";
import { u as useAdminCheck } from "./useAdminCheck-DEUH420T.js";
import { Loader2, Database, Download, CheckCircle, AlertCircle } from "lucide-react";
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
const HEAVY_TABLES = {
  canonical_transactions: 1e3,
  rag_chunks: 1e3,
  processed_data: 2e3,
  project_data_chunks: 2e3
};
const DEFAULT_CHUNK_SIZE = 5e3;
function getChunkSize(tableName) {
  return HEAVY_TABLES[tableName] ?? DEFAULT_CHUNK_SIZE;
}
function AdminDataExport() {
  const { isAdmin, isLoading: adminLoading } = useAdminCheck();
  const [tables, setTables] = useState([]);
  const [status, setStatus] = useState("idle");
  const [currentTable, setCurrentTable] = useState("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [progress, setProgress] = useState(0);
  const [exportedCount, setExportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const projectId = "mdgmessqbfebrbvjtndz";
  async function callExportFunction(params) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Not authenticated");
    const url = `https://${projectId}.supabase.co/functions/v1/export-full-database?${params}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ21lc3NxYmZlYnJidmp0bmR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDM4MzgsImV4cCI6MjA4ODU3OTgzOH0.T9Sedk2mU9iuObgODm7UBsmFZA6KO-hkZ1IookfYa68"
      }
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    return res;
  }
  async function loadTableList() {
    setStatus("loading-list");
    setErrorMsg("");
    try {
      const res = await callExportFunction("mode=list");
      const list = await res.json();
      setTables(list);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
  }
  async function exportTableChunked(tableName) {
    const chunkSize = getChunkSize(tableName);
    const parts = [];
    let offset = 0;
    let chunkNum = 0;
    let actualRows = 0;
    let expectedRows = 0;
    while (true) {
      const res = await callExportFunction(
        `table=${tableName}&offset=${offset}&limit=${chunkSize}`
      );
      const hasMore = res.headers.get("X-Has-More") === "true";
      const totalCount = parseInt(res.headers.get("X-Total-Count") || "0", 10);
      const rowCount = parseInt(res.headers.get("X-Row-Count") || "0", 10);
      expectedRows = totalCount;
      actualRows += rowCount;
      const estimatedChunks = Math.max(1, Math.ceil(totalCount / chunkSize));
      chunkNum++;
      setCurrentChunk(chunkNum);
      setTotalChunks(estimatedChunks);
      const sql = await res.text();
      parts.push(new Blob([sql, "\n"]));
      if (!hasMore) break;
      offset += chunkSize;
    }
    return { parts, expectedRows, actualRows };
  }
  async function exportAll() {
    let tableList = tables;
    if (tableList.length === 0) {
      setStatus("loading-list");
      setErrorMsg("");
      try {
        const res = await callExportFunction("mode=list");
        tableList = await res.json();
        setTables(tableList);
      } catch (err) {
        setErrorMsg(err.message);
        setStatus("error");
        return;
      }
    }
    if (tableList.length === 0) return;
    setStatus("exporting");
    setProgress(0);
    setExportedCount(0);
    setErrorMsg("");
    const blobParts = [];
    const header = [
      "-- Full database export",
      `-- Generated: ${(/* @__PURE__ */ new Date()).toISOString()}`,
      "-- Import with: psql -f this_file.sql",
      ""
    ].join("\n");
    blobParts.push(new Blob([header]));
    const mismatches = [];
    for (let i = 0; i < tableList.length; i++) {
      const t = tableList[i];
      setCurrentTable(t.table);
      setCurrentChunk(0);
      setTotalChunks(0);
      setProgress(Math.round(i / tableList.length * 100));
      try {
        const { parts, expectedRows, actualRows } = await exportTableChunked(t.table);
        for (const p of parts) blobParts.push(p);
        if (actualRows < expectedRows) {
          mismatches.push({ table: t.table, expected: expectedRows, actual: actualRows });
          blobParts.push(
            new Blob([
              `-- WARNING: ${t.table} exported ${actualRows} of ${expectedRows} rows
`
            ])
          );
        }
      } catch (err) {
        blobParts.push(new Blob([`-- ERROR exporting ${t.table}: ${err.message}
`]));
        mismatches.push({ table: t.table, expected: t.count, actual: 0 });
      }
      setExportedCount(i + 1);
    }
    setProgress(100);
    setCurrentTable("");
    if (mismatches.length > 0) {
      blobParts.push(
        new Blob([
          "\n-- INCOMPLETE TABLES:\n" + mismatches.map((m) => `--   ${m.table}: ${m.actual}/${m.expected} rows`).join("\n") + "\n"
        ])
      );
      toast.warning(
        `Export finished with ${mismatches.length} incomplete table(s): ${mismatches.map((m) => m.table).join(", ")}`
      );
    }
    const blob = new Blob(blobParts, { type: "application/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shepi_full_export_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("done");
  }
  async function exportSingleTable(tableName) {
    setStatus("exporting");
    setCurrentTable(tableName);
    setCurrentChunk(0);
    setTotalChunks(0);
    setErrorMsg("");
    try {
      const { parts, expectedRows, actualRows } = await exportTableChunked(tableName);
      if (actualRows < expectedRows) {
        toast.warning(
          `${tableName}: exported ${actualRows} of ${expectedRows} rows`
        );
      }
      const blob = new Blob(parts, { type: "application/sql" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tableName}_export.sql`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err.message);
      setStatus("error");
    }
    setCurrentTable("");
  }
  if (adminLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Loader2, { className: "h-6 w-6 animate-spin text-muted-foreground" }) });
  }
  if (!isAdmin) return null;
  const totalRows = tables.reduce((s, t) => s + Math.max(t.count, 0), 0);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-foreground", children: "Data Export" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground mt-1", children: "Export all database data as SQL INSERT statements for migration." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: loadTableList,
          variant: "outline",
          disabled: status === "loading-list" || status === "exporting",
          children: [
            status === "loading-list" ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" }) : /* @__PURE__ */ jsx(Database, { className: "h-4 w-4 mr-2" }),
            "Scan Tables"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: exportAll,
          disabled: status === "exporting",
          children: [
            status === "exporting" ? /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin mr-2" }) : /* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-2" }),
            "Export Full Database (.sql)"
          ]
        }
      )
    ] }),
    status === "exporting" && /* @__PURE__ */ jsxs("div", { className: "space-y-2 bg-muted/30 rounded-lg p-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Exporting ",
          currentTable,
          totalChunks > 1 && ` (chunk ${currentChunk} of ~${totalChunks})`,
          "..."
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          exportedCount,
          " / ",
          tables.length,
          " tables"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Progress, { value: progress, className: "h-2" })
    ] }),
    status === "done" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }),
      "Export complete — file downloaded. ",
      exportedCount,
      " tables exported."
    ] }),
    status === "error" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "h-4 w-4" }),
      errorMsg
    ] }),
    tables.length > 0 && /* @__PURE__ */ jsxs("div", { className: "border rounded-lg overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground flex justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          tables.length,
          " tables"
        ] }),
        /* @__PURE__ */ jsxs("span", { children: [
          totalRows.toLocaleString(),
          " total rows"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "divide-y max-h-[500px] overflow-y-auto", children: tables.map((t) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center justify-between px-4 py-2 text-sm hover:bg-muted/30",
          children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx(Database, { className: "h-3.5 w-3.5 text-muted-foreground" }),
              /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: t.table })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground tabular-nums", children: t.count >= 0 ? t.count.toLocaleString() + " rows" : "error" }),
              /* @__PURE__ */ jsx(
                Button,
                {
                  size: "sm",
                  variant: "ghost",
                  onClick: () => exportSingleTable(t.table),
                  disabled: status === "exporting",
                  children: /* @__PURE__ */ jsx(Download, { className: "h-3.5 w-3.5" })
                }
              )
            ] })
          ]
        },
        t.table
      )) })
    ] })
  ] });
}
export {
  AdminDataExport as default
};
