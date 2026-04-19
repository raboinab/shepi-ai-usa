/**
 * Other Expense (Income) slide — D&A, Interest, Misc, Penalties detail table.
 */
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

export function OtherExpenseSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
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
        { key: "val", label: "LTM", align: "right" as const },
      ];

  const rows = hasData
    ? rawData.slice(1).map((row) => {
        const cells: Record<string, string | number | null> = {};
        row.forEach((val, idx) => { cells[`col${idx}`] = val; });
        const label = (row[0] || "").toLowerCase();
        const isBold = label.includes("total") || label.includes("net");
        return { cells, bold: isBold };
      })
    : [{ cells: { item: "No data available", val: "—" } }];

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Other Expense (Income)">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          Other Expense (Income)
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.teal, marginBottom: 24 }} />
        <SlideTable columns={columns} rows={rows} compact />
      </div>
    </SlideLayout>
  );
}
