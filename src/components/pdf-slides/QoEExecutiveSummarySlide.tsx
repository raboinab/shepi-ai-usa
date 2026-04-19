/**
 * QoE Executive Summary slide — KPI cards showing Revenue, EBITDA, Adjusted EBITDA, margins.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

interface KPIMetric {
  label: string;
  value: string;
  subtitle?: string;
  accent?: string;
}

const fmtCurrency = (n: number): string => {
  if (isNaN(n) || n === 0) return "—";
  const abs = Math.abs(n);
  const formatted = abs >= 1_000_000
    ? `$${(abs / 1_000_000).toFixed(1)}M`
    : abs >= 1_000
      ? `$${(abs / 1_000).toFixed(0)}K`
      : `$${abs.toLocaleString("en-US")}`;
  return n < 0 ? `(${formatted})` : formatted;
};

const fmtPct = (n: number): string => {
  if (isNaN(n) || !isFinite(n)) return "N/A";
  return `${(n * 100).toFixed(1)}%`;
};

export function QoEExecutiveSummarySlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const d = (data || {}) as Record<string, unknown>;
  const revenue = (d.revenue as number) || 0;
  const grossProfit = (d.grossProfit as number) || 0;
  const reportedEBITDA = (d.reportedEBITDA as number) || 0;
  const adjustedEBITDA = (d.adjustedEBITDA as number) || 0;
  const totalAdj = (d.totalAdjustments as number) || 0;
  const adjCount = (d.adjustmentCount as number) || 0;
  const netIncome = (d.netIncome as number) || 0;

  const grossMargin = revenue > 0 ? grossProfit / revenue : NaN;
  const ebitdaMargin = revenue > 0 ? adjustedEBITDA / revenue : NaN;

  const metrics: KPIMetric[] = [
    { label: "LTM Revenue", value: fmtCurrency(revenue), accent: PDF_COLORS.lightBlue },
    { label: "Gross Profit", value: fmtCurrency(grossProfit), subtitle: `Margin: ${fmtPct(grossMargin)}`, accent: PDF_COLORS.teal },
    { label: "Reported EBITDA", value: fmtCurrency(reportedEBITDA), accent: PDF_COLORS.midBlue },
    { label: "Adjusted EBITDA", value: fmtCurrency(adjustedEBITDA), subtitle: `Margin: ${fmtPct(ebitdaMargin)}`, accent: PDF_COLORS.gold },
  ];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Executive Summary">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          Quality of Earnings — Executive Summary
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 32 }} />

        {/* KPI Cards */}
        <div style={{ display: "flex", gap: 28, marginBottom: 40 }}>
          {metrics.map((m, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor: PDF_COLORS.offWhite,
                borderRadius: 12,
                padding: "28px 24px",
                borderTop: `4px solid ${m.accent || PDF_COLORS.teal}`,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: PDF_COLORS.midGray, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
                {m.value}
              </div>
              {m.subtitle && (
                <div style={{ fontSize: 14, color: PDF_COLORS.midGray }}>{m.subtitle}</div>
              )}
            </div>
          ))}
        </div>

        {/* Bridge summary row */}
        <div style={{ display: "flex", gap: 40 }}>
          <div style={{ flex: 1, backgroundColor: PDF_COLORS.darkBlue, borderRadius: 12, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: PDF_COLORS.teal, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Total QoE Adjustments</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.white }}>{fmtCurrency(totalAdj)}</div>
            </div>
            <div style={{ fontSize: 14, color: PDF_COLORS.lightGray }}>
              {adjCount < 0 || (adjCount === 0 && totalAdj !== 0)
                ? "Adjustments applied"
                : `${adjCount} adjustment${adjCount !== 1 ? "s" : ""} identified`}
            </div>
          </div>
          <div style={{ flex: 1, backgroundColor: PDF_COLORS.offWhite, borderRadius: 12, padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, color: PDF_COLORS.midGray, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Net Income</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue }}>{fmtCurrency(netIncome)}</div>
            </div>
            <div style={{ fontSize: 14, color: PDF_COLORS.midGray }}>
              As reported (LTM)
            </div>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}
