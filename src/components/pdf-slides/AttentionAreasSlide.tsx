/**
 * Attention Areas / Key Findings — structured mini-brief cards.
 * Each card answers: What? Impact? Why? Follow-up?
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

interface AttentionItem {
  title: string;
  description?: string;
  rationale?: string;
  followUp?: string;
  severity?: "high" | "medium" | "low" | "info";
  ebitdaImpact?: number;
}

function cleanMarkdown(s: string): string {
  if (!s) return "";
  return s.replace(/\*\*/g, "").replace(/[#>~`_]/g, "").replace(/\s{2,}/g, " ").trim();
}

const severityLabel: Record<string, string> = {
  high: "High Priority",
  medium: "Medium Priority",
  low: "Low Priority",
  info: "Informational",
};

const severityColor: Record<string, string> = {
  high: "#c0392b",
  medium: "#e67e22",
  low: "#27ae60",
  info: PDF_COLORS.midBlue,
};

function formatImpact(v: number | undefined): string | null {
  if (v === undefined || v === null || v === 0) return null;
  const abs = Math.abs(v);
  const formatted =
    abs >= 1_000_000
      ? `$${(abs / 1_000_000).toFixed(1)}M`
      : abs >= 1_000
        ? `$${(abs / 1_000).toFixed(0)}K`
        : `$${abs.toLocaleString("en-US")}`;
  return v < 0 ? `(${formatted})` : formatted;
}

const DEFAULT_ITEMS: AttentionItem[] = [
  {
    title: "Revenue Recognition Timing",
    description: "Review of revenue cut-off procedures and deferred revenue balances across reporting periods.",
    rationale: "Inconsistent cut-off may overstate or understate earnings in any given period, affecting normalized EBITDA.",
    followUp: "Review deferred revenue schedules and confirm cut-off procedures with controller.",
    severity: "medium",
  },
  {
    title: "Related Party Transactions",
    description: "Identify and quantify transactions with related entities that may not reflect arm's-length terms.",
    rationale: "Non-arm's-length pricing directly impacts reported margins and may not persist post-transaction.",
    followUp: "Obtain related party listing and compare pricing to third-party benchmarks.",
    severity: "high",
  },
  {
    title: "Working Capital Normalization",
    description: "Assess whether working capital levels are consistent with historical norms and industry benchmarks.",
    rationale: "Abnormal working capital at close creates a peg adjustment that affects enterprise value.",
    followUp: "Calculate trailing 12-month average NWC and compare to proposed peg.",
    severity: "medium",
  },
  {
    title: "Owner Compensation & Perquisites",
    description: "Evaluate owner/officer compensation relative to market rates and identify personal expenses.",
    rationale: "Above-market compensation is a standard add-back; below-market understates true operating cost.",
    followUp: "Benchmark officer comp against industry salary surveys and review expense reports.",
    severity: "low",
  },
  {
    title: "Customer Concentration Risk",
    description: "Quantify revenue dependency on top customers and assess sustainability of key relationships.",
    rationale: "High concentration increases buyer risk and may warrant an EBITDA discount or earnout structure.",
    followUp: "Obtain customer-level revenue detail and confirm contract renewal status for top 5 accounts.",
    severity: "medium",
  },
  {
    title: "Non-Recurring Items",
    description: "Identify and remove one-time expenses and revenues to arrive at normalized earnings.",
    rationale: "Failure to properly normalize one-time items misrepresents the go-forward earnings power of the business.",
    followUp: "Review management's list of proposed add-backs and validate with supporting documentation.",
    severity: "info",
  },
];

export function AttentionAreasSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const raw = (data?.attentionItems as AttentionItem[]) || DEFAULT_ITEMS;

  const items = raw.map((item) => ({
    ...item,
    title: cleanMarkdown(item.title),
    description: item.description ? cleanMarkdown(item.description) : undefined,
    rationale: item.rationale ? cleanMarkdown(item.rationale) : undefined,
    followUp: item.followUp ? cleanMarkdown(item.followUp) : undefined,
  }));

  const displayItems = items.slice(0, 6);

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Attention Areas">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          Attention Areas
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.midBlue, marginBottom: 12 }} />
        <div style={{ fontSize: 14, color: PDF_COLORS.midGray, marginBottom: 20 }}>
          Key areas requiring additional scrutiny during the Quality of Earnings analysis for {metadata.companyName}.
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {displayItems.map((item, idx) => {
            const sev = item.severity || "medium";
            const impact = formatImpact(item.ebitdaImpact);
            const whyText = item.rationale || item.description;
            return (
              <div
                key={idx}
                style={{
                  width: "calc(50% - 8px)",
                  backgroundColor: PDF_COLORS.offWhite,
                  borderLeft: `4px solid ${severityColor[sev] || severityColor.medium}`,
                  borderRadius: 6,
                  padding: "14px 18px",
                  boxSizing: "border-box",
                }}
              >
                {/* Row 1: Title + severity badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: PDF_COLORS.darkBlue, flex: 1 }}>
                    {item.title.length > 50 ? item.title.substring(0, 50) + "…" : item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: severityColor[sev] || severityColor.medium,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      flexShrink: 0,
                      marginLeft: 10,
                    }}
                  >
                    {severityLabel[sev] || "Medium Priority"}
                  </div>
                </div>

                {/* Row 2: EBITDA impact */}
                {impact && (
                  <div style={{ fontSize: 12, color: PDF_COLORS.darkBlue, fontWeight: 600, marginBottom: 4 }}>
                    Est. EBITDA Impact: {impact}
                  </div>
                )}

                {/* Row 3: Why it matters */}
                {whyText && (
                  <div style={{ fontSize: 12, color: PDF_COLORS.midGray, lineHeight: 1.5, fontStyle: "italic", marginBottom: 4 }}>
                    {whyText.length > 140 ? whyText.substring(0, 140) + "…" : whyText}
                  </div>
                )}

                {/* Row 4: Follow-up needed */}
                {item.followUp && (
                  <div style={{ fontSize: 11, color: PDF_COLORS.midBlue, lineHeight: 1.4, marginTop: 2 }}>
                    ▸ {item.followUp.length > 100 ? item.followUp.substring(0, 100) + "…" : item.followUp}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </SlideLayout>
  );
}
