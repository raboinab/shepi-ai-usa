import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ResourceLink {
  to: string;
  label: string;
}

interface RelatedResourceCardsProps {
  links: ResourceLink[];
  className?: string;
}

export function RelatedResourceCards({ links, className }: RelatedResourceCardsProps) {
  return (
    <div className={cn("not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8", className)}>
      {links.map((link) => (
        <Link key={link.to} to={link.to}>
          <Card className="p-4 h-full hover:border-primary/40 transition-colors group cursor-pointer flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {link.label}
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
          </Card>
        </Link>
      ))}
    </div>
  );
}
