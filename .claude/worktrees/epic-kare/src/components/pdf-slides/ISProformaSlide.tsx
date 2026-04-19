/**
 * Proforma Income Statement slide — summary table.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

export function ISProformaSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
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

  const rows = hasData
    ? rawData.slice(1).map((row) => {
        const cells: Record<string, string | number | null> = {};
        row.forEach((val, idx) => {
          cells[`col${idx}`] = val;
        });
        const label = (row[0] || "").toLowerCase();
        const isBold =
          label.includes("revenue") ||
          label.includes("gross profit") ||
          label.includes("net income") ||
          label.includes("total") ||
          label.includes("operating income");
        return { cells, bold: isBold };
      })
    : [];

  return (
    <SlideLayout
      metadata={metadata}
      pageNumber={pageNumber}
      totalPages={totalPages}
      sectionTitle="Income Statement Analysis"
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
          Proforma Income Statement
        </div>
        <div
          style={{
            width: 60,
            height: 4,
            backgroundColor: PDF_COLORS.teal,
            marginBottom: 24,
          }}
        />
        {hasData ? (
          <SlideTable columns={columns} rows={rows} compact />
        ) : (
          <div style={{ fontSize: 18, color: PDF_COLORS.midGray, padding: 40 }}>
            Income statement data not yet available. Complete the Income Statement section to populate this slide.
          </div>
        )}
      </div>
    </SlideLayout>
  );
}
