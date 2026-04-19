import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Benefit {
  title: string;
  description: string;
}

interface BenefitGridProps {
  benefits: Benefit[];
  className?: string;
}

export function BenefitGrid({ benefits, className }: BenefitGridProps) {
  return (
    <div className={cn("not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8", className)}>
      {benefits.map((b, i) => (
        <Card key={i} className="p-5">
          <p className="font-semibold text-foreground mb-1.5">{b.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
        </Card>
      ))}
    </div>
  );
}
