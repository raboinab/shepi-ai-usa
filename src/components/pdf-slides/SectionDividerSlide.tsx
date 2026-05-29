/**
 * Section divider — half navy / half cream split with outlined numeral.
 */
import { PDF_COLORS, PDF_FONTS, SLIDE_DIMENSIONS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

export function SectionDividerSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const sectionTitle = (data?.sectionTitle as string) || "Section";
  const sectionSubtitle = (data?.sectionSubtitle as string) || "";
  const sectionNumber = (data?.sectionNumber as string) || "";

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} fullBleed>
      <div
        style={{
          width: SLIDE_DIMENSIONS.width,
          height: SLIDE_DIMENSIONS.height,
          display: "flex",
          position: "relative",
          fontFamily: PDF_FONTS.body,
        }}
      >
        {/* Left half — navy */}
        <div
          style={{
            width: "44%",
            height: "100%",
            backgroundColor: PDF_COLORS.darkBlue,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: 80,
            position: "relative",
          }}
        >
          {/* Gold corner mark */}
          <div
            style={{
              position: "absolute",
              top: 60,
              left: 60,
              fontSize: 11,
              fontWeight: 600,
              color: PDF_COLORS.gold,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
            }}
          >
            Shepi · QoE
          </div>

          {/* Massive outlined numeral */}
          {sectionNumber && (
            <div
              style={{
                fontSize: 520,
                fontWeight: 500,
                color: "transparent",
                WebkitTextStroke: `2px ${PDF_COLORS.gold}`,
                lineHeight: 0.85,
                fontFamily: PDF_FONTS.heading,
                fontStyle: "italic",
              }}
            >
              {sectionNumber}
            </div>
          )}
        </div>

        {/* Right half — cream */}
        <div
          style={{
            flex: 1,
            backgroundColor: PDF_COLORS.cream,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 120px",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: PDF_COLORS.midBlue,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            {sectionNumber ? `Section ${sectionNumber}` : "Section"}
          </div>

          <div
            style={{
              width: 80,
              height: 2,
              backgroundColor: PDF_COLORS.gold,
              marginBottom: 36,
            }}
          />

          <div
            style={{
              fontSize: 78,
              fontWeight: 500,
              color: PDF_COLORS.darkBlue,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontFamily: PDF_FONTS.heading,
              maxWidth: 900,
            }}
          >
            {sectionTitle}
          </div>

          {sectionSubtitle && (
            <div
              style={{
                fontSize: 22,
                color: PDF_COLORS.midGray,
                marginTop: 28,
                maxWidth: 720,
                lineHeight: 1.45,
                fontStyle: "italic",
                fontFamily: PDF_FONTS.heading,
              }}
            >
              {sectionSubtitle}
            </div>
          )}
        </div>

        {/* Bottom gold rule */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: PDF_COLORS.gold,
          }}
        />
      </div>
    </SlideLayout>
  );
}
