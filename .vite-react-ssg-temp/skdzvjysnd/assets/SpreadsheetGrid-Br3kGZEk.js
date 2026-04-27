import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useRef, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { au as formatCell } from "./sanitizeWizardData-nrsUY-BP.js";
import { m as cn } from "../main.mjs";
const ROW_HEIGHT = 24;
function SpreadsheetGrid({ data, onCellChange, className }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const parentRef = useRef(null);
  const frozenCount = data.frozenColumns || 0;
  const frozenCols = data.columns.slice(0, frozenCount);
  const scrollCols = data.columns.slice(frozenCount);
  const rowVirtualizer = useVirtualizer({
    count: data.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15
  });
  const handleDoubleClick = useCallback((row, col) => {
    if (!row.editable || !onCellChange) return;
    const val = row.cells[col.key];
    setEditingCell({ rowId: row.id, colKey: col.key });
    setEditValue(val != null ? String(val) : "");
  }, [onCellChange]);
  const commitEdit = useCallback(() => {
    if (editingCell && onCellChange) {
      onCellChange(editingCell.rowId, editingCell.colKey, editValue);
    }
    setEditingCell(null);
    setEditValue("");
  }, [editingCell, editValue, onCellChange]);
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  }, [commitEdit]);
  const getRowClasses = (type) => {
    switch (type) {
      case "header":
        return "bg-[hsl(var(--excel-header-bg,220_14%_96%))] font-semibold text-xs uppercase tracking-wide";
      case "section-header":
        return "bg-[hsl(var(--excel-header-bg,220_14%_96%))] font-semibold text-sm";
      case "subtotal":
        return "font-semibold border-t border-[hsl(var(--excel-grid,220_13%_91%))]";
      case "total":
        return "font-bold border-t-2 border-b-2 border-[hsl(var(--excel-grid,220_13%_91%))]";
      case "check":
        return "text-xs italic";
      case "spacer":
        return "h-4";
      default:
        return "";
    }
  };
  const renderCell = (row, col) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
    const value = row.cells[col.key];
    if (isEditing) {
      return /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          className: "w-full h-full px-1 bg-[hsl(50_100%_90%)] border-2 border-primary outline-none text-right font-mono text-[11px]",
          value: editValue,
          onChange: (e) => setEditValue(e.target.value),
          onBlur: commitEdit,
          onKeyDown: handleKeyDown,
          autoFocus: true
        }
      );
    }
    const formatted = formatCell(value, row.format ?? col.format);
    const isCheckRow = row.type === "check";
    return /* @__PURE__ */ jsx("span", { className: cn(
      "truncate",
      row.editable && col.format !== "text" && "cursor-cell",
      isCheckRow && row.checkPassed === true && "text-[hsl(var(--check-pass,142_76%_36%))]",
      isCheckRow && row.checkPassed === false && "text-[hsl(var(--check-fail,0_84%_60%))]",
      value !== null && typeof value === "number" && value < 0 && "text-[hsl(var(--check-fail,0_84%_60%))]"
    ), children: formatted });
  };
  if (data.rows.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: cn("flex items-center justify-center h-64 text-muted-foreground", className), children: "No data available" });
  }
  const frozenLeftOffsets = [];
  let cumulativeLeft = 0;
  for (const col of frozenCols) {
    frozenLeftOffsets.push(cumulativeLeft);
    cumulativeLeft += col.width || 120;
  }
  const totalHeight = rowVirtualizer.getTotalSize();
  const virtualRows = rowVirtualizer.getVirtualItems();
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: parentRef,
      className: cn("financial-grid overflow-auto border border-[hsl(var(--excel-grid,220_13%_91%))] rounded-sm", className),
      style: { maxHeight: "80vh" },
      children: /* @__PURE__ */ jsxs("table", { className: "border-collapse text-[11px] w-max", children: [
        /* @__PURE__ */ jsx("thead", { className: "sticky top-0 z-30", children: /* @__PURE__ */ jsxs("tr", { className: "bg-[hsl(var(--excel-header-bg,220_14%_96%))]", children: [
          frozenCols.map((col, i) => /* @__PURE__ */ jsx(
            "th",
            {
              className: "px-2 py-1 text-left font-semibold border-b border-[hsl(var(--excel-grid,220_13%_91%))] whitespace-nowrap sticky bg-[hsl(var(--excel-header-bg,220_14%_96%))] z-30",
              style: { width: col.width || 120, minWidth: col.width || 120, left: frozenLeftOffsets[i] },
              children: col.label
            },
            col.key
          )),
          scrollCols.map((col) => /* @__PURE__ */ jsx(
            "th",
            {
              className: "px-2 py-1 text-right font-semibold border-b border-[hsl(var(--excel-grid,220_13%_91%))] whitespace-nowrap bg-[hsl(var(--excel-header-bg,220_14%_96%))]",
              style: { minWidth: col.width || 90 },
              children: col.label
            },
            col.key
          ))
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { style: { height: totalHeight, position: "relative" }, children: [
          virtualRows.length > 0 && virtualRows[0].start > 0 && /* @__PURE__ */ jsx("tr", { style: { height: virtualRows[0].start }, "aria-hidden": true, children: /* @__PURE__ */ jsx("td", { colSpan: frozenCols.length + scrollCols.length }) }),
          virtualRows.map((virtualRow) => {
            const row = data.rows[virtualRow.index];
            return /* @__PURE__ */ jsx("tr", { className: getRowClasses(row.type), children: row.type === "spacer" ? /* @__PURE__ */ jsx("td", { colSpan: frozenCols.length + scrollCols.length, className: "h-4" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              frozenCols.map((col, i) => /* @__PURE__ */ jsx(
                "td",
                {
                  className: cn(
                    "px-2 py-0.5 border-b border-[hsl(var(--excel-grid,220_13%_91%))] whitespace-nowrap sticky bg-card z-10",
                    row.type === "section-header" && "bg-[hsl(var(--excel-header-bg,220_14%_96%))]",
                    row.type === "header" && "bg-[hsl(var(--excel-header-bg,220_14%_96%))]",
                    (row.type === "total" || row.type === "subtotal") && "bg-card"
                  ),
                  style: {
                    left: frozenLeftOffsets[i],
                    paddingLeft: col.key === frozenCols[0]?.key && row.indent ? `${8 + (row.indent || 0) * 12}px` : void 0
                  },
                  children: row.type === "section-header" && col.key === frozenCols[0]?.key ? row.label || row.cells[col.key] : renderCell(row, col)
                },
                col.key
              )),
              scrollCols.map((col) => /* @__PURE__ */ jsx(
                "td",
                {
                  className: cn(
                    "px-2 py-0.5 border-b border-[hsl(var(--excel-grid,220_13%_91%))] text-right whitespace-nowrap font-mono",
                    row.editable && "cell-editable"
                  ),
                  onDoubleClick: () => handleDoubleClick(row, col),
                  children: renderCell(row, col)
                },
                col.key
              ))
            ] }) }, row.id);
          }),
          virtualRows.length > 0 && /* @__PURE__ */ jsx("tr", { style: { height: totalHeight - virtualRows[virtualRows.length - 1].end }, "aria-hidden": true, children: /* @__PURE__ */ jsx("td", { colSpan: frozenCols.length + scrollCols.length }) })
        ] })
      ] })
    }
  );
}
export {
  SpreadsheetGrid as S
};
