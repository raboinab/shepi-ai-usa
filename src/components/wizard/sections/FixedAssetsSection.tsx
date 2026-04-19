import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FinancialTable } from "../shared/FinancialTable";
import { SummaryCard } from "../shared/SummaryCard";
import { FixedAssetsImportDialog } from "../shared/FixedAssetsImportDialog";
import { Building, TrendingDown, Wrench, DollarSign, Download, Edit3, FileSpreadsheet, Info, ChevronDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FixedAssetsData {
  assets: Record<string, unknown>[];
  capexAnalysis: Record<string, unknown>[];
}

interface BalanceSheetData {
  fixedAssets?: Array<{ account: string; values: Record<string, number> }>;
}

interface FixedAssetsSectionProps {
  data: FixedAssetsData;
  updateData: (data: FixedAssetsData) => void;
  projectId: string;
  periods?: string[];
  balanceSheetData?: BalanceSheetData;
}

const defaultData: FixedAssetsData = {
  assets: [
    { id: 1, description: "Land", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "N/A", method: "N/A" },
    { id: 2, description: "Buildings", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "39 years", method: "Straight-Line" },
    { id: 3, description: "Machinery & Equipment", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "7 years", method: "MACRS 7-Year" },
    { id: 4, description: "Furniture & Fixtures", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "5 years", method: "Straight-Line" },
    { id: 5, description: "Vehicles", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "5 years", method: "MACRS 5-Year" },
    { id: 6, description: "Computer Equipment", cost: 0, accumDepr: 0, nbv: 0, usefulLife: "3 years", method: "MACRS 5-Year" },
  ],
  capexAnalysis: [],
};

const getDefaultCapexAnalysis = (periods: string[]) => {
  if (periods && periods.length > 0) {
    return periods.map((period, index) => ({
      id: index + 1,
      period,
      capex: 0,
      maintenance: 0,
    }));
  }
  return [
    { id: 1, period: "Y-2", capex: 0, maintenance: 0 },
    { id: 2, period: "Y-1", capex: 0, maintenance: 0 },
    { id: 3, period: "Current", capex: 0, maintenance: 0 },
  ];
};

export const FixedAssetsSection = ({ 
  data, 
  updateData, 
  projectId, 
  periods = [],
  balanceSheetData 
}: FixedAssetsSectionProps) => {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  
  // Initialize capex analysis with dynamic periods if not already set
  const initializeCapexAnalysis = () => {
    if (!data.capexAnalysis || data.capexAnalysis.length === 0) {
      return getDefaultCapexAnalysis(periods);
    }
    return data.capexAnalysis;
  };

  const faData = { 
    ...defaultData, 
    ...data,
    capexAnalysis: initializeCapexAnalysis()
  };

  const assetColumns = [
    { key: "description", label: "Asset Class", type: "text" as const },
    { key: "cost", label: "Cost", type: "currency" as const },
    { key: "accumDepr", label: "Accum. Depr.", type: "currency" as const },
    { key: "nbv", label: "Net Book Value", type: "currency" as const, editable: false },
    { key: "usefulLife", label: "Useful Life", type: "text" as const },
    { key: "method", label: "Depr. Method", type: "text" as const },
  ];

  const capexColumns = [
    { key: "period", label: "Period", type: "text" as const, editable: false },
    { key: "capex", label: "Capital Expenditure", type: "currency" as const },
    { key: "maintenance", label: "R&M Expense", type: "currency" as const },
  ];

  // Calculate NBV for each asset
  const assetsWithNBV = faData.assets.map((asset) => ({
    ...asset,
    nbv: ((asset.cost as number) || 0) - ((asset.accumDepr as number) || 0),
  }));

  const totalCost = faData.assets.reduce((sum, asset) => sum + ((asset.cost as number) || 0), 0);
  const totalAccumDepr = faData.assets.reduce((sum, asset) => sum + ((asset.accumDepr as number) || 0), 0);
  const totalNBV = totalCost - totalAccumDepr;

  const capexData = faData.capexAnalysis as Array<{ id: number; period: string; capex: number; maintenance: number }>;
  const avgCapex = capexData.length > 0 
    ? capexData.reduce((sum, p) => sum + (p.capex || 0), 0) / capexData.length
    : 0;
  const avgMaintenance = capexData.length > 0
    ? capexData.reduce((sum, p) => sum + (p.maintenance || 0), 0) / capexData.length
    : 0;

  // Check if data has been entered
  const hasData = totalCost > 0 || totalAccumDepr > 0;
  
  // Check if balance sheet data is available
  const hasBalanceSheetData = balanceSheetData?.fixedAssets && balanceSheetData.fixedAssets.length > 0;

  const handleImport = (importedData: { assets: Array<{ id: number; description: string; cost: number; accumDepr: number; usefulLife: string }> }) => {
    // Merge imported assets with existing capex analysis, adding default method
    const assetsWithMethod = importedData.assets.map(asset => ({
      ...asset,
      method: asset.description === "Land" ? "N/A" : "Straight-Line"
    }));
    
    updateData({
      assets: assetsWithMethod,
      capexAnalysis: faData.capexAnalysis,
    });
  };

  const handlePullFromBalanceSheet = () => {
    if (!balanceSheetData?.fixedAssets) return;

    // Get the most recent period's values
    const mostRecentPeriod = periods[periods.length - 1] || "current";
    
    let totalFixedAssetsCost = 0;
    let totalAccumulatedDepr = 0;

    balanceSheetData.fixedAssets.forEach(item => {
      const value = item.values[mostRecentPeriod] || 0;
      const accountLower = item.account.toLowerCase();
      
      if (accountLower.includes("accumulated") || accountLower.includes("accum")) {
        totalAccumulatedDepr += Math.abs(value);
      } else {
        totalFixedAssetsCost += value;
      }
    });

    // Create a summary entry
    const summaryAsset = {
      id: 1,
      description: "Fixed Assets (from Balance Sheet)",
      cost: totalFixedAssetsCost,
      accumDepr: totalAccumulatedDepr,
      nbv: totalFixedAssetsCost - totalAccumulatedDepr,
      usefulLife: "Various",
      method: "Various"
    };

    updateData({
      assets: [summaryAsset],
      capexAnalysis: faData.capexAnalysis,
    });

    setShowGuidance(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Fixed Assets</h2>
          <p className="text-muted-foreground">Track fixed assets, depreciation, and capital expenditure analysis</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Import from Document
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <Edit3 className="h-4 w-4" />
                Enter Manually
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowGuidance(true)}>
                <Info className="h-4 w-4 mr-2" />
                Show Entry Guide
              </DropdownMenuItem>
              {hasBalanceSheetData && (
                <DropdownMenuItem onClick={handlePullFromBalanceSheet}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Pull Totals from Balance Sheet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Manual Entry Guidance Card */}
      {(showGuidance || (!hasData && !importDialogOpen)) && (
        <Alert className="bg-muted/50 border-primary/20">
          <Edit3 className="h-4 w-4" />
          <AlertTitle>Manual Entry Mode</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              No depreciation schedule from QuickBooks? No problem. Fixed asset schedules are only available 
              in QuickBooks Online Advanced, but you can still complete this section:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Edit values directly in the table below</li>
              <li>Add custom asset classes with the <strong>+ Add Row</strong> button</li>
              <li>Net Book Value calculates automatically (Cost − Accum. Depreciation)</li>
              <li>Common depreciation methods are pre-populated</li>
            </ul>
            {hasBalanceSheetData && (
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePullFromBalanceSheet}
                  className="gap-2"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Pull Totals from Balance Sheet
                </Button>
                <span className="text-sm text-muted-foreground ml-2">
                  Quick-start with summary totals
                </span>
              </div>
            )}
            <div className="pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowGuidance(false)}
              >
                Dismiss
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="Total Cost" value={totalCost} icon={Building} />
        <SummaryCard title="Accum. Depreciation" value={totalAccumDepr} icon={TrendingDown} />
        <SummaryCard title="Net Book Value" value={totalNBV} icon={DollarSign} />
        <SummaryCard title="Avg Annual CapEx" value={avgCapex} icon={Wrench} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fixed Asset Register</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialTable
            columns={assetColumns}
            data={assetsWithNBV}
            onDataChange={(assets) => updateData({ ...faData, assets })}
            newRowTemplate={{ description: "New Asset Class", cost: 0, accumDepr: 0, usefulLife: "", method: "Straight-Line" }}
          />
          <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-lg font-semibold">${totalCost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Accumulated Depreciation</p>
              <p className="text-lg font-semibold">${totalAccumDepr.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Net Book Value</p>
              <p className="text-xl font-bold text-primary">${totalNBV.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CapEx vs. R&M Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <FinancialTable
            columns={capexColumns}
            data={faData.capexAnalysis}
            onDataChange={(capexAnalysis) => updateData({ ...faData, capexAnalysis })}
            allowAddRow={false}
            allowDeleteRow={false}
          />
          <div className="mt-4 grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Average Annual CapEx</p>
              <p className="text-xl font-bold">${avgCapex.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Annual R&M</p>
              <p className="text-xl font-bold">${avgMaintenance.toLocaleString()}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Compare capital expenditures to repairs & maintenance to assess whether expenses are being appropriately capitalized.
          </p>
        </CardContent>
      </Card>

      <FixedAssetsImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        projectId={projectId}
        onImport={handleImport}
      />
    </div>
  );
};
