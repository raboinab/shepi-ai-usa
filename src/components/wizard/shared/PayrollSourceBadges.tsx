import { CheckCircle2, FileSpreadsheet, BookOpen, Circle } from "lucide-react";
import { formatCurrency } from "@/lib/trialBalanceUtils";

interface Props {
  tbAccountCount: number;
  tbLtmTotal: number;
  registerDocName?: string | null;
  registerLtmTotal: number;
  registerItemCount: number;
}

const baseClass = "flex items-start gap-3 rounded-lg border px-4 py-3 flex-1 min-w-0";

export const PayrollSourceBadges = ({
  tbAccountCount,
  tbLtmTotal,
  registerDocName,
  registerLtmTotal,
  registerItemCount,
}: Props) => {
  const tbPresent = tbAccountCount > 0 && tbLtmTotal > 0.01;
  const regPresent = registerItemCount > 0;

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className={`${baseClass} ${tbPresent ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900" : "bg-muted/40"}`}>
        {tbPresent ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="h-4 w-4" />
            Trial Balance
          </div>
          {tbPresent ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {tbAccountCount} account{tbAccountCount === 1 ? "" : "s"} classified · {formatCurrency(tbLtmTotal)} LTM
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              No accounts classified as "Payroll &amp; Related" yet
            </p>
          )}
        </div>
      </div>

      <div className={`${baseClass} ${regPresent ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900" : "bg-muted/40"}`}>
        {regPresent ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileSpreadsheet className="h-4 w-4" />
            Payroll Register
          </div>
          {regPresent ? (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {registerItemCount} line item{registerItemCount === 1 ? "" : "s"} · {formatCurrency(registerLtmTotal)} LTM
              {registerDocName ? <> · <span className="font-mono">{registerDocName}</span></> : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-0.5">
              No payroll register uploaded. Add one in Documents → Payroll Reports.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
