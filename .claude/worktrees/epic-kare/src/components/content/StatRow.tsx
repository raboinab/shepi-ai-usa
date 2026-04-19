import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  value: string;
  label: string;
}

interface StatRowProps {
  stats: StatItem[];
  className?: string;
}

export function StatRow({ stats, className }: StatRowProps) {
  return (
    <div className={cn("not-prose grid gap-4 mb-8", stats.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {stats.map((stat, i) => (
        <Card key={i} className="p-5 text-center">
          <p className="text-2xl md:text-3xl font-bold text-primary mb-1">{stat.value}</p>
          <p className="text-sm text-muted-foreground">{stat.label}</p>
        </Card>
      ))}
    </div>
  );
}
