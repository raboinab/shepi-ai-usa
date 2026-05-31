import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { formatCurrency } from "@/lib/trialBalanceUtils";
import type { PayrollFallbackData } from "@/lib/workbook-types";
import { PAYROLL_CATEGORY_LABELS, type PayrollCategoryKey } from "@/lib/payrollReconciliation";

interface Props {
  fallback: PayrollFallbackData;
  periodIds?: string[];
}

const sumItem = (item: { monthlyValues: Record<string, number> }, periodIds?: string[]) => {
  const mv = item.monthlyValues || {};
  if (periodIds && periodIds.length > 0) {
    return periodIds.reduce((s, p) => s + (mv[p] || 0), 0);
  }
  return Object.values(mv).reduce((s, v) => s + (v || 0), 0);
};

export const PayrollRegisterDetail = ({ fallback, periodIds }: Props) => {
  const [open, setOpen] = useState(false);

  const categories: Array<{ key: PayrollCategoryKey; items: Array<{ name: string; monthlyValues: Record<string, number> }> }> = ([
    { key: "salaryWages" as const, items: fallback.salaryWages || [] },
    { key: "ownerCompensation" as const, items: fallback.ownerCompensation || [] },
    { key: "payrollTaxes" as const, items: fallback.payrollTaxes || [] },
    { key: "benefits" as const, items: fallback.benefits || [] },
  ]).filter(c => c.items.length > 0);

  const totalLines = categories.reduce((s, c) => s + c.items.length, 0);

  if (totalLines === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4" />
            Payroll Register Detail
            <span className="text-xs font-normal text-muted-foreground">
              ({totalLines} line item{totalLines === 1 ? "" : "s"})
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setOpen(o => !o)}>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {open ? "Hide" : "Show"}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-4">
          {categories.map(cat => (
            <div key={cat.key} className="space-y-1">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {PAYROLL_CATEGORY_LABELS[cat.key]}
              </div>
              <div className="rounded-md border">
                {cat.items.map((item, i) => (
                  <div
                    key={`${cat.key}-${i}`}
                    className="flex items-center justify-between px-3 py-1.5 text-sm border-b last:border-b-0"
                  >
                    <span className="truncate pr-3">{item.name}</span>
                    <span className="font-mono tabular-nums">{formatCurrency(sumItem(item, periodIds))}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            Totals shown for the LTM window. The Workbook Payroll grid rolls these up by category when no Trial Balance accounts are classified as "Payroll &amp; Related".
          </p>
        </CardContent>
      )}
    </Card>
  );
};
