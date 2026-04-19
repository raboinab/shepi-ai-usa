/**
 * Main orchestrator for generating the diligence slide-deck PDF.
 */
import { createElement } from "react";
import { generatePDF } from "./slideRenderer";
import type { ReportMetadata, SlideDefinition, SlideProps } from "./reportTypes";
import type { WizardReportData } from "@/lib/wizardReportBuilder";

// Slide components
import { CoverSlide } from "@/components/pdf-slides/CoverSlide";
import { OverviewSlide } from "@/components/pdf-slides/OverviewSlide";
import { CIMOverviewSlide } from "@/components/pdf-slides/CIMOverviewSlide";
import { DisclaimerSlide } from "@/components/pdf-slides/DisclaimerSlide";
import { DataSourcesSlide } from "@/components/pdf-slides/DataSourcesSlide";
import { KeyTermsSlide } from "@/components/pdf-slides/KeyTermsSlide";
import { TOCSlide } from "@/components/pdf-slides/TOCSlide";
import { SectionDividerSlide } from "@/components/pdf-slides/SectionDividerSlide";
import { AttentionAreasSlide } from "@/components/pdf-slides/AttentionAreasSlide";
import { QoEExecutiveSummarySlide } from "@/components/pdf-slides/QoEExecutiveSummarySlide";
import { QoESlide } from "@/components/pdf-slides/QoESlide";
import { ISProformaSlide } from "@/components/pdf-slides/ISProformaSlide";
import { RevenueDetailSlide } from "@/components/pdf-slides/RevenueDetailSlide";
import { COGSSlide } from "@/components/pdf-slides/COGSSlide";
import { OpExSlide } from "@/components/pdf-slides/OpExSlide";
import { OtherExpenseSlide } from "@/components/pdf-slides/OtherExpenseSlide";
import { BalanceSheetSlide } from "@/components/pdf-slides/BalanceSheetSlide";
import { ISDetailedSlide } from "@/components/pdf-slides/ISDetailedSlide";
import { BSDetailedSlide } from "@/components/pdf-slides/BSDetailedSlide";
import { WorkingCapitalSlide } from "@/components/pdf-slides/WorkingCapitalSlide";
import { NWCAnalysisSlide } from "@/components/pdf-slides/NWCAnalysisSlide";
import { FreeCashFlowSlide } from "@/components/pdf-slides/FreeCashFlowSlide";
import { ProofOfCashSlide } from "@/components/pdf-slides/ProofOfCashSlide";
import { ARAgingSlide } from "@/components/pdf-slides/ARAgingSlide";
import { APAgingSlide } from "@/components/pdf-slides/APAgingSlide";
import { FixedAssetsSlide } from "@/components/pdf-slides/FixedAssetsSlide";
import { CustomerConcentrationSlide } from "@/components/pdf-slides/CustomerConcentrationSlide";
import { VendorConcentrationSlide } from "@/components/pdf-slides/VendorConcentrationSlide";
import { PayrollSlide } from "@/components/pdf-slides/PayrollSlide";
// VerificationSummarySlide removed — internal QA data not client-facing
import { DDAdjustmentsSlide } from "@/components/pdf-slides/DDAdjustmentsSlide";
import { FinancialRatiosSlide } from "@/components/pdf-slides/FinancialRatiosSlide";
import { FlaggedTransactionsSlide } from "@/components/pdf-slides/FlaggedTransactionsSlide";
import { GLAnalysisSlide } from "@/components/pdf-slides/GLAnalysisSlide";

// Re-export types
export type { ReportMetadata, SlideDefinition, SlideProps };

interface GenerateDiligenceReportOptions {
  metadata: ReportMetadata;
  wizardData?: Record<string, unknown>;
  computedReports?: Record<string, WizardReportData>;
  onProgress?: (current: number, total: number, label: string) => void;
}

/**
 * Build the slide list from available data and generate the PDF.
 */
