import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import * as React from "react";
import { useState, useEffect } from "react";
import { ChevronRight, X, Menu, ArrowRight } from "lucide-react";
import { m as cn, u as useSEO, S as ShepiLogo, B as Button } from "../main.mjs";
import { Slot } from "@radix-ui/react-slot";
const Breadcrumb = React.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsx("nav", { ref, "aria-label": "breadcrumb", ...props }));
Breadcrumb.displayName = "Breadcrumb";
const BreadcrumbList = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "ol",
    {
      ref,
      className: cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className
      ),
      ...props
    }
  )
);
BreadcrumbList.displayName = "BreadcrumbList";
const BreadcrumbItem = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx("li", { ref, className: cn("inline-flex items-center gap-1.5", className), ...props })
);
BreadcrumbItem.displayName = "BreadcrumbItem";
const BreadcrumbLink = React.forwardRef(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsx(Comp, { ref, className: cn("transition-colors hover:text-foreground", className), ...props });
});
BreadcrumbLink.displayName = "BreadcrumbLink";
const BreadcrumbPage = React.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsx(
    "span",
    {
      ref,
      role: "link",
      "aria-disabled": "true",
      "aria-current": "page",
      className: cn("font-normal text-foreground", className),
      ...props
    }
  )
);
BreadcrumbPage.displayName = "BreadcrumbPage";
const BreadcrumbSeparator = ({ children, className, ...props }) => /* @__PURE__ */ jsx("li", { role: "presentation", "aria-hidden": "true", className: cn("[&>svg]:h-3.5 [&>svg]:w-3.5", className), ...props, children: children ?? /* @__PURE__ */ jsx(ChevronRight, {}) });
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
function ContentPageLayout({
  children,
  title,
  seoTitle,
  seoDescription,
  canonical,
  breadcrumbs,
  toc,
  jsonLd,
  publishedDate,
  modifiedDate,
  heroAccent
}) {
  const __seoTags = useSEO({ title: seoTitle, description: seoDescription, canonical, ogImage: "/og-image.png" });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  useEffect(() => {
    if (!jsonLd) return;
    let el = document.getElementById("content-jsonld");
    if (!el) {
      el = document.createElement("script");
      el.id = "content-jsonld";
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(jsonLd);
    return () => {
      const s = document.getElementById("content-jsonld");
      if (s) s.remove();
    };
  }, [jsonLd]);
  useEffect(() => {
    if (!toc?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc]);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    __seoTags,
    /* @__PURE__ */ jsxs("header", { className: "border-b border-border bg-card sticky top-0 z-40", children: [
      /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", children: /* @__PURE__ */ jsx(ShepiLogo, { variant: "dark", size: "md" }) }),
        /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-8", children: [
          /* @__PURE__ */ jsx(Link, { to: "/", className: "text-muted-foreground hover:text-foreground transition-colors", children: "Home" }),
          /* @__PURE__ */ jsx(Link, { to: "/resources", className: "text-muted-foreground hover:text-foreground transition-colors", children: "Resources" }),
          /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "text-muted-foreground hover:text-foreground transition-colors", children: "Pricing" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden md:flex items-center gap-3", children: [
          /* @__PURE__ */ jsx(Link, { to: "/auth", children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Log In" }) }),
          /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: /* @__PURE__ */ jsx(Button, { children: "Get Started" }) })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "md:hidden p-2", onClick: () => setMobileMenuOpen(!mobileMenuOpen), "aria-label": "Toggle menu", children: mobileMenuOpen ? /* @__PURE__ */ jsx(X, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Menu, { className: "w-6 h-6" }) })
      ] }),
      mobileMenuOpen && /* @__PURE__ */ jsxs("div", { className: "md:hidden border-t border-border px-4 py-4 flex flex-col gap-3 bg-card", children: [
        /* @__PURE__ */ jsx(Link, { to: "/", className: "text-muted-foreground hover:text-foreground py-2", onClick: () => setMobileMenuOpen(false), children: "Home" }),
        /* @__PURE__ */ jsx(Link, { to: "/resources", className: "text-muted-foreground hover:text-foreground py-2", onClick: () => setMobileMenuOpen(false), children: "Resources" }),
        /* @__PURE__ */ jsx(Link, { to: "/pricing", className: "text-muted-foreground hover:text-foreground py-2", onClick: () => setMobileMenuOpen(false), children: "Pricing" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 pt-3 border-t border-border", children: [
          /* @__PURE__ */ jsx(Link, { to: "/auth", className: "flex-1", children: /* @__PURE__ */ jsx(Button, { variant: "outline", className: "w-full", children: "Log In" }) }),
          /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", className: "flex-1", children: /* @__PURE__ */ jsx(Button, { className: "w-full", children: "Get Started" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-4", children: /* @__PURE__ */ jsx(Breadcrumb, { children: /* @__PURE__ */ jsxs(BreadcrumbList, { children: [
      /* @__PURE__ */ jsx(BreadcrumbItem, { children: /* @__PURE__ */ jsx(BreadcrumbLink, { asChild: true, children: /* @__PURE__ */ jsx(Link, { to: "/", children: "Home" }) }) }),
      breadcrumbs.map((b, i) => /* @__PURE__ */ jsxs("span", { className: "contents", children: [
        /* @__PURE__ */ jsx(BreadcrumbSeparator, {}),
        /* @__PURE__ */ jsx(BreadcrumbItem, { children: b.href ? /* @__PURE__ */ jsx(BreadcrumbLink, { asChild: true, children: /* @__PURE__ */ jsx(Link, { to: b.href, children: b.label }) }) : /* @__PURE__ */ jsx(BreadcrumbPage, { children: b.label }) })
      ] }, i))
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 pb-16", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-12", children: [
      toc && toc.length > 0 && /* @__PURE__ */ jsx("aside", { className: "hidden lg:block w-64 shrink-0", children: /* @__PURE__ */ jsxs("nav", { className: "sticky top-24 space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3", children: "On this page" }),
        toc.map(({ id, label }) => /* @__PURE__ */ jsx(
          "a",
          {
            href: `#${id}`,
            className: cn(
              "block text-sm py-1.5 px-3 rounded-md transition-colors",
              activeSection === id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
            ),
            children: label
          },
          id
        ))
      ] }) }),
      /* @__PURE__ */ jsxs("article", { className: "flex-1 min-w-0 max-w-3xl", children: [
        /* @__PURE__ */ jsxs("header", { className: "mb-10", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight mb-4", children: title }),
          heroAccent && /* @__PURE__ */ jsx("div", { className: "h-1 w-16 rounded-full bg-primary mb-4" }),
          (publishedDate || modifiedDate) && /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: modifiedDate ? `Updated ${modifiedDate}` : `Published ${publishedDate}` })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "prose prose-neutral dark:prose-invert max-w-none\n              prose-headings:font-serif prose-headings:text-foreground\n              prose-p:text-foreground/90 prose-li:text-foreground/90\n              prose-a:text-primary prose-a:no-underline hover:prose-a:underline\n              prose-strong:text-foreground\n            ", children })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "bg-primary py-16 px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-serif font-bold text-primary-foreground mb-4", children: "Ready to Accelerate Your QoE Analysis?" }),
      /* @__PURE__ */ jsx("p", { className: "text-primary-foreground/80 mb-8 text-lg", children: "From raw financials to lender-ready conclusions in hours, not weeks." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
        /* @__PURE__ */ jsx(Link, { to: "/auth?mode=signup", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "bg-secondary text-secondary-foreground hover:bg-secondary/90 gap-2", children: [
          "Get Started Free ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
        ] }) }),
        /* @__PURE__ */ jsx(Link, { to: "/dashboard/demo", children: /* @__PURE__ */ jsx(Button, { size: "lg", variant: "outline", className: "border-secondary text-secondary bg-transparent hover:bg-secondary/10", children: "Try Live Demo" }) }),
        /* @__PURE__ */ jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsx(Button, { size: "lg", variant: "ghost", className: "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5", children: "See Pricing" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("footer", { className: "border-t border-border bg-card", children: /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-8", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShepiLogo, { size: "sm" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "© 2026 SMB EDGE. All rights reserved." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Link, { to: "/resources", className: "hover:text-foreground transition-colors", children: "Resources" }),
        /* @__PURE__ */ jsx(Link, { to: "/privacy", className: "hover:text-foreground transition-colors", children: "Privacy" }),
        /* @__PURE__ */ jsx(Link, { to: "/terms", className: "hover:text-foreground transition-colors", children: "Terms" }),
        /* @__PURE__ */ jsx(Link, { to: "/cookies", className: "hover:text-foreground transition-colors", children: "Cookies" }),
        /* @__PURE__ */ jsx(Link, { to: "/eula", className: "hover:text-foreground transition-colors", children: "EULA" })
      ] })
    ] }) }) })
  ] });
}
export {
  ContentPageLayout as C
};
