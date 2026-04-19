/**
 * Table of Contents slide.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

interface TOCEntry {
  number: string;
  title: string;
  page: number;
}

const TOC_ENTRIES: TOCEntry[] = [
  { number: "I", title: "Attention Areas", page: 6 },
  { number: "II", title: "Quality of Earnings Analysis", page: 8 },
  { number: "III", title: "Income Statement Analysis", page: 10 },
  { number: "IV", title: "Balance Sheet Analysis", page: 16 },
  { number: "V", title: "Supplementary Analysis", page: 24 },
];

export function TOCSlide({ metadata, pageNumber, totalPages }: SlideProps) {
  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Table of Contents">
      <div style={{ fontFamily: PDF_FONTS.body, display: "flex", gap: 80 }}>
        {/* Left: Title area */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: PDF_COLORS.darkBlue,
              marginBottom: 8,
            }}
          >
            Table of Contents
          </div>
          <div
            style={{
              width: 60,
              height: 4,
              backgroundColor: PDF_COLORS.teal,
              marginBottom: 20,
            }}
          />
          <div style={{ fontSize: 16, color: PDF_COLORS.midGray, lineHeight: 1.6 }}>
            This report presents a comprehensive Quality of Earnings analysis for {metadata.companyName}.
          </div>
        </div>

        {/* Right: TOC entries */}
        <div style={{ flex: 1 }}>
          {TOC_ENTRIES.map((entry, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "16px 0",
                borderBottom: `1px solid ${PDF_COLORS.lightGray}`,
              }}
            >
              <div
                style={{
                  width: 50,
                  fontSize: 18,
                  fontWeight: 700,
                  color: PDF_COLORS.teal,
                }}
              >
                {entry.number}
              </div>
              <div
                style={{
                  flex: 1,
                  fontSize: 20,
                  fontWeight: 600,
                  color: PDF_COLORS.darkBlue,
                }}
              >
                {entry.title}
              </div>
              <div
                style={{
                  fontSize: 16,
                  color: PDF_COLORS.midGray,
                  fontWeight: 500,
                }}
              >
                {entry.page}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideLayout>
  );
}
