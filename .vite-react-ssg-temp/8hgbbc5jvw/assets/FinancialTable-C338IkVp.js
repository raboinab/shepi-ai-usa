import { jsxs, jsx } from "react/jsx-runtime";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-CVoj8f5R.js";
import { I as Input } from "./input-CSM87NBF.js";
import { B as Button } from "../main.mjs";
import { Trash2, Plus } from "lucide-react";
const FinancialTable = ({
  columns,
  data,
  onDataChange,
  allowAddRow = true,
  allowDeleteRow = true,
  newRowTemplate = {}
}) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };
  const handleCellChange = (rowIndex, key, value) => {
    const newData = [...data];
    const col = columns.find((c) => c.key === key);
    newData[rowIndex] = {
      ...newData[rowIndex],
      [key]: col?.type === "number" || col?.type === "currency" ? parseFloat(value) || 0 : value
    };
    onDataChange(newData);
  };
  const addRow = () => {
    onDataChange([...data, { id: Date.now(), ...newRowTemplate }]);
  };
  const deleteRow = (index) => {
    onDataChange(data.filter((_, i) => i !== index));
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsx("div", { className: "border rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxs(Table, { children: [
      /* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { className: "bg-muted/50", children: [
        columns.map((col) => /* @__PURE__ */ jsx(TableHead, { style: { width: col.width }, children: col.label }, col.key)),
        allowDeleteRow && /* @__PURE__ */ jsx(TableHead, { className: "w-12" })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: data.map((row, rowIndex) => /* @__PURE__ */ jsxs(TableRow, { children: [
        columns.map((col) => /* @__PURE__ */ jsx(TableCell, { className: "p-1", children: col.editable !== false ? /* @__PURE__ */ jsx(
          Input,
          {
            type: col.type === "number" || col.type === "currency" ? "number" : "text",
            value: row[col.key] || "",
            onChange: (e) => handleCellChange(rowIndex, col.key, e.target.value),
            className: "h-8 text-sm"
          }
        ) : col.type === "currency" ? /* @__PURE__ */ jsx("span", { className: "px-3 font-medium", children: formatCurrency(row[col.key]) }) : /* @__PURE__ */ jsx("span", { className: "px-3", children: row[col.key] }) }, col.key)),
        allowDeleteRow && /* @__PURE__ */ jsx(TableCell, { className: "p-1", children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => deleteRow(rowIndex),
            className: "h-8 w-8 p-0 text-muted-foreground hover:text-destructive",
            children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
          }
        ) })
      ] }, row.id || rowIndex)) })
    ] }) }),
    allowAddRow && /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: addRow, className: "gap-2", children: [
      /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
      " Add Row"
    ] })
  ] });
};
export {
  FinancialTable as F
};
