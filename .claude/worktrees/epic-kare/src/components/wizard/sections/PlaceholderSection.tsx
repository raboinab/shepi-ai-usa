import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

const SECTION_NAMES: Record<string, string> = {
  "2-2": "Income Statement",
  "2-3": "Balance Sheet",
  "3-1": "QofE Summary",
  "3-2": "QoE Analysis",
  "3-3": "Due Diligence Adjustments",
  "3-4": "Reclassification Adjustments",
  "4-1": "Payroll & Related",
  "4-2": "Working Capital",
  "4-3": "NWC & FCF Analysis",
  "5-1": "AR Aging",
  "5-2": "Fixed Assets",
  "5-3": "Supplementary",
  "6-1": "Top Customers by Year",
  "6-2": "Top Vendors by Year",
  "7-1": "Proof of Cash",
  "7-2": "Final Review & Export",
};

interface PlaceholderSectionProps {
  phase: number;
  section: number;
}

export const PlaceholderSection = ({ phase, section }: PlaceholderSectionProps) => {
  const key = `${phase}-${section}`;
  const sectionName = SECTION_NAMES[key] || `Phase ${phase}, Section ${section}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">{sectionName}</h2>
        <p className="text-muted-foreground">
          This section will be built out with full functionality
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Construction className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            This section is part of the QoE wizard framework. Full data entry 
            and AI-assisted features will be added incrementally.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
