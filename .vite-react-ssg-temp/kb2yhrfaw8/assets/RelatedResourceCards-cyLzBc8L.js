import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { C as Card, n as cn } from "../main.mjs";
function RelatedResourceCards({ links, className }) {
  return /* @__PURE__ */ jsx("div", { className: cn("not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8", className), children: links.map((link) => /* @__PURE__ */ jsx(Link, { to: link.to, children: /* @__PURE__ */ jsxs(Card, { className: "p-4 h-full hover:border-primary/40 transition-colors group cursor-pointer flex items-center justify-between gap-3", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-foreground group-hover:text-primary transition-colors", children: link.label }),
    /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" })
  ] }) }, link.to)) });
}
export {
  RelatedResourceCards as R
};
