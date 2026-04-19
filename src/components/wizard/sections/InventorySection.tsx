import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { Package, DollarSign, BarChart3, TrendingUp } from "lucide-react";

interface InventoryData {
  items: Record<string, unknown>[];
  turnoverAnalysis: Record<string, unknown>[];
}

interface InventorySectionProps {
  data: InventoryData;
  updateData: (data: InventoryData) => void;
}

const defaultData: InventoryData = {
  items: [
    { id: 1, category: "Raw Materials", description: "", quantity: 0, unitCost: 0, totalValue: 0 },
    { id: 2, category: "Work in Progress", description: "", quantity: 0, unitCost: 0, totalValue: 0 },
    { id: 3, category: "Finished Goods", description: "", quantity: 0, unitCost: 0, totalValue: 0 },
  ],
  turnoverAnalysis: [
    { id: 1, period: "Y-2", avgInventory: 0, cogs: 0, turnover: 0, daysOnHand: 0 },
    { id: 2, period: "Y-1", avgInventory: 0, cogs: 0, turnover: 0, daysOnHand: 0 },
    { id: 3, period: "Current", avgInventory: 0, cogs: 0, turnover: 0, daysOnHand: 0 },
  ],
};

export const InventorySection = ({ data, updateData }: InventorySectionProps) => {
  const invData = { ...defaultData, ...data };

  const itemColumns = [
    { key: "category", label: "Category", type: "text" as const },
    { key: "description", label: "Description", type: "text" as const },
    { key: "quantity", label: "Quantity", type: "number" as const },
    { key: "unitCost", label: "Unit Cost", type: "currency" as const },
    { key: "totalValue", label: "Total Value", type: "currency" as const, editable: false },
  ];

  const turnoverColumns = [
    { key: "period", label: "Period", type: "text" as const, editable: false },
    { key: "avgInventory", label: "Avg Inventory", type: "currency" as const },
    { key: "cogs", label: "COGS", type: "currency" as const },
    { key: "turnover", label: "Turnover Ratio", type: "number" as const, editable: false },
    { key: "daysOnHand", label: "Days on Hand", type: "number" as const, editable: false },
  ];

  // Calculate total value for each item
  const itemsWithTotal = invData.items.map((item) => ({
    ...item,
    totalValue: ((item.quantity as number) || 0) * ((item.unitCost as number) || 0),
  }));

  // Calculate turnover metrics
  const turnoverWithCalcs = invData.turnoverAnalysis.map((period) => {
    const avgInv = (period.avgInventory as number) || 0;
    const cogs = (period.cogs as number) || 0;
    const turnover = avgInv > 0 ? cogs / avgInv : 0;
    const daysOnHand = turnover > 0 ? Math.round(365 / turnover) : 0;
    return { 
      ...period, 
      turnover: Math.round(turnover * 100) / 100, 
      daysOnHand 
    };
  });

  const totalInventoryValue = itemsWithTotal.reduce(
    (sum, item) => sum + ((item.totalValue as number) || 0),
    0
  );

  const categoryCount = new Set(invData.items.map((i) => i.category)).size;
  
  const currentTurnover = turnoverWithCalcs.find((t) => (t as Record<string, unknown>).period === "Current") as Record<string, unknown> | undefined;
  const avgTurnover = (currentTurnover?.turnover as number) || 0;
  const avgDaysOnHand = (currentTurnover?.daysOnHand as number) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Inventory</h2>
        <p className="text-muted-foreground">
          Track inventory levels, valuation, and turnover analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Inventory Value" value={totalInventoryValue} icon={DollarSign} />
        <SummaryCard title="Categories" value={String(categoryCount)} icon={Package} />
        <SummaryCard title="Turnover Ratio" value={String(avgTurnover)} icon={TrendingUp} />
        <SummaryCard title="Days on Hand" value={String(avgDaysOnHand)} icon={BarChart3} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialTable
            columns={itemColumns}
            data={itemsWithTotal}
            onDataChange={(items) => updateData({ ...invData, items })}
            newRowTemplate={{
              category: "",
              description: "",
              quantity: 0,
              unitCost: 0,
              totalValue: 0,
            }}
          />
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Inventory Value</p>
              <p className="text-xl font-bold text-primary">
                ${totalInventoryValue.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Turnover Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialTable
            columns={turnoverColumns}
            data={turnoverWithCalcs}
            onDataChange={(turnoverAnalysis) =>
              updateData({ ...invData, turnoverAnalysis })
            }
            allowAddRow={false}
            allowDeleteRow={false}
          />
          <p className="text-sm text-muted-foreground mt-4">
            Turnover Ratio = COGS / Average Inventory. Days on Hand = 365 / Turnover
            Ratio. Higher turnover indicates more efficient inventory management.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
