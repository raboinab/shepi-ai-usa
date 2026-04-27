import { jsx, jsxs } from "react/jsx-runtime";
import { D as DemoAuthGate } from "./DemoAuthGate-DDTOHLYa.js";
import { Link } from "react-router-dom";
import { B as Button, i as trackEvent } from "../main.mjs";
import { ArrowLeft, Play } from "lucide-react";
import { useRef, useEffect } from "react";
import "./TermsAcceptanceModal-DCI1QJ_5.js";
import "./dialog-sNpTUd89.js";
import "@radix-ui/react-dialog";
import "./checkbox-3bpvUXl3.js";
import "@radix-ui/react-checkbox";
import "./scroll-area-DQ-itlDB.js";
import "@radix-ui/react-scroll-area";
import "./spinner-DXdBpr08.js";
import "vite-react-ssg";
import "@radix-ui/react-toast";
import "class-variance-authority";
import "clsx";
import "tailwind-merge";
import "next-themes";
import "sonner";
import "@radix-ui/react-tooltip";
import "@tanstack/react-query";
import "@radix-ui/react-slot";
import "@supabase/supabase-js";
import "@radix-ui/react-accordion";
const VIDEO_TITLE = "Shepi Product Demo";
const LOOM_VIDEO_ID = "f378161442644660bd880b0c2b9e9c9f";
function DemoVideo() {
  const milestonesFired = useRef(/* @__PURE__ */ new Set());
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const lastPercentRef = useRef(0);
  useEffect(() => {
    const onMessage = (e) => {
      if (typeof e.origin !== "string" || !e.origin.includes("loom.com")) return;
      let data = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }
      if (!data || typeof data !== "object") return;
      const evt = data.event || data.type;
      const currentTime = Number(data.currentTime ?? data.data?.currentTime ?? 0);
      const duration = Number(data.duration ?? data.data?.duration ?? 0);
      if (evt === "play" && !startedRef.current) {
        startedRef.current = true;
        trackEvent("video_start", {
          video_title: VIDEO_TITLE,
          video_provider: "loom",
          video_duration: duration || void 0
        });
      }
      if ((evt === "timeupdate" || evt === "playbackProgress") && duration > 0) {
        const pct = Math.floor(currentTime / duration * 100);
        lastPercentRef.current = pct;
        for (const m of [25, 50, 75]) {
          if (pct >= m && !milestonesFired.current.has(m)) {
            milestonesFired.current.add(m);
            trackEvent("video_progress", {
              video_title: VIDEO_TITLE,
              video_provider: "loom",
              percent: m,
              video_duration: duration
            });
          }
        }
      }
      if ((evt === "ended" || evt === "complete") && !completedRef.current) {
        completedRef.current = true;
        trackEvent("video_complete", {
          video_title: VIDEO_TITLE,
          video_provider: "loom",
          video_duration: duration || void 0
        });
      }
    };
    window.addEventListener("message", onMessage);
    const onUnload = () => {
      if (startedRef.current && !completedRef.current) {
        trackEvent("video_abandoned", {
          video_title: VIDEO_TITLE,
          video_provider: "loom",
          last_percent: lastPercentRef.current
        });
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("beforeunload", onUnload);
      onUnload();
    };
  }, []);
  return /* @__PURE__ */ jsx(DemoAuthGate, { page: "demo_video", children: /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", children: /* @__PURE__ */ jsxs("div", { className: "container flex h-16 items-center justify-between px-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        /* @__PURE__ */ jsx("span", { className: "font-semibold text-lg", children: "Shepi" })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/dashboard/demo", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [
        /* @__PURE__ */ jsx(Play, { className: "w-4 h-4" }),
        "Try Live Demo"
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "bg-secondary/10 border-b border-secondary/20 py-2 px-4 text-center", children: /* @__PURE__ */ jsx("p", { className: "text-sm text-secondary font-medium", children: "🎥 Product Walkthrough — See how Shepi automates Quality of Earnings analysis" }) }),
    /* @__PURE__ */ jsxs("main", { className: "container max-w-5xl mx-auto px-4 py-12", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold text-foreground mb-3", children: "Watch Shepi in Action" }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-lg max-w-2xl mx-auto", children: "See how Shepi transforms raw financial data into a complete Quality of Earnings report in minutes, not weeks." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "relative w-full rounded-xl overflow-hidden border border-border/50 shadow-2xl", style: { paddingBottom: "56.25%" }, children: /* @__PURE__ */ jsx(
        "iframe",
        {
          src: `https://www.loom.com/embed/${LOOM_VIDEO_ID}?sid=auto`,
          frameBorder: "0",
          allowFullScreen: true,
          className: "absolute inset-0 w-full h-full",
          title: VIDEO_TITLE
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12 text-center space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-foreground", children: "Ready to try it yourself?" }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
          /* @__PURE__ */ jsx(Link, { to: "/dashboard/demo", children: /* @__PURE__ */ jsxs(Button, { size: "lg", className: "gap-2 px-8", children: [
            /* @__PURE__ */ jsx(Play, { className: "w-5 h-5" }),
            "Try the Live Demo"
          ] }) }),
          /* @__PURE__ */ jsx(Link, { to: "/pricing", children: /* @__PURE__ */ jsx(Button, { size: "lg", variant: "outline", className: "px-8", children: "View Pricing" }) })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  DemoVideo as default
};
