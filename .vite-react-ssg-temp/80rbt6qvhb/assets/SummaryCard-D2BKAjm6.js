import { jsx, jsxs } from "react/jsx-runtime";
import { C as Card, f as CardContent, m as cn } from "../main.mjs";
const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
  isCurrency = true
}) => {
  const formatValue = (val) => {
    if (typeof val === "number") {
      if (isCurrency) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(val);
      }
      return new Intl.NumberFormat("en-US").format(val);
    }
    return val;
  };
  return /* @__PURE__ */ jsx(Card, { className: cn("", className), children: /* @__PURE__ */ jsx(CardContent, { className: "p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: title }),
      /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold", children: formatValue(value) }),
      subtitle && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: subtitle }),
      trend && trendValue && /* @__PURE__ */ jsxs(
        "p",
        {
          className: cn(
            "text-xs font-medium",
            trend === "up" && "text-green-600",
            trend === "down" && "text-red-600",
            trend === "neutral" && "text-muted-foreground"
          ),
          children: [
            trend === "up" ? "↑" : trend === "down" ? "↓" : "→",
            " ",
            trendValue
          ]
        }
      )
    ] }),
    Icon && /* @__PURE__ */ jsx("div", { className: "p-2 bg-primary/10 rounded-lg", children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5 text-primary" }) })
  ] }) }) });
};
export {
  SummaryCard as S
};
