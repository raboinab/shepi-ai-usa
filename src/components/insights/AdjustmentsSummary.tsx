import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, CheckCircle, XCircle } from "lucide-react";
import { signedAdjustmentTotal } from "@/lib/adjustmentSignUtils";

interface AdjustmentsSummaryProps {
  wizardData: Record<string, unknown>;
}

export const AdjustmentsSummary = ({ wizardData }: AdjustmentsSummaryProps) => {
  // Read from ddAdjustments (user-entered data still in wizard_data)
  const ddAdj = wizardData.ddAdjustments as Record<string, unknown> | undefined;
  const adjustments = (ddAdj?.adjustments || []) as Array<{
    description?: string;
    label?: string;
    name?: string;
    amount?: number;
    periodValues?: Record<string, number>;
    block?: string;
    intent?: string;
    category?: string;
    approved?: boolean;
  }>;

  // Compute total amount for each adjustment (sum periodValues if available)
  const withTotals = adjustments.map(adj => ({
    ...adj,
    totalAmount: signedAdjustmentTotal(adj),
  }));

  const sortedAdjustments = [...withTotals]
    .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount))
    .slice(0, 8);

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD", 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(Math.abs(value));
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Top Adjustments
          <Badge variant="secondary" className="font-normal">
            {adjustments.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          {sortedAdjustments.length > 0 ? (
            <div className="space-y-3">
              {sortedAdjustments.map((adj, index) => (
                <div 
                  key={index} 
                  className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${adj.totalAmount >= 0 ? "bg-chart-2/20 text-chart-2" : "bg-chart-1/20 text-chart-1"}`}>
                      {adj.totalAmount >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{adj.description || adj.label || adj.name || "Adjustment"}</div>
                      {(adj.block || adj.category) && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {adj.block || adj.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${adj.totalAmount >= 0 ? "text-chart-2" : "text-chart-1"}`}>
                      {formatCurrency(adj.totalAmount)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {adj.approved ? (
                        <CheckCircle className="w-3 h-3 text-chart-2" />
                      ) : (
                        <XCircle className="w-3 h-3 text-muted-foreground" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {adj.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No adjustments recorded yet
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
