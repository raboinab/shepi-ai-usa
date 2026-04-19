import { useMemo } from "react";
import type { DealData } from "@/lib/workbook-types";

interface TabProps {
  dealData: DealData;
  onDataChange?: (data: DealData) => void;
}

export function SetupTab({ dealData }: TabProps) {
  const info = dealData.deal;
  
  const rows = useMemo(() => {
    const regular = info.periods.filter(p => !p.isStub);
    const stubs = info.periods.filter(p => p.isStub);
    const periodLabel = stubs.length > 0
      ? `${regular.length} months + ${stubs.length} stub${stubs.length > 1 ? "s" : ""}`
      : `${regular.length} months`;

    // Build a human-readable review period from earliest to latest date
    const allDates = info.periods.map(p => p.date).filter(Boolean);
    const reviewPeriod = allDates.length > 0
      ? `${allDates[0].toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${allDates[allDates.length - 1].toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
      : "None";

    return [
      ["Project Name", info.projectName],
      ["Client / Firm", info.clientName],
      ["Target Company", info.targetCompany],
      ["Industry", info.industry],
      ["Location", (dealData as any).dueDiligenceData?.location || ""],
      ["Transaction Type", info.transactionType
        ? info.transactionType.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join("-")
        : ""],
      ["Currency", (dealData as any).dueDiligenceData?.currency || "USD $"],
      ["Fiscal Year End", `Month ${info.fiscalYearEnd}`],
      ["Periods", periodLabel],
      ["Period Range", info.periods.length > 0
        ? `${info.periods[0].label} – ${info.periods[info.periods.length - 1].label}`
        : "None"],
      ["Review Period", reviewPeriod],
    ];
  }, [info]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Due Diligence Information</h2>
      <table className="w-full text-sm border-collapse">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={i} className="border-b border-border">
              <td className="py-2 pr-4 font-medium text-muted-foreground w-48">{label}</td>
              <td className="py-2">{value || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
