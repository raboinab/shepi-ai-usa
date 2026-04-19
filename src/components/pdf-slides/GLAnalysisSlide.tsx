/**
 * GL / JE Analysis slide — AI findings about unusual GL patterns and journal entry anomalies.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

interface AnalysisFinding {
  title: string;
  description: string;
  severity?: string;
  category?: string;
}

export function GLAnalysisSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const glFindings = (data?.glFindings as AnalysisFinding[]) || [];
  const jeFindings = (data?.jeFindings as AnalysisFinding[]) || [];
  const allFindings = [...glFindings, ...jeFindings];

  const severityIcon = (s?: string) => {
    if (s === "high" || s === "critical") return { color: PDF_COLORS.red, label: "●" };
    if (s === "medium") return { color: "#e67e22", label: "●" };
    return { color: PDF_COLORS.green, label: "●" };
  };

  const displayFindings = allFindings.slice(0, 10);

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="AI Analysis">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          General Ledger & Journal Entry Analysis
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 24 }} />

        {allFindings.length === 0 ? (
          <div style={{ fontSize: 18, color: PDF_COLORS.midGray, marginTop: 40 }}>
            No GL/JE analysis findings available. Run the AI analysis to populate this section.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {displayFindings.map((f, i) => {
              const sev = severityIcon(f.severity);
              return (
                <div key={i} style={{ display: "flex", gap: 16, backgroundColor: PDF_COLORS.offWhite, borderRadius: 8, padding: "16px 24px", borderLeft: `4px solid ${sev.color}` }}>
                  <div style={{ flexShrink: 0, fontSize: 20, color: sev.color, marginTop: 2 }}>{sev.label}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 14, color: PDF_COLORS.darkGray, lineHeight: 1.5 }}>{f.description}</div>
                    {f.category && (
                      <div style={{ fontSize: 12, color: PDF_COLORS.midGray, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>{f.category}</div>
                    )}
                  </div>
                </div>
              );
            })}
            {allFindings.length > 10 && (
              <div style={{ fontSize: 14, color: PDF_COLORS.midGray, fontStyle: "italic" }}>
                … and {allFindings.length - 10} additional findings
              </div>
            )}
          </div>
        )}
      </div>
    </SlideLayout>
  );
}
