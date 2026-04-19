import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, AlertTriangle, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAutoLoadVendors } from "@/hooks/useAutoLoadProcessedData";

interface TopVendorsData {
  vendors: Record<string, unknown>[];
  totalSpend: number;
}

interface NormalizedVendor {
  id: number;
  rank: number;
  name: string;
  currentYear: number;
  priorYear: number;
  percentOfTotal: number;
  isRelatedParty: boolean;
}

interface TopVendorsSectionProps {
  projectId: string;
  data: TopVendorsData;
  updateData: (data: TopVendorsData) => void;
}

// Normalize vendor data from yearlySpend format to currentYear/priorYear format
function normalizeVendorData(rawData: TopVendorsData): { vendors: NormalizedVendor[]; totalSpend: number; yearLabels: { current: string; prior: string } } {
  let detectedYears: string[] = [];
  
  const vendors = (rawData.vendors || []).map((v, idx) => {
    // If already has currentYear field, use as-is (manual entry format)
    if ('currentYear' in v && typeof v.currentYear === 'number') {
      return {
        id: (v.id as number) || idx + 1,
        rank: idx + 1,
        name: (v.name as string) || "",
        currentYear: v.currentYear as number,
        priorYear: (v.priorYear as number) || 0,
        percentOfTotal: (v.percentOfTotal as number) || 0,
        isRelatedParty: (v.isRelatedParty as boolean) || false,
      };
    }
    
    // Convert from yearlySpend format (from sync-sheet or QuickBooks)
    const yearlySpend = (v.yearlySpend as Record<string, number>) || {};
    const years = Object.keys(yearlySpend).sort().reverse(); // Most recent first
    
    if (years.length > 0 && detectedYears.length === 0) {
      detectedYears = years.slice(0, 2);
    }
    
    return {
      id: (v.id as number) || idx + 1,
      rank: idx + 1,
      name: (v.name as string) || "",
      currentYear: yearlySpend[years[0]] || 0,
      priorYear: yearlySpend[years[1]] || 0,
      percentOfTotal: -1, // sentinel: compute after we know totalSpend
      isRelatedParty: (v.isRelatedParty as boolean) || false,
    };
  });

  // Compute percentOfTotal using the totalSpend from rawData
  const totalSpendVal = rawData.totalSpend || vendors.reduce((s, v) => s + v.currentYear, 0) || 1;
  vendors.forEach(v => {
    if (v.percentOfTotal === -1) {
      v.percentOfTotal = totalSpendVal ? parseFloat(((v.currentYear / totalSpendVal) * 100).toFixed(1)) : 0;
    }
  });
  
  // Pad to 10 rows if less
  while (vendors.length < 10) {
    vendors.push({
      id: vendors.length + 1,
      rank: vendors.length + 1,
      name: "",
      currentYear: 0,
      priorYear: 0,
      percentOfTotal: 0,
      isRelatedParty: false,
    });
  }
  
  return {
    vendors,
    totalSpend: rawData.totalSpend || 0,
    yearLabels: {
      current: detectedYears[0] || "Current Year",
      prior: detectedYears[1] || "Prior Year",
    },
  };
}

export const TopVendorsSection = ({ projectId, data, updateData }: TopVendorsSectionProps) => {
  // Auto-load from processed_data if wizard_data is empty
  useAutoLoadVendors({
    projectId,
    data,
    updateData,
  });

  const { vendors, totalSpend, yearLabels } = normalizeVendorData(data);

  const columns = [
    { key: "rank", label: "#", type: "number" as const, editable: false, width: "50px" },
    { key: "name", label: "Vendor Name", type: "text" as const },
    { key: "currentYear", label: yearLabels.current, type: "currency" as const },
    { key: "priorYear", label: yearLabels.prior, type: "currency" as const },
    { key: "percentOfTotal", label: "% of Total", type: "number" as const },
  ];

  const topVendorSpend = vendors.reduce((sum, v) => sum + (v.currentYear || 0), 0);
  const top1Spend = vendors[0]?.currentYear || 0;
  const top5Spend = vendors.slice(0, 5).reduce((sum, v) => sum + (v.currentYear || 0), 0);

  const top1Concentration = totalSpend ? ((top1Spend / totalSpend) * 100).toFixed(1) : "0";
  const top5Concentration = totalSpend ? ((top5Spend / totalSpend) * 100).toFixed(1) : "0";
  const top10Concentration = totalSpend ? ((topVendorSpend / totalSpend) * 100).toFixed(1) : "0";

  const relatedPartyVendors = vendors.filter((v) => v.isRelatedParty);
  const relatedPartySpend = relatedPartyVendors.reduce((sum, v) => sum + (v.currentYear || 0), 0);

  const chartData = vendors
    .filter((v) => v.currentYear > 0)
    .slice(0, 5)
    .map((v) => ({
      name: v.name || `Vendor ${v.rank}`,
      current: v.currentYear,
      prior: v.priorYear,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Top Vendors by Year</h2>
        <p className="text-muted-foreground">Analyze vendor concentration and related party transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Top Vendor" value={`${top1Concentration}%`} icon={Building2} subtitle="of total spend" />
        <SummaryCard title="Top 5 Concentration" value={`${top5Concentration}%`} icon={TrendingUp} />
        <SummaryCard title="Top 10 Concentration" value={`${top10Concentration}%`} icon={Percent} />
        <SummaryCard
          title="Related Party Spend"
          value={relatedPartySpend}
          icon={AlertTriangle}
          subtitle={`${relatedPartyVendors.length} vendors`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Vendor Spend (for % calculation)</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="number"
            value={totalSpend || ""}
            onChange={(e) => updateData({ ...data, totalSpend: parseFloat(e.target.value) || 0 })}
            placeholder="Enter total vendor spend for percentage calculations"
            className="w-full md:w-1/3 p-2 border rounded-md"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top 10 Vendors
              {relatedPartyVendors.length > 0 && (
                <Badge variant="destructive">{relatedPartyVendors.length} Related Party</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FinancialTable
              columns={columns}
              data={vendors as unknown as Record<string, unknown>[]}
              onDataChange={(newVendors) => updateData({ ...data, vendors: newVendors })}
              allowAddRow={false}
              allowDeleteRow={false}
            />
            <p className="text-sm text-muted-foreground mt-4">
              Flag related party vendors by updating the vendor data with isRelatedParty: true
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Vendor Comparison</CardTitle>
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
                  Enter vendor data to see comparison
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
