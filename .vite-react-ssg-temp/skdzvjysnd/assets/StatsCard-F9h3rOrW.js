import { jsxs, jsx } from "react/jsx-runtime";
import { C as Card, b as CardHeader, d as CardTitle, f as CardContent } from "../main.mjs";
function StatsCard({ title, value, description, icon: Icon }) {
  return /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "flex flex-row items-center justify-between space-y-0 pb-2", children: [
      /* @__PURE__ */ jsx(CardTitle, { className: "text-sm font-medium", children: title }),
      /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4 text-muted-foreground" })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { children: [
      /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: value }),
      description && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: description })
    ] })
  ] });
}
export {
  StatsCard as S
};
