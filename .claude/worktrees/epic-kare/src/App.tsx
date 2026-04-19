import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Project from "./pages/Project";
import Workbook from "./pages/Workbook";
import ResetPassword from "./pages/ResetPassword";
import Pricing from "./pages/Pricing";
import PaymentSuccess from "./pages/PaymentSuccess";
import Account from "./pages/Account";
import WorkbookDemo from "./pages/WorkbookDemo";
import WizardDemo from "./pages/WizardDemo";
import DashboardDemo from "./pages/DashboardDemo";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import EULA from "./pages/EULA";
import Subprocessors from "./pages/Subprocessors";
import DPA from "./pages/DPA";
import Resources from "./pages/Resources";
import QualityOfEarnings from "./pages/guides/QualityOfEarnings";
import EBITDAAdjustments from "./pages/guides/EBITDAAdjustments";
import DueDiligenceChecklist from "./pages/guides/DueDiligenceChecklist";
import IndependentSearchers from "./pages/use-cases/IndependentSearchers";
import PEFirms from "./pages/use-cases/PEFirms";
import DealAdvisors from "./pages/use-cases/DealAdvisors";
import AccountantsCPA from "./pages/use-cases/AccountantsCPA";
import BusinessBrokers from "./pages/use-cases/BusinessBrokers";
import Lenders from "./pages/use-cases/Lenders";
import ShepiVsExcel from "./pages/compare/ShepiVsExcel";
import AIvsTraditional from "./pages/compare/AIvsTraditional";
import QuickBooksIntegrationPage from "./pages/features/QuickBooksIntegration";
import AIAssistantPage from "./pages/features/AIAssistant";
import AIDueDiligencePage from "./pages/features/AIDueDiligence";
import RevenueQualityAnalysis from "./pages/guides/RevenueQualityAnalysis";
import WorkingCapitalAnalysis from "./pages/guides/WorkingCapitalAnalysis";
import QoEReportTemplate from "./pages/guides/QoEReportTemplate";
import GeneralLedgerReview from "./pages/guides/GeneralLedgerReview";
import EBITDABridge from "./pages/guides/EBITDABridge";
import FinancialRedFlags from "./pages/guides/FinancialRedFlags";
import CashProofAnalysis from "./pages/guides/CashProofAnalysis";
import QoESoftware from "./pages/features/QoESoftware";
import EBITDAAutomation from "./pages/features/EBITDAAutomation";
import SellSideVsBuySideQoE from "./pages/guides/SellSideVsBuySideQoE";
import OwnerCompensationNormalization from "./pages/guides/OwnerCompensationNormalization";
import PersonalExpenseDetection from "./pages/guides/PersonalExpenseDetection";
import CustomerConcentrationRisk from "./pages/guides/CustomerConcentrationRisk";
import RunRateEBITDA from "./pages/guides/RunRateEBITDA";
import CanAIReplaceQoE from "./pages/guides/CanAIReplaceQoE";
import AIAccountingAnomalyDetection from "./pages/guides/AIAccountingAnomalyDetection";
import EarningsManipulationSigns from "./pages/guides/EarningsManipulationSigns";
import { AdminLayout } from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminRAGUpload from "./pages/admin/AdminRAGUpload";
import AdminWhitelist from "./pages/admin/AdminWhitelist";
import AdminDiagnostics from "./pages/admin/AdminDiagnostics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/project/:id" element={<Project />} />
          <Route path="/project/:id/workbook" element={<Workbook />} />
          <Route path="/workbook/demo" element={<WorkbookDemo />} />
          <Route path="/wizard/demo" element={<WizardDemo />} />
          <Route path="/dashboard/demo" element={<DashboardDemo />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/account" element={<Account />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/eula" element={<EULA />} />
          <Route path="/subprocessors" element={<Subprocessors />} />
          <Route path="/dpa" element={<DPA />} />
          
          {/* SEO Content Pages */}
          <Route path="/resources" element={<Resources />} />
          <Route path="/guides/quality-of-earnings" element={<QualityOfEarnings />} />
          <Route path="/guides/ebitda-adjustments" element={<EBITDAAdjustments />} />
          <Route path="/guides/due-diligence-checklist" element={<DueDiligenceChecklist />} />
          <Route path="/use-cases/independent-searchers" element={<IndependentSearchers />} />
          <Route path="/use-cases/pe-firms" element={<PEFirms />} />
          <Route path="/use-cases/deal-advisors" element={<DealAdvisors />} />
          <Route path="/use-cases/accountants-cpa" element={<AccountantsCPA />} />
          <Route path="/use-cases/business-brokers" element={<BusinessBrokers />} />
          <Route path="/use-cases/lenders" element={<Lenders />} />
          <Route path="/compare/shepi-vs-excel" element={<ShepiVsExcel />} />
          <Route path="/compare/ai-qoe-vs-traditional" element={<AIvsTraditional />} />
          <Route path="/features/quickbooks-integration" element={<QuickBooksIntegrationPage />} />
          <Route path="/features/ai-assistant" element={<AIAssistantPage />} />
          <Route path="/features/ai-due-diligence" element={<AIDueDiligencePage />} />
          <Route path="/guides/revenue-quality-analysis" element={<RevenueQualityAnalysis />} />
          <Route path="/guides/working-capital-analysis" element={<WorkingCapitalAnalysis />} />
          <Route path="/guides/qoe-report-template" element={<QoEReportTemplate />} />
          <Route path="/guides/general-ledger-review" element={<GeneralLedgerReview />} />
          <Route path="/guides/ebitda-bridge" element={<EBITDABridge />} />
          <Route path="/guides/financial-red-flags" element={<FinancialRedFlags />} />
          <Route path="/guides/cash-proof-analysis" element={<CashProofAnalysis />} />
          <Route path="/features/qoe-software" element={<QoESoftware />} />
          <Route path="/features/ebitda-automation" element={<EBITDAAutomation />} />
          <Route path="/guides/sell-side-vs-buy-side-qoe" element={<SellSideVsBuySideQoE />} />
          <Route path="/guides/owner-compensation-normalization" element={<OwnerCompensationNormalization />} />
          <Route path="/guides/personal-expense-detection" element={<PersonalExpenseDetection />} />
          <Route path="/guides/customer-concentration-risk" element={<CustomerConcentrationRisk />} />
          <Route path="/guides/run-rate-ebitda" element={<RunRateEBITDA />} />
          <Route path="/guides/can-ai-replace-qoe" element={<CanAIReplaceQoE />} />
          <Route path="/guides/ai-accounting-anomaly-detection" element={<AIAccountingAnomalyDetection />} />
          <Route path="/guides/earnings-manipulation-signs" element={<EarningsManipulationSigns />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="whitelist" element={<AdminWhitelist />} />
            <Route path="contacts" element={<AdminContacts />} />
            <Route path="rag" element={<AdminRAGUpload />} />
            <Route path="diagnostics" element={<AdminDiagnostics />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
