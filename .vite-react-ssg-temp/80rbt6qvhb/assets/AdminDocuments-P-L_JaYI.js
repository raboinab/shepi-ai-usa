import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { s as supabase, B as Button } from "../main.mjs";
import { S as Spinner } from "./spinner-DXdBpr08.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CXC355eQ.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { FileDown, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import JSZip from "jszip";
import "vite-react-ssg";
import "react-router-dom";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "@radix-ui/react-tooltip";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
import "@radix-ui/react-select";
function AdminDocuments() {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [downloading, setDownloading] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [downloadingAll, setDownloadingAll] = useState(false);
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["admin-projects-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("id, name, client_name").order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      return data || [];
    }
  });
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["admin-project-documents", selectedProjectId],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("project_id", selectedProjectId).order("created_at", { ascending: false }).limit(1e6);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProjectId
  });
  const handleDownload = async (filePath, fileName) => {
    setDownloading(filePath);
    try {
      const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error("No signed URL returned");
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = fileName;
      a.target = "_blank";
      a.click();
    } catch (err) {
      toast.error(`Download failed: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };
  const handleDownloadAll = async () => {
    if (!documents?.length) return;
    setDownloadingAll(true);
    const zip = new JSZip();
    let added = 0;
    for (const doc of documents) {
      try {
        setDownloadProgress(`Fetching ${added + 1} / ${documents.length}…`);
        const { data, error } = await supabase.storage.from("documents").createSignedUrl(doc.file_path, 3600);
        if (error || !data?.signedUrl) continue;
        const resp = await fetch(data.signedUrl);
        if (!resp.ok) continue;
        const blob = await resp.blob();
        zip.file(doc.name, blob);
        added++;
      } catch {
      }
    }
    if (added === 0) {
      toast.error("No files could be downloaded");
      setDownloadingAll(false);
      setDownloadProgress("");
      return;
    }
    setDownloadProgress("Creating zip…");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    const projectName = projects?.find((p) => p.id === selectedProjectId)?.name || "documents";
    a.download = `${projectName}-documents.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Zipped ${added} of ${documents.length} files`);
    setDownloadingAll(false);
    setDownloadProgress("");
  };
  const formatCategory = (doc) => {
    const raw = doc.category || doc.account_type || doc.document_type;
    if (!raw) return "—";
    return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };
  const formatFileSize = (bytes) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
        return "default";
      case "processing":
        return "secondary";
      case "healing":
        return "secondary";
      case "reprocessing":
        return "secondary";
      case "queued_for_healing":
        return "outline";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold", children: "Documents" }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-96", children: /* @__PURE__ */ jsxs(Select, { value: selectedProjectId, onValueChange: setSelectedProjectId, children: [
        /* @__PURE__ */ jsx(SelectTrigger, { children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Select a project…" }) }),
        /* @__PURE__ */ jsx(SelectContent, { children: projectsLoading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center p-2", children: /* @__PURE__ */ jsx(Spinner, { className: "h-4 w-4" }) }) : projects?.map((p) => /* @__PURE__ */ jsxs(SelectItem, { value: p.id, children: [
          p.name,
          p.client_name ? ` — ${p.client_name}` : ""
        ] }, p.id)) })
      ] }) }),
      documents && documents.length > 0 && /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: handleDownloadAll,
          disabled: downloadingAll,
          children: [
            /* @__PURE__ */ jsx(FileDown, { className: "h-4 w-4 mr-2" }),
            downloadingAll ? downloadProgress || "Preparing…" : `Download All (${documents.length})`
          ]
        }
      )
    ] }),
    !selectedProjectId && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "Select a project to view its documents." }),
    selectedProjectId && docsLoading && /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsx(Spinner, { className: "h-8 w-8" }) }),
    selectedProjectId && !docsLoading && documents?.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No documents found for this project." }),
    documents && documents.length > 0 && /* @__PURE__ */ jsx("div", { className: "rounded-md border", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { children: "Name" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Category" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Period" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Status" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Size" }),
        /* @__PURE__ */ jsx(TableHead, { children: "Uploaded" }),
        /* @__PURE__ */ jsx(TableHead, { className: "w-[80px]" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: documents.map((doc) => /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableCell, { className: "font-medium max-w-[250px] truncate", children: doc.name }),
        /* @__PURE__ */ jsx(TableCell, { children: formatCategory(doc) }),
        /* @__PURE__ */ jsx(TableCell, { children: doc.period_start && doc.period_end ? `${doc.period_start} → ${doc.period_end}` : "—" }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(Badge, { variant: getStatusVariant(doc.processing_status), children: doc.processing_status || "pending" }) }),
        /* @__PURE__ */ jsx(TableCell, { children: formatFileSize(doc.file_size) }),
        /* @__PURE__ */ jsx(TableCell, { children: doc.created_at ? format(new Date(doc.created_at), "MMM d, yyyy") : "—" }),
        /* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            disabled: downloading === doc.file_path,
            onClick: () => handleDownload(doc.file_path, doc.name),
            children: /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" })
          }
        ) })
      ] }, doc.id)) })
    ] }) })
  ] });
}
export {
  AdminDocuments as default
};
