/**
 * Financial Ratios slide — key performance ratios in a clean table layout.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

interface RatioItem {
  name: string;
  value: string;
  category: string;
}

export function FinancialRatiosSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const ratios = (data?.ratios as RatioItem[]) || [];

  // Group by category
  const categories = new Map<string, RatioItem[]>();
  for (const r of ratios) {
    const cat = r.category || "Other";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(r);
  }

  const categoryColors: Record<string, string> = {
    Profitability: PDF_COLORS.teal,
    Liquidity: PDF_COLORS.lightBlue,
    Efficiency: PDF_COLORS.gold,
    Leverage: PDF_COLORS.midBlue,
    Other: PDF_COLORS.midGray,
  };

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Financial Ratios">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          Financial Ratios & Metrics
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 32 }} />

        {ratios.length === 0 ? (
          <div style={{ fontSize: 18, color: PDF_COLORS.midGray, marginTop: 40 }}>
            Financial ratios will be populated from project data.
          </div>
        ) : (
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {Array.from(categories.entries()).map(([cat, items]) => (
              <div key={cat} style={{ flex: "1 1 420px", backgroundColor: PDF_COLORS.offWhite, borderRadius: 12, padding: 28, borderTop: `4px solid ${categoryColors[cat] || PDF_COLORS.midGray}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: PDF_COLORS.darkBlue, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20 }}>
                  {cat}
                </div>
                {items.map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < items.length - 1 ? `1px solid ${PDF_COLORS.lightGray}` : "none" }}>
                    <span style={{ fontSize: 15, color: PDF_COLORS.darkGray }}>{r.name}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: PDF_COLORS.darkBlue }}>{r.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </SlideLayout>
  );
}
