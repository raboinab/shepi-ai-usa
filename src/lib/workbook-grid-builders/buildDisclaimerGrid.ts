/**
 * Builds a GridData for the "Disclaimer" tab in the Excel workbook.
 * Content mirrors the PDF DisclaimerSlide with tier-aware language.
 */
import type { GridData } from "../workbook-types";

const BASE_PARAGRAPHS = [
  "IMPORTANT DISCLAIMER",
  "",
  'This Quality of Earnings Report (the "Report") has been prepared solely for the use and benefit of the intended recipient identified herein. This Report is confidential and proprietary, and its contents may not be disclosed, reproduced, or distributed without prior written consent.',
  "",
  "The information contained in this Report is based on data provided by the Company and its management, as well as publicly available information. We have not independently verified the accuracy or completeness of the information provided, and we make no representation or warranty, express or implied, as to the accuracy, completeness, or reliability of the information contained herein.",
  "",
  "This Report does not constitute an audit, review, or compilation of financial statements in accordance with generally accepted auditing standards. Our procedures were limited to those described herein and do not provide assurance on the financial statements or internal controls of the Company.",
  "",
  "The analyses, opinions, and conclusions expressed in this Report are based on conditions and information available at the time of preparation. We undertake no obligation to update or revise this Report based on circumstances or events occurring after the date hereof.",
  "",
  "This Report is not intended to be, and should not be construed as, investment advice, a recommendation, or an offer to buy or sell any security. Recipients should conduct their own due diligence and consult with their own legal, tax, and financial advisors.",
  "",
  "The scope and reliability of this analysis are directly dependent on the documents and data provided. Sections of this report may be limited or omitted where supporting documentation was not available. A complete list of documents provided is included in the Data Sources appendix.",
];

const AI_PARAGRAPHS = [
  "",
  "This Report was generated using AI-assisted analytical tools. It has not been prepared, reviewed, or certified by a licensed Certified Public Accountant (CPA), auditor, or other credentialed financial professional. The methodologies employed are automated and pattern-based.",
  "",
  "Analysis Methodology: Financial data was uploaded by the report preparer and processed using automated normalization, trend analysis, and adjustment identification algorithms. AI models were used to suggest potential adjustments, which were reviewed and accepted or modified by the preparer. All figures in this report reflect the preparer's final selections.",
];

const THIRD_PARTY_PARAGRAPH = [
  "",
  "If this Report is shared with or relied upon by any third party, including but not limited to lenders, investors, or regulatory bodies, such reliance is at the sole risk of the recipient. The preparer and the platform provider accept no liability for any decisions made or actions taken by third parties based on the contents of this Report.",
];

export function buildDisclaimerGrid(): GridData {
  const allParagraphs = [
    ...BASE_PARAGRAPHS,
    ...AI_PARAGRAPHS,
    ...THIRD_PARTY_PARAGRAPH,
  ];

  return {
    columns: [
      { key: "text", label: "", width: 800, align: "left", format: "text" },
    ],
    rows: allParagraphs.map((text, i) => ({
      id: `disclaimer-${i}`,
      type: i === 0 ? "section-header" as const : text === "" ? "spacer" as const : "data" as const,
      label: i === 0 ? text : undefined,
      cells: { text: i === 0 ? "" : text },
    })),
    frozenColumns: 0,
  };
}
