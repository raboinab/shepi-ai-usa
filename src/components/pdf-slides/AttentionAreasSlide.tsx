/**
 * Attention Areas / Key Findings — executive-summary card layout.
 * Each finding is a single row: priority stripe · title · impact badge · rationale · next step.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { formatCompactCurrency, type Severity } from "@/lib/pdf/exportNormalize";

interface AttentionItem {
  title: string;
  description?: string;
  rationale?: string;
  followUp?: string;
  severity?: Severity | string;
  ebitdaImpact?: number;
}

const SEVERITY: Record<string, { color: string; label: string }> = {
  high: { color: "#c0392b", label: "High Priority" },
  medium: { color: "#e67e22", label: "Medium Priority" },
  low: { color: "#27ae60", label: "Low Priority" },
  info: { color: PDF_COLORS.teal, label: "Informational" },
};

const DEFAULT_ITEMS: AttentionItem[] = [
  {
    title: "No findings recorded yet",
    severity: "info",
    rationale: "No diligence findings, hypotheses, or adjustment proposals have been published for this engagement.",
    followUp: "Run the discovery workflow or capture manual findings to populate this section.",
  },
];

export function AttentionAreasSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const rawItems = (data?.attentionItems as AttentionItem[] | undefined) ?? [];
  const items = rawItems.length > 0 ? rawItems.slice(0, 6) : DEFAULT_ITEMS;

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Attention Areas">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        {/* Heading */}
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Key Findings & Risk Assessment
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 14 }} />
        <div style={{ fontSize: 14, color: PDF_COLORS.midGray, marginBottom: 22 }}>
          Top {items.length} {items.length === 1 ? "item" : "items"} requiring attention during the Quality of Earnings analysis for {metadata.companyName}.
        </div>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item, idx) => {
            const sev = SEVERITY[(item.severity as string) || "medium"] || SEVERITY.medium;
            const rationale = item.rationale || item.description || "";
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  backgroundColor: "#FAFAF7",
                  border: `1px solid ${PDF_COLORS.lightGray}`,
                  borderRadius: 6,
                  overflow: "hidden",
                  minHeight: 92,
                }}
              >
                {/* Priority stripe */}
                <div style={{ width: 8, backgroundColor: sev.color, flexShrink: 0 }} />

                {/* Body */}
                <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: PDF_COLORS.darkBlue,
                        lineHeight: 1.25,
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </div>
                    {item.ebitdaImpact !== undefined && item.ebitdaImpact !== 0 && (
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: item.ebitdaImpact < 0 ? "#c0392b" : PDF_COLORS.teal,
                          backgroundColor: PDF_COLORS.white,
                          border: `1px solid ${PDF_COLORS.lightGray}`,
                          padding: "3px 10px",
                          borderRadius: 4,
                          whiteSpace: "nowrap",
                        }}
                      >
                        EBITDA {item.ebitdaImpact < 0 ? "↓" : "↑"} {formatCompactCurrency(item.ebitdaImpact)}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: sev.color,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {sev.label}
                    </div>
                  </div>

                  {/* Rationale */}
                  {rationale && (
                    <div style={{ fontSize: 13, color: PDF_COLORS.darkGray, lineHeight: 1.5 }}>
                      {rationale}
                    </div>
                  )}

                  {/* Follow-up */}
                  {item.followUp && (
                    <div
                      style={{
                        fontSize: 12,
                        color: PDF_COLORS.midGray,
                        lineHeight: 1.4,
                        fontStyle: "italic",
                        marginTop: 2,
                      }}
                    >
                      <span style={{ color: PDF_COLORS.teal, fontWeight: 700, fontStyle: "normal" }}>Next: </span>
                      {item.followUp}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SlideLayout>
  );
}
