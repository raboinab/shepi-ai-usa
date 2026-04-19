import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

export function APAgingSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
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
        { key: "current", label: "Current", align: "right" as const },
        { key: "d30", label: "1-30", align: "right" as const },
        { key: "d60", label: "31-60", align: "right" as const },
        { key: "d90", label: "61-90", align: "right" as const },
        { key: "over90", label: "90+", align: "right" as const },
        { key: "total", label: "Total", align: "right" as const },
      ];

  const BOLD_KEYS = ["total", "net payables"];
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
        { cells: { item: "Trade Payables", current: "—", d30: "—", d60: "—", d90: "—", over90: "—", total: "—" }, bold: false },
        { cells: { item: "Total AP", current: "—", d30: "—", d60: "—", d90: "—", over90: "—", total: "—" }, bold: true, highlight: true },
      ];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Balance Sheet Analysis">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Accounts Payable Aging
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 24 }} />
        <SlideTable columns={columns} rows={rows} compact />
      </div>
    </SlideLayout>
  );
}