export async function generateDiligenceReport(
  options: GenerateDiligenceReportOptions
): Promise<void> {
  const { metadata, computedReports, onProgress } = options;

  const slides: SlideDefinition[] = [
    // ── Front matter ──
    { id: "cover", title: "Cover", component: CoverSlide },
    { id: "overview", title: "Overview", component: OverviewSlide },
    { id: "cim-overview", title: "Business Overview", component: CIMOverviewSlide },
    { id: "disclaimer", title: "Disclaimer", component: DisclaimerSlide },
    { id: "data-sources", title: "Data Sources", component: DataSourcesSlide },
    { id: "key-terms", title: "Key Terms", component: KeyTermsSlide },
    { id: "toc", title: "Table of Contents", component: TOCSlide },

    // ── Attention Areas ──
    { id: "attention-divider", title: "Attention Areas", section: "attention",
      component: createDividerSlide("Attention Areas", "Key Findings & Risk Assessment", "I") },
    { id: "attention-areas", title: "Attention Areas", section: "attention", component: AttentionAreasSlide },

    // ── QoE section ──
    { id: "qoe-divider", title: "QoE Section", section: "qoe",
      component: createDividerSlide("Quality of Earnings Analysis", "EBITDA Bridge & Adjustment Detail", "II") },
    { id: "qoe-exec-summary", title: "Executive Summary", section: "qoe", component: QoEExecutiveSummarySlide },
    { id: "qoe", title: "QoE Bridge", section: "qoe", component: QoESlide },
    { id: "dd-adjustments", title: "DD Adjustments", section: "qoe", component: DDAdjustmentsSlide },
    // Verification Summary removed — internal QA only
    { id: "financial-ratios", title: "Financial Ratios", section: "qoe", component: FinancialRatiosSlide },

    // ── IS section ──
    { id: "is-divider", title: "IS Section", section: "is",
      component: createDividerSlide("Income Statement Analysis", "Revenue, COGS & Operating Expenses", "III") },
    { id: "is-proforma", title: "Proforma IS", section: "is", component: ISProformaSlide },
    { id: "is-detailed", title: "IS Detailed", section: "is", component: ISDetailedSlide },
    { id: "revenue-detail", title: "Revenue Detail", section: "is", component: RevenueDetailSlide },
    { id: "cogs-detail", title: "COGS Detail", section: "is", component: COGSSlide },
    { id: "opex-detail", title: "OpEx Detail", section: "is", component: OpExSlide },
    { id: "other-expense", title: "Other Expense", section: "is", component: OtherExpenseSlide },
    { id: "payroll", title: "Payroll", section: "is", component: PayrollSlide },

    // ── BS section ──
    { id: "bs-divider", title: "BS Section", section: "bs",
      component: createDividerSlide("Balance Sheet Analysis", "Assets, Liabilities & Working Capital", "IV") },
    { id: "balance-sheet", title: "Balance Sheet", section: "bs", component: BalanceSheetSlide },
    { id: "bs-detailed", title: "BS Detailed", section: "bs", component: BSDetailedSlide },
    { id: "ar-aging", title: "AR Aging", section: "bs", component: ARAgingSlide },
    { id: "ap-aging", title: "AP Aging", section: "bs", component: APAgingSlide },
    { id: "fixed-assets", title: "Fixed Assets", section: "bs", component: FixedAssetsSlide },
    { id: "working-capital", title: "Working Capital", section: "bs", component: WorkingCapitalSlide },
    { id: "nwc-analysis", title: "NWC Analysis", section: "bs", component: NWCAnalysisSlide },
    { id: "free-cash-flow", title: "Free Cash Flow", section: "bs", component: FreeCashFlowSlide },

    // ── Supplementary section ──
    { id: "supp-divider", title: "Supplementary Section", section: "supp",
      component: createDividerSlide("Supplementary Analysis", "Proof of Cash, Concentration & AI Findings", "V") },
    { id: "proof-of-cash", title: "Proof of Cash", section: "supp", component: ProofOfCashSlide },
    { id: "customer-concentration", title: "Customer Concentration", section: "supp", component: CustomerConcentrationSlide },
    { id: "vendor-concentration", title: "Vendor Concentration", section: "supp", component: VendorConcentrationSlide },

    // ── AI Analysis section ──
    { id: "ai-divider", title: "AI Analysis Section", section: "ai",
      component: createDividerSlide("AI-Powered Analysis", "Flagged Transactions & Pattern Detection", "VI") },
    { id: "flagged-transactions", title: "Flagged Transactions", section: "ai", component: FlaggedTransactionsSlide },
    { id: "gl-analysis", title: "GL/JE Analysis", section: "ai", component: GLAnalysisSlide },
  ];

  // Inject data into slide props and filter out empty data slides
  const slidesWithData = slides
    .map((slide) => ({
      ...slide,
      component: createDataInjector(slide, computedReports),
    }))
    .filter((slide) => {
      const reportKey = SLIDE_DATA_MAP[slide.id];
      if (!reportKey) return true; // no data mapping = always show (cover, dividers, etc.)
      if (!computedReports) return false; // no reports at all = skip data slides
      const report = computedReports[reportKey];
      if (!report) return false;
      // Skip if rawData is an empty array
      if (report.rawData && Array.isArray(report.rawData) && report.rawData.length === 0) return false;
      // Skip if rawData exists but all non-header cells are dashes/zeros/empty
      if (report.rawData && Array.isArray(report.rawData)) {
        // Header-only = empty
        if (report.rawData.length <= 1) return false;
        const dataRows = (report.rawData as string[][]).slice(1);
        const EMPTY_VALS = new Set(["", "—", "–", "-", "$—", "$–", "$-", "0", "$0", "0.00", "$0.00"]);
        const allEmpty = dataRows.every((row) =>
          row.slice(1).every((cell) => !cell || EMPTY_VALS.has(cell.trim()))
        );
        if (allEmpty) return false;
      }
      return true;
    });

  await generatePDF({ metadata, slides: slidesWithData, onProgress });
}

