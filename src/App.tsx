// App root - route table for vite-react-ssg
import { lazy, Suspense, ReactNode } from "react";
import { Outlet } from "react-router-dom";
import type { RouteRecord } from "vite-react-ssg";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppErrorBoundary from "@/components/system/AppErrorBoundary";
import Index from "./pages/Index";

// Lazy-loaded routes
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Project = lazy(() => import("./pages/Project"));
const Workbook = lazy(() => import("./pages/Workbook"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const Account = lazy(() => import("./pages/Account"));
const WorkbookDemo = lazy(() => import("./pages/WorkbookDemo"));
const WizardDemo = lazy(() => import("./pages/WizardDemo"));
const DashboardDemo = lazy(() => import("./pages/DashboardDemo"));
const DemoVideo = lazy(() => import("./pages/DemoVideo"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Cookies = lazy(() => import("./pages/Cookies"));
const EULA = lazy(() => import("./pages/EULA"));
const Subprocessors = lazy(() => import("./pages/Subprocessors"));
const DPA = lazy(() => import("./pages/DPA"));
const Resources = lazy(() => import("./pages/Resources"));
const QualityOfEarnings = lazy(() => import("./pages/guides/QualityOfEarnings"));
const EBITDAAdjustments = lazy(() => import("./pages/guides/EBITDAAdjustments"));
const DueDiligenceChecklist = lazy(() => import("./pages/guides/DueDiligenceChecklist"));
const IndependentSearchers = lazy(() => import("./pages/use-cases/IndependentSearchers"));
const PEFirms = lazy(() => import("./pages/use-cases/PEFirms"));
const DealAdvisors = lazy(() => import("./pages/use-cases/DealAdvisors"));
const AccountantsCPA = lazy(() => import("./pages/use-cases/AccountantsCPA"));
const BusinessBrokers = lazy(() => import("./pages/use-cases/BusinessBrokers"));
const Lenders = lazy(() => import("./pages/use-cases/Lenders"));
const ShepiVsExcel = lazy(() => import("./pages/compare/ShepiVsExcel"));
const AIvsTraditional = lazy(() => import("./pages/compare/AIvsTraditional"));
const QuickBooksIntegrationPage = lazy(() => import("./pages/features/QuickBooksIntegration"));
const AIAssistantPage = lazy(() => import("./pages/features/AIAssistant"));
const AIDueDiligencePage = lazy(() => import("./pages/features/AIDueDiligence"));
const RevenueQualityAnalysis = lazy(() => import("./pages/guides/RevenueQualityAnalysis"));
const WorkingCapitalAnalysis = lazy(() => import("./pages/guides/WorkingCapitalAnalysis"));
const QoEReportTemplate = lazy(() => import("./pages/guides/QoEReportTemplate"));
const GeneralLedgerReview = lazy(() => import("./pages/guides/GeneralLedgerReview"));
const EBITDABridge = lazy(() => import("./pages/guides/EBITDABridge"));
const FinancialRedFlags = lazy(() => import("./pages/guides/FinancialRedFlags"));
const CashProofAnalysis = lazy(() => import("./pages/guides/CashProofAnalysis"));
const QoESoftware = lazy(() => import("./pages/features/QoESoftware"));
const EBITDAAutomation = lazy(() => import("./pages/features/EBITDAAutomation"));
const SellSideVsBuySideQoE = lazy(() => import("./pages/guides/SellSideVsBuySideQoE"));
const OwnerCompensationNormalization = lazy(() => import("./pages/guides/OwnerCompensationNormalization"));
const PersonalExpenseDetection = lazy(() => import("./pages/guides/PersonalExpenseDetection"));
const CustomerConcentrationRisk = lazy(() => import("./pages/guides/CustomerConcentrationRisk"));
const RunRateEBITDA = lazy(() => import("./pages/guides/RunRateEBITDA"));
const CanAIReplaceQoE = lazy(() => import("./pages/guides/CanAIReplaceQoE"));
const AIWontDoYourQoE = lazy(() => import("./pages/guides/AIWontDoYourQoE"));
const AIAccountingAnomalyDetection = lazy(() => import("./pages/guides/AIAccountingAnomalyDetection"));
const EarningsManipulationSigns = lazy(() => import("./pages/guides/EarningsManipulationSigns"));
const QualityOfEarningsCost = lazy(() => import("./pages/QualityOfEarningsCost"));
const QualityOfEarningsSoftware = lazy(() => import("./pages/QualityOfEarningsSoftware"));
const QualityOfEarningsTemplate = lazy(() => import("./pages/QualityOfEarningsTemplate"));
const QualityOfEarningsChecklist = lazy(() => import("./pages/QualityOfEarningsChecklist"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminProjects = lazy(() => import("./pages/admin/AdminProjects"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminContacts = lazy(() => import("./pages/admin/AdminContacts"));
const AdminRAGUpload = lazy(() => import("./pages/admin/AdminRAGUpload"));
const AdminWhitelist = lazy(() => import("./pages/admin/AdminWhitelist"));
const AdminDiagnostics = lazy(() => import("./pages/admin/AdminDiagnostics"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminDataExport = lazy(() => import("./pages/admin/AdminDataExport"));
const AdminDFYEngagements = lazy(() => import("./pages/admin/AdminDFYEngagements"));
const AdminMigration = lazy(() => import("./pages/admin/AdminMigration"));
const CpaLayout = lazy(() => import("./layouts/CpaLayout").then(m => ({ default: m.CpaLayout })));
const CpaQueue = lazy(() => import("./pages/cpa/CpaQueue"));
const CpaEngagements = lazy(() => import("./pages/cpa/CpaEngagements"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

const SuspenseFallback = () => (
  <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0f", color: "#a0a0a0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #333", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
      <div style={{ fontSize: 14 }}>Loading...</div>
    </div>
  </div>
);

const wrap = (node: ReactNode) => <Suspense fallback={<SuspenseFallback />}>{node}</Suspense>;

/**
 * Root layout — providers + Outlet. vite-react-ssg renders this at every route
 * with the matched child below it. Per-page <head> tags are emitted by each
 * page through `useSEO({...})` (returns JSX) or `<SEO {...} />` directly,
 * which renders vite-react-ssg's native <Head> (react-helmet-async).
 */
const RootLayout = () => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<SuspenseFallback />}>
          <Outlet />
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export const routes: RouteRecord[] = [
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Index />, entry: "src/pages/Index.tsx" },
      { path: "auth", element: wrap(<Auth />) },
      { path: "auth/callback", element: wrap(<AuthCallback />) },
      { path: "reset-password", element: wrap(<ResetPassword />) },
      { path: "dashboard", element: wrap(<Dashboard />) },
      { path: "project/:id", element: wrap(<Project />) },
      { path: "project/:id/workbook", element: wrap(<Workbook />) },
      { path: "workbook/demo", element: wrap(<WorkbookDemo />) },
      { path: "wizard/demo", element: wrap(<WizardDemo />) },
      { path: "dashboard/demo", element: wrap(<DashboardDemo />) },
      { path: "demo", element: wrap(<DemoVideo />) },
      { path: "pricing", element: wrap(<Pricing />) },
      { path: "payment-success", element: wrap(<PaymentSuccess />) },
      { path: "account", element: wrap(<Account />) },
      { path: "privacy", element: wrap(<Privacy />) },
      { path: "terms", element: wrap(<Terms />) },
      { path: "cookies", element: wrap(<Cookies />) },
      { path: "eula", element: wrap(<EULA />) },
      { path: "subprocessors", element: wrap(<Subprocessors />) },
      { path: "dpa", element: wrap(<DPA />) },

      // SEO Content Pages
      { path: "resources", element: wrap(<Resources />) },
      { path: "guides/quality-of-earnings", element: wrap(<QualityOfEarnings />) },
      { path: "guides/ebitda-adjustments", element: wrap(<EBITDAAdjustments />) },
      { path: "guides/due-diligence-checklist", element: wrap(<DueDiligenceChecklist />) },
      { path: "use-cases/independent-searchers", element: wrap(<IndependentSearchers />) },
      { path: "use-cases/pe-firms", element: wrap(<PEFirms />) },
      { path: "use-cases/deal-advisors", element: wrap(<DealAdvisors />) },
      { path: "use-cases/accountants-cpa", element: wrap(<AccountantsCPA />) },
      { path: "use-cases/business-brokers", element: wrap(<BusinessBrokers />) },
      { path: "use-cases/lenders", element: wrap(<Lenders />) },
      { path: "compare/shepi-vs-excel", element: wrap(<ShepiVsExcel />) },
      { path: "compare/ai-qoe-vs-traditional", element: wrap(<AIvsTraditional />) },
      { path: "features/quickbooks-integration", element: wrap(<QuickBooksIntegrationPage />) },
      { path: "features/ai-assistant", element: wrap(<AIAssistantPage />) },
      { path: "features/ai-due-diligence", element: wrap(<AIDueDiligencePage />) },
      { path: "guides/revenue-quality-analysis", element: wrap(<RevenueQualityAnalysis />) },
      { path: "guides/working-capital-analysis", element: wrap(<WorkingCapitalAnalysis />) },
      { path: "guides/qoe-report-template", element: wrap(<QoEReportTemplate />) },
      { path: "guides/general-ledger-review", element: wrap(<GeneralLedgerReview />) },
      { path: "guides/ebitda-bridge", element: wrap(<EBITDABridge />) },
      { path: "guides/financial-red-flags", element: wrap(<FinancialRedFlags />) },
      { path: "guides/cash-proof-analysis", element: wrap(<CashProofAnalysis />) },
      { path: "features/qoe-software", element: wrap(<QoESoftware />) },
      { path: "features/ebitda-automation", element: wrap(<EBITDAAutomation />) },
      { path: "guides/sell-side-vs-buy-side-qoe", element: wrap(<SellSideVsBuySideQoE />) },
      { path: "guides/owner-compensation-normalization", element: wrap(<OwnerCompensationNormalization />) },
      { path: "guides/personal-expense-detection", element: wrap(<PersonalExpenseDetection />) },
      { path: "guides/customer-concentration-risk", element: wrap(<CustomerConcentrationRisk />) },
      { path: "guides/run-rate-ebitda", element: wrap(<RunRateEBITDA />) },
      { path: "guides/can-ai-replace-qoe", element: wrap(<CanAIReplaceQoE />) },
      { path: "guides/ai-wont-do-your-qoe", element: wrap(<AIWontDoYourQoE />) },
      { path: "guides/ai-accounting-anomaly-detection", element: wrap(<AIAccountingAnomalyDetection />) },
      { path: "guides/earnings-manipulation-signs", element: wrap(<EarningsManipulationSigns />) },

      // P0 Money Pages
      { path: "quality-of-earnings-cost", element: wrap(<QualityOfEarningsCost />) },
      { path: "quality-of-earnings-software", element: wrap(<QualityOfEarningsSoftware />) },
      { path: "quality-of-earnings-template", element: wrap(<QualityOfEarningsTemplate />) },
      { path: "quality-of-earnings-checklist", element: wrap(<QualityOfEarningsChecklist />) },

      // Admin
      {
        path: "admin",
        element: wrap(<AdminLayout />),
        children: [
          { index: true, element: wrap(<AdminDashboard />) },
          { path: "users", element: wrap(<AdminUsers />) },
          { path: "projects", element: wrap(<AdminProjects />) },
          { path: "subscriptions", element: wrap(<AdminSubscriptions />) },
          { path: "whitelist", element: wrap(<AdminWhitelist />) },
          { path: "contacts", element: wrap(<AdminContacts />) },
          { path: "rag", element: wrap(<AdminRAGUpload />) },
          { path: "diagnostics", element: wrap(<AdminDiagnostics />) },
          { path: "documents", element: wrap(<AdminDocuments />) },
          { path: "data-export", element: wrap(<AdminDataExport />) },
          { path: "dfy-engagements", element: wrap(<AdminDFYEngagements />) },
          { path: "migration", element: wrap(<AdminMigration />) },
        ],
      },

      // CPA
      {
        path: "cpa",
        element: wrap(<CpaLayout />),
        children: [
          { index: true, element: wrap(<CpaQueue />) },
          { path: "engagements", element: wrap(<CpaEngagements />) },
        ],
      },

      { path: "*", element: wrap(<NotFound />) },
    ],
  },
];

/**
 * Public paths that should be statically prerendered. Excludes auth-gated,
 * dynamic, and post-purchase routes (those stay client-rendered).
 */
export const prerenderPaths = [
  "/",
  "/pricing",
  "/demo",
  "/privacy",
  "/terms",
  "/cookies",
  "/eula",
  "/subprocessors",
  "/dpa",
  "/resources",
  "/guides/quality-of-earnings",
  "/guides/ebitda-adjustments",
  "/guides/due-diligence-checklist",
  "/guides/revenue-quality-analysis",
  "/guides/working-capital-analysis",
  "/guides/qoe-report-template",
  "/guides/general-ledger-review",
  "/guides/ebitda-bridge",
  "/guides/financial-red-flags",
  "/guides/cash-proof-analysis",
  "/guides/sell-side-vs-buy-side-qoe",
  "/guides/owner-compensation-normalization",
  "/guides/personal-expense-detection",
  "/guides/customer-concentration-risk",
  "/guides/run-rate-ebitda",
  "/guides/can-ai-replace-qoe",
  "/guides/ai-wont-do-your-qoe",
  "/guides/ai-accounting-anomaly-detection",
  "/guides/earnings-manipulation-signs",
  "/use-cases/independent-searchers",
  "/use-cases/pe-firms",
  "/use-cases/deal-advisors",
  "/use-cases/accountants-cpa",
  "/use-cases/business-brokers",
  "/use-cases/lenders",
  "/compare/shepi-vs-excel",
  "/compare/ai-qoe-vs-traditional",
  "/features/quickbooks-integration",
  "/features/ai-assistant",
  "/features/ai-due-diligence",
  "/features/qoe-software",
  "/features/ebitda-automation",
  "/quality-of-earnings-cost",
  "/quality-of-earnings-software",
  "/quality-of-earnings-template",
  "/quality-of-earnings-checklist",
];
