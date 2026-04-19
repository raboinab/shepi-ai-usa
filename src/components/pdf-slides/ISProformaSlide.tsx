/**
 * Proforma Income Statement slide — summary table with narrative.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";
import { SlideNarrativeBox } from "./shared/SlideNarrativeBox";

function computeNarrative(rawData: string[][]): string {
  if (rawData.length < 3) return "";
  const headers = rawData[0];
  const lastCol = headers.length - 1;
  if (lastCol < 1) return "";

  const findRow = (key: string) =>
    rawData.find((r) => r[0]?.toLowerCase().includes(key));

  const parseVal = (s: string | undefined) => {
    if (!s || s === "—") return null;
    const n = parseFloat(s.replace(/[(),$ ]/g, ""));
    return isNaN(n) ? null : n;
  };

  const revenueRow = findRow("revenue");
  const gpRow = findRow("gross profit");
  const rev = parseVal(revenueRow?.[lastCol]);
  const gp = parseVal(gpRow?.[lastCol]);

  const parts: string[] = [];
  if (rev !== null) {
    const revStr = rev >= 1_000_000 ? `$${(rev / 1_000_000).toFixed(1)}M` : `$${(rev / 1_000).toFixed(0)}K`;
    parts.push(`LTM revenue of ${revStr}`);
  }
  if (rev && gp !== null) {
    const margin = ((gp / rev) * 100).toFixed(1);
    parts.push(`gross margin of ${margin}%`);
  }
  if (parts.length === 0) return "";
  return parts.join(" with ") + ". Review income statement line items below for period-over-period trends.";
}

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
        row.forEach((val, idx) => { cells[`col${idx}`] = val; });
        const label = (row[0] || "").toLowerCase();
        const isBold =
          label.includes("revenue") || label.includes("gross profit") ||
          label.includes("net income") || label.includes("total") ||
          label.includes("operating income");
        return { cells, bold: isBold };
      })
    : [];

  const narrative = hasData ? computeNarrative(rawData) : "";

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Income Statement Analysis">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Proforma Income Statement
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.midBlue, marginBottom: 16 }} />
        {hasData ? (
          <>
            <SlideNarrativeBox text={narrative} />
            <SlideTable columns={columns} rows={rows} compact />
          </>
        ) : (
          <div style={{ fontSize: 18, color: PDF_COLORS.midGray, padding: 40 }}>
            Income statement data not yet available. Complete the Income Statement section to populate this slide.
          </div>
        )}
      </div>
    </SlideLayout>
  );
}
