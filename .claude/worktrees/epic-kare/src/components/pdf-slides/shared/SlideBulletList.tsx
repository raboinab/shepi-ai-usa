/**
 * Styled bullet list for narrative PDF slides.
 * Renders attention areas, key findings, or risk items.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";

interface BulletItem {
  title: string;
  description?: string;
  severity?: "high" | "medium" | "low" | "info";
}

interface SlideBulletListProps {
  items: BulletItem[];
  columns?: 1 | 2;
}

const SEVERITY_COLORS: Record<string, string> = {
  high: "#c0392b",
  medium: "#e67e22",
  low: "#27ae60",
  info: PDF_COLORS.teal,
};

export function SlideBulletList({ items, columns = 1 }: SlideBulletListProps) {
  const colItems = columns === 2
    ? [items.slice(0, Math.ceil(items.length / 2)), items.slice(Math.ceil(items.length / 2))]
    : [items];

  return (
    <div
      style={{
        fontFamily: PDF_FONTS.body,
        display: "flex",
        gap: 60,
        width: "100%",
      }}
    >
      {colItems.map((col, colIdx) => (
        <div key={colIdx} style={{ flex: 1 }}>
          {col.map((item, idx) => {
            const dotColor = SEVERITY_COLORS[item.severity || "info"];
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 20,
                  alignItems: "flex-start",
                }}
              >
                {/* Severity dot */}
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    backgroundColor: dotColor,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: PDF_COLORS.darkBlue,
                      lineHeight: 1.3,
                      marginBottom: item.description ? 4 : 0,
                    }}
                  >
                    {item.title}
                  </div>
                  {item.description && (
                    <div
                      style={{
                        fontSize: 15,
                        color: PDF_COLORS.midGray,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
