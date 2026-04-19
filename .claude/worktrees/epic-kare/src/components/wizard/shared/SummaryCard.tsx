import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  isCurrency?: boolean;
}

export const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
  isCurrency = true,
}: SummaryCardProps) => {
  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      if (isCurrency) {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      }
      return new Intl.NumberFormat("en-US").format(val);
    }
    return val;
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend && trendValue && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend === "up" && "text-green-600",
                  trend === "down" && "text-red-600",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
