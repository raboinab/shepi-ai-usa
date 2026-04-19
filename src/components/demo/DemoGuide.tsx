import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";



interface DemoGuideProps {
  onNavigate: (phase: number, section: number) => void;
  onSetViewMode: (mode: "wizard" | "insights") => void;
  onNavigateToWorkbook?: () => void;
}

interface Step {
  title: string;
  message: string;
  phase: number;
  section: number;
  viewMode: "wizard" | "insights";
  externalRoute?: boolean;
  ai?: boolean;
}

const STEPS: Step[] = [
  {
    title: "Welcome to the QoE Demo",
    message: "This is a fully populated Quality of Earnings analysis for Acme Industrial. Everything here was generated from accounting data.",
    phase: 1, section: 1, viewMode: "wizard",
  },
  {
    title: "Project Setup",
    message: "Deal parameters, analysis periods, and intent configuration — the foundation of every QoE engagement.",
    phase: 1, section: 1, viewMode: "wizard",
  },
  {
    title: "Chart of Accounts & Trial Balance",
    message: "The accounting spine — every account mapped to financial line items. This drives the entire analysis downstream.",
    phase: 2, section: 1, viewMode: "wizard",
  },
  {
    title: "Document Upload",
    message: "Upload bank statements, tax returns, and contracts — AI extracts and classifies each document automatically.",
    phase: 2, section: 3, viewMode: "wizard", ai: true,
  },
  {
    title: "AI Reclassifications",
    message: "AI-suggested reclassifications to standardize the chart of accounts for QoE analysis. Review, approve, or reject each suggestion.",
    phase: 3, section: 1, viewMode: "wizard", ai: true,
  },
  {
    title: "AI Adjustment Discovery",
    message: "6 AI-discovered adjustment candidates worth $220K+ — like owner comp normalization, personal expenses, and non-recurring charges. Expand any card to see the transaction-level evidence.",
    phase: 3, section: 2, viewMode: "wizard", ai: true,
  },
  {
    title: "Schedules",
    message: "AR/AP Aging, Fixed Assets, Payroll — supporting detail schedules that feed into the QoE Bridge and working capital analysis.",
    phase: 3, section: 4, viewMode: "wizard",
  },
  {
    title: "Customer & Vendor Concentration",
    message: "Revenue and spend concentration risk analysis — identify dependency on key customers or vendors that could impact deal valuation.",
    phase: 4, section: 1, viewMode: "wizard",
  },
  {
    title: "Financial Reports",
    message: "Income Statement, Balance Sheet, and QoE Bridge are computed automatically from your Trial Balance and adjustments. No manual spreadsheet formulas.",
    phase: 5, section: 1, viewMode: "wizard",
  },
  {
    title: "Proof of Cash & AI Transfer Assistant",
    message: "AI classifies bank transactions as Interbank, Owner, or Operating — isolating transfers that affect your reconciliation. Review and approve classifications before they hit the grid.",
    phase: 5, section: 17, viewMode: "wizard", ai: true,
  },
  {
    title: "Export Center",
    message: "Export a lender-ready PDF report or Excel workbook. Everything flows from the same data — no copy-paste errors.",
    phase: 6, section: 4, viewMode: "wizard",
  },
  {
    title: "Workbook View",
    message: "Spreadsheet-style view of all tabs — familiar format for accountants. Every tab is auto-computed from the same underlying data.",
    phase: 1, section: 1, viewMode: "wizard", externalRoute: true,
  },
  {
    title: "Insights Dashboard",
    message: "AI-powered analytics — metrics, risk indicators, and the AI Analyst chat. Ask questions about the deal in natural language.",
    phase: 1, section: 1, viewMode: "insights", ai: true,
  },
];

export function DemoGuide({ onNavigate, onSetViewMode, onNavigateToWorkbook }: DemoGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const step = STEPS[currentStep];
    if (step.externalRoute) {
      onNavigateToWorkbook?.();
      return;
    }
    onSetViewMode(step.viewMode);
    if (step.viewMode === "wizard") {
      onNavigate(step.phase, step.section);
    }
  }, [currentStep, dismissed]);

  if (dismissed) return null;

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const dismiss = () => {
    setDismissed(true);
  };

  const next = () => {
    if (isLast) dismiss();
    else setCurrentStep((s) => s + 1);
  };

  const back = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
      <div
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={dismiss}
      />

      <div className="relative bg-card border border-border rounded-xl shadow-xl max-w-md w-full p-5 pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-300">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss guide"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === currentStep
                  ? "w-4 bg-primary"
                  : i < currentStep
                  ? "w-2 bg-primary/40"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="flex items-start gap-3 mb-4">
          <div className="shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{step.title}</h3>
              {step.ai && (
                <span className="text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide">
                  AI
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {step.message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
            className="text-xs text-muted-foreground"
          >
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1}/{STEPS.length}
            </span>
            {!isFirst && (
              <Button variant="outline" size="sm" onClick={back} className="gap-1">
                <ArrowLeft className="w-3 h-3" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={next} className="gap-1">
              {isLast ? "Done" : "Next"}
              {!isLast && <ArrowRight className="w-3 h-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
