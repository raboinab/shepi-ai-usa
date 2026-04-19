import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface SyncedSection {
  key: string;
  label: string;
  count?: number;
  countLabel?: string;
}

interface QuickBooksSyncSummaryProps {
  wizardData: Record<string, unknown>;
}

const SYNCABLE_SECTIONS: SyncedSection[] = [
  { key: "chartOfAccounts", label: "Chart of Accounts", countLabel: "accounts" },
  { key: "trialBalance", label: "Trial Balance", countLabel: "line items" },
  { key: "arAging", label: "AR Aging", countLabel: "customers" },
  { key: "apAging", label: "AP Aging", countLabel: "vendors" },
  { key: "topCustomers", label: "Top Customers", countLabel: "entries" },
  { key: "topVendors", label: "Top Vendors", countLabel: "entries" },
  { key: "fixedAssets", label: "Fixed Assets", countLabel: "assets" },
  { key: "inventory", label: "Inventory", countLabel: "items" },
];

function getSectionSyncInfo(sectionData: unknown): { synced: boolean; lastSyncDate?: string; count: number } {
  if (!sectionData || typeof sectionData !== "object") {
    return { synced: false, count: 0 };
  }

  const data = sectionData as Record<string, unknown>;
  
  // Check for sync indicators
  const hasSyncSource = data.syncSource === "quickbooks";
  const hasLastSyncDate = !!data.lastSyncDate;
  const synced = hasSyncSource || hasLastSyncDate;

  // Calculate count based on section structure
  let count = 0;
  if (Array.isArray(data.accounts)) count = data.accounts.length;
  else if (Array.isArray(data.customers)) count = data.customers.length;
  else if (Array.isArray(data.vendors)) count = data.vendors.length;
  else if (Array.isArray(data.assets)) count = data.assets.length;
  else if (Array.isArray(data.items)) count = data.items.length;
  else if (Array.isArray(data.periodData)) {
    // For aging reports, count entries in first period
    const firstPeriod = data.periodData[0] as Record<string, unknown> | undefined;
    if (firstPeriod && Array.isArray(firstPeriod.entries)) {
      count = (firstPeriod.entries as unknown[]).filter((e: unknown) => {
        const entry = e as Record<string, unknown>;
        return entry.customer || entry.vendor;
      }).length;
    }
  }

  return {
    synced,
    lastSyncDate: data.lastSyncDate as string | undefined,
    count,
  };
}

export function QuickBooksSyncSummary({ wizardData }: QuickBooksSyncSummaryProps) {
  const syncedSections = SYNCABLE_SECTIONS.map(section => {
    const info = getSectionSyncInfo(wizardData[section.key]);
    return {
      ...section,
      ...info,
    };
  }).filter(s => s.synced);

  if (syncedSections.length === 0) {
    return null;
  }

  // Get the most recent sync date
  const lastSyncDates = syncedSections
    .filter(s => s.lastSyncDate)
    .map(s => new Date(s.lastSyncDate!).getTime());
  
  const mostRecentSync = lastSyncDates.length > 0 
    ? format(new Date(Math.max(...lastSyncDates)), "MMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <Card className="border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-green-800 dark:text-green-300">
          <RefreshCw className="h-4 w-4" />
          QuickBooks Data
          {mostRecentSync && (
            <span className="text-xs font-normal text-green-600 dark:text-green-400 ml-auto">
              Last synced: {mostRecentSync}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {syncedSections.map(section => (
            <div 
              key={section.key} 
              className="flex items-center gap-2 text-sm py-1.5 px-2 rounded bg-green-100/50 dark:bg-green-900/20"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="truncate text-green-800 dark:text-green-300">{section.label}</span>
              {section.count > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400 ml-auto">
                  ({section.count})
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
