import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useMemo, useEffect } from "react";
import { ClipboardList, ChevronUp, ChevronDown, CheckCircle2, AlertCircle, Minus, Circle } from "lucide-react";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { s as supabase, B as Button, m as cn, T as TooltipProvider, n as Tooltip, o as TooltipTrigger, p as TooltipContent } from "../main.mjs";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { format } from "date-fns";
import { g as getFilteredChecklist, a as getItemsByTier, T as TIER_CONFIG, i as isChecklistItemComplete } from "./documentChecklist-BAkBsBzh.js";
function DocumentChecklistReference({
  projectId,
  inventoryEnabled = false,
  wipEnabled = false,
  currentDocType,
  wizardData = {},
  notApplicable = {},
  onNavigate
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [processedDataTypes, setProcessedDataTypes] = useState(/* @__PURE__ */ new Set());
  const [qbSyncedDataTypes, setQbSyncedDataTypes] = useState(/* @__PURE__ */ new Set());
  const [loading, setLoading] = useState(true);
  const checklist = useMemo(
    () => getFilteredChecklist(inventoryEnabled, wipEnabled),
    [inventoryEnabled, wipEnabled]
  );
  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [docsResult, pdResult] = await Promise.all([
          supabase.from("documents").select("id, account_type, processing_status").eq("project_id", projectId).limit(1e6),
          supabase.from("processed_data").select("data_type, source_type").eq("project_id", projectId).limit(1e6)
        ]);
        if (docsResult.error) throw docsResult.error;
        setDocuments(docsResult.data || []);
        if (!pdResult.error && pdResult.data) {
          setProcessedDataTypes(new Set(pdResult.data.map((r) => r.data_type)));
          setQbSyncedDataTypes(new Set(
            pdResult.data.filter((r) => r.source_type === "quickbooks_api").map((r) => r.data_type)
          ));
        }
      } catch (error) {
        console.error("Error fetching checklist data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const channel = supabase.channel(`checklist-docs-${projectId}`).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "documents",
        filter: `project_id=eq.${projectId}`
      },
      () => {
        fetchData();
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
  const isItemComplete = (item) => {
    return isChecklistItemComplete(item, wizardData, documents, notApplicable, processedDataTypes);
  };
  const isItemNA = (item) => {
    return notApplicable[item.id] || false;
  };
  const getQBSyncInfo = (item) => {
    const sectionKey = item.checkWizardSection;
    if (sectionKey && wizardData[sectionKey]) {
      const sectionData = wizardData[sectionKey];
      const synced = sectionData.syncSource === "quickbooks" || !!sectionData.lastSyncDate;
      if (synced) {
        return { synced: true, lastSyncDate: sectionData.lastSyncDate };
      }
    }
    if (item.docType && qbSyncedDataTypes.has(item.docType)) {
      return { synced: true };
    }
    return { synced: false };
  };
  const getTierStats = (tier) => {
    const items = getItemsByTier(checklist, tier);
    const completed = items.filter((item) => isItemComplete(item)).length;
    return { total: items.length, completed };
  };
  const requiredStats = getTierStats("required");
  const recommendedStats = getTierStats("recommended");
  const optionalStats = getTierStats("optional");
  const isCurrentItem = (item) => {
    return currentDocType !== null && item.docType === currentDocType;
  };
  const renderTierSection = (tier) => {
    const items = getItemsByTier(checklist, tier);
    const config = TIER_CONFIG[tier];
    const stats = getTierStats(tier);
    return /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxs("div", { className: cn("text-xs font-medium flex items-center gap-2", config.color), children: [
        /* @__PURE__ */ jsx("span", { children: config.label.toUpperCase() }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
          "(",
          stats.completed,
          "/",
          stats.total,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-0.5 pl-1", children: items.map((item) => {
        const complete = isItemComplete(item);
        const isNA = isItemNA(item);
        const isCurrent = isCurrentItem(item);
        const qbInfo = getQBSyncInfo(item);
        return /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => {
              if (onNavigate && item.sectionNav) {
                onNavigate(item.sectionNav.phase, item.sectionNav.section, item.docType || void 0);
              }
            },
            className: cn(
              "flex items-center gap-2 text-sm py-0.5 px-2 rounded-sm transition-colors",
              isCurrent && "bg-primary/10 font-medium",
              !isCurrent && "hover:bg-muted/50",
              onNavigate && item.sectionNav && "cursor-pointer"
            ),
            children: [
              isNA ? /* @__PURE__ */ jsx(Minus, { className: "h-3.5 w-3.5 text-muted-foreground flex-shrink-0" }) : complete ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" }) : /* @__PURE__ */ jsx(Circle, { className: "h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" }),
              /* @__PURE__ */ jsx("span", { className: cn(
                "truncate",
                complete && !isNA && "text-muted-foreground",
                isNA && "text-muted-foreground line-through"
              ), children: item.label }),
              qbInfo.synced && /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
                /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
                  Badge,
                  {
                    variant: "secondary",
                    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0 ml-1",
                    children: "QB"
                  }
                ) }),
                /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm", children: qbInfo.lastSyncDate ? `Synced from QuickBooks on ${format(new Date(qbInfo.lastSyncDate), "MMM d, yyyy 'at' h:mm a")}` : "Synced from QuickBooks" }) })
              ] }) }),
              isCurrent && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "ml-auto text-[10px] px-1.5 py-0", children: "Current" })
            ]
          },
          item.id
        );
      }) })
    ] }, tier);
  };
  const renderSummaryBadges = () => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
    /* @__PURE__ */ jsxs(
      Badge,
      {
        variant: requiredStats.completed === requiredStats.total ? "default" : "destructive",
        className: "text-xs",
        children: [
          requiredStats.completed === requiredStats.total ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3 mr-1" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "h-3 w-3 mr-1" }),
          "Required: ",
          requiredStats.completed,
          "/",
          requiredStats.total
        ]
      }
    ),
    /* @__PURE__ */ jsxs(
      Badge,
      {
        variant: "secondary",
        className: cn(
          "text-xs",
          recommendedStats.completed === recommendedStats.total && "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
        ),
        children: [
          "Recommended: ",
          recommendedStats.completed,
          "/",
          recommendedStats.total
        ]
      }
    ),
    /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-xs text-muted-foreground", children: [
      "Optional: ",
      optionalStats.completed,
      "/",
      optionalStats.total
    ] })
  ] });
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "border rounded-lg p-3 bg-muted/30 animate-pulse", children: /* @__PURE__ */ jsx("div", { className: "h-5 w-48 bg-muted rounded" }) });
  }
  return /* @__PURE__ */ jsx(Collapsible, { open: isOpen, onOpenChange: setIsOpen, children: /* @__PURE__ */ jsxs("div", { className: "border rounded-lg bg-card", children: [
    /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        className: "w-full justify-between p-3 h-auto hover:bg-muted/50",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "Document Checklist" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            !isOpen && renderSummaryBadges(),
            isOpen ? /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })
          ] })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(CollapsibleContent, { children: /* @__PURE__ */ jsxs("div", { className: "px-3 pb-3 pt-1 border-t space-y-3", children: [
      renderSummaryBadges(),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-4 sm:grid-cols-3 pt-2", children: [
        renderTierSection("required"),
        renderTierSection("recommended"),
        renderTierSection("optional")
      ] })
    ] }) })
  ] }) });
}
export {
  DocumentChecklistReference as D
};
