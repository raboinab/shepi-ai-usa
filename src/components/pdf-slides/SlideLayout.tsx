/**
 * Base 1920x1080 slide wrapper with consistent header, footer, and page number.
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
      {/* Header bar */}
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
        <div style={{ color: PDF_COLORS.white, fontSize: 22, fontWeight: 700 }}>
          {sectionTitle || metadata.companyName}
        </div>
        <div style={{ color: PDF_COLORS.teal, fontSize: 14, fontWeight: 500 }}>
          CONFIDENTIAL
        </div>
      </div>

      {/* Teal accent line */}
      <div style={{ height: 4, backgroundColor: PDF_COLORS.teal, flexShrink: 0 }} />

      {/* Content area */}
      <div
        style={{
          flex: 1,
          padding: SLIDE_DIMENSIONS.padding,
          overflow: "hidden",
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
          borderTop: `2px solid ${PDF_COLORS.lightGray}`,
          flexShrink: 0,
        }}
      >
        <div style={{ color: PDF_COLORS.midGray, fontSize: 12, display: "flex", gap: 16 }}>
          <span>{metadata.companyName} — Quality of Earnings Report</span>
          <span style={{ opacity: 0.7, fontStyle: "italic" }}>
            AI-Assisted Analysis · Not an Audit or Attestation
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 30,
              height: 3,
              backgroundColor: PDF_COLORS.teal,
            }}
          />
          <span style={{ color: PDF_COLORS.midGray, fontSize: 13, fontWeight: 600 }}>
            {pageNumber} / {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
}
