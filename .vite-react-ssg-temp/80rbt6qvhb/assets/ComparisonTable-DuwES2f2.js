import { jsx, jsxs } from "react/jsx-runtime";
import { m as cn } from "../main.mjs";
function ComparisonTable({ headers, rows, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose overflow-x-auto mb-8", className), children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm border border-border rounded-lg", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { className: "bg-muted/30", children: headers.map((h, i) => /* @__PURE__ */ jsx("th", { className: "text-left p-3 border-b border-border font-semibold text-foreground", children: h }, i)) }) }),
    /* @__PURE__ */ jsx("tbody", { children: rows.map((row, i) => /* @__PURE__ */ jsxs("tr", { className: cn("border-b border-border last:border-0", i % 2 === 1 && "bg-muted/10"), children: [
      /* @__PURE__ */ jsx("td", { className: "p-3 font-medium text-foreground", children: row[0] }),
      /* @__PURE__ */ jsx("td", { className: "p-3 text-muted-foreground", children: row[1] }),
      /* @__PURE__ */ jsx("td", { className: "p-3 text-foreground", children: row[2] })
    ] }, i)) })
  ] }) });
}
export {
  ComparisonTable as C
};
