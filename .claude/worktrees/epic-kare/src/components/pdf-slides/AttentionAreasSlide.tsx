/**
 * Attention Areas / Key Findings narrative slide.
 * Renders bullet-pointed risk items and observations.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideBulletList } from "./shared/SlideBulletList";

interface AttentionItem {
  title: string;
  description?: string;
  severity?: "high" | "medium" | "low" | "info";
}

const DEFAULT_ITEMS: AttentionItem[] = [
  {
    title: "Revenue Recognition Timing",
    description: "Review of revenue cut-off procedures and deferred revenue balances across reporting periods.",
    severity: "medium",
  },
  {
    title: "Related Party Transactions",
    description: "Identify and quantify transactions with related entities that may not reflect arm's-length terms.",
    severity: "high",
  },
  {
    title: "Working Capital Normalization",
    description: "Assess whether working capital levels are consistent with historical norms and industry benchmarks.",
    severity: "medium",
  },
  {
    title: "Owner Compensation & Perquisites",
    description: "Evaluate owner/officer compensation relative to market rates and identify personal expenses.",
    severity: "low",
  },
  {
    title: "Customer Concentration Risk",
    description: "Quantify revenue dependency on top customers and assess sustainability of key relationships.",
    severity: "medium",
  },
  {
    title: "Non-Recurring Items",
    description: "Identify and remove one-time expenses and revenues to arrive at normalized earnings.",
    severity: "info",
  },
];

export function AttentionAreasSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const items = (data?.attentionItems as AttentionItem[]) || DEFAULT_ITEMS;

  return (
    <SlideLayout
      metadata={metadata}
      pageNumber={pageNumber}
      totalPages={totalPages}
      sectionTitle="Attention Areas"
    >
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ display: "flex", gap: 80 }}>
          {/* Left: title area */}
          <div style={{ width: 380, flexShrink: 0 }}>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: PDF_COLORS.darkBlue,
                marginBottom: 8,
              }}
            >
              Attention Areas
            </div>
            <div
              style={{
                width: 60,
                height: 4,
                backgroundColor: PDF_COLORS.teal,
                marginBottom: 20,
              }}
            />
            <div style={{ fontSize: 16, color: PDF_COLORS.midGray, lineHeight: 1.6 }}>
              Key areas requiring additional scrutiny during the Quality of Earnings analysis
              for {metadata.companyName}.
            </div>

            {/* Legend */}
            <div style={{ marginTop: 32 }}>
              {[
                { label: "High Priority", color: "#c0392b" },
                { label: "Medium Priority", color: "#e67e22" },
                { label: "Low Priority", color: "#27ae60" },
                { label: "Informational", color: PDF_COLORS.teal },
              ].map((leg) => (
                <div
                  key={leg.label}
                  style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: leg.color,
                    }}
                  />
                  <span style={{ fontSize: 13, color: PDF_COLORS.midGray }}>{leg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: bullet items */}
          <div style={{ flex: 1 }}>
            <SlideBulletList items={items} />
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}
