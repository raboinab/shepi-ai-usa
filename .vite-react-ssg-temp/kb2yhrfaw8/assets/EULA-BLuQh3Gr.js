import { jsxs, jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { L as LegalPageLayout } from "./LegalPageLayout-B8Jk9rBM.js";
import { u as useSEO } from "../main.mjs";
import "react-router-dom";
import "lucide-react";
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
function EULA() {
  const __seoTags = useSEO({
    title: "End User License Agreement — shepi",
    description: "Read shepi's End User License Agreement (EULA) for terms governing software use.",
    canonical: "https://shepi.ai/eula"
  });
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://policies.termageddon.com/api/embed/VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector('script[src="https://policies.termageddon.com/api/embed/VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09.js"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);
  return /* @__PURE__ */ jsxs(LegalPageLayout, { title: "End User License Agreement", children: [
    __seoTags,
    /* @__PURE__ */ jsxs(
      "div",
      {
        id: "VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09",
        className: "policy_embed_div",
        children: [
          "Please wait while the policy is loaded. If it does not load, please",
          " ",
          /* @__PURE__ */ jsx(
            "a",
            {
              rel: "nofollow",
              href: "https://policies.termageddon.com/api/policy/VjFSeU1EWmxOV2g1YVRCTVdrRTlQUT09",
              target: "_blank",
              className: "text-primary hover:underline",
              children: "click here"
            }
          ),
          " ",
          "to view the policy."
        ]
      }
    )
  ] });
}
export {
  EULA as default
};
