/**
 * Reusable narrative callout box for dense table slides.
 * Light background with a left accent border.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";

interface SlideNarrativeBoxProps {
  text: string;
}

export function SlideNarrativeBox({ text }: SlideNarrativeBoxProps) {
  if (!text) return null;
  return (
    <div
      style={{
        backgroundColor: PDF_COLORS.offWhite,
        borderLeft: `4px solid ${PDF_COLORS.midBlue}`,
        padding: "14px 20px",
        marginBottom: 20,
        borderRadius: 4,
        fontFamily: PDF_FONTS.body,
        fontSize: 14,
        lineHeight: 1.6,
        color: PDF_COLORS.darkGray,
      }}
    >
      {text}
    </div>
  );
}
