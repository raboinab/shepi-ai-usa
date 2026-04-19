import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description: string;
}

interface StepListProps {
  steps: Step[];
  className?: string;
}

export function StepList({ steps, className }: StepListProps) {
  return (
    <div className={cn("not-prose space-y-4 mb-8", className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold mt-0.5">
            {i + 1}
          </div>
          <div className="flex-1 border border-border rounded-lg p-4 bg-card">
            <p className="font-semibold text-foreground mb-1">{step.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
