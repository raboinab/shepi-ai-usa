import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

export function BalanceSheetSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const rawData = (data?.rawData as string[][]) || [];
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

  const BOLD_KEYS = ["total", "assets", "liabilities", "equity", "net"];
  const rows = hasData
    ? rawData.slice(1).map((row) => {
        const cells: Record<string, string | number | null> = {};
        row.forEach((val, idx) => { cells[`col${idx}`] = val; });
        const label = (row[0] || "").toLowerCase();
        const isBold = BOLD_KEYS.some((k) => label.includes(k));
        const isSep = label === "" && row.every((v) => !v || v.trim() === "");
        return { cells, bold: isBold, separator: isSep };
      })
    : [
        { cells: { item: "Total Current Assets", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: { item: "Total Non-Current Assets", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: { item: "Total Assets", fy1: "—", fy2: "—", ltm: "—" }, bold: true, highlight: true },
        { cells: {}, separator: true },
        { cells: { item: "Total Current Liabilities", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: { item: "Total Non-Current Liabilities", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: { item: "Total Liabilities", fy1: "—", fy2: "—", ltm: "—" }, bold: true, highlight: true },
        { cells: {}, separator: true },
        { cells: { item: "Total Equity", fy1: "—", fy2: "—", ltm: "—" }, bold: true, highlight: true },
      ];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Balance Sheet Analysis">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Balance Sheet Summary
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 24 }} />
        <SlideTable columns={columns} rows={rows} compact />
      </div>
    </SlideLayout>
  );
}
