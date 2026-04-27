/**
 * AdjustmentTraceSheet — first-click drill-down from the DD Adjustments grid.
 * Shows the GL lines that support an adjustment, then drills into the source
 * record (bank statement / QB GL) on click.
 */
import { useState, useMemo } from "react";
import { ChevronRight, Receipt, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AdjustmentProofSet, MatchingTxnLite } from "@/hooks/useAdjustmentProofs";
import type { Adjustment } from "@/lib/workbook-types";
import { BankReconcilePanel } from "./BankReconcilePanel";

interface AdjustmentTraceSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjustment: Adjustment | null;
  proofSet?: AdjustmentProofSet;
}

const formatCurrency = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function AdjustmentTraceSheet({
  open,
  onOpenChange,
  adjustment,
  proofSet,
}: AdjustmentTraceSheetProps) {
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);

  const proof = proofSet?.verification;
  const matches: MatchingTxnLite[] = useMemo(() => proof?.matchingTransactions ?? [], [proof]);

  const totalAmount = useMemo(
    () => (adjustment ? Object.values(adjustment.amounts).reduce((s, v) => s + (v || 0), 0) : 0),
    [adjustment]
  );

  // Reset child panel when sheet closes or adjustment changes
  const handleOpenChange = (next: boolean) => {
    if (!next) setSelectedTxnId(null);
    onOpenChange(next);
  };

  if (!adjustment) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] overflow-hidden flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-3 border-b">
          <SheetTitle className="text-base flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span className="leading-snug">{adjustment.label || "Adjustment"}</span>
          </SheetTitle>
          <SheetDescription className="text-xs flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {adjustment.type}
            </Badge>
            {adjustment.tbAccountNumber && (
              <span className="font-mono">{adjustment.tbAccountNumber}</span>
            )}
            <span>·</span>
            <span className="font-mono font-medium text-foreground">
              {formatCurrency(totalAmount)}
            </span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          {selectedTxnId ? (
            <BankReconcilePanel txnId={selectedTxnId} onBack={() => setSelectedTxnId(null)} />
          ) : (
            <div className="space-y-4">
              {/* Variance triangle */}
              {proof && (proof.sellerAmount || proof.actualAmount || proof.varianceAmount) ? (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Stat label="Seller" value={formatCurrency(proof.sellerAmount)} />
                  <Stat label="GL-matched" value={formatCurrency(proof.actualAmount)} />
                  <Stat
                    label="Variance"
                    value={formatCurrency(proof.varianceAmount)}
                    tone={Math.abs(proof.varianceAmount) > 0.01 ? "warn" : "ok"}
                  />
                </div>
              ) : null}

              {/* Asserted-only state */}
              {!proof && (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Asserted — not yet GL-traced
                  </div>
                  <p>
                    No verification has been run for this adjustment, so there are no GL lines or
                    bank reconciliations to display. Run verification from the wizard to populate
                    the audit trail.
                  </p>
                </div>
              )}

              {/* GL lines */}
              {proof && (
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-sm font-semibold">GL lines supporting this adjustment</h3>
                    <span className="text-xs text-muted-foreground">
                      {matches.length} {matches.length === 1 ? "line" : "lines"}
                    </span>
                  </div>

                  {matches.length === 0 ? (
                    <div className="rounded-md border p-4 text-sm text-muted-foreground">
                      Verification ran but found no matching GL transactions. The adjustment is
                      asserted-only — see the contradictions / data-gap section in the verify
                      dialog for details.
                    </div>
                  ) : (
                    <ul className="rounded-md border divide-y">
                      {matches.map((t) => (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedTxnId(t.id)}
                            className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2 group"
                          >
                            <Receipt className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0 grid grid-cols-12 gap-2 text-xs items-center">
                              <span className="col-span-2 text-muted-foreground font-mono">
                                {t.date || "—"}
                              </span>
                              <span className="col-span-5 truncate">
                                {t.description || "—"}
                                {t.vendor && (
                                  <span className="text-muted-foreground"> · {t.vendor}</span>
                                )}
                              </span>
                              <span className="col-span-3 text-muted-foreground truncate font-mono">
                                {t.account_number ? `${t.account_number} ` : ""}
                                {t.account_name}
                              </span>
                              <span className="col-span-2 text-right font-mono font-medium">
                                {formatCurrency(t.amount)}
                              </span>
                            </div>
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-[11px] text-muted-foreground italic pt-1">
                    Click any GL line to see the bank transaction (or QuickBooks record) it
                    reconciles to.
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warn";
}) {
  const toneClass =
    tone === "warn"
      ? "text-amber-600 border-amber-500/30 bg-amber-500/5"
      : tone === "ok"
      ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5"
      : "text-foreground border-border bg-muted/30";
  return (
    <div className={`rounded-md border px-2.5 py-2 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-mono text-sm font-medium">{value}</div>
    </div>
  );
}
