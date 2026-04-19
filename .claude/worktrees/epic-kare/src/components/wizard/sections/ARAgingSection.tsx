import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { Clock, AlertTriangle, Users, Percent } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Period } from "@/lib/periodUtils";
import { AR_AGING_CONTRACT, AGING_BUCKETS } from "@/lib/workbookContract";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { useAutoLoadArAging } from "@/hooks/useAutoLoadProcessedData";

interface ARAgingEntry {
  id: number;
  customer: string;
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  days90plus: number;
  total: number;
}

interface ARAgingPeriodData {
  periodId: string;
  entries: ARAgingEntry[];
}

interface ARAgingData {
  periodData: ARAgingPeriodData[];
  badDebtReserve: number;
}

interface ARAgingSectionProps {
  projectId: string;
  data: ARAgingData;
  updateData: (data: ARAgingData) => void;
  periods?: Period[];
}

const createDefaultEntry = (id: number): ARAgingEntry => ({
  id,
  customer: "",
  current: 0,
  days1to30: 0,
  days31to60: 0,
  days61to90: 0,
  days90plus: 0,
  total: 0,
});

const createDefaultPeriodData = (periodId: string): ARAgingPeriodData => ({
  periodId,
  entries: Array.from({ length: AR_AGING_CONTRACT.maxCustomersPerPeriod }, (_, i) => createDefaultEntry(i + 1)),
});

const defaultData: ARAgingData = {
  periodData: [],
  badDebtReserve: 0,
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

export const ARAgingSection = ({ projectId, data, updateData, periods = [] }: ARAgingSectionProps) => {
  const arData = { ...defaultData, ...data };

  // Auto-load from processed_data if wizard_data is empty
  useAutoLoadArAging({
    projectId,
    data: arData,
    updateData,
  });

  // Extract synced QB periods (those starting with "as_of_")
  const syncedPeriodIds = useMemo(() => {
    return arData.periodData
      .map(p => p.periodId)
      .filter(id => id.startsWith('as_of_'));
  }, [arData.periodData]);

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
    const existingPeriodIds = new Set(arData.periodData.map((p) => p.periodId));
    const newPeriodData = [...arData.periodData];

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
    { key: "customer", label: "Customer Name", type: "text" as const },
    { key: "current", label: "Current", type: "currency" as const },
    { key: "days1to30", label: "1-30 Days", type: "currency" as const },
    { key: "days31to60", label: "31-60 Days", type: "currency" as const },
    { key: "days61to90", label: "61-90 Days", type: "currency" as const },
    { key: "days90plus", label: "90+ Days", type: "currency" as const },
    { key: "total", label: "Total", type: "currency" as const, editable: false },
  ];

  // Calculate totals for current period
  const calculateTotals = (entries: ARAgingEntry[]) => {
    const entriesWithTotals = entries.map((entry) => ({
      ...entry,
      total: entry.current + entry.days1to30 + entry.days31to60 + entry.days61to90 + entry.days90plus,
    }));

    const totalAR = entriesWithTotals.reduce((sum, e) => sum + e.total, 0);
    const currentAR = entriesWithTotals.reduce((sum, e) => sum + e.current, 0);
    const overdueAR = totalAR - currentAR;

    return { entriesWithTotals, totalAR, currentAR, overdueAR };
  };

  const { entriesWithTotals, totalAR, currentAR, overdueAR } = currentPeriodData
    ? calculateTotals(currentPeriodData.entries)
    : { entriesWithTotals: [], totalAR: 0, currentAR: 0, overdueAR: 0 };

  const overduePercentage = totalAR ? ((overdueAR / totalAR) * 100).toFixed(1) : "0";

  // Chart data - aging distribution
  const chartData = AGING_BUCKETS.map((bucket) => ({
    bucket: bucket.label,
    amount: entriesWithTotals.reduce((sum, e) => sum + ((e[bucket.key as keyof ARAgingEntry] as number) || 0), 0),
  }));

  // Top customers by AR balance
  const topCustomers = [...entriesWithTotals]
    .filter((e) => e.customer && e.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topCustomerTotal = topCustomers.reduce((sum, c) => sum + c.total, 0);
  const concentration = totalAR ? ((topCustomerTotal / totalAR) * 100).toFixed(1) : "0";

  const handleDataChange = (newEntries: Record<string, unknown>[]) => {
    if (!selectedPeriodId) return;

    const updatedPeriodData = periodDataWithDefaults.map((pd) => {
      if (pd.periodId === selectedPeriodId) {
        return { ...pd, entries: newEntries as unknown as ARAgingEntry[] };
      }
      return pd;
    });

    // Add new period if doesn't exist
    if (!updatedPeriodData.find((p) => p.periodId === selectedPeriodId)) {
      updatedPeriodData.push({
        periodId: selectedPeriodId,
        entries: newEntries as unknown as ARAgingEntry[],
      });
    }

    updateData({
      ...arData,
      periodData: updatedPeriodData,
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
          <h2 className="text-2xl font-serif font-bold">AR Aging</h2>
          <p className="text-muted-foreground">Analyze accounts receivable aging by period</p>
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
          <h2 className="text-2xl font-serif font-bold">AR Aging</h2>
          <p className="text-muted-foreground">Analyze accounts receivable aging and customer concentration</p>
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
        <SummaryCard title="Total AR" value={totalAR} icon={Clock} />
        <SummaryCard title="Overdue AR" value={overdueAR} icon={AlertTriangle} subtitle={`${overduePercentage}% of total`} />
        <SummaryCard title="Top 5 Concentration" value={`${concentration}%`} icon={Users} />
        <SummaryCard title="Bad Debt Reserve" value={arData.badDebtReserve} icon={Percent} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              AR Aging - {getSelectedPeriodLabel()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <FinancialTable
                columns={columns}
                data={entriesWithTotals}
                onDataChange={handleDataChange}
                allowAddRow={entriesWithTotals.length < AR_AGING_CONTRACT.maxCustomersPerPeriod}
                allowDeleteRow={false}
              />
            </div>
            <div className="mt-4 text-right">
              <p className="text-sm text-muted-foreground">Total Accounts Receivable</p>
              <p className="text-xl font-bold">${totalAR.toLocaleString()}</p>
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
          <CardTitle>Top Customers by AR Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {topCustomers.length > 0 ? (
            <div className="space-y-2">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/30 rounded">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-muted-foreground">#{index + 1}</span>
                    <span>{customer.customer}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${customer.total.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {totalAR ? ((customer.total / totalAR) * 100).toFixed(1) : 0}% of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">Enter customer data to see top customers</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bad Debt Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm text-muted-foreground">Bad Debt Reserve</label>
              <input
                type="number"
                value={arData.badDebtReserve || ""}
                onChange={(e) => updateData({ ...arData, badDebtReserve: parseFloat(e.target.value) || 0 })}
                className="w-full mt-1 p-2 border rounded-md bg-background"
              />
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Reserve as % of AR</p>
              <p className="text-xl font-bold">
                {totalAR ? ((arData.badDebtReserve / totalAR) * 100).toFixed(2) : 0}%
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Net AR</p>
              <p className="text-xl font-bold">${(totalAR - arData.badDebtReserve).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