function createDividerSlide(title: string, subtitle: string, number: string) {
  return function DividerSlide(props: SlideProps) {
    return createElement(SectionDividerSlide, {
      ...props,
      data: { sectionTitle: title, sectionSubtitle: subtitle, sectionNumber: number },
    });
  };
}

/** Map slide IDs to computedReports keys */
const SLIDE_DATA_MAP: Record<string, string> = {
  "cim-overview": "cimInsights",
  "data-sources": "documentSources",
  "attention-areas": "attentionAreas",
  "qoe-exec-summary": "qoeExecutiveSummary",
  qoe: "qoeAnalysis",
  "dd-adjustments": "ddAdjustments",
  "financial-ratios": "financialRatios",
  "is-proforma": "incomeStatement",
  "is-detailed": "incomeStatementDetailed",
  "revenue-detail": "salesDetail",
  "cogs-detail": "cogsDetail",
  "opex-detail": "operatingExpenses",
  "other-expense": "otherExpenseIncome",
  payroll: "payroll",
  "balance-sheet": "balanceSheet",
  "bs-detailed": "balanceSheetDetailed",
  "ar-aging": "arAging",
  "ap-aging": "apAging",
  "fixed-assets": "fixedAssets",
  "working-capital": "workingCapital",
  "nwc-analysis": "nwcAnalysis",
  "free-cash-flow": "freeCashFlow",
  "proof-of-cash": "proofOfCash",
  "customer-concentration": "topCustomers",
  "vendor-concentration": "topVendors",
  "flagged-transactions": "flaggedTransactions",
  "gl-analysis": "glAnalysis",
};

function createDataInjector(
  slide: SlideDefinition,
  computedReports?: Record<string, WizardReportData>
) {
  const OriginalComponent = slide.component;

  return function InjectedSlide(props: SlideProps) {
    let injectedData = props.data || {};

    const reportKey = SLIDE_DATA_MAP[slide.id];
    if (reportKey && computedReports?.[reportKey]) {
      const reportData = computedReports[reportKey];

      // These slides expect specific non-rawData shapes — spread directly
      const spreadDirectKeys = new Set([
        "cimInsights",
        "attentionAreas",
        "qoeExecutiveSummary",
        "ddAdjustments",
        "financialRatios",
        "flaggedTransactions",
        "glAnalysis",
        "documentSources",
      ]);

      if (spreadDirectKeys.has(reportKey)) {
        injectedData = { ...injectedData, ...(reportData as unknown as Record<string, unknown>) };
      } else if (reportData.rawData && Array.isArray(reportData.rawData)) {
        injectedData = { ...injectedData, rawData: reportData.rawData };
      } else {
        injectedData = { ...injectedData, ...(reportData as unknown as Record<string, unknown>) };
      }
    }

    return createElement(OriginalComponent, { ...props, data: injectedData });
  };
}
