import { jsxs, jsx } from "react/jsx-runtime";
import { Zap, X, ArrowRight, CheckCircle2 } from "lucide-react";
import { A as Alert, a as AlertTitle, b as AlertDescription } from "./alert-FolYmCWY.js";
import { B as Button, m as cn } from "../main.mjs";
import { P as Progress } from "./progress-DNO9VJ6D.js";
const STEPS = [
  { step: 1, label: "Chart of Accounts", phase: 2, section: 1 },
  { step: 2, label: "Trial Balance", phase: 2, section: 2 },
  { step: 3, label: "Document Upload", phase: 2, section: 3 }
];
function CoreDataGuideBanner({
  currentStep,
  onNavigate,
  onDismiss,
  isQBUser,
  hasCOA,
  hasTB,
  visible
}) {
  if (!visible) return null;
  const stepStatuses = STEPS.map((s) => {
    if (s.step === 1) return hasCOA || isQBUser;
    if (s.step === 2) return hasTB || isQBUser;
    return false;
  });
  const completedCount = stepStatuses.filter(Boolean).length;
  const progressPercent = completedCount / 3 * 100;
  const nextStep = isQBUser ? STEPS[2] : STEPS.find((s) => s.step > currentStep) || null;
  const currentStepInfo = STEPS.find((s) => s.step === currentStep);
  if (isQBUser) {
    return /* @__PURE__ */ jsxs(Alert, { className: "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-800", children: [
      /* @__PURE__ */ jsx(Zap, { className: "h-4 w-4 text-green-600 dark:text-green-400" }),
      /* @__PURE__ */ jsxs(AlertTitle, { className: "text-green-800 dark:text-green-200 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "QuickBooks Data Synced" }),
        /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: onDismiss, children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }) })
      ] }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-green-700 dark:text-green-300", children: [
        /* @__PURE__ */ jsx("p", { className: "mb-2", children: "Chart of Accounts and Trial Balance have been synced from QuickBooks. Upload your remaining documents (bank statements, tax returns, etc.) to complete your data set." }),
        currentStep !== 3 && /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            className: "gap-1.5 border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30",
            onClick: () => onNavigate(2, 3),
            children: [
              "Go to Document Upload ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })
            ]
          }
        )
      ] })
    ] });
  }
  return /* @__PURE__ */ jsx(Alert, { className: "bg-primary/5 border-primary/20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between w-full", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
      /* @__PURE__ */ jsxs(AlertTitle, { className: "text-primary flex items-center gap-2 mb-1", children: [
        "Step ",
        currentStep,
        " of 3: ",
        currentStepInfo?.label
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mb-2", children: /* @__PURE__ */ jsx(Progress, { value: progressPercent, className: "h-1.5" }) }),
      /* @__PURE__ */ jsxs(AlertDescription, { className: "text-sm flex items-center gap-3 flex-wrap", children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3 text-xs text-muted-foreground", children: STEPS.map((s) => /* @__PURE__ */ jsxs(
          "span",
          {
            className: cn(
              "flex items-center gap-1",
              s.step === currentStep && "text-primary font-medium"
            ),
            children: [
              stepStatuses[s.step - 1] ? /* @__PURE__ */ jsx(CheckCircle2, { className: "h-3 w-3 text-green-600 dark:text-green-400" }) : /* @__PURE__ */ jsx("span", { className: "h-3 w-3 rounded-full border border-muted-foreground/40 inline-block" }),
              s.label
            ]
          },
          s.step
        )) }),
        nextStep && /* @__PURE__ */ jsxs(
          Button,
          {
            size: "sm",
            variant: "outline",
            className: "gap-1.5 ml-auto",
            onClick: () => onNavigate(nextStep.phase, nextStep.section),
            children: [
              "Continue to ",
              nextStep.label,
              " ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-3.5 w-3.5" })
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "text-xs text-muted-foreground ml-2 -mt-1", onClick: onDismiss, children: "Skip guide" })
  ] }) });
}
export {
  CoreDataGuideBanner as C
};
