import { useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { QuickBooksSyncBadge } from "../shared/QuickBooksSyncBadge";
import { toast } from "@/hooks/use-toast";
import type { ProjectData } from "@/pages/Project";
import { 
  extractFinancialLabelsFromCOA, 
  hasCoaData, 
  getCoaAccounts, 
  getCoaSyncInfo,
  autoPopulateFinancialLabels,
} from "@/lib/financialLabelUtils";

interface FinancialCategoryLabelsCardProps {
  project: ProjectData;
  dueDiligenceData: Record<string, unknown>;
  updateDueDiligenceData: (data: Record<string, unknown>) => void;
  onNavigate?: (phase: number, section: number) => void;
}

export function FinancialCategoryLabelsCard({
  project,
  dueDiligenceData,
  updateDueDiligenceData,
  onNavigate,
}: FinancialCategoryLabelsCardProps) {
  // Check if COA is loaded
  const hasCoa = hasCoaData(project.wizard_data as Record<string, unknown>);
  const coaAccounts = getCoaAccounts(project.wizard_data as Record<string, unknown>);
  const { syncSource, lastSyncDate } = getCoaSyncInfo(project.wizard_data as Record<string, unknown>);

  // Extract dynamic options from COA
  const dynamicLabelOptions = useMemo(() => {
    if (!hasCoa) return null;
    return extractFinancialLabelsFromCOA(coaAccounts);
  }, [hasCoa, coaAccounts]);

  // All IS categories as fallback pool
  const allISCategories = dynamicLabelOptions?.allIncomeStatementCategories || [];

  // Build options with fallback to all IS categories when specific match is empty
  const buildOptions = (primary: string[] | undefined) => ({
    options: (primary?.length ?? 0) > 0 ? primary! : allISCategories,
    isFallback: (primary?.length ?? 0) === 0 && allISCategories.length > 0
  });

  const salesOptions = buildOptions(dynamicLabelOptions?.salesLabel);
  const cogsOptions = buildOptions(dynamicLabelOptions?.cogsLabel);
  const expenseOptions = buildOptions(dynamicLabelOptions?.expenseLabels);
  const interestOptions = buildOptions(dynamicLabelOptions?.interestLabel);
  const depreciationOptions = buildOptions(dynamicLabelOptions?.depreciationLabel);
  const taxesOptions = buildOptions(dynamicLabelOptions?.taxesLabel);

  // Track if we've already auto-populated for this COA
  const hasAutoPopulatedRef = useRef(false);
  const prevCoaAccountsLength = useRef(0);

  // Auto-populate labels when COA data becomes available
  useEffect(() => {
    if (!hasCoa || !dynamicLabelOptions) return;
    
    // Detect if COA just loaded (accounts length changed from 0 to >0)
    const coaJustLoaded = coaAccounts.length > 0 && prevCoaAccountsLength.current === 0;
    prevCoaAccountsLength.current = coaAccounts.length;
    
    if (!coaJustLoaded && hasAutoPopulatedRef.current) return;
    
    const existingLabels = (dueDiligenceData.financialLabels as Record<string, string>) || {};
    const { labels, autoPopulatedKeys } = autoPopulateFinancialLabels(dynamicLabelOptions, existingLabels);
    
    if (autoPopulatedKeys.length > 0) {
      updateDueDiligenceData({
        ...dueDiligenceData,
        financialLabels: labels,
      });
      
      hasAutoPopulatedRef.current = true;
      
      toast({
        title: "Financial labels configured",
        description: `Auto-selected ${autoPopulatedKeys.length} label${autoPopulatedKeys.length > 1 ? 's' : ''} from your Chart of Accounts.`,
      });
    }
  }, [hasCoa, dynamicLabelOptions, coaAccounts.length]);

  const updateLabel = (key: string, value: string) => {
    updateDueDiligenceData({
      ...dueDiligenceData,
      financialLabels: {
        ...((dueDiligenceData.financialLabels as Record<string, string>) || {}),
        [key]: value,
      },
    });
  };

  const getLabel = (key: string): string => {
    return (dueDiligenceData.financialLabels as Record<string, string>)?.[key] || "";
  };

  // Helper component for dropdowns with fallback indicator
  const LabelSelect = ({ 
    id, 
    label, 
    optionData, 
    fallbackMessage 
  }: { 
    id: string; 
    label: string; 
    optionData: { options: string[]; isFallback: boolean }; 
    fallbackMessage: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={getLabel(id)}
        onValueChange={(value) => updateLabel(id, value)}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={optionData.isFallback ? "Select from all categories..." : "Select category..."} />
        </SelectTrigger>
        <SelectContent>
          {optionData.options.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {optionData.isFallback && (
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{fallbackMessage} Showing all Income Statement categories.</span>
        </p>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Financial Category Labels
              {hasCoa && syncSource === "quickbooks" && (
                <QuickBooksSyncBadge lastSyncDate={lastSyncDate} size="sm" />
              )}
            </CardTitle>
            <CardDescription>
              {hasCoa
                ? "Select labels matching your target company's financial statements"
                : "Load Chart of Accounts to configure labels"}
            </CardDescription>
          </div>
          {hasCoa && (
            <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              COA Loaded
            </Badge>
          )}
        </div>
      </CardHeader>

      {!hasCoa ? (
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-col gap-3">
              <span>
                To configure financial labels, first load your Chart of Accounts by syncing with QuickBooks or uploading a COA file.
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onNavigate?.(2, 1)}
                >
                  Go to Chart of Accounts
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      ) : (
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <LabelSelect
              id="salesLabel"
              label="Sales / Revenue"
              optionData={salesOptions}
              fallbackMessage="No Revenue accounts found."
            />

            <LabelSelect
              id="cogsLabel"
              label="Cost of Goods Sold"
              optionData={cogsOptions}
              fallbackMessage="No COGS accounts found."
            />

            <LabelSelect
              id="operatingExpensesLabel"
              label="Operating Expenses"
              optionData={expenseOptions}
              fallbackMessage="No Operating Expenses accounts found."
            />

            <LabelSelect
              id="interestLabel"
              label="Interest Expense"
              optionData={interestOptions}
              fallbackMessage='No "Interest" accounts found.'
            />

            <LabelSelect
              id="depreciationLabel"
              label="Depreciation / Amortization"
              optionData={depreciationOptions}
              fallbackMessage='No "Depreciation" or "Amortization" accounts found.'
            />

            <LabelSelect
              id="taxesLabel"
              label="Income Taxes"
              optionData={taxesOptions}
              fallbackMessage='No "Tax" accounts found.'
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
