import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { S as Sheet, a as SheetTrigger, b as SheetContent, u as useIsMobile } from "./use-mobile-hSLzflml.js";
import { m as cn, B as Button, A as Accordion, j as AccordionItem, k as AccordionTrigger, l as AccordionContent, C as Card, f as CardContent, T as TooltipProvider, n as Tooltip, o as TooltipTrigger, p as TooltipContent } from "../main.mjs";
import { CheckCircle, Circle, Eye, ChevronDown, ChevronRight, Edit3, Menu, HelpCircle, GripVertical, PanelRightClose, X, MessageSquare, ArrowRight, BookOpen, Sparkles, ClipboardList, Search, ArrowLeft } from "lucide-react";
import * as React from "react";
import { useState, useRef, useCallback, useEffect, useMemo, useReducer, Suspense, lazy, Component } from "react";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { Drawer as Drawer$1 } from "vaul";
import { S as ScrollArea } from "./scroll-area-DQ-itlDB.js";
import { p as projectToDealData } from "./sanitizeWizardData-nrsUY-BP.js";
import { b as buildWizardReports } from "./InsightsView-BkA7fJjp.js";
import { S as Spinner } from "./spinner-DXdBpr08.js";
const WIZARD_PHASES = [
  {
    id: 1,
    name: "Project Setup",
    type: "input",
    sections: [
      { id: 1, name: "Project Setup", type: "write" }
    ]
  },
  {
    id: 2,
    name: "Core Data Entry",
    type: "input",
    sections: [
      { id: 1, name: "Chart of Accounts", type: "write" },
      { id: 2, name: "Trial Balance", type: "write" },
      { id: 3, name: "Document Upload", type: "write" }
    ]
  },
  {
    id: 3,
    name: "Adjustments & Schedules",
    type: "input",
    subgroups: [
      {
        label: "Adjustments",
        sections: [
          { id: 1, name: "Reclassifications", type: "write" },
          { id: 2, name: "DD Adjustments", type: "write" },
          { id: 3, name: "Journal Entries", type: "read" }
        ]
      },
      {
        label: "Schedules",
        sections: [
          { id: 4, name: "AR Aging", type: "write" },
          { id: 5, name: "AP Aging", type: "write" },
          { id: 6, name: "Fixed Assets", type: "write" },
          { id: 7, name: "Inventory", type: "write" },
          { id: 8, name: "Payroll", type: "write" },
          { id: 9, name: "Supplementary", type: "write" },
          { id: 10, name: "Material Contracts", type: "write" },
          { id: 11, name: "WIP Schedule", type: "write" }
        ]
      }
    ]
  },
  {
    id: 4,
    name: "Customer & Vendor",
    type: "input",
    sections: [
      { id: 1, name: "Top Customers", type: "write" },
      { id: 2, name: "Top Vendors", type: "write" }
    ]
  },
  {
    id: 5,
    name: "Reports",
    type: "report",
    subgroups: [
      {
        label: "Financial Statements",
        sections: [
          { id: 1, name: "Income Statement", type: "read" },
          { id: 2, name: "Income Statement - Detailed", type: "read" },
          { id: 3, name: "Balance Sheet", type: "read" },
          { id: 4, name: "Balance Sheet - Detailed", type: "read" },
          { id: 5, name: "IS/BS Reconciliation", type: "read" }
        ]
      },
      {
        label: "Detail Schedules",
        sections: [
          { id: 6, name: "Sales Detail", type: "read" },
          { id: 7, name: "COGS Detail", type: "read" },
          { id: 8, name: "Operating Expenses", type: "read" },
          { id: 9, name: "Other Income/Expense", type: "read" }
        ]
      },
      {
        label: "QoE Reports",
        sections: [
          { id: 10, name: "QoE Analysis", type: "read" },
          { id: 11, name: "QoE Summary", type: "read" }
        ]
      },
      {
        label: "Working Capital",
        sections: [
          { id: 12, name: "Working Capital", type: "read" },
          { id: 13, name: "NWC Analysis", type: "read" },
          { id: 14, name: "Cash Analysis", type: "read" },
          { id: 15, name: "Other Current Assets", type: "read" },
          { id: 16, name: "Other Current Liabilities", type: "read" }
        ]
      },
      {
        label: "Supporting",
        sections: [
          { id: 17, name: "Proof of Cash", type: "write" },
          { id: 18, name: "Free Cash Flow", type: "read" }
        ]
      }
    ]
  },
  {
    id: 6,
    name: "Deliverables",
    type: "report",
    sections: [
      { id: 1, name: "QoE Executive Summary", type: "read" },
      { id: 2, name: "Financial Reports", type: "read" },
      { id: 3, name: "Analysis Reports", type: "read" },
      { id: 4, name: "Export Center", type: "write" }
    ]
  }
];
const WizardSidebar = ({
  currentPhase,
  currentSection,
  onNavigate,
  inventoryEnabled = false,
  wipEnabled = false
}) => {
  const [expandedPhases, setExpandedPhases] = useState([currentPhase]);
  const togglePhase = (phaseId) => {
    setExpandedPhases(
      (prev) => prev.includes(phaseId) ? prev.filter((id) => id !== phaseId) : [...prev, phaseId]
    );
  };
  const isPhaseComplete = (phaseId) => phaseId < currentPhase;
  const isSectionComplete = (phaseId, sectionId) => {
    if (phaseId < currentPhase) return true;
    if (phaseId === currentPhase && sectionId < currentSection) return true;
    return false;
  };
  return /* @__PURE__ */ jsx("aside", { className: "w-72 md:border-r border-border bg-card overflow-y-auto flex-shrink-0 flex flex-col h-full", children: /* @__PURE__ */ jsxs("div", { className: "p-4 flex-1 overflow-y-auto", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4", children: "QoE Wizard" }),
    /* @__PURE__ */ jsx("nav", { className: "space-y-1", children: WIZARD_PHASES.map((phase) => {
      const isExpanded = expandedPhases.includes(phase.id);
      const isComplete = isPhaseComplete(phase.id);
      const isCurrent = phase.id === currentPhase;
      const isReportPhase = phase.type === "report";
      const filteredSubgroups = phase.subgroups?.map((sg) => ({
        ...sg,
        sections: sg.sections.filter((s) => {
          if (phase.id === 3 && s.name === "Inventory" && !inventoryEnabled) return false;
          if (phase.id === 3 && s.name === "WIP Schedule" && !wipEnabled) return false;
          return true;
        })
      }));
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => togglePhase(phase.id),
            className: cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isCurrent ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
            ),
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                isComplete ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-4 h-4 text-primary" }) : /* @__PURE__ */ jsx(Circle, { className: cn("w-4 h-4", isCurrent ? "text-primary" : "text-muted-foreground") }),
                /* @__PURE__ */ jsx("span", { children: phase.name }),
                isReportPhase && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[10px] px-1.5 py-0", children: /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3" }) })
              ] }),
              isExpanded ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4 flex-shrink-0" }) : /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4 flex-shrink-0" })
            ]
          }
        ),
        isExpanded && /* @__PURE__ */ jsx("div", { className: "ml-6 mt-1 space-y-1", children: filteredSubgroups ? (
          // Render with subgroup labels
          filteredSubgroups.map((subgroup, sgIndex) => /* @__PURE__ */ jsxs("div", { children: [
            sgIndex > 0 && /* @__PURE__ */ jsx("div", { className: "h-2" }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1", children: subgroup.label }),
            subgroup.sections.map((section) => {
              const sectionComplete = isSectionComplete(phase.id, section.id);
              const isCurrentSection = phase.id === currentPhase && section.id === currentSection;
              const isReadOnly = section.type === "read";
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => onNavigate(phase.id, section.id),
                  className: cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                    isCurrentSection ? "bg-primary text-primary-foreground" : sectionComplete ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  ),
                  children: [
                    isReadOnly ? /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3 flex-shrink-0" }) : sectionComplete ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 flex-shrink-0" }) : /* @__PURE__ */ jsx(Edit3, { className: "w-3 h-3 flex-shrink-0" }),
                    /* @__PURE__ */ jsx("span", { children: section.name })
                  ]
                },
                section.id
              );
            })
          ] }, subgroup.label))
        ) : (
          // Render flat sections
          phase.sections?.map((section) => {
            const sectionComplete = isSectionComplete(phase.id, section.id);
            const isCurrentSection = phase.id === currentPhase && section.id === currentSection;
            const isReadOnly = section.type === "read";
            return /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onNavigate(phase.id, section.id),
                className: cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isCurrentSection ? "bg-primary text-primary-foreground" : sectionComplete ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                ),
                children: [
                  isReadOnly ? /* @__PURE__ */ jsx(Eye, { className: "w-3 h-3 flex-shrink-0" }) : sectionComplete ? /* @__PURE__ */ jsx(CheckCircle, { className: "w-3 h-3 flex-shrink-0" }) : /* @__PURE__ */ jsx(Edit3, { className: "w-3 h-3 flex-shrink-0" }),
                  /* @__PURE__ */ jsx("span", { children: section.name })
                ]
              },
              section.id
            );
          })
        ) })
      ] }, phase.id);
    }) })
  ] }) });
};
const MobileWizardSidebar = ({
  currentPhase,
  currentSection,
  onNavigate,
  inventoryEnabled = false,
  wipEnabled = false
}) => {
  const [open, setOpen] = useState(false);
  const handleNavigate = (phase, section) => {
    onNavigate(phase, section);
    setOpen(false);
  };
  return /* @__PURE__ */ jsxs(Sheet, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "icon", className: "md:hidden", children: [
      /* @__PURE__ */ jsx(Menu, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Open wizard menu" })
    ] }) }),
    /* @__PURE__ */ jsx(SheetContent, { side: "left", className: "p-0 w-72", children: /* @__PURE__ */ jsx(
      WizardSidebar,
      {
        currentPhase,
        currentSection,
        onNavigate: handleNavigate,
        inventoryEnabled,
        wipEnabled
      }
    ) })
  ] });
};
function guideReducer(state, action) {
  switch (action.type) {
    case "setSection":
      return {
        sectionKey: action.sectionKey,
        mode: void 0,
        focusedControl: void 0,
        expandedCardId: null,
        hasData: void 0,
        hasAIFlags: void 0
      };
    case "clearFocus":
      return { ...state, focusedControl: void 0 };
    case "merge": {
      const next = { ...state, ...action.patch };
      if (action.patch.sectionKey && action.patch.sectionKey !== state.sectionKey) {
        next.focusedControl = void 0;
        next.expandedCardId = null;
      }
      return next;
    }
    default:
      return state;
  }
}
const contextualHints = {
  intent: {
    title: "Choosing the right effect",
    content: "Pick the intent that matches what you're doing to earnings. The intent determines the EBITDA direction — see the reference table below."
  },
  tbAccount: {
    title: "Link to Trial Balance account",
    content: "Choose the TB account that matches this activity so Shepi can track where the adjustment lands and keep schedules consistent."
  },
  periodValues: {
    title: "Entering monthly values",
    content: "Enter amounts by month. The total is computed automatically. Use zeros for months where the item didn't occur."
  },
  status: {
    title: "Status workflow",
    content: "Proposed = under review. Accepted = included in normalized results. Rejected = excluded (kept for audit trail)."
  },
  verify: {
    title: "Verify with AI",
    content: "Verify cross-checks your adjustment against linked evidence and uploaded deal docs to reduce mistakes and strengthen support."
  },
  proof: {
    title: "Attach proof",
    content: "Upload or link supporting documents (invoice, statement, email, contract) so reviewers can validate the adjustment quickly."
  }
};
const commonKeyTerms = [
  { term: "EBITDA", definition: "Earnings Before Interest, Taxes, Depreciation & Amortization — a common measure of operating performance used in deals." },
  { term: "Add-back", definition: "Removing an expense to increase EBITDA and show ongoing earnings power." },
  { term: "Normalization", definition: "Adjusting an item to a market or steady-state level (e.g., owner comp, rent) to reflect a buyer's reality." },
  { term: "Non-recurring", definition: "A one-time item not expected to repeat under normal operations (e.g., lawsuit settlement)." },
  { term: "Pro Forma", definition: '"As if" earnings — what results would look like after a future change (e.g., new lease terms).' },
  { term: "Run-rate", definition: "A normalized, steady-state level of revenue/cost used to estimate ongoing performance." }
];
const sharedDecisionTree = [
  { question: "Am I changing EBITDA?", answer: "Yes → DD Adjustments", navigateTo: { phase: 3, section: 1 } },
  { question: "Am I changing EBITDA?", answer: "No → Reclassifications", navigateTo: { phase: 3, section: 2 } },
  { question: "Investigating raw entries?", answer: "Journal Entries", navigateTo: { phase: 3, section: 3 } }
];
const adjustmentsGuideContent = {
  "3-1": {
    title: "DD Adjustments",
    decisionTree: sharedDecisionTree,
    what: "Adjustments correct earnings to show what a buyer would actually earn. You remove one-time items, normalize owner perks, and account for post-deal changes so normalized EBITDA reflects reality.",
    howToUse: [
      {
        title: "Using the Adjustment Ledger",
        steps: [
          'Click "From template..." to pre-fill common adjustments (e.g., owner comp normalization).',
          'Or click "Add DD Adjustment" for a blank entry.',
          "Expand the row and fill in Description, TB Account, Effect (Intent), and monthly values.",
          "Add Evidence/Notes so a reviewer can validate quickly.",
          "Set Status to Proposed / Accepted / Rejected.",
          "Use Verify and Attach Proof to strengthen support."
        ]
      },
      {
        title: "Types of adjustments",
        steps: [
          "MA (Management): owner-related or discretionary items (e.g., personal car, family payroll).",
          "DD (Due Diligence): one-time items uncovered during review (e.g., settled lawsuit).",
          "PF (Pro Forma): future changes expected after close (e.g., new lease savings)."
        ]
      }
    ],
    keyTerms: commonKeyTerms,
    examples: [
      { title: "Owner's personal car lease", scenario: "The company pays $10k/month for the owner's personal vehicle.", action: "Create an MA adjustment and remove the expense (+EBITDA). Attach the lease statement." },
      { title: "One-time legal settlement", scenario: "A $50k legal settlement was paid and the matter is resolved.", action: "Create a DD adjustment and remove the one-time expense (+EBITDA). Attach the settlement proof." },
      { title: "New lease savings post-close", scenario: "A signed lease amendment will reduce rent by $3k/month.", action: "Create a PF adjustment reflecting future savings (+EBITDA). Attach the signed amendment." }
    ],
    intentTable: [
      { intent: "Remove one-time expense", ebitdaImpact: "+EBITDA" },
      { intent: "Add missing expense", ebitdaImpact: "-EBITDA" },
      { intent: "Remove non-recurring revenue", ebitdaImpact: "-EBITDA" },
      { intent: "Add missing revenue", ebitdaImpact: "+EBITDA" },
      { intent: "Normalize expense upward", ebitdaImpact: "-EBITDA" },
      { intent: "Normalize expense downward", ebitdaImpact: "+EBITDA" }
    ],
    suggestedPrompts: [
      "What common adjustments should I look for in this industry?",
      "Is this owner compensation reasonable vs market?",
      "Help me decide whether this is MA, DD, or PF.",
      "Does this look non-recurring or run-rate?"
    ],
    emptyStateHint: 'Not sure where to start? Try AI Discovery or choose a template from "From template...".',
    modeOverrides: {
      "ai-discovery": {
        howToUse: [
          {
            title: "Using AI Discovery",
            steps: [
              'Switch to the "AI Discovery" tab to review automatically flagged items.',
              "Click a flag to see why it was flagged (timing, amount, vendor/memo patterns).",
              'Click "Convert" to create an adjustment — Shepi pre-fills account, amount, and effect.',
              "Review the created adjustment in the Ledger tab, refine values, and attach proof."
            ]
          }
        ],
        suggestedPrompts: [
          "Why was this transaction flagged as unusual?",
          "Should this be an add-back or a reclass?",
          "What evidence would best support this adjustment?"
        ]
      }
    }
  },
  "3-2": {
    title: "Reclassifications",
    decisionTree: sharedDecisionTree,
    what: "Reclassifications move amounts between financial statement categories without changing total profit. They do not change EBITDA, but can change Gross Profit / Gross Margin presentation (e.g., moving shipping from G&A to COGS).",
    howToUse: [
      {
        title: "How to reclassify",
        steps: [
          'Click "Add Entry".',
          "Enter Account # and Account Description.",
          "Select the From FS line item (where it currently sits).",
          "Select the To FS line item (where it should be).",
          "Enter the amount to move.",
          "Add a reason so reviewers understand the logic."
        ]
      },
      {
        title: "Reclass vs Adjust",
        steps: [
          "Adjust (DD Adjustments): when EBITDA should change.",
          "Reclass (this page): when EBITDA should not change — you're fixing categorization for clarity."
        ]
      }
    ],
    keyTerms: commonKeyTerms,
    examples: [
      { title: "Shipping costs in G&A", scenario: "The company records $8k/month shipping under G&A.", action: "Reclass from G&A to COGS. EBITDA stays the same, but gross margin becomes accurate." }
    ],
    suggestedPrompts: [
      "Which accounts might be miscategorized?",
      "Should this expense be COGS or OpEx?",
      "Does this belong in revenue contra accounts or expense?"
    ],
    emptyStateHint: "Not sure what to reclass? Ask the AI which accounts might be miscategorized.",
    modeOverrides: {
      "ai-discovery": {
        howToUse: [
          {
            title: "Using AI Discovery for reclasses",
            steps: [
              "Review suggested reclasses based on vendor/memo patterns and account behavior.",
              "Confirm the direction (From → To) matches the business logic.",
              "Apply the reclass and document the reason."
            ]
          }
        ]
      }
    }
  },
  "3-3": {
    title: "Journal Entries",
    decisionTree: sharedDecisionTree,
    what: "Journal Entries are the raw accounting records. This read-only view helps you spot unusual patterns like large period-end entries, round numbers, or adjustments that don't match operations.",
    howToUse: [
      {
        title: "How to review journal entries",
        steps: [
          "Use search to filter by account, memo, or JE number.",
          "Expand a row to see debit/credit line details.",
          "Look for unusual entries (timing, size, or memo).",
          "If something affects normalized earnings, create a DD Adjustment for it."
        ]
      },
      {
        title: "What to look for",
        steps: [
          "Large entries near month-end or year-end.",
          "Round numbers (e.g., exactly $100,000).",
          'Entries marked "Adj" or posted by accountants near close.',
          "Unusual revenue or COGS entries that don't align to operations."
        ]
      }
    ],
    keyTerms: commonKeyTerms,
    examples: [
      { title: "Large year-end entry", scenario: "A large adjusting entry posted on the last day of the fiscal year impacts revenue.", action: "Investigate support. If non-recurring or unsupported, create a DD adjustment and attach evidence." }
    ],
    suggestedPrompts: [
      "Which journal entries look like period-end adjustments?",
      "Are there entries that could indicate earnings management?",
      "What evidence would validate this journal entry?"
    ],
    emptyStateHint: "Journal entries will appear after a QuickBooks sync. Check your integration status if you expected to see them."
  }
};
function getDefaultOpenItems(ctx) {
  if (ctx.mode === "ai-discovery") return ["how"];
  if (ctx.hasData === false) return ["how", "examples"];
  if (ctx.focusedControl) return ["how"];
  return ["what", "how"];
}
const Drawer = ({ shouldScaleBackground = true, ...props }) => /* @__PURE__ */ jsx(Drawer$1.Root, { shouldScaleBackground, ...props });
Drawer.displayName = "Drawer";
const DrawerTrigger = Drawer$1.Trigger;
const DrawerPortal = Drawer$1.Portal;
Drawer$1.Close;
const DrawerOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Drawer$1.Overlay, { ref, className: cn("fixed inset-0 z-50 bg-black/80", className), ...props }));
DrawerOverlay.displayName = Drawer$1.Overlay.displayName;
const DrawerContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DrawerPortal, { children: [
  /* @__PURE__ */ jsx(DrawerOverlay, {}),
  /* @__PURE__ */ jsxs(
    Drawer$1.Content,
    {
      ref,
      className: cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx("div", { className: "mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" }),
        children
      ]
    }
  )
] }));
DrawerContent.displayName = "DrawerContent";
const DrawerHeader = ({ className, ...props }) => /* @__PURE__ */ jsx("div", { className: cn("grid gap-1.5 p-4 text-center sm:text-left", className), ...props });
DrawerHeader.displayName = "DrawerHeader";
const DrawerTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  Drawer$1.Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DrawerTitle.displayName = Drawer$1.Title.displayName;
const DrawerDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(Drawer$1.Description, { ref, className: cn("text-sm text-muted-foreground", className), ...props }));
DrawerDescription.displayName = Drawer$1.Description.displayName;
const GUIDE_WIDTH_KEY = "adjustments-guide-width";
const DEFAULT_WIDTH = 300;
const MIN_WIDTH = 220;
const MAX_WIDTH = 500;
function mergeModeOverride(sectionKey, mode) {
  const base = adjustmentsGuideContent[sectionKey];
  if (!mode) return base;
  const override = base.modeOverrides?.[mode];
  if (!override) return base;
  return {
    ...base,
    ...override,
    howToUse: override.howToUse ?? base.howToUse,
    suggestedPrompts: override.suggestedPrompts ?? base.suggestedPrompts,
    examples: override.examples ?? base.examples,
    keyTerms: override.keyTerms ?? base.keyTerms
  };
}
function HintBanner({ ctx }) {
  if (!ctx.focusedControl) return null;
  const hint = contextualHints[ctx.focusedControl];
  if (!hint) return null;
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border border-primary/30 bg-primary/5 p-3 mb-3", children: [
    /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: hint.title }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: hint.content })
  ] });
}
function DecisionTree({
  sectionKey,
  onNavigate
}) {
  const { decisionTree } = adjustmentsGuideContent[sectionKey];
  return /* @__PURE__ */ jsxs("div", { className: "rounded-md border bg-muted/30 p-3 mb-3", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-muted-foreground mb-2", children: "Quick Decision" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: decisionTree.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 text-xs", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: item.answer }),
      item.navigateTo && /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "link",
          size: "sm",
          className: "h-auto p-0 text-xs text-primary",
          onClick: () => onNavigate(item.navigateTo.phase, item.navigateTo.section),
          children: [
            "Go ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3 ml-0.5" })
          ]
        }
      )
    ] }, idx)) })
  ] });
}
function SidebarBody({
  ctx,
  onNavigate,
  onOpenAssistant
}) {
  const content = mergeModeOverride(ctx.sectionKey, ctx.mode);
  const defaultOpen = useMemo(() => getDefaultOpenItems(ctx), [ctx.mode, ctx.focusedControl, ctx.hasData]);
  const [openItems, setOpenItems] = useState(defaultOpen);
  useEffect(() => {
    setOpenItems(defaultOpen);
  }, [defaultOpen.join(",")]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-1 overflow-hidden break-words", children: [
    /* @__PURE__ */ jsx(DecisionTree, { sectionKey: ctx.sectionKey, onNavigate }),
    /* @__PURE__ */ jsx(HintBanner, { ctx }),
    /* @__PURE__ */ jsxs(Accordion, { type: "multiple", value: openItems, onValueChange: (v) => setOpenItems(v), children: [
      /* @__PURE__ */ jsxs(AccordionItem, { value: "what", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2.5", children: "What is this?" }),
        /* @__PURE__ */ jsx(AccordionContent, { className: "text-xs text-muted-foreground leading-relaxed", children: content.what })
      ] }),
      /* @__PURE__ */ jsxs(AccordionItem, { value: "how", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2.5", children: "How to use this page" }),
        /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
          content.howToUse.map((group, gi) => /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold mb-1", children: group.title }),
            /* @__PURE__ */ jsx("ol", { className: "space-y-1 text-xs text-muted-foreground list-decimal list-inside", children: group.steps.map((s, si) => /* @__PURE__ */ jsx("li", { children: s }, si)) })
          ] }, gi)),
          content.intentTable && content.intentTable.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold mb-1", children: "Intent Selector reference" }),
            /* @__PURE__ */ jsxs("div", { className: "border rounded text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-px bg-muted font-medium p-1.5", children: [
                /* @__PURE__ */ jsx("span", { children: "Effect" }),
                /* @__PURE__ */ jsx("span", { children: "EBITDA Impact" })
              ] }),
              content.intentTable.map((row, i) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-px p-1.5 border-t text-muted-foreground", children: [
                /* @__PURE__ */ jsx("span", { children: row.intent }),
                /* @__PURE__ */ jsx("span", { className: cn(
                  "font-medium",
                  row.ebitdaImpact.includes("+") ? "text-primary" : "text-destructive"
                ), children: row.ebitdaImpact })
              ] }, i))
            ] })
          ] }),
          !ctx.hasData && content.emptyStateHint && /* @__PURE__ */ jsx("p", { className: "text-xs text-primary mt-2", children: content.emptyStateHint })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(AccordionItem, { value: "terms", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2.5", children: "Key Terms" }),
        /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("dl", { className: "space-y-2", children: content.keyTerms.map((t) => /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("dt", { className: "text-xs font-semibold", children: t.term }),
          /* @__PURE__ */ jsx("dd", { className: "text-xs text-muted-foreground", children: t.definition })
        ] }, t.term)) }) })
      ] }),
      /* @__PURE__ */ jsxs(AccordionItem, { value: "examples", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2.5", children: "Real-World Examples" }),
        /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-3", children: content.examples.map((ex) => /* @__PURE__ */ jsxs("div", { className: "border rounded p-2.5", children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold", children: ex.title }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: ex.scenario }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs mt-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Action: " }),
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: ex.action })
          ] })
        ] }, ex.title)) }) })
      ] }),
      /* @__PURE__ */ jsxs(AccordionItem, { value: "ask", children: [
        /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-sm py-2.5", children: "Ask the AI Assistant" }),
        /* @__PURE__ */ jsx(AccordionContent, { children: /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: content.suggestedPrompts.map((p) => /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "link",
            size: "sm",
            className: "w-full justify-start text-xs h-auto py-1.5 px-2 text-primary/70 hover:text-primary no-underline hover:underline",
            onClick: () => onOpenAssistant?.(p),
            children: [
              /* @__PURE__ */ jsx(MessageSquare, { className: "h-3 w-3 mr-1.5 shrink-0" }),
              p
            ]
          },
          p
        )) }) })
      ] })
    ] })
  ] });
}
function AdjustmentsGuideSidebar({
  guideContext,
  onOpenAssistant,
  onNavigate,
  onDismiss,
  visible,
  collapsed,
  onToggleCollapse
}) {
  const isMobile = useIsMobile();
  const [width, setWidth] = useState(() => {
    try {
      const saved = localStorage.getItem(GUIDE_WIDTH_KEY);
      if (saved) return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(saved)));
    } catch {
    }
    return DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef(null);
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = { x: e.clientX, width };
  }, [width]);
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e) => {
      if (!resizeStartRef.current) return;
      const delta = resizeStartRef.current.x - e.clientX;
      const newW = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartRef.current.width + delta));
      setWidth(newW);
    };
    const onUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      localStorage.setItem(GUIDE_WIDTH_KEY, String(width));
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isResizing, width]);
  if (!visible) return null;
  if (isMobile) {
    return /* @__PURE__ */ jsxs(Drawer, { children: [
      /* @__PURE__ */ jsx(DrawerTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
        Button,
        {
          size: "icon",
          className: "fixed bottom-20 right-4 z-40 rounded-full h-10 w-10 shadow-lg",
          children: /* @__PURE__ */ jsx(HelpCircle, { className: "h-5 w-5" })
        }
      ) }),
      /* @__PURE__ */ jsxs(DrawerContent, { className: "max-h-[85vh]", children: [
        /* @__PURE__ */ jsx(DrawerHeader, { className: "pb-2", children: /* @__PURE__ */ jsxs(DrawerTitle, { className: "text-sm", children: [
          adjustmentsGuideContent[guideContext.sectionKey].title,
          " Guide"
        ] }) }),
        /* @__PURE__ */ jsxs(ScrollArea, { className: "px-4 pb-4 h-[70vh]", children: [
          /* @__PURE__ */ jsx(SidebarBody, { ctx: guideContext, onNavigate, onOpenAssistant }),
          /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "w-full mt-3 text-muted-foreground", onClick: onDismiss, children: "Dismiss guide" })
        ] })
      ] })
    ] });
  }
  if (collapsed) {
    return /* @__PURE__ */ jsx("div", { className: "shrink-0 w-10 flex flex-col items-center pt-2", children: /* @__PURE__ */ jsx(
      Button,
      {
        variant: "ghost",
        size: "icon",
        className: "h-8 w-8",
        onClick: onToggleCollapse,
        title: "Open learning guide",
        children: /* @__PURE__ */ jsx(HelpCircle, { className: "h-4 w-4" })
      }
    ) });
  }
  return /* @__PURE__ */ jsxs(
    "aside",
    {
      id: "adjustments-guide-aside",
      className: "shrink-0 border-l hidden lg:block relative overflow-hidden",
      style: { width },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "absolute top-0 left-0 w-2 h-full cursor-col-resize z-10 group flex items-center justify-center hover:bg-primary/10 transition-colors",
            onMouseDown: handleResizeStart,
            children: /* @__PURE__ */ jsx(GripVertical, { className: "h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "pl-4 pr-2 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm font-semibold", children: [
              adjustmentsGuideContent[guideContext.sectionKey].title,
              " Guide"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: onToggleCollapse, title: "Collapse", children: /* @__PURE__ */ jsx(PanelRightClose, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 text-muted-foreground", onClick: onDismiss, title: "Dismiss", children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsx(ScrollArea, { className: "h-[calc(100vh-220px)]", children: /* @__PURE__ */ jsx(SidebarBody, { ctx: guideContext, onNavigate, onOpenAssistant }) })
        ] })
      ]
    }
  );
}
function getRecommendation(ctx) {
  if (ctx.sectionKey === "3-1") {
    if (ctx.hasAIFlags) {
      return {
        text: "Switch to AI Discovery to review automatically flagged items.",
        icon: /* @__PURE__ */ jsx(Sparkles, { className: "h-4 w-4 text-primary shrink-0" })
      };
    }
    return {
      text: 'Start with a template — pick from common adjustment types in "From template...".',
      icon: /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4 text-primary shrink-0" })
    };
  }
  if (ctx.sectionKey === "3-2") {
    return {
      text: "Add an entry, or ask the AI what might need reclassifying (COGS vs OpEx is a great first pass).",
      icon: /* @__PURE__ */ jsx(ClipboardList, { className: "h-4 w-4 text-primary shrink-0" })
    };
  }
  if (!ctx.hasData) {
    return {
      text: "Journal entries will appear after your QuickBooks sync completes.",
      icon: /* @__PURE__ */ jsx(BookOpen, { className: "h-4 w-4 text-primary shrink-0" })
    };
  }
  return {
    text: "Search for unusual entries near period-end (large amounts, round numbers, or 'Adj' memos).",
    icon: /* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-primary shrink-0" })
  };
}
function AdjustmentsWelcomeCard({
  guideContext,
  onGotIt,
  onHideForNow,
  onDontShowAgain
}) {
  const rec = getRecommendation(guideContext);
  return /* @__PURE__ */ jsx(Card, { className: "mb-4 border-primary/20 bg-primary/5", children: /* @__PURE__ */ jsxs(CardContent, { className: "pt-5 pb-4 space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(BookOpen, { className: "h-5 w-5 text-primary mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-sm", children: "Welcome to Phase 3" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "This is where you clean up earnings and presentation so stakeholders see the true profit potential. The Learning Guide on the right will walk you through each step." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 rounded-md bg-background/80 p-2.5 border", children: [
      rec.icon,
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Recommended first step" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm", children: rec.text })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsx(Button, { size: "sm", onClick: onGotIt, children: "Got it, show me the guide" }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: onHideForNow, children: "Hide for now" }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "text-muted-foreground", onClick: onDontShowAgain, children: "Don't show again" })
    ] })
  ] }) });
}
const ProjectSetupSection = lazy(() => import("./ProjectSetupSection-DufIF0vS.js").then((m) => ({ default: m.ProjectSetupSection })));
const ChartOfAccountsSection = lazy(() => import("./ChartOfAccountsSection-CJy1u8wZ.js").then((m) => ({ default: m.ChartOfAccountsSection })));
const TrialBalanceSection = lazy(() => import("./TrialBalanceSection-C2_6LWDB.js").then((m) => ({ default: m.TrialBalanceSection })));
const DocumentUploadSection = lazy(() => import("./DocumentUploadSection-DJ9E1m8s.js").then((m) => ({ default: m.DocumentUploadSection })));
const DDAdjustmentsSection = lazy(() => import("./DDAdjustmentsSection-E_pC76hQ.js").then((m) => ({ default: m.DDAdjustmentsSection })));
const ReclassificationsSection = lazy(() => import("./ReclassificationsSection-ChQbM9ju.js").then((m) => ({ default: m.ReclassificationsSection })));
const JournalEntriesSection = lazy(() => import("./JournalEntriesSection-CZZAo3Pw.js").then((m) => ({ default: m.JournalEntriesSection })));
const ARAgingSection = lazy(() => import("./ARAgingSection-CFMN2Ucy.js").then((m) => ({ default: m.ARAgingSection })));
const APAgingSection = lazy(() => import("./APAgingSection-Bs0-uCY3.js").then((m) => ({ default: m.APAgingSection })));
const FixedAssetsSection = lazy(() => import("./FixedAssetsSection-CIiJUfZk.js").then((m) => ({ default: m.FixedAssetsSection })));
const InventorySection = lazy(() => import("./InventorySection-BE8FVnSG.js").then((m) => ({ default: m.InventorySection })));
const TopCustomersSection = lazy(() => import("./TopCustomersSection-CttvI-Aw.js").then((m) => ({ default: m.TopCustomersSection })));
const TopVendorsSection = lazy(() => import("./TopVendorsSection-Bv4PCTFl.js").then((m) => ({ default: m.TopVendorsSection })));
const IncomeStatementSection = lazy(() => import("./IncomeStatementSection-BNdGEk-L.js").then((m) => ({ default: m.IncomeStatementSection })));
const BalanceSheetSection = lazy(() => import("./BalanceSheetSection-DUvzFVhM.js").then((m) => ({ default: m.BalanceSheetSection })));
const QoESummarySection = lazy(() => import("./QoESummarySection-BrCkWCwo.js").then((m) => ({ default: m.QoESummarySection })));
const PayrollSection = lazy(() => import("./PayrollSection-BXshCcaF.js").then((m) => ({ default: m.PayrollSection })));
const NWCFCFSection = lazy(() => import("./NWCFCFSection-TdN0KHii.js").then((m) => ({ default: m.NWCFCFSection })));
const ProofOfCashSection = lazy(() => import("./ProofOfCashSection-8qK2c8cv.js").then((m) => ({ default: m.ProofOfCashSection })));
const SupplementarySection = lazy(() => import("./SupplementarySection-BHnB5Ga1.js").then((m) => ({ default: m.SupplementarySection })));
const MaterialContractsSection = lazy(() => import("./MaterialContractsSection-ClNuEO_v.js").then((m) => ({ default: m.MaterialContractsSection })));
const QoEExecutiveSummarySection = lazy(() => import("./QoEExecutiveSummarySection-B2gTlRUY.js").then((m) => ({ default: m.QoEExecutiveSummarySection })));
const FinancialReportsSection = lazy(() => import("./FinancialReportsSection-CNF1IHXu.js").then((m) => ({ default: m.FinancialReportsSection })));
const AnalysisReportsSection = lazy(() => import("./AnalysisReportsSection-t8fwnlxI.js").then((m) => ({ default: m.AnalysisReportsSection })));
const ExportCenterSection = lazy(() => import("./ExportCenterSection-BuFjVNYO.js").then((m) => ({ default: m.ExportCenterSection })));
const GenericReportSection = lazy(() => import("./GenericReportSection-BPd0zg8c.js").then((m) => ({ default: m.GenericReportSection })));
function SectionFallback() {
  return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-32", children: /* @__PURE__ */ jsx(Spinner, { className: "h-6 w-6 text-muted-foreground" }) });
}
class SectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error(`Section "${this.props.sectionName}" crashed:`, error, info);
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsxs("div", { className: "rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-lg font-semibold text-foreground", children: "This section encountered an error" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: this.state.error?.message || "An unexpected error occurred." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "text-sm text-primary underline hover:no-underline",
            onClick: () => this.setState({ hasError: false, error: null }),
            children: "Try again"
          }
        )
      ] });
    }
    return this.props.children;
  }
}
const SECTION_MAP = {
  // Phase 1: Project Setup (1 combined section)
  "1-1": { phase: 1, section: 1, next: { phase: 2, section: 1 } },
  // Phase 2: Core Data Entry (3 sections)
  "2-1": { phase: 2, section: 1, prev: { phase: 1, section: 1 }, next: { phase: 2, section: 2 } },
  "2-2": { phase: 2, section: 2, prev: { phase: 2, section: 1 }, next: { phase: 2, section: 3 } },
  "2-3": { phase: 2, section: 3, prev: { phase: 2, section: 2 }, next: { phase: 3, section: 1 } },
  // Phase 3: Adjustments & Schedules (10 sections)
  "3-1": { phase: 3, section: 1, prev: { phase: 2, section: 3 }, next: { phase: 3, section: 2 } },
  "3-2": { phase: 3, section: 2, prev: { phase: 3, section: 1 }, next: { phase: 3, section: 3 } },
  "3-3": { phase: 3, section: 3, prev: { phase: 3, section: 2 }, next: { phase: 3, section: 4 } },
  "3-4": { phase: 3, section: 4, prev: { phase: 3, section: 3 }, next: { phase: 3, section: 5 } },
  "3-5": { phase: 3, section: 5, prev: { phase: 3, section: 4 }, next: { phase: 3, section: 6 } },
  "3-6": { phase: 3, section: 6, prev: { phase: 3, section: 5 }, next: { phase: 3, section: 7 } },
  "3-7": { phase: 3, section: 7, prev: { phase: 3, section: 6 }, next: { phase: 3, section: 8 } },
  "3-8": { phase: 3, section: 8, prev: { phase: 3, section: 7 }, next: { phase: 3, section: 9 } },
  "3-9": { phase: 3, section: 9, prev: { phase: 3, section: 8 }, next: { phase: 3, section: 10 } },
  "3-10": { phase: 3, section: 10, prev: { phase: 3, section: 9 }, next: { phase: 3, section: 11 } },
  "3-11": { phase: 3, section: 11, prev: { phase: 3, section: 10 }, next: { phase: 4, section: 1 } },
  // Phase 4: Customer & Vendor (2 sections)
  "4-1": { phase: 4, section: 1, prev: { phase: 3, section: 10 }, next: { phase: 4, section: 2 } },
  "4-2": { phase: 4, section: 2, prev: { phase: 4, section: 1 }, next: { phase: 5, section: 1 } },
  // Phase 5: Reports (18 sections - expanded with IS/BS Reconciliation)
  "5-1": { phase: 5, section: 1, prev: { phase: 4, section: 2 }, next: { phase: 5, section: 2 } },
  "5-2": { phase: 5, section: 2, prev: { phase: 5, section: 1 }, next: { phase: 5, section: 3 } },
  "5-3": { phase: 5, section: 3, prev: { phase: 5, section: 2 }, next: { phase: 5, section: 4 } },
  "5-4": { phase: 5, section: 4, prev: { phase: 5, section: 3 }, next: { phase: 5, section: 5 } },
  "5-5": { phase: 5, section: 5, prev: { phase: 5, section: 4 }, next: { phase: 5, section: 6 } },
  "5-6": { phase: 5, section: 6, prev: { phase: 5, section: 5 }, next: { phase: 5, section: 7 } },
  "5-7": { phase: 5, section: 7, prev: { phase: 5, section: 6 }, next: { phase: 5, section: 8 } },
  "5-8": { phase: 5, section: 8, prev: { phase: 5, section: 7 }, next: { phase: 5, section: 9 } },
  "5-9": { phase: 5, section: 9, prev: { phase: 5, section: 8 }, next: { phase: 5, section: 10 } },
  "5-10": { phase: 5, section: 10, prev: { phase: 5, section: 9 }, next: { phase: 5, section: 11 } },
  "5-11": { phase: 5, section: 11, prev: { phase: 5, section: 10 }, next: { phase: 5, section: 12 } },
  "5-12": { phase: 5, section: 12, prev: { phase: 5, section: 11 }, next: { phase: 5, section: 13 } },
  "5-13": { phase: 5, section: 13, prev: { phase: 5, section: 12 }, next: { phase: 5, section: 14 } },
  "5-14": { phase: 5, section: 14, prev: { phase: 5, section: 13 }, next: { phase: 5, section: 15 } },
  "5-15": { phase: 5, section: 15, prev: { phase: 5, section: 14 }, next: { phase: 5, section: 16 } },
  "5-16": { phase: 5, section: 16, prev: { phase: 5, section: 15 }, next: { phase: 5, section: 17 } },
  "5-17": { phase: 5, section: 17, prev: { phase: 5, section: 16 }, next: { phase: 5, section: 18 } },
  "5-18": { phase: 5, section: 18, prev: { phase: 5, section: 17 }, next: { phase: 6, section: 1 } },
  // Phase 6: Deliverables (4 sections)
  "6-1": { phase: 6, section: 1, prev: { phase: 5, section: 18 }, next: { phase: 6, section: 2 } },
  "6-2": { phase: 6, section: 2, prev: { phase: 6, section: 1 }, next: { phase: 6, section: 3 } },
  "6-3": { phase: 6, section: 3, prev: { phase: 6, section: 2 }, next: { phase: 6, section: 4 } },
  "6-4": { phase: 6, section: 4, prev: { phase: 6, section: 3 } }
};
const getPeriodData = (project) => {
  const rawPeriods = project.periods;
  const periods = Array.isArray(rawPeriods) ? rawPeriods.filter((p) => typeof p === "object" && p !== null && "id" in p) : [];
  const fiscalYearEnd = project.fiscal_year_end ? parseInt(project.fiscal_year_end.split("-")[1] || "12") : 12;
  return { periods, fiscalYearEnd };
};
const WizardContent = ({
  project,
  updateProject,
  updateWizardData,
  onNavigate,
  onSave,
  inventoryEnabled = false,
  wipEnabled = false,
  onSwitchToInsights,
  onOpenAssistant
}) => {
  const [pendingDocType, setPendingDocType] = useState(null);
  const sectionKey = `${project.current_phase}-${project.current_section}`;
  useEffect(() => {
    if (sectionKey !== "2-3" && pendingDocType) {
      setPendingDocType(null);
    }
  }, [sectionKey, pendingDocType]);
  const isPhase3Adj = sectionKey === "3-1" || sectionKey === "3-2" || sectionKey === "3-3";
  const [guideContext, dispatchGuide] = useReducer(guideReducer, { sectionKey: "3-1" });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (isPhase3Adj) {
      dispatchGuide({ type: "setSection", sectionKey });
    }
  }, [sectionKey, isPhase3Adj]);
  const guideSettings = project.wizard_data?.settings || {};
  const dismissedUntil = Number(guideSettings.adjustmentsGuideDismissedUntil ?? 0);
  const guideComplete = Boolean(guideSettings.adjustmentsGuideComplete);
  const welcomeSeen = Boolean(guideSettings.adjustmentsWelcomeSeen);
  const showGuide = isPhase3Adj && !guideComplete && Date.now() > dismissedUntil;
  const showWelcomeCard = isPhase3Adj && !guideComplete && !welcomeSeen;
  const updateGuideSettings = useCallback((patch) => {
    updateWizardData("settings", { ...guideSettings, ...patch });
  }, [guideSettings, updateWizardData]);
  const handleGotIt = useCallback(() => updateGuideSettings({ adjustmentsWelcomeSeen: true }), [updateGuideSettings]);
  const handleHideForNow = useCallback(() => updateGuideSettings({ adjustmentsGuideDismissedUntil: Date.now() + 24 * 60 * 60 * 1e3, adjustmentsWelcomeSeen: true }), [updateGuideSettings]);
  const handleDontShowAgain = useCallback(() => updateGuideSettings({ adjustmentsWelcomeSeen: true, adjustmentsGuideComplete: true }), [updateGuideSettings]);
  const handleDismissGuide = useCallback(() => updateGuideSettings({ adjustmentsGuideComplete: true }), [updateGuideSettings]);
  const handleReopenGuide = useCallback(() => {
    updateGuideSettings({ adjustmentsGuideComplete: false });
    setSidebarCollapsed(false);
  }, [updateGuideSettings]);
  const onGuideContextChange = useCallback((patch) => {
    dispatchGuide({ type: "merge", patch });
  }, []);
  const openGuide = useCallback(() => {
    if (guideComplete) return;
    setSidebarCollapsed(false);
    if (dismissedUntil > 0 && Date.now() > dismissedUntil) {
      updateGuideSettings({ adjustmentsGuideDismissedUntil: 0 });
    }
  }, [guideComplete, dismissedUntil, updateGuideSettings]);
  const getNavInfo = () => {
    const baseNavInfo = SECTION_MAP[sectionKey];
    if (!baseNavInfo) return null;
    if (!inventoryEnabled) {
      if (sectionKey === "3-6" && baseNavInfo.next?.phase === 3 && baseNavInfo.next?.section === 7) {
        return { ...baseNavInfo, next: { phase: 3, section: 8 } };
      }
      if (sectionKey === "3-8" && baseNavInfo.prev?.phase === 3 && baseNavInfo.prev?.section === 7) {
        return { ...baseNavInfo, prev: { phase: 3, section: 6 } };
      }
    }
    if (!wipEnabled) {
      if (sectionKey === "3-10" && baseNavInfo.next?.phase === 3 && baseNavInfo.next?.section === 11) {
        return { ...baseNavInfo, next: { phase: 4, section: 1 } };
      }
      if (sectionKey === "4-1" && baseNavInfo.prev?.phase === 3 && baseNavInfo.prev?.section === 11) {
        return { ...baseNavInfo, prev: { phase: 3, section: 10 } };
      }
    }
    return baseNavInfo;
  };
  const navInfo = getNavInfo();
  const handleNext = () => {
    if (navInfo?.next) {
      onNavigate(navInfo.next.phase, navInfo.next.section);
      onSave();
    }
  };
  const handlePrev = () => {
    if (navInfo?.prev) {
      onNavigate(navInfo.prev.phase, navInfo.prev.section);
    }
  };
  const { periods, fiscalYearEnd } = getPeriodData(project);
  const needsReports = (project.current_phase ?? 1) >= 5;
  const { dealData, wizardReports } = useMemo(() => {
    if (!needsReports) {
      return { dealData: null, wizardReports: {} };
    }
    try {
      const dd = projectToDealData({
        id: project.id,
        name: project.name,
        client_name: project.client_name ?? null,
        target_company: project.target_company ?? null,
        industry: project.industry ?? null,
        transaction_type: project.transaction_type ?? null,
        fiscal_year_end: project.fiscal_year_end ?? null,
        periods: project.periods ?? null,
        wizard_data: project.wizard_data
      });
      return { dealData: dd, wizardReports: buildWizardReports(dd) };
    } catch (e) {
      console.warn("Failed to build wizard reports:", e);
      return { dealData: null, wizardReports: {} };
    }
  }, [needsReports, project.id, project.wizard_data, project.periods]);
  const getReportData = (key) => {
    return wizardReports[key] || {};
  };
  const isDemo = project.id === "demo";
  const renderSection = () => {
    const key = `${project.current_phase}-${project.current_section}`;
    switch (key) {
      // Phase 1: Project Setup
      case "1-1":
        return /* @__PURE__ */ jsx(
          ProjectSetupSection,
          {
            project,
            updateProject,
            updateWizardData,
            dueDiligenceData: project.wizard_data.dueDiligence || {},
            updateDueDiligenceData: (data) => updateWizardData("dueDiligence", data),
            onNavigate,
            onSave: async (overrides) => onSave(overrides)
          }
        );
      // Phase 2: Core Data Entry
      case "2-1":
        return /* @__PURE__ */ jsx(
          ChartOfAccountsSection,
          {
            projectId: project.id,
            data: project.wizard_data.chartOfAccounts || {},
            updateData: (data) => updateWizardData("chartOfAccounts", data),
            onAutoImport: () => onSave(),
            onNavigate,
            onOpenAssistant,
            onSave: (overrides) => onSave(overrides),
            wizardData: project.wizard_data
          }
        );
      case "2-2":
        return /* @__PURE__ */ jsx(
          TrialBalanceSection,
          {
            projectId: project.id,
            data: project.wizard_data.trialBalance || {},
            updateData: (data) => updateWizardData("trialBalance", data),
            periods,
            fiscalYearEnd,
            coaAccounts: project.wizard_data.chartOfAccounts?.accounts || [],
            onNavigate,
            onSave: (overrides) => onSave(overrides),
            wizardData: project.wizard_data
          }
        );
      case "2-3": {
        return /* @__PURE__ */ jsx(
          DocumentUploadSection,
          {
            projectId: project.id,
            periods,
            data: project.wizard_data.documentUpload || {},
            updateData: (data) => updateWizardData("documentUpload", data),
            fullWizardData: project.wizard_data,
            initialDocType: pendingDocType
          }
        );
      }
      // Phase 3: Adjustments & Schedules
      case "3-1":
        return /* @__PURE__ */ jsx(ReclassificationsSection, { data: project.wizard_data.reclassifications || {}, updateData: (data) => updateWizardData("reclassifications", data), projectId: project.id, onGuideContextChange, onOpenGuide: openGuide, isDemo, mockFlags: isDemo ? project.wizard_data.reclassificationFlags : void 0 });
      case "3-2":
        return /* @__PURE__ */ jsx(
          DDAdjustmentsSection,
          {
            data: project.wizard_data.ddAdjustments || {},
            updateData: (data) => updateWizardData("ddAdjustments", data),
            projectId: project.id,
            periods,
            fiscalYearEnd,
            coaAccounts: project.wizard_data.chartOfAccounts?.accounts || [],
            trialBalanceAccounts: project.wizard_data.trialBalance?.accounts || [],
            onGuideContextChange,
            onOpenGuide: openGuide,
            isDemo,
            mockProposals: isDemo ? project.wizard_data.discoveryProposals : void 0
          }
        );
      case "3-3":
        return /* @__PURE__ */ jsx(JournalEntriesSection, { projectId: project.id, data: project.wizard_data.journalEntries || { entries: [], totalCount: 0 }, onUpdate: (data) => updateWizardData("journalEntries", data), onGuideContextChange });
      case "3-4":
        return /* @__PURE__ */ jsx(ARAgingSection, { projectId: project.id, data: project.wizard_data.arAging || {}, updateData: (data) => updateWizardData("arAging", data), periods });
      case "3-5":
        return /* @__PURE__ */ jsx(APAgingSection, { projectId: project.id, data: project.wizard_data.apAging || {}, updateData: (data) => updateWizardData("apAging", data), periods });
      case "3-6":
        return /* @__PURE__ */ jsx(FixedAssetsSection, { data: project.wizard_data.fixedAssets || {}, updateData: (data) => updateWizardData("fixedAssets", data), projectId: project.id });
      case "3-7":
        return /* @__PURE__ */ jsx(InventorySection, { data: project.wizard_data.inventory || {}, updateData: (data) => updateWizardData("inventory", data) });
      case "3-8":
        return /* @__PURE__ */ jsx(
          PayrollSection,
          {
            data: project.wizard_data.payroll || {},
            periods,
            fiscalYearEnd,
            projectId: project.id,
            trialBalanceAccounts: project.wizard_data.trialBalance?.accounts || [],
            onTrialBalanceChange: (accounts) => {
              const tbData = project.wizard_data.trialBalance || {};
              updateWizardData("trialBalance", { ...tbData, accounts });
            }
          }
        );
      case "3-9":
        return /* @__PURE__ */ jsx(SupplementarySection, { data: project.wizard_data.supplementary || {}, updateData: (data) => updateWizardData("supplementary", data), projectId: project.id });
      case "3-10":
        return /* @__PURE__ */ jsx(MaterialContractsSection, { data: project.wizard_data.materialContracts || {}, updateData: (data) => updateWizardData("materialContracts", data), projectId: project.id });
      case "3-11":
        return /* @__PURE__ */ jsx("div", { className: "p-6 text-center text-muted-foreground", children: "WIP Schedule is available in the Workbook view. Navigate to Reports → Workbook to use the WIP Schedule tab." });
      // Phase 4: Customer & Vendor
      case "4-1":
        return /* @__PURE__ */ jsx(TopCustomersSection, { projectId: project.id, data: project.wizard_data.topCustomers || {}, updateData: (data) => updateWizardData("topCustomers", data) });
      case "4-2":
        return /* @__PURE__ */ jsx(TopVendorsSection, { projectId: project.id, data: project.wizard_data.topVendors || {}, updateData: (data) => updateWizardData("topVendors", data) });
      // Phase 5: Reports (expanded with all spreadsheet tabs)
      case "5-1":
        return /* @__PURE__ */ jsx(IncomeStatementSection, { data: getReportData("incomeStatement"), periods, fiscalYearEnd, dealData });
      case "5-2":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Income Statement - Detailed", description: "Detailed income statement with account-level breakdown", data: getReportData("incomeStatementDetailed"), dealData, reportType: "incomeStatementDetailed" });
      case "5-3":
        return /* @__PURE__ */ jsx(BalanceSheetSection, { data: getReportData("balanceSheet"), periods, fiscalYearEnd, dealData });
      case "5-4":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Balance Sheet - Detailed", description: "Detailed balance sheet with account-level breakdown", data: getReportData("balanceSheetDetailed"), dealData, reportType: "balanceSheetDetailed" });
      // IS/BS Reconciliation (QC check) — uses workbook grid
      case "5-5":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Reconciling IS & BS", description: "Side-by-side reconciliation of Income Statement and Balance Sheet to audited financials", data: getReportData("isbsReconciliation"), dealData, reportType: "isbsReconciliation" });
      // Detail Schedules
      case "5-6":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Sales Detail", description: "Monthly sales breakdown by category", data: getReportData("salesDetail"), dealData, reportType: "salesDetail" });
      case "5-7":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Cost of Goods Sold", description: "COGS breakdown by category", data: getReportData("cogsDetail"), dealData, reportType: "cogsDetail" });
      case "5-8":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Operating Expenses", description: "Operating expense detail by category", data: getReportData("operatingExpenses"), dealData, reportType: "operatingExpenses" });
      case "5-9":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Other Income/Expense", description: "Non-operating income and expenses", data: getReportData("otherExpenseIncome"), dealData, reportType: "otherExpenseIncome" });
      // QoE Reports
      case "5-10":
        return /* @__PURE__ */ jsx(
          GenericReportSection,
          {
            title: "QoE Analysis",
            description: "EBITDA bridge and adjustment summary computed from your Trial Balance and adjustments",
            data: getReportData("qoeAnalysis"),
            dealData,
            reportType: "qoeAnalysis"
          }
        );
      case "5-11":
        return /* @__PURE__ */ jsx(
          QoESummarySection,
          {
            dealData
          }
        );
      // Working Capital
      case "5-12":
        return /* @__PURE__ */ jsx(
          GenericReportSection,
          {
            title: "Working Capital",
            description: "Current assets and liabilities analysis (excluding cash and debt)",
            data: getReportData("workingCapital"),
            dealData,
            reportType: "workingCapital"
          }
        );
      case "5-13":
        return /* @__PURE__ */ jsx(
          NWCFCFSection,
          {
            nwcAnalysisData: getReportData("nwcAnalysis"),
            fcfData: getReportData("freeCashFlow"),
            periods,
            fiscalYearEnd,
            dealData,
            dealParameters: project.wizard_data.dealParameters || void 0,
            onUpdateDealParameters: (params) => updateWizardData("dealParameters", params)
          }
        );
      case "5-14":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Cash Analysis", description: "Cash flow and cash position analysis", data: getReportData("cashAnalysis"), dealData, reportType: "cashAnalysis" });
      case "5-15":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Other Current Assets", description: "Prepaid expenses, deposits, and other current assets", data: getReportData("otherCurrentAssets"), dealData, reportType: "otherCurrentAssets" });
      case "5-16":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Other Current Liabilities", description: "Accrued expenses and other current liabilities", data: getReportData("otherCurrentLiabilities"), dealData, reportType: "otherCurrentLiabilities" });
      // Supporting
      case "5-17":
        return /* @__PURE__ */ jsx(SectionErrorBoundary, { sectionName: "Proof of Cash", children: /* @__PURE__ */ jsx(
          ProofOfCashSection,
          {
            data: project.wizard_data.proofOfCash || {},
            updateData: (data) => updateWizardData("proofOfCash", data),
            periods,
            projectId: project.id,
            cashAnalysis: project.wizard_data.cashAnalysis,
            dealData,
            isDemo
          }
        ) });
      case "5-18":
        return /* @__PURE__ */ jsx(GenericReportSection, { title: "Free Cash Flow", description: "Free cash flow analysis and trends", data: getReportData("freeCashFlow"), dealData, reportType: "freeCashFlow" });
      // Phase 6: Deliverables
      case "6-1":
        return /* @__PURE__ */ jsx(QoEExecutiveSummarySection, { dealData, wizardData: project.wizard_data, project });
      case "6-2":
        return /* @__PURE__ */ jsx(FinancialReportsSection, { incomeStatementData: getReportData("incomeStatement"), balanceSheetData: getReportData("balanceSheet"), cashFlowData: getReportData("freeCashFlow") });
      case "6-3":
        return /* @__PURE__ */ jsx(AnalysisReportsSection, { dealData, nwcReportData: getReportData("nwcAnalysis") });
      case "6-4":
        return /* @__PURE__ */ jsx(ExportCenterSection, { data: project.wizard_data.exportCenter || {}, updateData: (data) => updateWizardData("exportCenter", data), wizardData: project.wizard_data, projectId: project.id, projectName: project.name, computedReports: wizardReports, dealData, onNavigateToInsights: onSwitchToInsights, isDemo });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "p-6 h-full flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 flex gap-0", children: [
      /* @__PURE__ */ jsxs("div", { className: cn("flex-1 min-w-0", isPhase3Adj && showGuide && !sidebarCollapsed && "lg:mr-0"), children: [
        isPhase3Adj && guideComplete && /* @__PURE__ */ jsx("div", { className: "flex justify-end mb-2", children: /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
          /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: handleReopenGuide, children: /* @__PURE__ */ jsx(HelpCircle, { className: "h-4 w-4" }) }) }),
          /* @__PURE__ */ jsx(TooltipContent, { children: "Reopen learning guide" })
        ] }) }) }),
        showWelcomeCard && /* @__PURE__ */ jsx(
          AdjustmentsWelcomeCard,
          {
            guideContext,
            onGotIt: handleGotIt,
            onHideForNow: handleHideForNow,
            onDontShowAgain: handleDontShowAgain
          }
        ),
        /* @__PURE__ */ jsx(Suspense, { fallback: /* @__PURE__ */ jsx(SectionFallback, {}), children: renderSection() })
      ] }),
      isPhase3Adj && /* @__PURE__ */ jsx(
        AdjustmentsGuideSidebar,
        {
          guideContext,
          onOpenAssistant: onOpenAssistant ? (prompt) => onOpenAssistant(prompt) : void 0,
          onNavigate,
          onDismiss: handleDismissGuide,
          visible: showGuide,
          collapsed: sidebarCollapsed,
          onToggleCollapse: () => setSidebarCollapsed((v) => !v)
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-4 pt-4 border-t border-border shrink-0", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          onClick: handlePrev,
          disabled: !navInfo?.prev,
          className: "gap-2",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
            " Previous"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleNext,
          disabled: !navInfo?.next,
          className: "gap-2",
          children: navInfo?.next ? /* @__PURE__ */ jsxs(Fragment, { children: [
            "Next ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
          ] }) : "Complete"
        }
      )
    ] })
  ] });
};
export {
  MobileWizardSidebar as M,
  WizardSidebar as W,
  WizardContent as a
};
