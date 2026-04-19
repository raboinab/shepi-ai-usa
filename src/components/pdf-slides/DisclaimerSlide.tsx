/**
 * Disclaimer slide — standard legal text with tier-aware AI/CPA disclosures.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

const BASE_DISCLAIMER_TEXT = [
  "This Quality of Earnings Report (the \"Report\") is provided as decision-support and analytical workflow support. You may share this Report with employees, owners, advisors, accountants, attorneys, brokers, lenders, investors, buyers, sellers, and other transaction participants in connection with diligence, financing, negotiation, or related business activity.",
  "The information contained in this Report is based on data provided by the Company and its management. We have not independently verified the accuracy or completeness of the information provided, and we make no representation or warranty, express or implied, as to the accuracy, completeness, or reliability of the information contained herein.",
  "This Report does not constitute an audit, attestation engagement, or professional opinion. Use of this Report does not create a fiduciary, accounting, legal, tax, investment, valuation, underwriting, or other professional engagement. Sharing this Report does not convert it into an audit, attestation, or professional opinion, and does not create rights against shepi for any recipient.",
  "The analyses and conclusions expressed in this Report are based on conditions and information available at the time of preparation. We undertake no obligation to update or revise this Report based on circumstances or events occurring after the date hereof.",
  "Recipients should conduct their own due diligence and consult with their own legal, tax, and financial advisors. You remain responsible for your decisions, filings, negotiations, financing requests, transactions, and representations.",
  "The scope and reliability of this analysis depend on the quality, completeness, and accuracy of the documents and data provided. Incomplete or inaccurate materials may materially limit the resulting analysis. A complete list of documents provided is included in the Data Sources appendix.",
];

const AI_DISCLOSURE_PARAGRAPHS = [
  "This Report was generated using AI-assisted analytical tools. It has not been prepared, reviewed, or certified by a licensed Certified Public Accountant (CPA), auditor, or other credentialed financial professional. The methodologies employed are automated and pattern-based.",
  "Analysis Methodology: Financial data was uploaded by the report preparer and processed using automated normalization, trend analysis, and adjustment identification algorithms. AI models were used to suggest potential adjustments, which were reviewed and accepted or modified by the preparer. All figures in this report reflect the preparer's final selections.",
];

const THIRD_PARTY_RELAY_PARAGRAPH =
  "If this Report is shared with or relied upon by any third party, including but not limited to lenders, investors, or regulatory bodies, such reliance is at the sole risk of the recipient. The preparer and the platform provider accept no liability for any decisions made or actions taken by third parties based on the contents of this Report.";

function getDisclaimerText(): string[] {
  return [
    ...BASE_DISCLAIMER_TEXT,
    ...AI_DISCLOSURE_PARAGRAPHS,
    THIRD_PARTY_RELAY_PARAGRAPH,
  ];
}

export function DisclaimerSlide({ metadata, pageNumber, totalPages }: SlideProps) {
  const paragraphs = getDisclaimerText();

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

        {paragraphs.map((paragraph, idx) => (
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
