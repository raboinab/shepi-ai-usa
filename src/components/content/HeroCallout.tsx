import { cn } from "@/lib/utils";

interface HeroCalloutProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroCallout({ children, className }: HeroCalloutProps) {
  return (
    <div
      className={cn(
        "not-prose border-l-4 border-primary bg-primary/5 rounded-r-lg px-6 py-5 mb-8",
        className
      )}
    >
      <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
        {children}
      </p>
    </div>
  );
}
