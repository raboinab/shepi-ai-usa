import { jsx, jsxs } from "react/jsx-runtime";
import { m as cn } from "../main.mjs";
function StepList({ steps, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose space-y-4 mb-8", className), children: steps.map((step, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-start", children: [
    /* @__PURE__ */ jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mt-0.5", children: i + 1 }),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 border border-border rounded-lg p-4 bg-card", children: [
      /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground mb-1", children: step.title }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: step.description })
    ] })
  ] }, i)) });
}
export {
  StepList as S
};
