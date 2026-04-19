/**
 * Quality of Earnings bridge table slide.
 * Shows Revenue → Net Income → EBITDA → Adjusted EBITDA.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

export function QoESlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const rawData = (data?.rawData as string[][]) || [];

  // If we have real data, build columns and rows from the 2D array
  const hasData = rawData.length > 1;

  const columns = hasData
    ? rawData[0].map((label, idx) => ({
        key: `col${idx}`,
        label: idx === 0 ? "" : label,
        align: (idx === 0 ? "left" : "right") as "left" | "right",
      }))
    : [
        { key: "item", label: "", align: "left" as const },
        { key: "fy1", label: "FY 2022", align: "right" as const },
        { key: "fy2", label: "FY 2023", align: "right" as const },
        { key: "ltm", label: "LTM", align: "right" as const },
      ];

  const rows = hasData
    ? rawData.slice(1).map((row) => {
        const cells: Record<string, string | number | null> = {};
        row.forEach((val, idx) => {
          cells[`col${idx}`] = val;
        });
        const label = (row[0] || "").toLowerCase();
        const isBold =
          label.includes("revenue") ||
          label.includes("ebitda") ||
          label.includes("net income") ||
          label.includes("total") ||
          label.includes("adjusted");
        const isSep = label === "" && row.every((v) => !v || v.trim() === "");
        return { cells, bold: isBold, separator: isSep };
      })
    : [
        { cells: { item: "Total Revenue", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: { item: "Cost of Goods Sold", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "Gross Profit", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: { item: "Operating Expenses", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "Net Income", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: {}, separator: true },
        { cells: { item: "Depreciation & Amortization", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "Interest Expense", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "Income Taxes", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "EBITDA", fy1: "—", fy2: "—", ltm: "—" }, bold: true, highlight: true },
        { cells: {}, separator: true },
        { cells: { item: "QoE Adjustments", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "Adjusted EBITDA", fy1: "—", fy2: "—", ltm: "—" }, bold: true, highlight: true },
      ];

  return (
    <SlideLayout
      metadata={metadata}
      pageNumber={pageNumber}
      totalPages={totalPages}
      sectionTitle="Quality of Earnings Analysis"
    >
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: PDF_COLORS.darkBlue,
            marginBottom: 6,
          }}
        >
          Quality of Earnings — EBITDA Bridge
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            backgroundColor: PDF_COLORS.teal,
            marginBottom: 24,
          }}
        />
        <SlideTable columns={columns} rows={rows} compact />
      </div>
    </SlideLayout>
  );
}
