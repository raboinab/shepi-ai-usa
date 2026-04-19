/**
 * Flagged Transactions slide — top AI-detected anomalies.
 * Client-facing: no confidence scores or internal IDs.
 */
import { PDF_COLORS, PDF_FONTS } from "@/lib/pdf/theme";
import type { SlideProps } from "@/lib/pdf/reportTypes";
import { SlideLayout } from "./SlideLayout";
import { SlideTable } from "./shared/SlideTable";

interface FlaggedItem {
  description: string;
  account_name: string;
  amount: number;
  flag_type: string;
  flag_category: string;
  confidence_score: number;
  transaction_date: string;
}

function cleanLabel(s: string): string {
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export function FlaggedTransactionsSlide({ metadata, pageNumber, totalPages, data }: SlideProps) {
  const items = (data?.flaggedItems as FlaggedItem[]) || [];

  const columns = [
    { key: "description", label: "Description", align: "left" as const, width: "32%" },
    { key: "account", label: "Account", align: "left" as const, width: "20%" },
    { key: "amount", label: "Amount ($)", align: "right" as const, width: "14%" },
    { key: "type", label: "Issue Type", align: "center" as const, width: "16%" },
    { key: "category", label: "Priority", align: "center" as const, width: "18%" },
  ];

  const displayItems = items.slice(0, 12);

  const rows = displayItems.map((item) => ({
    cells: {
      description: item.description.length > 55 ? item.description.substring(0, 55) + "…" : item.description,
      account: item.account_name.length > 28 ? item.account_name.substring(0, 28) + "…" : item.account_name,
      amount: Math.abs(item.amount).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      type: cleanLabel(item.flag_type),
      category: cleanLabel(item.flag_category),
    },
  }));

  if (items.length > 12) {
    rows.push({
      cells: {
        description: `… and ${items.length - 12} more flagged items`,
        account: "", amount: "", type: "", category: "",
      },
    });
  }

  return (
    <SlideLayout metadata={metadata} pageNumber={pageNumber} totalPages={totalPages} sectionTitle="Flagged Transactions">
      <div style={{ fontFamily: PDF_FONTS.body }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: PDF_COLORS.darkBlue, marginBottom: 8 }}>
          AI-Flagged Transactions
        </div>
        <div style={{ width: 60, height: 4, backgroundColor: PDF_COLORS.midBlue, marginBottom: 16 }} />

        {items.length === 0 ? (
          <div style={{ fontSize: 18, color: PDF_COLORS.midGray, marginTop: 40 }}>
            No flagged transactions detected for this engagement.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 14, color: PDF_COLORS.midGray, marginBottom: 16 }}>
              {items.length} transaction{items.length !== 1 ? "s" : ""} flagged for review based on anomaly detection and pattern analysis.
            </div>
            <SlideTable columns={columns} rows={rows} compact />
          </>
        )}
      </div>
    </SlideLayout>
  );
}
