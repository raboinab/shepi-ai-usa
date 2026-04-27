import { jsx, jsxs } from "react/jsx-runtime";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { T as TooltipProvider, n as Tooltip, o as TooltipTrigger, p as TooltipContent } from "../main.mjs";
import { format } from "date-fns";
function QuickBooksSyncBadge({ lastSyncDate, className, size = "default" }) {
  const formattedDate = lastSyncDate ? format(new Date(lastSyncDate), "MMM d, yyyy 'at' h:mm a") : null;
  return /* @__PURE__ */ jsx(TooltipProvider, { children: /* @__PURE__ */ jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
      Badge,
      {
        variant: "secondary",
        className: `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 ${size === "sm" ? "text-[10px] px-1.5 py-0" : ""} ${className || ""}`,
        children: "QB"
      }
    ) }),
    /* @__PURE__ */ jsx(TooltipContent, { children: /* @__PURE__ */ jsx("p", { className: "text-sm", children: formattedDate ? `Synced from QuickBooks on ${formattedDate}` : "Synced from QuickBooks" }) })
  ] }) });
}
export {
  QuickBooksSyncBadge as Q
};
