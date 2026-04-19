/**
 * Key Terms slide — definitions table for fiscal years, acronyms, etc.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";

const DEFAULT_TERMS: { term: string; definition: string }[] = [
  { term: "FY", definition: "Fiscal Year — the 12-month accounting period used by the Company" },
  { term: "LTM", definition: "Last Twelve Months — trailing 12-month period ending on the most recent reporting date" },
  { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation, and Amortization" },
  { term: "Adjusted EBITDA", definition: "EBITDA adjusted for non-recurring, non-operational, and owner-related items" },
  { term: "QoE", definition: "Quality of Earnings — analysis of the sustainability and accuracy of reported earnings" },
  { term: "COGS", definition: "Cost of Goods Sold — direct costs attributable to production of goods or services" },
  { term: "SG&A", definition: "Selling, General & Administrative — operating expenses not directly tied to production" },
  { term: "NWC", definition: "Net Working Capital — current assets minus current liabilities, excluding cash and debt" },
  { term: "DSO", definition: "Days Sales Outstanding — average number of days to collect receivables" },
  { term: "DPO", definition: "Days Payable Outstanding — average number of days to pay suppliers" },
];

export function KeyTermsSlide({ metadata, pageNumber, totalPages }: SlideProps) {
  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Key Terms & Definitions">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: PDF_COLORS.darkBlue,
            marginBottom: 8,
          }}
        >
          Key Terms &amp; Definitions
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            backgroundColor: PDF_COLORS.teal,
            marginBottom: 28,
          }}
        />

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 16 }}>
          <thead>
            <tr>
              <th
                style={{
                  backgroundColor: PDF_COLORS.darkBlue,
                  color: PDF_COLORS.white,
                  padding: "10px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  width: "160px",
                  borderBottom: `2px solid ${PDF_COLORS.teal}`,
                }}
              >
                Term
              </th>
              <th
                style={{
                  backgroundColor: PDF_COLORS.darkBlue,
                  color: PDF_COLORS.white,
                  padding: "10px 16px",
                  textAlign: "left",
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  borderBottom: `2px solid ${PDF_COLORS.teal}`,
                }}
              >
                Definition
              </th>
            </tr>
          </thead>
          <tbody>
            {DEFAULT_TERMS.map((item, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    padding: "10px 16px",
                    fontWeight: 700,
                    color: PDF_COLORS.darkBlue,
                    backgroundColor: idx % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.offWhite,
                    borderBottom: `1px solid ${PDF_COLORS.lightGray}`,
                    verticalAlign: "top",
                  }}
                >
                  {item.term}
                </td>
                <td
                  style={{
                    padding: "10px 16px",
                    color: PDF_COLORS.darkGray,
                    backgroundColor: idx % 2 === 0 ? PDF_COLORS.white : PDF_COLORS.offWhite,
                    borderBottom: `1px solid ${PDF_COLORS.lightGray}`,
                    lineHeight: 1.5,
                  }}
                >
                  {item.definition}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SlideLayout>
  );
}
