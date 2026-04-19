/**
 * Disclaimer slide — standard legal text.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

const DISCLAIMER_TEXT = [
  "This Quality of Earnings Report (the \"Report\") has been prepared solely for the use and benefit of the intended recipient identified herein. This Report is confidential and proprietary, and its contents may not be disclosed, reproduced, or distributed without prior written consent.",
  "The information contained in this Report is based on data provided by the Company and its management, as well as publicly available information. We have not independently verified the accuracy or completeness of the information provided, and we make no representation or warranty, express or implied, as to the accuracy, completeness, or reliability of the information contained herein.",
  "This Report does not constitute an audit, review, or compilation of financial statements in accordance with generally accepted auditing standards. Our procedures were limited to those described herein and do not provide assurance on the financial statements or internal controls of the Company.",
  "The analyses, opinions, and conclusions expressed in this Report are based on conditions and information available at the time of preparation. We undertake no obligation to update or revise this Report based on circumstances or events occurring after the date hereof.",
  "This Report is not intended to be, and should not be construed as, investment advice, a recommendation, or an offer to buy or sell any security. Recipients should conduct their own due diligence and consult with their own legal, tax, and financial advisors.",
];

export function DisclaimerSlide({ metadata, pageNumber, totalPages }: SlideProps) {
  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Disclaimer">
      <div style={{ fontFamily: PDF_FONTS.body, maxWidth: 1600 }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: PDF_COLORS.darkBlue,
            marginBottom: 8,
          }}
        >
          Important Disclaimer
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            backgroundColor: PDF_COLORS.teal,
            marginBottom: 32,
          }}
        />

        {DISCLAIMER_TEXT.map((paragraph, idx) => (
          <p
            key={idx}
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: PDF_COLORS.darkGray,
              marginBottom: 18,
            }}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </SlideLayout>
  );
}
