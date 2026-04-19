import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { Users, TrendingUp, AlertTriangle, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAutoLoadCustomers } from "@/hooks/useAutoLoadProcessedData";

interface TopCustomersData {
  customers: Record<string, unknown>[];
  totalRevenue: number;
}

interface NormalizedCustomer {
  id: number;
  rank: number;
  name: string;
  currentYear: number;
  priorYear: number;
  percentOfTotal: number;
}

interface TopCustomersSectionProps {
  projectId: string;
  data: TopCustomersData;
  updateData: (data: TopCustomersData) => void;
}

// Normalize customer data from yearlyRevenue format to currentYear/priorYear format
function normalizeCustomerData(rawData: TopCustomersData): { customers: NormalizedCustomer[]; totalRevenue: number; yearLabels: { current: string; prior: string } } {
  let detectedYears: string[] = [];
  
  const customers = (rawData.customers || []).map((c, idx) => {
    // If already has currentYear field, use as-is (manual entry format)
    if ('currentYear' in c && typeof c.currentYear === 'number') {
      return {
        id: (c.id as number) || idx + 1,
        rank: idx + 1,
        name: (c.name as string) || "",
        currentYear: c.currentYear as number,
        priorYear: (c.priorYear as number) || 0,
        percentOfTotal: (c.percentOfTotal as number) || 0,
      };
    }
    
    // Convert from yearlyRevenue format (from sync-sheet or QuickBooks)
    const yearlyRevenue = (c.yearlyRevenue as Record<string, number>) || {};
    const years = Object.keys(yearlyRevenue).sort().reverse(); // Most recent first
    
    if (years.length > 0 && detectedYears.length === 0) {
      detectedYears = years.slice(0, 2);
    }
    
    return {
      id: (c.id as number) || idx + 1,
      rank: idx + 1,
      name: (c.name as string) || "",
      currentYear: yearlyRevenue[years[0]] || 0,
      priorYear: yearlyRevenue[years[1]] || 0,
      percentOfTotal: -1, // sentinel: compute after we know totalRevenue
    };
  });
  
  // Compute percentOfTotal using the totalRevenue from rawData
  const totalRev = rawData.totalRevenue || customers.reduce((s, c) => s + c.currentYear, 0) || 1;
  customers.forEach(c => {
    if (c.percentOfTotal === -1) {
      c.percentOfTotal = totalRev ? parseFloat(((c.currentYear / totalRev) * 100).toFixed(1)) : 0;
    }
  });
  
  // Pad to 10 rows if less
  while (customers.length < 10) {
    customers.push({
      id: customers.length + 1,
      rank: customers.length + 1,
      name: "",
      currentYear: 0,
      priorYear: 0,
      percentOfTotal: 0,
    });
  }
  
  return {
    customers,
    totalRevenue: rawData.totalRevenue || 0,
    yearLabels: {
      current: detectedYears[0] || "Current Year",
      prior: detectedYears[1] || "Prior Year",
    },
  };
}

export const TopCustomersSection = ({ projectId, data, updateData }: TopCustomersSectionProps) => {
  // Auto-load from processed_data if wizard_data is empty
  useAutoLoadCustomers({
    projectId,
    data,
    updateData,
  });

  const { customers, totalRevenue, yearLabels } = normalizeCustomerData(data);

  const columns = [
    { key: "rank", label: "#", type: "number" as const, editable: false, width: "50px" },
    { key: "name", label: "Customer Name", type: "text" as const },
    { key: "currentYear", label: yearLabels.current, type: "currency" as const },
    { key: "priorYear", label: yearLabels.prior, type: "currency" as const },
    { key: "percentOfTotal", label: "% of Total", type: "number" as const },
  ];

  const topCustomerRevenue = customers.reduce((sum, c) => sum + (c.currentYear || 0), 0);
  const top1Revenue = customers[0]?.currentYear || 0;
  const top5Revenue = customers.slice(0, 5).reduce((sum, c) => sum + (c.currentYear || 0), 0);

  const top1Concentration = totalRevenue ? ((top1Revenue / totalRevenue) * 100).toFixed(1) : "0";
  const top5Concentration = totalRevenue ? ((top5Revenue / totalRevenue) * 100).toFixed(1) : "0";
  const top10Concentration = totalRevenue ? ((topCustomerRevenue / totalRevenue) * 100).toFixed(1) : "0";

  const chartData = customers
    .filter((c) => c.currentYear > 0)
    .slice(0, 5)
    .map((c) => ({
      name: c.name || `Customer ${c.rank}`,
      current: c.currentYear,
      prior: c.priorYear,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Top Customers by Year</h2>
        <p className="text-muted-foreground">Analyze customer concentration and revenue trends</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Top Customer" value={`${top1Concentration}%`} icon={Users} subtitle="of total revenue" />
        <SummaryCard title="Top 5 Concentration" value={`${top5Concentration}%`} icon={TrendingUp} />
        <SummaryCard title="Top 10 Concentration" value={`${top10Concentration}%`} icon={Percent} />
        <SummaryCard
          title="Concentration Risk"
          value={parseFloat(top1Concentration) > 20 ? "High" : parseFloat(top1Concentration) > 10 ? "Medium" : "Low"}
          icon={AlertTriangle}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Revenue (for % calculation)</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="number"
            value={totalRevenue || ""}
            onChange={(e) => updateData({ ...data, totalRevenue: parseFloat(e.target.value) || 0 })}
            placeholder="Enter total revenue for percentage calculations"
            className="w-full md:w-1/3 p-2 border rounded-md"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialTable
              columns={columns}
              data={customers as unknown as Record<string, unknown>[]}
              onDataChange={(newCustomers) => updateData({ ...data, customers: newCustomers })}
              allowAddRow={false}
              allowDeleteRow={false}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Customer Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <YAxis type="category" dataKey="name" width={100} />
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Bar dataKey="prior" fill="hsl(var(--muted-foreground))" name="Prior Year" />
                    <Bar dataKey="current" fill="hsl(var(--primary))" name="Current Year" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Enter customer data to see comparison
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
