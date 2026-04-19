/**
 * SpreadsheetGrid - Core grid component for the workbook engine.
 * Virtualized table with sticky frozen columns for perfect row alignment.
 */
import { useState, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { GridData, GridRow, GridColumn, RowType } from "@/lib/workbook-types";
import { formatCell } from "@/lib/workbook-format";
import { cn } from "@/lib/utils";

interface SpreadsheetGridProps {
  data: GridData;
  onCellChange?: (rowId: string, colKey: string, value: string) => void;
  className?: string;
}

const ROW_HEIGHT = 24;

export function SpreadsheetGrid({ data, onCellChange, className }: SpreadsheetGridProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const frozenCount = data.frozenColumns || 0;
  const frozenCols = data.columns.slice(0, frozenCount);
  const scrollCols = data.columns.slice(frozenCount);

  const rowVirtualizer = useVirtualizer({
    count: data.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  const handleDoubleClick = useCallback((row: GridRow, col: GridColumn) => {
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") { setEditingCell(null); setEditValue(""); }
  }, [commitEdit]);

  const getRowClasses = (type: RowType): string => {
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

  const renderCell = (row: GridRow, col: GridColumn) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
    const value = row.cells[col.key];

    if (isEditing) {
      return (
        <input
          type="text"
          className="w-full h-full px-1 bg-[hsl(50_100%_90%)] border-2 border-primary outline-none text-right font-mono text-[11px]"
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      );
    }

    const formatted = formatCell(value, row.format ?? col.format);
    const isCheckRow = row.type === "check";

    return (
      <span className={cn(
        "truncate",
        row.editable && col.format !== "text" && "cursor-cell",
        isCheckRow && row.checkPassed === true && "text-[hsl(var(--check-pass,142_76%_36%))]",
        isCheckRow && row.checkPassed === false && "text-[hsl(var(--check-fail,0_84%_60%))]",
        value !== null && typeof value === "number" && value < 0 && "text-[hsl(var(--check-fail,0_84%_60%))]",
      )}>
        {formatted}
      </span>
    );
  };

  if (data.rows.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground", className)}>
        No data available
      </div>
    );
  }

  // Calculate left offsets for sticky frozen columns
  const frozenLeftOffsets: number[] = [];
  let cumulativeLeft = 0;
  for (const col of frozenCols) {
    frozenLeftOffsets.push(cumulativeLeft);
    cumulativeLeft += (col.width || 120);
  }

  const totalHeight = rowVirtualizer.getTotalSize();
  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={cn("financial-grid overflow-auto border border-[hsl(var(--excel-grid,220_13%_91%))] rounded-sm", className)}
      style={{ maxHeight: "80vh" }}
    >
      <table className="border-collapse text-[11px] w-max">
        <thead className="sticky top-0 z-30">
          <tr className="bg-[hsl(var(--excel-header-bg,220_14%_96%))]">
            {frozenCols.map((col, i) => (
              <th
                key={col.key}
                className="px-2 py-1 text-left font-semibold border-b border-[hsl(var(--excel-grid,220_13%_91%))] whitespace-nowrap sticky bg-[hsl(var(--excel-header-bg,220_14%_96%))] z-30"
                style={{ width: col.width || 120, minWidth: col.width || 120, left: frozenLeftOffsets[i] }}
              >
                {col.label}
              </th>
            ))}
            {scrollCols.map(col => (
              <th
                key={col.key}
                className="px-2 py-1 text-right font-semibold border-b border-[hsl(var(--excel-grid,220_13%_91%))] whitespace-nowrap bg-[hsl(var(--excel-header-bg,220_14%_96%))]"
                style={{ minWidth: col.width || 90 }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ height: totalHeight, position: "relative" }}>
          {/* Top spacer */}
          {virtualRows.length > 0 && virtualRows[0].start > 0 && (
            <tr style={{ height: virtualRows[0].start }} aria-hidden>
              <td colSpan={frozenCols.length + scrollCols.length} />
            </tr>
          )}
          {virtualRows.map(virtualRow => {
            const row = data.rows[virtualRow.index];
            return (
              <tr key={row.id} className={getRowClasses(row.type)}>
                {row.type === "spacer" ? (
                  <td colSpan={frozenCols.length + scrollCols.length} className="h-4" />
                ) : (
                  <>
                    {frozenCols.map((col, i) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-2 py-0.5 border-b border-[hsl(var(--excel-grid,220_13%_91%))] whitespace-nowrap sticky bg-card z-10",
                          row.type === "section-header" && "bg-[hsl(var(--excel-header-bg,220_14%_96%))]",
                          row.type === "header" && "bg-[hsl(var(--excel-header-bg,220_14%_96%))]",
                          (row.type === "total" || row.type === "subtotal") && "bg-card",
                        )}
                        style={{
                          left: frozenLeftOffsets[i],
                          paddingLeft: col.key === frozenCols[0]?.key && row.indent
                            ? `${8 + (row.indent || 0) * 12}px`
                            : undefined,
                        }}
                      >
                        {row.type === "section-header" && col.key === frozenCols[0]?.key
                          ? row.label || row.cells[col.key]
                          : renderCell(row, col)
                        }
                      </td>
                    ))}
                    {scrollCols.map(col => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-2 py-0.5 border-b border-[hsl(var(--excel-grid,220_13%_91%))] text-right whitespace-nowrap font-mono",
                          row.editable && "cell-editable",
                        )}
                        onDoubleClick={() => handleDoubleClick(row, col)}
                      >
                        {renderCell(row, col)}
                      </td>
                    ))}
                  </>
                )}
              </tr>
            );
          })}
          {/* Bottom spacer */}
          {virtualRows.length > 0 && (
            <tr style={{ height: totalHeight - (virtualRows[virtualRows.length - 1].end) }} aria-hidden>
              <td colSpan={frozenCols.length + scrollCols.length} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
