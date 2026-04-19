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
import { DisclaimerSlide } from "@/components/pdf-slides/DisclaimerSlide";
import { KeyTermsSlide } from "@/components/pdf-slides/KeyTermsSlide";
import { TOCSlide } from "@/components/pdf-slides/TOCSlide";
import { SectionDividerSlide } from "@/components/pdf-slides/SectionDividerSlide";
import { AttentionAreasSlide } from "@/components/pdf-slides/AttentionAreasSlide";
import { QoESlide } from "@/components/pdf-slides/QoESlide";
import { ISProformaSlide } from "@/components/pdf-slides/ISProformaSlide";
import { RevenueDetailSlide } from "@/components/pdf-slides/RevenueDetailSlide";
import { COGSSlide } from "@/components/pdf-slides/COGSSlide";
import { OpExSlide } from "@/components/pdf-slides/OpExSlide";
import { BalanceSheetSlide } from "@/components/pdf-slides/BalanceSheetSlide";
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
    { id: "disclaimer", title: "Disclaimer", component: DisclaimerSlide },
    { id: "key-terms", title: "Key Terms", component: KeyTermsSlide },
    { id: "toc", title: "Table of Contents", component: TOCSlide },

    // ── Attention Areas ──
    { id: "attention-divider", title: "Attention Areas", section: "attention",
      component: createDividerSlide("Attention Areas", "Key Findings & Risk Assessment", "I") },
    { id: "attention-areas", title: "Attention Areas", section: "attention", component: AttentionAreasSlide },

    // ── QoE section ──
    { id: "qoe-divider", title: "QoE Section", section: "qoe",
      component: createDividerSlide("Quality of Earnings Analysis", "EBITDA Bridge & Adjustment Detail", "II") },
    { id: "qoe", title: "QoE Bridge", section: "qoe", component: QoESlide },

    // ── IS section ──
    { id: "is-divider", title: "IS Section", section: "is",
      component: createDividerSlide("Income Statement Analysis", "Revenue, COGS & Operating Expenses", "III") },
    { id: "is-proforma", title: "Proforma IS", section: "is", component: ISProformaSlide },
    { id: "revenue-detail", title: "Revenue Detail", section: "is", component: RevenueDetailSlide },
    { id: "cogs-detail", title: "COGS Detail", section: "is", component: COGSSlide },
    { id: "opex-detail", title: "OpEx Detail", section: "is", component: OpExSlide },
    { id: "payroll", title: "Payroll", section: "is", component: PayrollSlide },

    // ── BS section ──
    { id: "bs-divider", title: "BS Section", section: "bs",
      component: createDividerSlide("Balance Sheet Analysis", "Assets, Liabilities & Working Capital", "IV") },
    { id: "balance-sheet", title: "Balance Sheet", section: "bs", component: BalanceSheetSlide },
    { id: "ar-aging", title: "AR Aging", section: "bs", component: ARAgingSlide },
    { id: "ap-aging", title: "AP Aging", section: "bs", component: APAgingSlide },
    { id: "fixed-assets", title: "Fixed Assets", section: "bs", component: FixedAssetsSlide },
    { id: "working-capital", title: "Working Capital", section: "bs", component: WorkingCapitalSlide },
    { id: "nwc-analysis", title: "NWC Analysis", section: "bs", component: NWCAnalysisSlide },
    { id: "free-cash-flow", title: "Free Cash Flow", section: "bs", component: FreeCashFlowSlide },

    // ── Supplementary section ──
    { id: "supp-divider", title: "Supplementary Section", section: "supp",
      component: createDividerSlide("Supplementary Analysis", "Proof of Cash, Concentration & Payroll", "V") },
    { id: "proof-of-cash", title: "Proof of Cash", section: "supp", component: ProofOfCashSlide },
    { id: "customer-concentration", title: "Customer Concentration", section: "supp", component: CustomerConcentrationSlide },
    { id: "vendor-concentration", title: "Vendor Concentration", section: "supp", component: VendorConcentrationSlide },
  ];

  // Inject data into slide props
  const slidesWithData = slides.map((slide) => ({
    ...slide,
    component: createDataInjector(slide, computedReports),
  }));

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
  qoe: "qoeAnalysis",
  "is-proforma": "incomeStatement",
  "revenue-detail": "salesDetail",
  "cogs-detail": "cogsDetail",
  "opex-detail": "operatingExpenses",
  payroll: "payroll",
  "balance-sheet": "balanceSheet",
  "ar-aging": "arAging",
  "ap-aging": "apAging",
  "fixed-assets": "fixedAssets",
  "working-capital": "workingCapital",
  "nwc-analysis": "nwcAnalysis",
  "free-cash-flow": "freeCashFlow",
  "proof-of-cash": "proofOfCash",
  "customer-concentration": "topCustomers",
  "vendor-concentration": "topVendors",
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
      injectedData = { ...injectedData, rawData: computedReports[reportKey].rawData };
    }

    return createElement(OriginalComponent, { ...props, data: injectedData });
  };
}
