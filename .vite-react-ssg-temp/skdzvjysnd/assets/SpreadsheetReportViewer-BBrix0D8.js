import { jsx, jsxs } from "react/jsx-runtime";
import { C as Card, f as CardContent, b as CardHeader, d as CardTitle } from "../main.mjs";
import { T as Table, d as TableBody, b as TableRow, c as TableHead, e as TableCell } from "./table-CVoj8f5R.js";
import { B as Badge } from "./badge-BbLwm7hH.js";
import { FileSpreadsheet, Clock } from "lucide-react";
import { S as ScrollArea, a as ScrollBar } from "./scroll-area-DQ-itlDB.js";
import { formatDistanceToNow } from "date-fns";
const TEXT_COLUMN_PATTERNS = /acct|account|line item|sub-account|description|name|category|label/i;
const isTextColumn = (headerValue) => {
  if (!headerValue) return false;
  return TEXT_COLUMN_PATTERNS.test(headerValue);
};
const formatCell = (value, isText) => {
  if (!value || value.trim() === "") return "";
  if (isText) return value;
  if (value.trim().endsWith("%") || value.trim() === "N/M") return value;
  const cleanValue = value.toString().replace(/[$,()]/g, "").trim();
  const isNegative = value.includes("(") || cleanValue.startsWith("-");
  const num = parseFloat(cleanValue.replace("-", ""));
  if (!isNaN(num) && cleanValue !== "" && !/^[a-zA-Z]/.test(cleanValue)) {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(num));
    return isNegative ? `(${formatted.replace("$", "")})` : formatted;
  }
  return value;
};
const getRowType = (row, rowIndex, headerRowIndex) => {
  const firstCell = (row[0] || "").toLowerCase().trim();
  const allEmpty = row.every((cell) => !cell || cell.trim() === "");
  if (allEmpty) return "empty";
  if (rowIndex === headerRowIndex) return "header";
  if (firstCell.includes("total") || firstCell.includes("net income") || firstCell.includes("gross profit") || firstCell.includes("ebitda") || firstCell.includes("total liabilities & equity") || firstCell.includes("total l&e")) {
    return firstCell.startsWith("total") ? "total" : "subtotal";
  }
  const nonEmptyCells = row.filter((cell) => cell && cell.trim() !== "").length;
  if (nonEmptyCells === 1 && firstCell !== "") {
    if (firstCell.match(/^(revenue|sales|income|expenses|cost|assets|liabilities|equity|operating|other)/i)) {
      return "section";
    }
  }
  return "data";
};
const getRowStyles = (rowType) => {
  switch (rowType) {
    case "header":
      return "bg-muted font-semibold border-b-2 border-border";
    case "section":
      return "bg-muted/50 font-medium";
    case "subtotal":
      return "font-semibold border-t border-border";
    case "total":
      return "font-bold bg-primary/10 border-t-2 border-border";
    case "empty":
      return "h-4";
    default:
      return "";
  }
};
const getCellStyles = (rowType, colIndex) => {
  const base = colIndex === 0 ? "text-left" : "text-right";
  if (rowType === "header") {
    return `${base} py-3 px-4`;
  }
  if (rowType === "section") {
    return `${base} py-2 px-4`;
  }
  if (rowType === "total" || rowType === "subtotal") {
    return `${base} py-2 px-4`;
  }
  return `${base} py-1.5 px-4 ${colIndex === 0 ? "pl-6" : ""}`;
};
const SpreadsheetReportViewer = ({
  rawData,
  title,
  syncedAt,
  skipEmptyRows = false,
  headerRowIndex = 0
}) => {
  if (!rawData || rawData.length === 0) {
    return /* @__PURE__ */ jsx(Card, { children: /* @__PURE__ */ jsxs(CardContent, { className: "py-12 text-center", children: [
      /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-12 h-12 mx-auto mb-4 text-muted-foreground/50" }),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground", children: "No report data available." }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Sync from the spreadsheet to populate this report." })
    ] }) });
  }
  const columnCount = Math.max(...rawData.map((row) => row.length));
  const headerRow = rawData[headerRowIndex] || [];
  const textColumnFlags = Array.from({ length: columnCount }, (_, i) => isTextColumn(headerRow[i]));
  const displayRows = skipEmptyRows ? rawData.filter((row) => row.some((cell) => cell && cell.trim() !== "")) : rawData;
  return /* @__PURE__ */ jsxs(Card, { children: [
    (title || syncedAt) && /* @__PURE__ */ jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      title && /* @__PURE__ */ jsx(CardTitle, { children: title }),
      syncedAt && /* @__PURE__ */ jsxs(Badge, { variant: "outline", className: "gap-1 font-normal", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
        "Synced ",
        formatDistanceToNow(new Date(syncedAt), { addSuffix: true })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(CardContent, { className: title || syncedAt ? "" : "pt-4", children: /* @__PURE__ */ jsxs(ScrollArea, { className: "w-full", children: [
      /* @__PURE__ */ jsx("div", { className: "min-w-max", children: /* @__PURE__ */ jsx(Table, { children: /* @__PURE__ */ jsx(TableBody, { children: displayRows.map((row, rowIndex) => {
        const rowType = getRowType(row, rowIndex, headerRowIndex);
        if (rowType === "empty" && skipEmptyRows) return null;
        return /* @__PURE__ */ jsx(TableRow, { className: getRowStyles(rowType), children: Array.from({ length: columnCount }).map((_, colIndex) => {
          const cellValue = row[colIndex];
          const formattedValue = rowType === "header" ? cellValue : formatCell(cellValue, textColumnFlags[colIndex]);
          const CellComponent = rowType === "header" ? TableHead : TableCell;
          return /* @__PURE__ */ jsx(
            CellComponent,
            {
              className: getCellStyles(rowType, colIndex),
              children: formattedValue
            },
            colIndex
          );
        }) }, rowIndex);
      }) }) }) }),
      /* @__PURE__ */ jsx(ScrollBar, { orientation: "horizontal" })
    ] }) })
  ] });
};
export {
  SpreadsheetReportViewer as S
};
