import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { C as Card, b as CardHeader, d as CardTitle, B as Button, e as CardDescription, f as CardContent } from "../main.mjs";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { C as Collapsible, a as CollapsibleTrigger, b as CollapsibleContent } from "./collapsible-DUtqt5i7.js";
import { FileText, RefreshCw, Building2, MapPin, Calendar, Users, TrendingUp, AlertTriangle, ChevronUp, ChevronDown, Briefcase, Target, DollarSign } from "lucide-react";
const CIMInsightsCard = ({ insights, className, onReupload, isReuploading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef(null);
  const handleReuploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onReupload) {
      onReupload(file);
    }
    e.target.value = "";
  };
  return /* @__PURE__ */ jsxs(Card, { className, children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "pb-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-5 h-5 text-primary" }),
          /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: "CIM Business Insights" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: "AI Extracted" }),
          onReupload && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "file",
                ref: fileInputRef,
                onChange: handleFileChange,
                accept: ".pdf,.doc,.docx",
                className: "hidden"
              }
            ),
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: handleReuploadClick,
                disabled: isReuploading,
                className: "h-7 text-xs",
                children: [
                  isReuploading ? /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1 animate-spin" }) : /* @__PURE__ */ jsx(RefreshCw, { className: "w-3 h-3 mr-1" }),
                  "Re-upload CIM"
                ]
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardDescription, { children: "Key business context extracted from the Confidential Information Memorandum" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "p-3 bg-muted/50 rounded-lg", children: /* @__PURE__ */ jsx("p", { className: "text-sm leading-relaxed", children: insights.rawSummary }) }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        insights.marketPosition.industry && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Building2, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { children: insights.marketPosition.industry })
        ] }),
        insights.businessOverview.headquarters && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsx("span", { children: insights.businessOverview.headquarters })
        ] }),
        insights.businessOverview.foundedYear && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Est. ",
            insights.businessOverview.foundedYear
          ] })
        ] }),
        insights.businessOverview.employeeCount && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxs("span", { children: [
            insights.businessOverview.employeeCount,
            " employees"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-3", children: [
        insights.growthDrivers.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-green-600", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4" }),
            "Growth Drivers"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1 text-muted-foreground", children: insights.growthDrivers.slice(0, 3).map((driver, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-green-500", children: "•" }),
            /* @__PURE__ */ jsx("span", { children: driver })
          ] }, i)) })
        ] }),
        insights.keyRisks.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-amber-600", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
            "Key Risks"
          ] }),
          /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1 text-muted-foreground", children: insights.keyRisks.slice(0, 3).map((risk, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-amber-500", children: "•" }),
            /* @__PURE__ */ jsx("span", { children: risk })
          ] }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Collapsible, { open: isExpanded, onOpenChange: setIsExpanded, children: [
        /* @__PURE__ */ jsx(CollapsibleTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "w-full justify-between", children: [
          isExpanded ? "Show Less" : "View All Details",
          isExpanded ? /* @__PURE__ */ jsx(ChevronUp, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" })
        ] }) }),
        /* @__PURE__ */ jsxs(CollapsibleContent, { className: "space-y-4 pt-4", children: [
          insights.productsAndServices.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
              /* @__PURE__ */ jsx(Briefcase, { className: "w-4 h-4 text-muted-foreground" }),
              "Products & Services"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: insights.productsAndServices.map((product, i) => /* @__PURE__ */ jsxs("div", { className: "p-2 bg-muted/30 rounded text-sm", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "font-medium", children: product.name }),
                product.revenuePercentage && /* @__PURE__ */ jsxs(Badge, { variant: "outline", children: [
                  product.revenuePercentage,
                  "% revenue"
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-xs mt-1", children: product.description })
            ] }, i)) })
          ] }),
          insights.managementTeam.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
              /* @__PURE__ */ jsx(Users, { className: "w-4 h-4 text-muted-foreground" }),
              "Management Team"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid gap-1", children: insights.managementTeam.map((member, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: member.name }),
              /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: member.title })
            ] }, i)) })
          ] }),
          insights.marketPosition.competitiveAdvantages.length > 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
              /* @__PURE__ */ jsx(Target, { className: "w-4 h-4 text-muted-foreground" }),
              "Competitive Advantages"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: insights.marketPosition.competitiveAdvantages.map((advantage, i) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-xs", children: advantage }, i)) })
          ] }),
          (insights.financialHighlights.revenueGrowth || insights.financialHighlights.ebitdaMargin || insights.financialHighlights.notes.length > 0) && /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm font-medium", children: [
              /* @__PURE__ */ jsx(DollarSign, { className: "w-4 h-4 text-muted-foreground" }),
              "Financial Highlights"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 text-sm", children: [
              insights.financialHighlights.revenueGrowth && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Revenue Growth:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: insights.financialHighlights.revenueGrowth })
              ] }),
              insights.financialHighlights.ebitdaMargin && /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "EBITDA Margin:" }),
                /* @__PURE__ */ jsx("span", { className: "ml-2 font-medium", children: insights.financialHighlights.ebitdaMargin })
              ] })
            ] }),
            insights.financialHighlights.notes.length > 0 && /* @__PURE__ */ jsx("ul", { className: "text-sm space-y-1 text-muted-foreground mt-2", children: insights.financialHighlights.notes.map((note, i) => /* @__PURE__ */ jsxs("li", { children: [
              "• ",
              note
            ] }, i)) })
          ] }),
          (insights.dealContext.reasonForSale || insights.dealContext.timeline) && /* @__PURE__ */ jsxs("div", { className: "space-y-2 p-3 bg-muted/30 rounded-lg", children: [
            /* @__PURE__ */ jsx("div", { className: "text-sm font-medium", children: "Deal Context" }),
            insights.dealContext.reasonForSale && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsx("strong", { children: "Reason for Sale:" }),
              " ",
              insights.dealContext.reasonForSale
            ] }),
            insights.dealContext.timeline && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
              /* @__PURE__ */ jsx("strong", { children: "Timeline:" }),
              " ",
              insights.dealContext.timeline
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground text-right", children: [
        "Extracted: ",
        new Date(insights.extractedAt).toLocaleDateString()
      ] })
    ] })
  ] });
};
export {
  CIMInsightsCard as C
};
