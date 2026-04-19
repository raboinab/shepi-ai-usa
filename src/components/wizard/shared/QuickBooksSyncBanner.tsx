import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface QuickBooksSyncBannerProps {
  lastSyncDate?: string;
  recordCount?: number;
  recordLabel?: string;
}

export function QuickBooksSyncBanner({ lastSyncDate, recordCount, recordLabel = "records" }: QuickBooksSyncBannerProps) {
  if (!lastSyncDate) return null;

  const formattedDate = format(new Date(lastSyncDate), "MMM d, yyyy 'at' h:mm a");

  return (
    <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
      <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertDescription className="text-green-800 dark:text-green-300">
        This data was synced from QuickBooks on <span className="font-medium">{formattedDate}</span>
        {recordCount !== undefined && recordCount > 0 && (
          <> — {recordCount} {recordLabel}</>
        )}
      </AlertDescription>
    </Alert>
  );
}
