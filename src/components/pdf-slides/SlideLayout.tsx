/**
 * Base 1920x1080 slide wrapper with editorial header, footer, and page number.
 * Uses inline styles for html-to-image compatibility.
 */
import { PDF_COLORS, PDF_FONTS, SLIDE_DIMENSIONS } from "@/lib/pdf/theme";
import type { ReportMetadata } from "@/lib/pdf/reportTypes";

interface SlideLayoutProps {
  children: React.ReactNode;
  metadata: ReportMetadata;
  pageNumber: number;
  totalPages: number;
  sectionTitle?: string;
  /** If true, renders full-bleed (no header/footer) — for cover/divider slides */
  fullBleed?: boolean;
}

export function SlideLayout({
  children,
  metadata,
  pageNumber,
  totalPages,
  sectionTitle,
  fullBleed,
}: SlideLayoutProps) {
  if (fullBleed) {
    return (
      <div
        style={{
          width: SLIDE_DIMENSIONS.width,
          height: SLIDE_DIMENSIONS.height,
          position: "relative",
          overflow: "hidden",
          fontFamily: PDF_FONTS.body,
          backgroundColor: PDF_COLORS.white,
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      style={{
        width: SLIDE_DIMENSIONS.width,
        height: SLIDE_DIMENSIONS.height,
        position: "relative",
        overflow: "hidden",
        fontFamily: PDF_FONTS.body,
        backgroundColor: PDF_COLORS.white,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header — navy bar with gold underline */}
      <div
        style={{
          height: SLIDE_DIMENSIONS.headerHeight,
          backgroundColor: PDF_COLORS.darkBlue,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${SLIDE_DIMENSIONS.padding}px`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: PDF_COLORS.gold,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontFamily: PDF_FONTS.body,
            }}
          >
            Shepi · QoE
          </span>
          <span
            style={{
              color: PDF_COLORS.white,
              fontSize: 18,
              fontWeight: 500,
              fontFamily: PDF_FONTS.heading,
              fontStyle: "normal",
            }}
          >
            {sectionTitle || metadata.companyName}
          </span>
        </div>
        <div
          style={{
            color: PDF_COLORS.gold,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
          }}
        >
          Confidential
        </div>
      </div>

      {/* Gold accent line */}
      <div style={{ height: 2, backgroundColor: PDF_COLORS.gold, flexShrink: 0 }} />

      {/* Content area */}
      <div
        style={{
          flex: 1,
          padding: `${SLIDE_DIMENSIONS.padding - 12}px ${SLIDE_DIMENSIONS.padding}px`,
          overflow: "hidden",
          backgroundColor: PDF_COLORS.white,
        }}
      >
        {children}
      </div>

      {/* Footer */}
      <div
        style={{
          height: SLIDE_DIMENSIONS.footerHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `0 ${SLIDE_DIMENSIONS.padding}px`,
          borderTop: `1px solid ${PDF_COLORS.lightGray}`,
          flexShrink: 0,
          backgroundColor: PDF_COLORS.cream,
        }}
      >
        <div
          style={{
            color: PDF_COLORS.midGray,
            fontSize: 11,
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <span style={{ fontFamily: PDF_FONTS.heading, fontStyle: "italic", color: PDF_COLORS.darkBlue }}>
            {metadata.companyName}
          </span>
          <span style={{ opacity: 0.6 }}>—</span>
          <span style={{ letterSpacing: "0.05em" }}>Quality of Earnings Report</span>
          <span style={{ opacity: 0.5, fontStyle: "italic" }}>
            · AI-Assisted Analysis · Not an Audit or Attestation
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 24, height: 2, backgroundColor: PDF_COLORS.gold }} />
          <span
            style={{
              color: PDF_COLORS.darkBlue,
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(pageNumber).padStart(2, "0")} <span style={{ color: PDF_COLORS.midGray }}>/ {String(totalPages).padStart(2, "0")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
