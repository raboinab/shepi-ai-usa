import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogDescription, f as DialogFooter } from "./dialog-sNpTUd89.js";
import { B as Button } from "../main.mjs";
import { AlertTriangle, FileCheck, ArrowRight } from "lucide-react";
import { B as Badge } from "./badge-BbLwm7hH.js";
function DocumentValidationDialog({
  open,
  onOpenChange,
  fileName,
  selectedType,
  selectedTypeLabel,
  validationResult,
  suggestedTypeLabel,
  onChangeType,
  onUploadAnyway,
  onCancel
}) {
  const confidencePercent = Math.round(validationResult.confidence * 100);
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "sm:max-w-md", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "h-5 w-5 text-amber-500" }),
        "Document Type Mismatch"
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: "The uploaded document might not match your selection" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-border bg-muted/50 p-4 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(FileCheck, { className: "h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { className: "font-medium truncate", children: fileName })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "text-muted-foreground", children: [
            "Selected: ",
            selectedTypeLabel
          ] }),
          suggestedTypeLabel && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxs(Badge, { variant: "secondary", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", children: [
              "Detected: ",
              suggestedTypeLabel
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: validationResult.reason }),
      confidencePercent > 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
        "Confidence: ",
        confidencePercent,
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "flex-col gap-2 sm:flex-row", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          onClick: onCancel,
          className: "w-full sm:w-auto",
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outline",
          onClick: onUploadAnyway,
          className: "w-full sm:w-auto",
          children: "Upload Anyway"
        }
      ),
      suggestedTypeLabel && /* @__PURE__ */ jsxs(
        Button,
        {
          onClick: onChangeType,
          className: "w-full sm:w-auto",
          children: [
            "Change to ",
            suggestedTypeLabel
          ]
        }
      )
    ] })
  ] }) });
}
export {
  DocumentValidationDialog as D
};
