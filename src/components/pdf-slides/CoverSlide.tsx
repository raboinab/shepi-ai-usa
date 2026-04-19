/**
 * Cover page slide — full gradient background with company name, date, and branding.
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
          background: `linear-gradient(135deg, ${PDF_COLORS.darkBlue} 0%, ${PDF_COLORS.midBlue} 60%, ${PDF_COLORS.lightBlue} 100%)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
          fontFamily: PDF_FONTS.heading,
        }}
      >
        {/* Geometric accent shapes */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            border: `2px solid rgba(74, 127, 163, 0.15)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -150,
            left: -80,
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: `2px solid rgba(74, 127, 163, 0.1)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            width: 200,
            height: 3,
            backgroundColor: PDF_COLORS.teal,
            opacity: 0.6,
          }}
        />

        {/* Content */}
        <div style={{ textAlign: "center", zIndex: 1, maxWidth: 1200 }}>
          {/* Accent line */}
          <div
            style={{
              width: 80,
              height: 4,
              backgroundColor: PDF_COLORS.teal,
              margin: "0 auto 40px",
            }}
          />

          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: PDF_COLORS.teal,
              letterSpacing: "4px",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            Quality of Earnings Report
          </div>

          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: PDF_COLORS.white,
              lineHeight: 1.1,
              marginBottom: 20,
              letterSpacing: "-1px",
            }}
          >
            {metadata.companyName}
          </div>

          {metadata.clientName && (
            <div
              style={{
                fontSize: 24,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 40,
              }}
            >
              Prepared for {metadata.clientName}
            </div>
          )}

          {/* Divider */}
          <div
            style={{
              width: 60,
              height: 3,
              backgroundColor: PDF_COLORS.gold,
              margin: "0 auto 30px",
            }}
          />

          <div
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              marginBottom: 8,
            }}
          >
            {metadata.reportDate}
          </div>

          {metadata.preparedBy && (
            <div
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.45)",
                marginTop: 12,
              }}
            >
              Prepared by {metadata.preparedBy}
            </div>
          )}

          <div
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              marginTop: 16,
              fontStyle: "italic",
            }}
          >
            Generated using shepi — an AI-assisted analysis platform
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: PDF_COLORS.teal,
          }}
        />

        {/* Confidential badge */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 60,
            fontSize: 13,
            fontWeight: 600,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "3px",
            textTransform: "uppercase",
          }}
        >
          CONFIDENTIAL
        </div>
      </div>
    </SlideLayout>
  );
}
