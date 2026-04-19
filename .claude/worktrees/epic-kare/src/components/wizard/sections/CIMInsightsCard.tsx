import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Calendar,
  Target,
  Briefcase,
  DollarSign,
  FileText,
  RefreshCw
} from "lucide-react";

export interface CIMInsights {
  businessOverview: {
    description: string;
    foundedYear: string | null;
    headquarters: string | null;
    employeeCount: string | null;
  };
  productsAndServices: Array<{
    name: string;
    description: string;
    revenuePercentage: number | null;
  }>;
  marketPosition: {
    industry: string;
    competitiveAdvantages: string[];
    marketSize: string | null;
  };
  managementTeam: Array<{
    name: string;
    title: string;
    tenure: string | null;
  }>;
  customerInsights: {
    topCustomerConcentration: string | null;
    retentionRate: string | null;
    geographicDistribution: string | null;
  };
  growthDrivers: string[];
  keyRisks: string[];
  financialHighlights: {
    revenueGrowth: string | null;
    ebitdaMargin: string | null;
    notes: string[];
  };
  dealContext: {
    reasonForSale: string | null;
    timeline: string | null;
    sellerExpectations: string | null;
  };
  rawSummary: string;
  extractedAt: string;
}

interface CIMInsightsCardProps {
  insights: CIMInsights;
  className?: string;
  onReupload?: (file: File) => void;
  isReuploading?: boolean;
}

export const CIMInsightsCard = ({ insights, className, onReupload, isReuploading }: CIMInsightsCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReuploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReupload) {
      onReupload(file);
    }
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">CIM Business Insights</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              AI Extracted
            </Badge>
            {onReupload && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReuploadClick}
                  disabled={isReuploading}
                  className="h-7 text-xs"
                >
                  {isReuploading ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Re-upload CIM
                </Button>
              </>
            )}
          </div>
        </div>
        <CardDescription>
          Key business context extracted from the Confidential Information Memorandum
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Executive Summary */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed">{insights.rawSummary}</p>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {insights.marketPosition.industry && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{insights.marketPosition.industry}</span>
            </div>
          )}
          {insights.businessOverview.headquarters && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{insights.businessOverview.headquarters}</span>
            </div>
          )}
          {insights.businessOverview.foundedYear && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Est. {insights.businessOverview.foundedYear}</span>
            </div>
          )}
          {insights.businessOverview.employeeCount && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{insights.businessOverview.employeeCount} employees</span>
            </div>
          )}
        </div>

        {/* Growth Drivers & Risks Summary */}
        <div className="grid md:grid-cols-2 gap-3">
          {insights.growthDrivers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <TrendingUp className="w-4 h-4" />
                Growth Drivers
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {insights.growthDrivers.slice(0, 3).map((driver, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span>{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insights.keyRisks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                Key Risks
              </div>
              <ul className="text-sm space-y-1 text-muted-foreground">
                {insights.keyRisks.slice(0, 3).map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              {isExpanded ? "Show Less" : "View All Details"}
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            {/* Products & Services */}
            {insights.productsAndServices.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  Products & Services
                </div>
                <div className="grid gap-2">
                  {insights.productsAndServices.map((product, i) => (
                    <div key={i} className="p-2 bg-muted/30 rounded text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{product.name}</span>
                        {product.revenuePercentage && (
                          <Badge variant="outline">{product.revenuePercentage}% revenue</Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">{product.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Management Team */}
            {insights.managementTeam.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  Management Team
                </div>
                <div className="grid gap-1">
                  {insights.managementTeam.map((member, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                      <span className="font-medium">{member.name}</span>
                      <span className="text-muted-foreground">{member.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Advantages */}
            {insights.marketPosition.competitiveAdvantages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Competitive Advantages
                </div>
                <div className="flex flex-wrap gap-2">
                  {insights.marketPosition.competitiveAdvantages.map((advantage, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {advantage}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Highlights */}
            {(insights.financialHighlights.revenueGrowth || insights.financialHighlights.ebitdaMargin || insights.financialHighlights.notes.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Financial Highlights
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {insights.financialHighlights.revenueGrowth && (
                    <div>
                      <span className="text-muted-foreground">Revenue Growth:</span>
                      <span className="ml-2 font-medium">{insights.financialHighlights.revenueGrowth}</span>
                    </div>
                  )}
                  {insights.financialHighlights.ebitdaMargin && (
                    <div>
                      <span className="text-muted-foreground">EBITDA Margin:</span>
                      <span className="ml-2 font-medium">{insights.financialHighlights.ebitdaMargin}</span>
                    </div>
                  )}
                </div>
                {insights.financialHighlights.notes.length > 0 && (
                  <ul className="text-sm space-y-1 text-muted-foreground mt-2">
                    {insights.financialHighlights.notes.map((note, i) => (
                      <li key={i}>• {note}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Deal Context */}
            {(insights.dealContext.reasonForSale || insights.dealContext.timeline) && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <div className="text-sm font-medium">Deal Context</div>
                {insights.dealContext.reasonForSale && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Reason for Sale:</strong> {insights.dealContext.reasonForSale}
                  </p>
                )}
                {insights.dealContext.timeline && (
                  <p className="text-sm text-muted-foreground">
                    <strong>Timeline:</strong> {insights.dealContext.timeline}
                  </p>
                )}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Extraction timestamp */}
        <p className="text-xs text-muted-foreground text-right">
          Extracted: {new Date(insights.extractedAt).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
};
