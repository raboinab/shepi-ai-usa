import { jsx, jsxs } from "react/jsx-runtime";
import { n as cn, C as Card } from "../main.mjs";
function HeroCallout({ children, className }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "not-prose border-l-4 border-primary bg-primary/5 rounded-r-lg px-6 py-5 mb-8",
        className
      ),
      children: /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl font-medium text-foreground leading-relaxed", children })
    }
  );
}
function BenefitGrid({ benefits, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8", className), children: benefits.map((b, i) => /* @__PURE__ */ jsxs(Card, { className: "p-5", children: [
    /* @__PURE__ */ jsx("p", { className: "font-semibold text-foreground mb-1.5", children: b.title }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground leading-relaxed", children: b.description })
  ] }, i)) });
}
export {
  BenefitGrid as B,
  HeroCallout as H
};
