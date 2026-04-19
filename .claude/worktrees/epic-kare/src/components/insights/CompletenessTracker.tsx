import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getAllSectionStatuses, getCategories, checkHasData } from "@/lib/dataCompleteness";
import { supabase } from "@/integrations/supabase/client";

// Maps camelCase wizardDataKey to snake_case processed_data.data_type
const WIZARD_KEY_TO_DATA_TYPE: Record<string, string> = {
  journalEntries: "journal_entries",
  arAging: "ar_aging",
  apAging: "ap_aging",
  topCustomers: "customer_concentration",
  topVendors: "vendor_concentration",
  incomeStatement: "income_statement",
  balanceSheet: "balance_sheet",
  trialBalance: "trial_balance",
  chartOfAccounts: "chart_of_accounts",
  generalLedger: "general_ledger",
  fixedAssets: "fixed_assets",
  inventory: "inventory",
  payroll: "payroll",
};

interface CompletenessTrackerProps {
  wizardData: Record<string, unknown>;
  computedReports?: Record<string, { rawData?: string[][] }>;
  projectId?: string;
}

export const CompletenessTracker = ({ wizardData, computedReports, projectId }: CompletenessTrackerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [processedDataTypes, setProcessedDataTypes] = useState<Set<string>>(new Set());

  // Fetch distinct data_type values from processed_data for this project
  useEffect(() => {
    if (!projectId) return;
    const fetchTypes = async () => {
      const { data } = await supabase
        .from("processed_data")
        .select("data_type")
        .eq("project_id", projectId);
      if (data) {
        setProcessedDataTypes(new Set(data.map(r => r.data_type)));
      }
    };
    fetchTypes();
  }, [projectId]);

  // Merge computed report presence and processed_data into wizard data for status checks
  const sections = getAllSectionStatuses(wizardData).map(section => {
    if (!section.hasData && computedReports) {
      const reportData = computedReports[section.key];
      if (reportData?.rawData && reportData.rawData.length > 1) {
        return { ...section, hasData: true };
      }
    }
    // Fallback: check processed_data types
    if (!section.hasData) {
      const mappedType = WIZARD_KEY_TO_DATA_TYPE[section.key];
      if (mappedType && processedDataTypes.has(mappedType)) {
        return { ...section, hasData: true };
      }
    }
    return section;
  });

  const completedCount = sections.filter(s => s.hasData).length;
  const progressPercent = (completedCount / sections.length) * 100;
  const categories = getCategories();

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Data Completeness
              </CardTitle>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {completedCount}/{sections.length} sections
                </span>
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CardContent className="pt-0">
          <Progress value={progressPercent} className="h-2 mb-2" />
          <div className="text-xs text-muted-foreground mb-3">
            {progressPercent.toFixed(0)}% complete
          </div>

          <CollapsibleContent>
            <div className="space-y-4 pt-2 border-t">
              {categories.map(category => {
                const categorySections = sections.filter(s => s.category === category);
                const categoryComplete = categorySections.filter(s => s.hasData).length;
                
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{category}</span>
                      <span className="text-xs text-muted-foreground">
                        {categoryComplete}/{categorySections.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {categorySections.map(section => (
                        <div 
                          key={section.key}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                            section.hasData ? "text-chart-2 bg-chart-2/10" : "text-muted-foreground bg-muted/30"
                          )}
                        >
                          {section.hasData ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <Circle className="w-3 h-3" />
                          )}
                          {section.label}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Collapsible>
    </Card>
  );
};
