/**
 * PDF slide showing a summary table of adjustment verification proofs.
 * Excludes pending-status rows.
 */
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";
import { PDF_COLORS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";

const STATUS_COLORS: Record<string, string> = {
  validated: "#059669",
  supported: "#16a34a",
  partial: "#d97706",
  insufficient: "#dc2626",
  contradictory: "#b91c1c",
};

export function VerificationSummarySlide(props: SlideProps) {
  const { metadata, pageNumber, totalPages, data } = props;
  const rawData = (data?.rawData ?? []) as Array<{
    adjustment_id: string;
    validation_status: string;
    validation_score: number | null;
    key_findings: string[];
    red_flags: string[];
    verification_type: string;
    description?: string;
  }>;

  const columns = [
    { key: "adjustment", label: "Adjustment", align: "left" as const, width: "30%" },
    { key: "type", label: "Type", align: "center" as const, width: "12%" },
    { key: "status", label: "Status", align: "center" as const, width: "12%" },
    { key: "score", label: "Score", align: "center" as const, width: "8%" },
    { key: "finding", label: "Top Finding", align: "left" as const, width: "22%" },
    { key: "redFlag", label: "Red Flag", align: "left" as const, width: "16%" },
  ];

  const rows = rawData
    .filter((r) => r.validation_status !== "pending")
    .map((r) => ({
      cells: {
        adjustment: r.description || r.adjustment_id.slice(0, 12),
        type: r.verification_type || "—",
        status: r.validation_status.charAt(0).toUpperCase() + r.validation_status.slice(1),
        score: r.validation_score ?? "—",
        finding: r.key_findings?.[0]
          ? r.key_findings[0].length > 60
            ? r.key_findings[0].slice(0, 59) + "…"
            : r.key_findings[0]
          : "—",
        redFlag: r.red_flags?.[0]
          ? r.red_flags[0].length > 50
            ? r.red_flags[0].slice(0, 49) + "…"
            : r.red_flags[0]
          : "—",
      },
    }));

  return (
    <SlideLayout
      metadata={metadata}
      pageNumber={pageNumber}
      totalPages={totalPages}
      sectionTitle="Verification Summary"
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Adjustment Verification Summary
        </div>
        <div style={{ fontSize: 16, color: PDF_COLORS.midGray }}>
          Proof validation results for due diligence adjustments
        </div>
      </div>
      {rows.length > 0 ? (
        <SlideTable columns={columns} rows={rows} compact />
      ) : (
        <div style={{ fontSize: 18, color: PDF_COLORS.midGray, textAlign: "center", marginTop: 120 }}>
          No verified adjustments to display
        </div>
      )}
    </SlideLayout>
  );
}
