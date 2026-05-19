import { jsx, jsxs } from "react/jsx-runtime";
import { A as Accordion, k as AccordionItem, l as AccordionTrigger, m as AccordionContent, n as cn } from "../main.mjs";
function AccordionFAQ({ items, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose mb-8", className), children: /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, className: "w-full", children: items.map((item, i) => /* @__PURE__ */ jsxs(AccordionItem, { value: `faq-${i}`, children: [
    /* @__PURE__ */ jsx(AccordionTrigger, { className: "text-left text-foreground", children: item.question }),
    /* @__PURE__ */ jsx(AccordionContent, { className: "text-muted-foreground leading-relaxed", children: item.answer })
  ] }, i)) }) });
}
export {
  AccordionFAQ as A
};
