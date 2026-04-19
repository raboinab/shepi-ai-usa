/**
 * DD Adjustments slide — renders a table of all due-diligence adjustments.
 * Filters out zero/empty placeholder rows. Includes verification status.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

interface AdjustmentRow {
  title: string;
  description?: string;
  block?: string;
  adjustmentClass?: string;
  amount?: number;
  status?: string;
  verificationStatus?: string;
  verificationScore?: number | null;
  matchCount?: number;
  redFlagCount?: number;
}

export function DDAdjustmentsSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const rawAdjustments = (data?.adjustments as AdjustmentRow[]) || [];

  // Filter out placeholder/empty adjustments
  const adjustments = rawAdjustments.filter((a) => {
    const hasAmount = a.amount !== undefined && a.amount !== null && a.amount !== 0;
    const hasDescription = !!(a.description && a.description.trim());
    const hasTitle = !!(a.title && a.title.trim() && !a.title.match(/^[0-9a-f]{8}-/i)); // not a UUID
    return hasAmount || (hasDescription && hasTitle);
  });

  const columns = [
    { key: "title", label: "Adjustment", align: "left" as const, width: "30%" },
    { key: "block", label: "Block", align: "center" as const, width: "8%" },
    { key: "adjustmentClass", label: "Category", align: "center" as const, width: "12%" },
    { key: "description", label: "Description", align: "left" as const, width: "22%" },
    { key: "verification", label: "Verified", align: "center" as const, width: "13%" },
    { key: "amount", label: "Amount ($)", align: "right" as const, width: "15%" },
  ];

  const blockLabel = (b: string) => {
    if (b === "MA") return "Mgmt";
    if (b === "DD") return "DD";
    if (b === "PF") return "Pro Forma";
    return b;
  };

  const classLabel = (c: string) => {
    if (!c) return "—";
    return c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatAmount = (v: number | undefined) => {
    if (v === undefined || v === null) return "—";
    const abs = Math.abs(v);
    const formatted = abs >= 1000
      ? abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : abs.toLocaleString("en-US");
    return v < 0 ? `(${formatted})` : formatted;
  };

  const STATUS_LABELS: Record<string, string> = {
    validated: "Validated",
    supported: "Supported",
    partial: "Partial",
    insufficient: "Insufficient",
    contradictory: "Contradictory",
  };

  const formatVerification = (a: AdjustmentRow) => {
    if (!a.verificationStatus || a.verificationStatus === "pending") return "—";
    const label = STATUS_LABELS[a.verificationStatus] ?? a.verificationStatus;
    if (a.verificationScore != null) return `${label} (${a.verificationScore})`;
    return label;
  };

  const displayRows = adjustments.slice(0, 15);
  const totalAmount = adjustments.reduce((sum, a) => sum + (a.amount || 0), 0);

  // Compute aggregate verification stats for footnote
  const verifiedCount = adjustments.filter(a => a.verificationStatus && a.verificationStatus !== "pending").length;
  const totalMatches = adjustments.reduce((s, a) => s + (a.matchCount || 0), 0);
  const totalFlags = adjustments.reduce((s, a) => s + (a.redFlagCount || 0), 0);

  const tableRows = [
    ...displayRows.map((a) => ({
      cells: {
        title: a.title.match(/^[0-9a-f]{8}-/i) ? "Untitled Adjustment" : a.title,
        block: blockLabel(a.block || ""),
        adjustmentClass: classLabel(a.adjustmentClass || ""),
        description: (a.description || "").substring(0, 50) + ((a.description || "").length > 50 ? "…" : ""),
        verification: formatVerification(a),
        amount: formatAmount(a.amount),
      },
    })),
    ...(adjustments.length > 15
      ? [{ cells: { title: `… and ${adjustments.length - 15} more`, block: "", adjustmentClass: "", description: "", verification: "", amount: "" }, indent: 1 }]
      : []),
    ...(adjustments.length > 0
      ? [
          { separator: true, cells: {} },
          {
            cells: {
              title: "Total Net Adjustment Impact",
              block: "",
              adjustmentClass: "",
              description: "",
              verification: "",
              amount: formatAmount(totalAmount),
            },
            bold: true,
            highlight: true,
          },
        ]
      : []),
  ];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="DD Adjustments">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          Due Diligence Adjustments
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.midBlue, marginBottom: 24 }} />

        {adjustments.length === 0 ? (
          <div style={{ fontSize: 18, color: PDF_COLORS.midGray, marginTop: 40 }}>
            No adjustments have been recorded for this engagement.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: PDF_COLORS.midGray, marginBottom: 16 }}>
              {adjustments.length} adjustment{adjustments.length !== 1 ? "s" : ""} identified across Management, Due Diligence, and Pro Forma categories.
            </div>
            <SlideTable columns={columns} rows={tableRows} compact />
            {verifiedCount > 0 && (
              <div style={{ fontSize: 11, color: PDF_COLORS.midGray, marginTop: 12, fontStyle: "italic" }}>
                {verifiedCount} of {adjustments.length} adjustment{adjustments.length !== 1 ? "s" : ""} verified
                {totalMatches > 0 ? ` · ${totalMatches} supporting transaction${totalMatches !== 1 ? "s" : ""} matched` : ""}
                {totalFlags > 0 ? ` · ${totalFlags} red flag${totalFlags !== 1 ? "s" : ""} identified` : ""}
              </div>
            )}
          </>
        )}
      </div>
    </SlideLayout>
  );
}
