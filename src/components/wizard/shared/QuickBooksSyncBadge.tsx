import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface QuickBooksSyncBadgeProps {
  lastSyncDate?: string;
  className?: string;
  size?: "sm" | "default";
}

export function QuickBooksSyncBadge({ lastSyncDate, className, size = "default" }: QuickBooksSyncBadgeProps) {
  const formattedDate = lastSyncDate 
    ? format(new Date(lastSyncDate), "MMM d, yyyy 'at' h:mm a")
    : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="secondary" 
            className={`bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 ${size === "sm" ? "text-[10px] px-1.5 py-0" : ""} ${className || ""}`}
          >
            QB
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {formattedDate 
              ? `Synced from QuickBooks on ${formattedDate}`
              : "Synced from QuickBooks"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
