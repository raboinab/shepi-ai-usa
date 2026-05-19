import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo } from "react";
function SetupTab({ dealData }) {
  const info = dealData.deal;
  const rows = useMemo(() => {
    const regular = info.periods.filter((p) => !p.isStub);
    const stubs = info.periods.filter((p) => p.isStub);
    const periodLabel = stubs.length > 0 ? `${regular.length} months + ${stubs.length} stub${stubs.length > 1 ? "s" : ""}` : `${regular.length} months`;
    const allDates = info.periods.map((p) => p.date).filter(Boolean);
    const reviewPeriod = allDates.length > 0 ? `${allDates[0].toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${allDates[allDates.length - 1].toLocaleDateString("en-US", { month: "short", year: "numeric" })}` : "None";
    return [
      ["Project Name", info.projectName],
      ["Client / Firm", info.clientName],
      ["Target Company", info.targetCompany],
      ["Industry", info.industry],
      ["Location", dealData.dueDiligenceData?.location || ""],
      ["Transaction Type", info.transactionType ? info.transactionType.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("-") : ""],
      ["Currency", dealData.dueDiligenceData?.currency || "USD $"],
      ["Fiscal Year End", `Month ${info.fiscalYearEnd}`],
      ["Periods", periodLabel],
      ["Period Range", info.periods.length > 0 ? `${info.periods[0].label} – ${info.periods[info.periods.length - 1].label}` : "None"],
      ["Review Period", reviewPeriod]
    ];
  }, [info]);
  return /* @__PURE__ */ jsxs("div", { className: "max-w-2xl", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-4", children: "Due Diligence Information" }),
    /* @__PURE__ */ jsx("table", { className: "w-full text-sm border-collapse", children: /* @__PURE__ */ jsx("tbody", { children: rows.map(([label, value], i) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border", children: [
      /* @__PURE__ */ jsx("td", { className: "py-2 pr-4 font-medium text-muted-foreground w-48", children: label }),
      /* @__PURE__ */ jsx("td", { className: "py-2", children: value || "—" })
    ] }, i)) }) })
  ] });
}
export {
  SetupTab
};
