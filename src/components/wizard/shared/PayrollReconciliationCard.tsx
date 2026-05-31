import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitCompare } from "lucide-react";
import { formatCurrency } from "@/lib/trialBalanceUtils";
import type { VarianceRow } from "@/lib/payrollReconciliation";

interface Props {
  rows: VarianceRow[];
}

const varianceTone = (pct: number) => {
  if (pct >= 0.1) return "text-red-600 dark:text-red-400 font-semibold";
  if (pct >= 0.03) return "text-amber-600 dark:text-amber-400 font-medium";
  return "text-muted-foreground";
};

export const PayrollReconciliationCard = ({ rows }: Props) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitCompare className="h-4 w-4" />
          Register vs Trial Balance — LTM Reconciliation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th className="text-left py-2 font-medium">Category</th>
                <th className="text-right py-2 font-medium">Per Register</th>
                <th className="text-right py-2 font-medium">Per TB</th>
                <th className="text-right py-2 font-medium">Variance</th>
                <th className="text-right py-2 font-medium">% Var</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isTotal = row.key === "total";
                const tone = varianceTone(row.pctVariance);
                return (
                  <tr
                    key={row.key}
                    className={`border-b last:border-b-0 ${isTotal ? "font-semibold bg-muted/30" : ""}`}
                  >
                    <td className="py-2">{row.label}</td>
                    <td className="text-right py-2 font-mono">{formatCurrency(row.register)}</td>
                    <td className="text-right py-2 font-mono">{formatCurrency(row.tb)}</td>
                    <td className={`text-right py-2 font-mono ${tone}`}>
                      {row.variance >= 0 ? "+" : ""}{formatCurrency(row.variance)}
                    </td>
                    <td className={`text-right py-2 ${tone}`}>{(row.pctVariance * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Variances under 3% are typically timing differences (accruals, payroll cutoffs).
          Gaps above 10% often signal unrecorded liabilities, misclassified accounts, or off-book payroll —
          worth investigating before relying on either figure.
        </p>
      </CardContent>
    </Card>
  );
};
