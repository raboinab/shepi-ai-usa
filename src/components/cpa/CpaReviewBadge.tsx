import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CpaReviewEntry } from "@/hooks/useCpaReviewMap";

interface Props {
  review: CpaReviewEntry | undefined;
  originalAmount?: number | null;
}

const fmt = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n);

export function CpaReviewBadge({ review, originalAmount }: Props) {
  if (!review) return null;

  const cfg =
    review.decision === "confirmed"
      ? {
          label: "CPA confirmed",
          icon: ShieldCheck,
          cls: "bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/15",
        }
      : review.decision === "modified"
      ? {
          label: "CPA modified",
          icon: ShieldAlert,
          cls: "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/15",
        }
      : {
          label: "CPA rejected",
          icon: ShieldX,
          cls: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15",
        };

  const Icon = cfg.icon;

  return (
    <Popover>
      <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge
          variant="outline"
          className={cn("text-[10px] gap-1 cursor-pointer", cfg.cls)}
        >
          <Icon className="h-2.5 w-2.5" />
          {cfg.label}
        </Badge>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 text-sm space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-medium">{cfg.label}</div>
        {review.cpa_full_name && (
          <div className="text-xs text-muted-foreground">
            Reviewed by {review.cpa_full_name}, CPA
          </div>
        )}
        {review.decision === "modified" && review.modified_amount != null && (
          <div className="text-xs">
            <span className="text-muted-foreground">AI proposed </span>
            <span className="font-mono">{fmt(originalAmount)}</span>
            <span className="text-muted-foreground"> → CPA set </span>
            <span className="font-mono font-medium">
              {fmt(review.modified_amount)}
            </span>
          </div>
        )}
        {review.cpa_note && (
          <div className="text-xs whitespace-pre-wrap rounded bg-muted/50 p-2">
            {review.cpa_note}
          </div>
        )}
        <div className="text-[10px] text-muted-foreground">
          {new Date(review.reviewed_at).toLocaleString()}
        </div>
      </PopoverContent>
    </Popover>
  );
}
