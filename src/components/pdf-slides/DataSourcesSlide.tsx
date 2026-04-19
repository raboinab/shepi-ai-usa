/**
 * Data Sources slide — lists documents provided/missing grouped by tier.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

interface DocSourceItem {
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

export function DataSourcesSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const sources: DocSourceItem[] = (data?.documentSources as DocSourceItem[]) || [];

  const requiredItems = sources.filter((s) => s.tier === "required");
  const requiredMissing = requiredItems.filter((s) => s.status === "not_provided").length;

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Data Sources">
      <div style={{ fontFamily: PDF_FONTS.body, maxWidth: 1600 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: PDF_COLORS.darkBlue,
            marginBottom: 8,
          }}
        >
          Data Sources &amp; Document Coverage
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            backgroundColor: PDF_COLORS.teal,
            marginBottom: 24,
          }}
        />

        {TIER_ORDER.map((tier) => {
          const items = sources.filter((s) => s.tier === tier);
          if (items.length === 0) return null;

          return (
            <div key={tier} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: tier === "required" ? "#c0392b" : tier === "recommended" ? "#d4a017" : PDF_COLORS.midGray,
                  letterSpacing: 1.5,
                  marginBottom: 10,
                  textTransform: "uppercase" as const,
                }}
              >
                {TIER_LABELS[tier]}
              </div>

              {items.map((item, idx) => {
                const icon = item.status === "provided" ? "\u2713" : item.status === "na" ? "\u2014" : "\u2717";
                const iconColor = item.status === "provided" ? "#27ae60" : item.status === "na" ? PDF_COLORS.midGray : "#c0392b";
                const statusText =
                  item.status === "provided"
                    ? `Provided${item.uploadDate ? ` (${item.uploadDate})` : ""}`
                    : item.status === "na"
                    ? "N/A"
                    : "Not Provided";

                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "6px 0",
                      borderBottom: `1px solid ${PDF_COLORS.lightGray}`,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 700, color: iconColor, width: 24, textAlign: "center" }}>
                      {icon}
                    </span>
                    <span style={{ fontSize: 15, color: PDF_COLORS.darkGray, flex: 1 }}>{item.label}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: item.status === "provided" ? "#27ae60" : item.status === "na" ? PDF_COLORS.midGray : "#c0392b",
                      }}
                    >
                      {statusText}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Warning footer if required docs missing */}
        {requiredMissing > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              backgroundColor: "#fef3c7",
              borderLeft: "4px solid #d4a017",
              fontSize: 14,
              color: PDF_COLORS.darkGray,
              lineHeight: 1.6,
            }}
          >
            {requiredMissing} of {requiredItems.length} required document(s) not provided. Analysis scope limited accordingly.
          </div>
        )}

        <div
          style={{
            marginTop: 20,
            fontSize: 12,
            color: PDF_COLORS.midGray,
            fontStyle: "italic",
          }}
        >
          The completeness of this analysis is limited to the data sources listed above.
        </div>
      </div>
    </SlideLayout>
  );
}
