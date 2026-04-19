/**
 * Section divider slide — gradient background with section title.
 * Reusable for IS Analysis, BS Analysis, etc.
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
          background: `linear-gradient(135deg, ${PDF_COLORS.darkBlue} 0%, ${PDF_COLORS.midBlue} 100%)`,
          display: "flex",
          alignItems: "center",
          padding: `0 120px`,
          position: "relative",
          fontFamily: PDF_FONTS.heading,
        }}
      >
        {/* Large watermark number */}
        {sectionNumber && (
          <div
            style={{
              position: "absolute",
              right: 80,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 320,
              fontWeight: 900,
              color: "rgba(255,255,255,0.06)",
              lineHeight: 1,
              fontFamily: PDF_FONTS.heading,
            }}
          >
            {sectionNumber}
          </div>
        )}
        {/* Accent shapes */}
        <div
          style={{
            position: "absolute",
            right: 100,
            top: "50%",
            transform: "translateY(-50%)",
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: `2px solid rgba(44, 165, 165, 0.12)`,
          }}
        />

        <div>
          {sectionNumber && (
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: PDF_COLORS.teal,
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              Section {sectionNumber}
            </div>
          )}

          <div
            style={{
              width: 60,
              height: 4,
              backgroundColor: PDF_COLORS.teal,
              marginBottom: 24,
            }}
          />

          <div
            style={{
              fontSize: 52,
              fontWeight: 800,
              color: PDF_COLORS.white,
              lineHeight: 1.15,
              maxWidth: 900,
            }}
          >
            {sectionTitle}
          </div>

          {sectionSubtitle && (
            <div
              style={{
                fontSize: 22,
                color: "rgba(255,255,255,0.6)",
                marginTop: 16,
              }}
            >
              {sectionSubtitle}
            </div>
          )}
        </div>

        {/* Bottom accent */}
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
      </div>
    </SlideLayout>
  );
}
