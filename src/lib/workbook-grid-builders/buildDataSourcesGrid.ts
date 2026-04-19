/**
 * Builds a GridData for the "Data Sources" tab in the Excel workbook.
 * Shows the document manifest: Document | Tier | Status | Upload Date
 */
import type { GridData, GridRow } from "../workbook-types";

export interface DocSourceItem {
  label: string;
  tier: "required" | "recommended" | "optional";
  status: "provided" | "not_provided" | "na";
  uploadDate?: string;
}

const TIER_ORDER: Array<"required" | "recommended" | "optional"> = ["required", "recommended", "optional"];
const TIER_LABELS: Record<string, string> = {
  required: "REQUIRED",
  recommended: "RECOMMENDED",
  optional: "OPTIONAL",
};
const STATUS_LABELS: Record<string, string> = {
  provided: "Provided",
  not_provided: "Not Provided",
  na: "N/A",
};

export function buildDataSourcesGrid(sources: DocSourceItem[]): GridData {
  const columns = [
    { key: "document", label: "Document", width: 300, align: "left" as const, format: "text" as const },
    { key: "tier", label: "Tier", width: 120, align: "center" as const, format: "text" as const },
    { key: "status", label: "Status", width: 120, align: "center" as const, format: "text" as const },
    { key: "uploadDate", label: "Upload Date", width: 140, align: "center" as const, format: "text" as const },
  ];

  const rows: GridRow[] = [];

  for (const tier of TIER_ORDER) {
    const items = sources.filter((s) => s.tier === tier);
    if (items.length === 0) continue;

    rows.push({
      id: `header-${tier}`,
      type: "section-header",
      label: TIER_LABELS[tier],
      cells: { document: TIER_LABELS[tier], tier: "", status: "", uploadDate: "" },
    });

    for (const item of items) {
      rows.push({
        id: `src-${tier}-${item.label}`,
        type: "data",
        cells: {
          document: item.label,
          tier: TIER_LABELS[tier],
          status: STATUS_LABELS[item.status] || item.status,
          uploadDate: item.uploadDate || "—",
        },
      });
    }

    rows.push({ id: `spacer-${tier}`, type: "spacer", cells: {} });
  }

  // Footer warning if required docs are missing
  const requiredMissing = sources.filter((s) => s.tier === "required" && s.status === "not_provided");
  if (requiredMissing.length > 0) {
    rows.push({
      id: "warning",
      type: "total",
      cells: {
        document: `⚠ ${requiredMissing.length} of ${sources.filter((s) => s.tier === "required").length} required documents not provided. Analysis scope limited accordingly.`,
        tier: "",
        status: "",
        uploadDate: "",
      },
    });
  }

  return { columns, rows, frozenColumns: 1 };
}
