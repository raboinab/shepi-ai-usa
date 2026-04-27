import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { S as ShepiLogo } from "../main.mjs";
function LegalPageLayout({ title, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-6 py-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(ShepiLogo, { size: "sm" }) }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/",
          className: "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
            "Back to Home"
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "container mx-auto px-6 py-12", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-foreground mb-8", children: title }),
      /* @__PURE__ */ jsx("div", { className: "prose prose-neutral dark:prose-invert max-w-none", children })
    ] }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-border mt-auto", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-6 py-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShepiLogo, { size: "sm" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "© 2026 SMB EDGE. All rights reserved." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "hover:text-foreground transition-colors", children: "Privacy" }),
        /* @__PURE__ */ jsx(Link, { to: "/terms", className: "hover:text-foreground transition-colors", children: "Terms" }),
        /* @__PURE__ */ jsx(Link, { to: "/cookies", className: "hover:text-foreground transition-colors", children: "Cookies" }),
        /* @__PURE__ */ jsx(Link, { to: "/eula", className: "hover:text-foreground transition-colors", children: "EULA" }),
        /* @__PURE__ */ jsx(Link, { to: "/dpa", className: "hover:text-foreground transition-colors", children: "DPA" }),
        /* @__PURE__ */ jsx(Link, { to: "/subprocessors", className: "hover:text-foreground transition-colors", children: "Subprocessors" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => window.UC_UI?.showSecondLayer(),
            className: "hover:text-foreground transition-colors cursor-pointer",
            children: "Privacy Settings"
          }
        )
      ] })
    ] }) }) })
  ] });
}
export {
  LegalPageLayout as L
};
