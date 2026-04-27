import { jsx, jsxs } from "react/jsx-runtime";
import { m as cn, C as Card, A as Accordion, j as AccordionItem, k as AccordionTrigger, l as AccordionContent } from "../main.mjs";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
function AccordionFAQ({ items, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose mb-8", className), children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "w-full", children: items.map((item, i) => /* @__PURE__ */ jsxs(AccordionItem, { value: `faq-${i}`, children: [
    /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-left text-foreground", children: item.question }),
    /* @__PURE__ */ jsx(AccordionContent, { className: "text-muted-foreground leading-relaxed", children: item.answer })
  ] }, i)) }) });
}
function RelatedResourceCards({ links, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8", className), children: links.map((link) => /* @__PURE__ */ jsx(Link, { to: link.to, children: /* @__PURE__ */ jsxs(Card, { className: "p-4 h-full hover:border-primary/40 transition-colors group cursor-pointer flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground group-hover:text-primary transition-colors", children: link.label }),
    /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" })
  ] }) }, link.to)) });
}
export {
  AccordionFAQ as A,
  BenefitGrid as B,
  HeroCallout as H,
  RelatedResourceCards as R
};
