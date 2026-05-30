/**
 * Cover slide — editorial, navy with gold accents and serif company name.
 */
import { PDF_COLORS, PDF_FONTS, SLIDE_DIMENSIONS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

export function CoverSlide({ metadata, pageNumber, totalPages }: SlideProps) {
  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} fullBleed>
      <div
        style={{
          width: SLIDE_DIMENSIONS.width,
          height: SLIDE_DIMENSIONS.height,
          background: `linear-gradient(180deg, ${PDF_COLORS.darkBlue} 0%, #0a1430 100%)`,
          display: "flex",
          flexDirection: "column",
          padding: "96px 140px",
          position: "relative",
          fontFamily: PDF_FONTS.body,
        }}
      >
        {/* Top-left brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 14,
              height: 14,
              backgroundColor: PDF_COLORS.gold,
              transform: "rotate(45deg)",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: PDF_COLORS.white,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            Shepi · Quality of Earnings
          </span>
        </div>

        {/* Hairline rule under brand */}
        <div
          style={{
            marginTop: 28,
            width: "100%",
            height: 1,
            backgroundColor: "rgba(201, 168, 76, 0.3)",
          }}
        />

        {/* Main content — center-left aligned */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 1400 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: PDF_COLORS.gold,
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              marginBottom: 36,
            }}
          >
            Diligence Report · {metadata.reportDate}
          </div>

          <div
            style={{
              fontSize: 124,
              fontWeight: 500,
              color: PDF_COLORS.white,
              lineHeight: 1.02,
              letterSpacing: "-0.025em",
              fontFamily: PDF_FONTS.heading,
              fontStyle: "normal",
              marginBottom: 32,
            }}
          >
            {metadata.companyName}
          </div>

          {/* Gold hairline */}
          <div
            style={{
              width: 120,
              height: 2,
              backgroundColor: PDF_COLORS.gold,
              marginBottom: 36,
            }}
          />

          {metadata.clientName && (
            <div
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.78)",
                fontWeight: 400,
                marginBottom: 8,
                letterSpacing: "0.02em",
              }}
            >
              Prepared for <span style={{ color: PDF_COLORS.white, fontFamily: PDF_FONTS.heading, fontStyle: "italic" }}>{metadata.clientName}</span>
            </div>
          )}

          {metadata.preparedBy && (
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.55)",
                marginTop: 4,
                letterSpacing: "0.02em",
              }}
            >
              by {metadata.preparedBy}
            </div>
          )}
        </div>

        {/* Bottom row — footer-style metadata */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: 24,
            borderTop: "1px solid rgba(201, 168, 76, 0.25)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.5)",
              fontStyle: "italic",
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Generated using shepi — an AI-assisted analysis platform. This report is not an audit, review, or attestation engagement.
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: PDF_COLORS.gold,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            Confidential
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}
