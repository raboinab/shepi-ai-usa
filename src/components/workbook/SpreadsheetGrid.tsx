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
  /** Optional: fired when a `data` row is single-clicked (not while editing). */
  onRowClick?: (rowId: string) => void;
  className?: string;
}

const ROW_HEIGHT = 30;

export function SpreadsheetGrid({ data, onCellChange, onRowClick, className }: SpreadsheetGridProps) {
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
        return "bg-[hsl(var(--workbook-navy))] text-[hsl(var(--workbook-navy-fg))] font-semibold text-[10px] uppercase tracking-[0.12em]";
      case "section-header":
        return "bg-[hsl(var(--workbook-sand))]/60 text-[hsl(var(--workbook-navy))] font-serif font-semibold text-[13px]";
      case "subtotal":
        return "font-semibold border-t border-[hsl(var(--workbook-navy))]/30 bg-[hsl(var(--workbook-cream))]";
      case "total":
        return "font-bold border-t-2 border-[hsl(var(--workbook-navy))] bg-[hsl(var(--workbook-sand))]/40 text-[hsl(var(--workbook-navy))]";
      case "check":
        return "text-xs italic text-[hsl(var(--workbook-mid))]";
      case "spacer":
        return "h-4";
      default:
        return "text-[hsl(var(--workbook-navy))]";
    }
  };

  const renderCell = (row: GridRow, col: GridColumn) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
    const value = row.cells[col.key];

    if (isEditing) {
      return (
        <input
          type="text"
          className="w-full h-full px-1 bg-white border-2 border-[hsl(var(--workbook-gold))] outline-none text-right font-mono text-[11px] ring-2 ring-[hsl(var(--workbook-gold))]/30"
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
        "truncate tabular-nums",
        row.editable && col.format !== "text" && "cursor-cell",
        isCheckRow && row.checkPassed === true && "text-[hsl(var(--check-pass))]",
        isCheckRow && row.checkPassed === false && "text-[hsl(var(--check-fail))]",
        value !== null && typeof value === "number" && value < 0 && "text-[hsl(var(--check-fail))]",
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
      className={cn("financial-grid overflow-auto border border-[hsl(var(--workbook-rule-soft))] rounded-md shadow-sm bg-[hsl(var(--workbook-paper))]", className)}
      style={{ maxHeight: "80vh" }}
    >
      <table className="border-collapse text-[12px] w-max">
        <thead className="sticky top-0 z-30">
          <tr className="bg-[hsl(var(--workbook-navy))] text-[hsl(var(--workbook-navy-fg))]">
            {frozenCols.map((col, i) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-[0.12em] border-b-2 border-[hsl(var(--workbook-gold))] whitespace-nowrap sticky bg-[hsl(var(--workbook-navy))] text-[hsl(var(--workbook-navy-fg))] z-30"
                style={{ width: col.width || 120, minWidth: col.width || 120, left: frozenLeftOffsets[i] }}
              >
                {col.label}
              </th>
            ))}
            {scrollCols.map(col => (
              <th
                key={col.key}
                className="px-3 py-2 text-right font-semibold text-[10px] uppercase tracking-[0.12em] border-b-2 border-[hsl(var(--workbook-gold))] whitespace-nowrap bg-[hsl(var(--workbook-navy))] text-[hsl(var(--workbook-navy-fg))]"
                style={{ minWidth: col.width || 90 }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ height: totalHeight, position: "relative" }}>
          {virtualRows.length > 0 && virtualRows[0].start > 0 && (
            <tr style={{ height: virtualRows[0].start }} aria-hidden>
              <td colSpan={frozenCols.length + scrollCols.length} />
            </tr>
          )}
          {virtualRows.map(virtualRow => {
            const row = data.rows[virtualRow.index];
            const isClickable = !!onRowClick && row.type === "data" && row.id !== "empty";
            const isZebra = row.type === "data" && virtualRow.index % 2 === 1;
            return (
              <tr
                key={row.id}
                className={cn(
                  getRowClasses(row.type),
                  isZebra && "bg-[hsl(var(--workbook-zebra))]",
                  isClickable && "cursor-pointer hover:bg-[hsl(var(--workbook-sand))]/30"
                )}
                onClick={isClickable && !editingCell ? () => onRowClick!(row.id) : undefined}
              >
                {row.type === "spacer" ? (
                  <td colSpan={frozenCols.length + scrollCols.length} className="h-4" />
                ) : (
                  <>
                    {frozenCols.map((col, i) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-1 border-b border-[hsl(var(--workbook-rule-soft))] whitespace-nowrap sticky z-10 bg-[hsl(var(--workbook-paper))]",
                          isZebra && "bg-[hsl(var(--workbook-zebra))]",
                          row.type === "section-header" && "bg-[hsl(var(--workbook-sand))]/60",
                          row.type === "header" && "bg-[hsl(var(--workbook-navy))] text-[hsl(var(--workbook-navy-fg))]",
                          row.type === "total" && "bg-[hsl(var(--workbook-sand))]/40",
                          row.type === "subtotal" && "bg-[hsl(var(--workbook-cream))]",
                          i === frozenCols.length - 1 && "shadow-[2px_0_4px_-2px_rgba(15,27,61,0.15)]",
                        )}
                        style={{
                          left: frozenLeftOffsets[i],
                          paddingLeft: col.key === frozenCols[0]?.key && row.indent
                            ? `${12 + (row.indent || 0) * 14}px`
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
                          "px-3 py-1 border-b border-[hsl(var(--workbook-rule-soft))] text-right whitespace-nowrap tabular-nums",
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
