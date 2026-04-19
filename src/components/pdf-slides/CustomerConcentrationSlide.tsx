import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

export function CustomerConcentrationSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const rawData = (data?.rawData as string[][]) || [];
  const hasData = rawData.length > 1;

  const columns = hasData
    ? rawData[0].map((label, idx) => ({
        key: `col${idx}`,
        label: idx === 0 ? "" : label,
        align: (idx === 0 ? "left" : "right") as "left" | "right",
      }))
    : [
        { key: "rank", label: "#", align: "left" as const },
        { key: "customer", label: "Customer", align: "left" as const },
        { key: "revenue", label: "Revenue", align: "right" as const },
        { key: "pct", label: "% of Total", align: "right" as const },
      ];

  const BOLD_KEYS = ["total", "top 5", "top 10", "all other"];
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
        { cells: { rank: "1", customer: "Customer A", revenue: "—", pct: "—" }, bold: false },
        { cells: { rank: "2", customer: "Customer B", revenue: "—", pct: "—" }, bold: false },
        { cells: { rank: "3", customer: "Customer C", revenue: "—", pct: "—" }, bold: false },
        { cells: {}, separator: true },
        { cells: { rank: "", customer: "Top 5 Total", revenue: "—", pct: "—" }, bold: true, highlight: true },
        { cells: { rank: "", customer: "All Others", revenue: "—", pct: "—" }, bold: false },
        { cells: { rank: "", customer: "Total Revenue", revenue: "—", pct: "100%" }, bold: true, highlight: true },
      ];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Supplementary Analysis">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Customer Concentration Analysis
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 24 }} />
        <SlideTable columns={columns} rows={rows} compact />
      </div>
    </SlideLayout>
  );
}
