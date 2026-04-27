import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { s as supabase, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { format } from "date-fns";
import { Eye, Download, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CKdO6TGo.js";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-alert-dialog";
const MAX_ROWS = 1e6;
async function fetchTable(table, filter, columns = "*") {
  let query = supabase.from(table).select(columns).limit(MAX_ROWS);
  for (const [col, val] of Object.entries(filter)) {
    query = query.eq(col, val);
  }
  const { data, error } = await query;
  if (error) {
    console.warn(`Export: failed to fetch ${table}:`, error.message);
    return [];
  }
  return data ?? [];
}
async function exportProjectDataJson(projectId, projectName, onProgress) {
  const tables = [
    { key: "project", table: "projects", label: "Project" },
    { key: "documents", table: "documents", label: "Documents" },
    { key: "processed_data", table: "processed_data", label: "Processed Data" },
    { key: "canonical_transactions", table: "canonical_transactions", label: "Transactions" },
    { key: "flagged_transactions", table: "flagged_transactions", label: "Flagged Transactions" },
    { key: "adjustment_proofs", table: "adjustment_proofs", label: "Adjustment Proofs" },
    { key: "adjustment_proposals", table: "adjustment_proposals", label: "Adjustment Proposals" },
    { key: "analysis_jobs", table: "analysis_jobs", label: "Analysis Jobs" },
    { key: "detector_runs", table: "detector_runs", label: "Detector Runs" },
    { key: "verification_attempts", table: "verification_attempts", label: "Verification Attempts" },
    { key: "reclassification_jobs", table: "reclassification_jobs", label: "Reclassification Jobs" },
    { key: "docuclipper_jobs", table: "docuclipper_jobs", label: "DocuClipper Jobs" },
    { key: "chat_messages", table: "chat_messages", label: "Chat Messages" },
    { key: "project_data_chunks", table: "project_data_chunks", label: "Data Chunks", columns: "id, project_id, data_type, period, fs_section, chunk_key, token_count, metadata, created_at, updated_at" },
    {
      key: "company_info",
      table: "company_info",
      label: "Company Info",
      columns: "id, project_id, user_id, company_name, realm_id, created_at, updated_at"
    },
    { key: "workflows", table: "workflows", label: "Workflows" }
  ];
  tables.length + 2;
  const result = {};
  for (const t of tables) {
    const filter = t.table === "projects" ? { id: projectId } : { project_id: projectId };
    const rows = await fetchTable(t.table, filter, t.columns);
    result[t.key] = t.table === "projects" ? rows[0] ?? null : rows;
  }
  const proposalIds = (result.adjustment_proposals ?? []).map((p) => p.id);
  if (proposalIds.length > 0) {
    const { data } = await supabase.from("proposal_evidence").select("*").in("proposal_id", proposalIds).limit(MAX_ROWS);
    result.proposal_evidence = data ?? [];
  } else {
    result.proposal_evidence = [];
  }
  const attemptIds = (result.verification_attempts ?? []).map((a2) => a2.id);
  if (attemptIds.length > 0) {
    const { data } = await supabase.from("verification_transaction_snapshots").select("*").in("verification_attempt_id", attemptIds).limit(MAX_ROWS);
    result.verification_transaction_snapshots = data ?? [];
  } else {
    result.verification_transaction_snapshots = [];
  }
  const payload = {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    projectId,
    projectName,
    tables: result
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const safeName = (projectName || "project").replace(/[^a-zA-Z0-9_-]/g, "_");
  a.href = url;
  a.download = `${safeName}_data_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function AdminProjects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [exportingId, setExportingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const handleExport = async (projectId, projectName) => {
    setExportingId(projectId);
    try {
      await exportProjectDataJson(projectId, projectName);
      toast.success("Project data exported");
    } catch (e) {
      toast.error("Export failed: " + (e.message || "Unknown error"));
    } finally {
      setExportingId(null);
    }
  };
  const handleDelete = async (projectId) => {
    setDeletingId(projectId);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
    } catch (e) {
      toast.error("Delete failed: " + (e.message || "Unknown error"));
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };
  const { data: projects, isLoading } = useQuery({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const { data: projectsData, error: projError } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(1e6);
      if (projError) throw projError;
      const { data: profilesData } = await supabase.from("profiles").select("user_id, full_name, company").limit(1e6);
      const profileMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );
      return (projectsData || []).map((project) => ({
        ...project,
        profiles: profileMap.get(project.user_id) || null
      }));
    }
  });
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-64", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) });
  }
  const getStatusVariant = (status) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      default:
        return "outline";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Projects" }),
    /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Project Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Client" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Owner" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Created" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-[120px]" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: projects?.map((project) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium", children: project.name }),
        /* @__PURE__ */ jsx(TableCell, { children: project.client_name || "-" }),
        /* @__PURE__ */ jsx(TableCell, { children: project.profiles?.full_name || "Unknown" }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: getStatusVariant(project.status), children: project.status || "draft" }) }),
        /* @__PURE__ */ jsx(TableCell, { children: project.created_at ? format(new Date(project.created_at), "MMM d, yyyy") : "-" }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => navigate(`/project/${project.id}`),
              children: /* @__PURE__ */ jsx(Eye, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              disabled: exportingId === project.id,
              onClick: () => handleExport(project.id, project.name),
              children: exportingId === project.id ? /* @__PURE__ */ jsx(Spinner, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              disabled: deletingId === project.id,
              onClick: () => setConfirmDelete({ id: project.id, name: project.name }),
              children: deletingId === project.id ? /* @__PURE__ */ jsx(Spinner, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" })
            }
          )
        ] }) })
      ] }, project.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(AlertDialog, { open: !!confirmDelete, onOpenChange: () => setConfirmDelete(null), children: /* @__PURE__ */ jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsx(AlertDialogTitle, { children: "Delete Project" }),
        /* @__PURE__ */ jsxs(AlertDialogDescription, { children: [
          "Are you sure you want to delete ",
          /* @__PURE__ */ jsx("strong", { children: confirmDelete?.name }),
          "? This will permanently remove all project data including documents, analysis results, and adjustments. This action cannot be undone."
        ] })
      ] }),
      /* @__PURE__ */ jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsx(AlertDialogCancel, { children: "Cancel" }),
        /* @__PURE__ */ jsx(
          AlertDialogAction,
          {
            className: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            onClick: () => confirmDelete && handleDelete(confirmDelete.id),
            children: "Delete"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  AdminProjects as default
};
