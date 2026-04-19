import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";
import { SlideNarrativeBox } from "./shared/SlideNarrativeBox";
import { sliceColumnsForPDF } from "./shared/pdfTableUtils";

function computeNarrative(rawData: string[][]): string {
  if (rawData.length < 3) return "";
  const lastCol = rawData[0].length - 1;
  if (lastCol < 1) return "";

  const findRow = (key: string) => rawData.find((r) => r[0]?.toLowerCase().includes(key));
  const parseVal = (s: string | undefined) => {
    if (!s || s === "—") return null;
    const n = parseFloat(s.replace(/[(),$ ]/g, ""));
    return isNaN(n) ? null : n;
  };

  const fcf = parseVal(findRow("free cash flow")?.[lastCol]) ?? parseVal(findRow("fcf")?.[lastCol]);
  const ebitda = parseVal(findRow("ebitda")?.[lastCol]) ?? parseVal(findRow("adjusted")?.[lastCol]);

  const parts: string[] = [];
  if (fcf !== null) {
    const str = Math.abs(fcf) >= 1_000_000 ? `$${(Math.abs(fcf) / 1_000_000).toFixed(1)}M` : `$${(Math.abs(fcf) / 1_000).toFixed(0)}K`;
    parts.push(`Free cash flow of ${str}`);
  }
  if (fcf !== null && ebitda && ebitda !== 0) {
    const conv = ((fcf / ebitda) * 100).toFixed(0);
    parts.push(`representing ${conv}% EBITDA-to-FCF conversion`);
  }
  if (parts.length === 0) return "";
  return parts.join(", ") + ". Review the bridge below for key cash flow drivers.";
}

export function FreeCashFlowSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const rawDataFull = (data?.rawData as string[][]) || [];
  const rawData = sliceColumnsForPDF(rawDataFull);
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

  const BOLD_KEYS = ["ebitda", "adjusted", "free cash flow", "fcf", "total", "capex"];
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
        { cells: { item: "Adjusted EBITDA", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: { item: "(-) Cash Taxes", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "(-) Change in NWC", fy1: "—", fy2: "—", ltm: "—" }, bold: false },
        { cells: { item: "(-) CapEx", fy1: "—", fy2: "—", ltm: "—" }, bold: true },
        { cells: {}, separator: true },
        { cells: { item: "Free Cash Flow", fy1: "—", fy2: "—", ltm: "—" }, bold: true, highlight: true },
      ];

  const narrative = hasData ? computeNarrative(rawData) : "";

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Balance Sheet Analysis">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 6 }}>
          Free Cash Flow Bridge
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.midBlue, marginBottom: 16 }} />
        {hasData && <SlideNarrativeBox text={narrative} />}
        <SlideTable columns={columns} rows={rows} compact />
      </div>
    </SlideLayout>
  );
}
