import { jsx, jsxs } from "react/jsx-runtime";
import { C as Card, m as cn } from "../main.mjs";
function StatRow({ stats, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose grid gap-4 mb-8", stats.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className), children: stats.map((stat, i) => /* @__PURE__ */ jsxs(Card, { className: "p-5 text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "text-2xl md:text-3xl font-bold text-primary mb-1", children: stat.value }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: stat.label })
  ] }, i)) });
}
export {
  StatRow as S
};
