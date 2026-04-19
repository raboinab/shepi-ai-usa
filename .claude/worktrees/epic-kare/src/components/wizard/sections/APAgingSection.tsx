import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { Clock, AlertTriangle, Building2, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Period } from "@/lib/periodUtils";
import { AP_AGING_CONTRACT, AGING_BUCKETS } from "@/lib/workbookContract";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { useAutoLoadApAging } from "@/hooks/useAutoLoadProcessedData";

interface APAgingEntry {
  id: number;
  vendor: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

interface APAgingPeriodData {
  periodId: string;
  entries: APAgingEntry[];
}

interface APAgingData {
  periodData: APAgingPeriodData[];
  summary: {
    totalAP: number;
    currentAP: number;
    overdueAP: number;
  };
}

interface APAgingSectionProps {
  projectId: string;
  data: APAgingData;
  updateData: (data: APAgingData) => void;
  periods?: Period[];
}

const createDefaultEntry = (id: number): APAgingEntry => ({
  id,
  vendor: "",
  current: 0,
  days1to30: 0,
  days31to60: 0,
  days61to90: 0,
  days90plus: 0,
  total: 0,
});

const createDefaultPeriodData = (periodId: string): APAgingPeriodData => ({
  periodId,
  entries: Array.from({ length: AP_AGING_CONTRACT.maxVendorsPerPeriod }, (_, i) => createDefaultEntry(i + 1)),
});

const defaultData: APAgingData = {
  periodData: [],
  summary: {
    totalAP: 0,
    currentAP: 0,
    overdueAP: 0,
  },
};

// Format "as_of_YYYY-MM" period IDs to human-readable labels
const formatAsOfPeriod = (periodId: string): string => {
  const match = periodId.match(/as_of_(\d{4})-(\d{2})/);
  if (match) {
    const date = new Date(parseInt(match[1]), parseInt(match[2]) - 1);
    return `As of ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }
  return periodId;
};

export const APAgingSection = ({ projectId, data, updateData, periods = [] }: APAgingSectionProps) => {
  const apData = { ...defaultData, ...data };

  // Auto-load from processed_data if wizard_data is empty
  useAutoLoadApAging({
    projectId,
    data: apData,
    updateData,
  });

  // Extract synced QB periods (those starting with "as_of_")
  const syncedPeriodIds = useMemo(() => {
    return apData.periodData
      .map(p => p.periodId)
      .filter(id => id.startsWith('as_of_'));
  }, [apData.periodData]);

  // Combine project periods with synced periods
  const allPeriodOptions = useMemo(() => {
    const projectOptions = periods.map(p => ({ id: p.id, label: p.label }));
    const syncedOptions = syncedPeriodIds.map(id => ({ id, label: formatAsOfPeriod(id) }));
    return [...projectOptions, ...syncedOptions];
  }, [periods, syncedPeriodIds]);

  // Determine initial selected period - prefer synced data if available
  const getInitialPeriod = () => {
    if (syncedPeriodIds.length > 0) {
      return syncedPeriodIds[syncedPeriodIds.length - 1]; // Most recent synced
    }
    if (periods.length > 0) {
      return periods[periods.length - 1].id;
    }
    return "";
  };

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  // Auto-select best period: prefer synced data, fallback to project periods
  useEffect(() => {
    if (syncedPeriodIds.length > 0) {
      // Always prefer the most recent synced period when available
      const latestSynced = syncedPeriodIds[syncedPeriodIds.length - 1];
      if (!selectedPeriodId || (!selectedPeriodId.startsWith('as_of_') && latestSynced)) {
        setSelectedPeriodId(latestSynced);
      }
    } else if (!selectedPeriodId && periods.length > 0) {
      // Fallback to project periods if no synced data
      setSelectedPeriodId(periods[periods.length - 1].id);
    }
  }, [syncedPeriodIds, periods, selectedPeriodId]);

  // Initialize period data if not exists
  const initializePeriodData = () => {
    const existingPeriodIds = new Set(apData.periodData.map((p) => p.periodId));
    const newPeriodData = [...apData.periodData];
    
    periods.forEach((period) => {
      if (!existingPeriodIds.has(period.id)) {
        newPeriodData.push(createDefaultPeriodData(period.id));
      }
    });
    
    return newPeriodData;
  };

  const periodDataWithDefaults = initializePeriodData();
  const currentPeriodData = periodDataWithDefaults.find((p) => p.periodId === selectedPeriodId) 
    || (selectedPeriodId ? createDefaultPeriodData(selectedPeriodId) : null);

  const columns = [
    { key: "vendor", label: "Vendor Name", type: "text" as const },
    { key: "current", label: "Current", type: "currency" as const },
    { key: "days1to30", label: "1-30 Days", type: "currency" as const },
    { key: "days31to60", label: "31-60 Days", type: "currency" as const },
    { key: "days61to90", label: "61-90 Days", type: "currency" as const },
    { key: "days90plus", label: "90+ Days", type: "currency" as const },
    { key: "total", label: "Total", type: "currency" as const, editable: false },
  ];

  // Calculate totals for current period
  const calculateTotals = (entries: APAgingEntry[]) => {
    const entriesWithTotals = entries.map((entry) => ({
      ...entry,
      total: entry.current + entry.days1to30 + entry.days31to60 + entry.days61to90 + entry.days90plus,
    }));

    const totalAP = entriesWithTotals.reduce((sum, e) => sum + e.total, 0);
    const currentAP = entriesWithTotals.reduce((sum, e) => sum + e.current, 0);
    const overdueAP = totalAP - currentAP;

    return { entriesWithTotals, totalAP, currentAP, overdueAP };
  };

  const { entriesWithTotals, totalAP, currentAP, overdueAP } = currentPeriodData 
    ? calculateTotals(currentPeriodData.entries) 
    : { entriesWithTotals: [], totalAP: 0, currentAP: 0, overdueAP: 0 };

  const overduePercentage = totalAP ? ((overdueAP / totalAP) * 100).toFixed(1) : "0";

  // Chart data - aging distribution
  const chartData = AGING_BUCKETS.map((bucket) => ({
    bucket: bucket.label,
    amount: entriesWithTotals.reduce((sum, e) => sum + ((e[bucket.key as keyof APAgingEntry] as number) || 0), 0),
  }));

  // Top vendors by AP balance
  const topVendors = [...entriesWithTotals]
    .filter((e) => e.vendor && e.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topVendorTotal = topVendors.reduce((sum, v) => sum + v.total, 0);
  const concentration = totalAP ? ((topVendorTotal / totalAP) * 100).toFixed(1) : "0";

  const handleDataChange = (newEntries: Record<string, unknown>[]) => {
    if (!selectedPeriodId) return;

    const updatedPeriodData = periodDataWithDefaults.map((pd) => {
      if (pd.periodId === selectedPeriodId) {
        return { ...pd, entries: newEntries as unknown as APAgingEntry[] };
      }
      return pd;
    });

    // Add new period if doesn't exist
    if (!updatedPeriodData.find((p) => p.periodId === selectedPeriodId)) {
      updatedPeriodData.push({
        periodId: selectedPeriodId,
        entries: newEntries as unknown as APAgingEntry[],
      });
    }

    updateData({
      ...apData,
      periodData: updatedPeriodData,
      summary: { totalAP, currentAP, overdueAP },
    });
  };

  // Get display label for selected period
  const getSelectedPeriodLabel = () => {
    const projectPeriod = periods.find((p) => p.id === selectedPeriodId);
    if (projectPeriod) return projectPeriod.label;
    if (selectedPeriodId.startsWith('as_of_')) return formatAsOfPeriod(selectedPeriodId);
    return "Select Period";
  };

  // Show message if no periods configured AND no synced data
  if (periods.length === 0 && syncedPeriodIds.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-serif font-bold">AP Aging</h2>
          <p className="text-muted-foreground">Analyze accounts payable aging by period</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Please configure periods in the Company Information section first, or sync data from QuickBooks.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">AP Aging</h2>
          <p className="text-muted-foreground">Analyze accounts payable aging and vendor concentration</p>
        </div>
        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {allPeriodOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total AP" value={totalAP} icon={Clock} />
        <SummaryCard title="Overdue AP" value={overdueAP} icon={AlertTriangle} subtitle={`${overduePercentage}% of total`} />
        <SummaryCard title="Top 5 Concentration" value={`${concentration}%`} icon={Building2} />
        <SummaryCard title="Current AP" value={currentAP} icon={Percent} subtitle="Not yet due" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              AP Aging - {getSelectedPeriodLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <FinancialTable
                columns={columns}
                data={entriesWithTotals}
                onDataChange={handleDataChange}
                allowAddRow={entriesWithTotals.length < AP_AGING_CONTRACT.maxVendorsPerPeriod}
                allowDeleteRow={false}
              />
            </div>
            <div className="mt-4 text-right">
              <p className="text-sm text-muted-foreground">Total Accounts Payable</p>
              <p className="text-xl font-bold">${totalAP.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aging Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="bucket" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Amount"]} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Vendors by AP Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {topVendors.length > 0 ? (
            <div className="space-y-2">
              {topVendors.map((vendor, index) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground">#{index + 1}</span>
                    <span>{vendor.vendor}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${vendor.total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {totalAP ? ((vendor.total / totalAP) * 100).toFixed(1) : 0}% of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Enter vendor data to see top vendors</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
