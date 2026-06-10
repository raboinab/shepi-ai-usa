import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Trash2, CheckCircle } from "lucide-react";
import { isCrossLineReclass } from "@/lib/reclassHelpers";

interface Reclass {
  id: string;
  accountDescription?: string;
  accountNumber?: string;
  fromFsLineItem: string;
  toFsLineItem: string;
  amount: number;
  description?: string;
  sourceType?: "manual" | "ai-suggested";
}

interface Props {
  reclassifications: Reclass[];
  onRevert: (id: string) => void;
  /** Optional ack handler — when provided, renders an "Approve" button per row */
  onApprove?: (id: string) => void;
  approvedIds?: Set<string>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

/**
 * Surfaces reclassifications that cross the EBITDA line (e.g., Revenue ↔ Other expense (income)).
 * These are the only reclasses that shift Reported / Adjusted EBITDA, so they warrant explicit review.
 */
export const CrossLineReclassCallout = ({ reclassifications, onRevert, onApprove, approvedIds }: Props) => {
  const crossLine = reclassifications.filter(isCrossLineReclass);
  if (crossLine.length === 0) return null;

  return (
    <Card className="border-amber-500/50 bg-amber-500/5">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <CardTitle className="text-base">Cross-line reclasses (affect EBITDA)</CardTitle>
            <CardDescription>
              These {crossLine.length === 1 ? "reclassification moves" : `${crossLine.length} reclassifications move`} amounts across the EBITDA line. Review each one — they directly change Reported and Adjusted EBITDA.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {crossLine.map((rc) => {
          const isApproved = approvedIds?.has(rc.id);
          return (
            <div key={rc.id} className="rounded-md border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>{rc.fromFsLineItem || "—"}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span>{rc.toFsLineItem || "—"}</span>
                  <Badge variant="secondary" className="ml-2">{fmt(rc.amount || 0)}</Badge>
                  {rc.sourceType === "ai-suggested" && <Badge variant="outline">AI Suggested</Badge>}
                  {isApproved && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Reviewed
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {onApprove && !isApproved && (
                    <Button size="sm" variant="outline" onClick={() => onApprove(rc.id)}>
                      Mark reviewed
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive gap-1"
                    onClick={() => onRevert(rc.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Revert
                  </Button>
                </div>
              </div>
              {(rc.accountDescription || rc.accountNumber) && (
                <p className="text-xs text-muted-foreground">
                  {[rc.accountNumber, rc.accountDescription].filter(Boolean).join(" · ")}
                </p>
              )}
              {rc.description && <p className="text-xs text-muted-foreground">{rc.description}</p>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
