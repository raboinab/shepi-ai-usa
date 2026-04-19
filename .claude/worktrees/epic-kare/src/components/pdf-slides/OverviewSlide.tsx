/**
 * Overview slide — split layout with company details.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

export function OverviewSlide({ metadata, pageNumber, totalPages }: SlideProps) {
  const details = [
    { label: "Target Company", value: metadata.companyName },
    { label: "Client", value: metadata.clientName || "—" },
    { label: "Industry", value: metadata.industry || "—" },
    { label: "Transaction Type", value: metadata.transactionType || "—" },
    { label: "Fiscal Year End", value: metadata.fiscalYearEnd || "—" },
    { label: "Report Date", value: metadata.reportDate },
  ];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Overview">
      <div style={{ display: "flex", gap: 60, height: "100%", fontFamily: PDF_FONTS.body }}>
        {/* Left panel */}
        <div style={{ width: 500, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: PDF_COLORS.darkBlue,
              marginBottom: 8,
            }}
          >
            Engagement Overview
          </div>
          <div
            style={{
              width: 60,
              height: 4,
              backgroundColor: PDF_COLORS.teal,
              marginBottom: 24,
            }}
          />
          <p style={{ fontSize: 16, lineHeight: 1.7, color: PDF_COLORS.midGray }}>
            This Quality of Earnings report provides an independent analysis of the historical
            financial performance and condition of {metadata.companyName}. The analysis covers
            the key financial metrics, adjustments to reported earnings, and assessment of
            the sustainability of earnings.
          </p>
        </div>

        {/* Right panel — blue card */}
        <div
          style={{
            flex: 1,
            backgroundColor: PDF_COLORS.darkBlue,
            borderRadius: 12,
            padding: 48,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: PDF_COLORS.teal,
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            Company Details
          </div>

          {details.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: `1px solid rgba(255,255,255,0.1)`,
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>
                {item.label}
              </span>
              <span style={{ color: PDF_COLORS.white, fontSize: 16, fontWeight: 600 }}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
}
