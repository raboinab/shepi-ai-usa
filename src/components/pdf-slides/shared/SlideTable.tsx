/**
 * Styled financial table for PDF slides.
 * Designed for 1920x1080 slide rendering -- uses inline styles for html-to-image compatibility.
 * Auto-scales font/padding for wide tables (8+ columns).
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import { abbreviateHeader } from "./pdfTableUtils";

interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  width?: string;
}

interface Row {
  cells: Record<string, string | number | null>;
  bold?: boolean;
  highlight?: boolean;
  indent?: number;
  separator?: boolean;
}

interface SlideTableProps {
  columns: Column[];
  rows: Row[];
  title?: string;
  compact?: boolean;
}

const formatCell = (value: string | number | null): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    if (Math.abs(value) >= 1000) {
      return value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return value.toLocaleString("en-US");
  }
  return String(value);
};

export function SlideTable({ columns, rows, title, compact }: SlideTableProps) {
  const colCount = columns.length;

  // Auto-scale for wide tables
  let fontSize: number;
  let headerFontSize: number;
  let cellPadding: string;
  let rowHeight: number;

  if (colCount > 12) {
    fontSize = compact ? 11 : 12;
    headerFontSize = 10;
    cellPadding = "3px 5px";
    rowHeight = compact ? 26 : 30;
  } else if (colCount > 8) {
    fontSize = compact ? 12 : 13;
    headerFontSize = 11;
    cellPadding = "4px 6px";
    rowHeight = compact ? 28 : 32;
  } else {
    fontSize = compact ? 14 : 16;
    headerFontSize = compact ? 13 : 14;
    cellPadding = "6px 12px";
    rowHeight = compact ? 32 : 38;
  }

  return (
    <div style={{ fontFamily: PDF_FONTS.body, width: "100%" }}>
      {title && (
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: PDF_COLORS.darkBlue,
            marginBottom: 12,
          }}
        >
          {title}
        </div>
      )}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize,
          tableLayout: colCount > 8 ? "fixed" : "auto",
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  backgroundColor: PDF_COLORS.darkBlue,
                  color: PDF_COLORS.white,
                  padding: cellPadding,
                  textAlign: (col.align || (col.key === columns[0]?.key ? "left" : "right")) as React.CSSProperties["textAlign"],
                  fontWeight: 600,
                  fontSize: headerFontSize,
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  whiteSpace: "nowrap",
                  width: col.width,
                  borderBottom: `2px solid ${PDF_COLORS.teal}`,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {colCount > 8 ? abbreviateHeader(col.label) : col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            if (row.separator) {
              return (
                <tr key={idx}>
                  <td
                    colSpan={colCount}
                    style={{
                      height: 4,
                      backgroundColor: PDF_COLORS.teal,
                      padding: 0,
                    }}
                  />
                </tr>
              );
            }

            const isHighlightRow = row.highlight || row.bold;
            const bgColor = isHighlightRow
              ? "#EDE5D8"
              : idx % 2 === 0
                ? PDF_COLORS.white
                : "#F5F2EC";

            return (
              <tr key={idx}>
                {columns.map((col) => {
                  const isFirstCol = col.key === columns[0]?.key;
                  return (
                    <td
                      key={col.key}
                      style={{
                        padding: cellPadding,
                        height: rowHeight,
                        textAlign: (col.align || (isFirstCol ? "left" : "right")) as React.CSSProperties["textAlign"],
                        fontWeight: row.bold ? 700 : 400,
                        backgroundColor: bgColor,
                        color: row.bold ? PDF_COLORS.darkBlue : PDF_COLORS.darkGray,
                        borderBottom: `1px solid ${PDF_COLORS.lightGray}`,
                        paddingLeft: isFirstCol && row.indent
                          ? `${(colCount > 8 ? 6 : 12) + row.indent * (colCount > 8 ? 12 : 20)}px`
                          : undefined,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: colCount > 8 ? 0 : undefined,
                      }}
                    >
                      {formatCell(row.cells[col.key])}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
