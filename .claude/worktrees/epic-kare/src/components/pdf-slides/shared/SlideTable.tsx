/**
 * Styled financial table for PDF slides.
 * Designed for 1920x1080 slide rendering -- uses inline styles for html-to-image compatibility.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";

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
  const rowHeight = compact ? 32 : 38;
  const fontSize = compact ? 14 : 16;
  const headerFontSize = compact ? 13 : 14;

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
                  padding: "8px 12px",
                  textAlign: (col.align || (col.key === columns[0]?.key ? "left" : "right")) as React.CSSProperties["textAlign"],
                  fontWeight: 600,
                  fontSize: headerFontSize,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  width: col.width,
                  borderBottom: `2px solid ${PDF_COLORS.teal}`,
                }}
              >
                {col.label}
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
                    colSpan={columns.length}
                    style={{
                      height: 4,
                      backgroundColor: PDF_COLORS.teal,
                      padding: 0,
                    }}
                  />
                </tr>
              );
            }
            const bgColor = row.highlight
              ? PDF_COLORS.lightGray
              : idx % 2 === 0
                ? PDF_COLORS.white
                : PDF_COLORS.offWhite;

            return (
              <tr key={idx}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      padding: `6px 12px`,
                      height: rowHeight,
                      textAlign: (col.align || (col.key === columns[0]?.key ? "left" : "right")) as React.CSSProperties["textAlign"],
                      fontWeight: row.bold ? 700 : 400,
                      backgroundColor: bgColor,
                      color: row.bold ? PDF_COLORS.darkBlue : PDF_COLORS.darkGray,
                      borderBottom: `1px solid ${PDF_COLORS.lightGray}`,
                      paddingLeft: col.key === columns[0]?.key && row.indent
                        ? `${12 + row.indent * 20}px`
                        : "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatCell(row.cells[col.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
