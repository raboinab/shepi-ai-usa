import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  DollarSign,
  CheckCircle2,
  XCircle,
  Scale,
  BarChart3,
} from "lucide-react";

interface MultiPeriodAccount {
  id: string;
  name: string;
  category?: string;
  monthlyValues: Record<string, number>;
}

interface PayrollComparison {
  field: string;
  payrollValue: number | null;
  financialValue: number | null;
  source: string;
  variance: number | null;
  variancePercent: number | null;
  status: "match" | "variance" | "missing_data";
}

export interface PayrollAnalysisData {
  success?: boolean;
  confidence?: string;
  extractedData?: {
    salaryWages: MultiPeriodAccount[];
    payrollTaxes: MultiPeriodAccount[];
    benefits: MultiPeriodAccount[];
    ownerCompensation: MultiPeriodAccount[];
  };
  rawFindings?: string;
  periodCoverage?: string[];
  warnings?: string[];
  crossValidation?: {
    comparisons: PayrollComparison[];
    flags: string[];
    overallScore: number;
    totals: {
      salaryWages: number;
      payrollTaxes: number;
      benefits: number;
      ownerCompensation: number;
      totalPayroll: number;
    };
  };
  documentName?: string;
}

interface PayrollInsightsCardProps {
  analysisData: PayrollAnalysisData;
  documentName: string;
  className?: string;
}

const fmt = (v: number | null | undefined): string => {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};

const sumCategory = (accounts: MultiPeriodAccount[]): number =>
  accounts.reduce((total, acct) => total + Object.values(acct.monthlyValues).reduce((s, v) => s + (v || 0), 0), 0);

const CategoryTable = ({ accounts, label }: { accounts: MultiPeriodAccount[]; label: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (accounts.length === 0) return null;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between text-sm">
          <span className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5" />
            {label} ({accounts.length} items) — {fmt(sumCategory(accounts))}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((acct) => (
              <TableRow key={acct.id}>
                <TableCell className="text-sm">{acct.name}</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {fmt(Object.values(acct.monthlyValues).reduce((s, v) => s + (v || 0), 0))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const PayrollInsightsCard = ({ analysisData, documentName, className }: PayrollInsightsCardProps) => {
  const extracted = analysisData.extractedData;
  const cv = analysisData.crossValidation;
  const totals = cv?.totals;
  const hasCrossValidation = cv && cv.comparisons.length > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Payroll Analysis</CardTitle>
          </div>
          {cv && cv.overallScore >= 0 && (
            <Badge variant={cv.overallScore >= 80 ? "default" : cv.overallScore >= 50 ? "secondary" : "destructive"}>
              {cv.overallScore}% Match
            </Badge>
          )}
        </div>
        <CardDescription className="truncate">{documentName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="validation">
              Validation
              {cv && cv.flags.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1 h-4">{cv.flags.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 pt-3">
            {/* AI Summary */}
            {analysisData.rawFindings && (
              <p className="text-sm text-muted-foreground">{analysisData.rawFindings}</p>
            )}

            {/* Period Coverage */}
            {analysisData.periodCoverage && analysisData.periodCoverage.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Period: {analysisData.periodCoverage[0]} – {analysisData.periodCoverage[analysisData.periodCoverage.length - 1]} ({analysisData.periodCoverage.length} months)
              </div>
            )}

            {/* Key Totals */}
            {totals && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Total Payroll</div>
                  <div className="text-sm font-semibold">{fmt(totals.totalPayroll)}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Salary & Wages</div>
                  <div className="text-sm font-semibold">{fmt(totals.salaryWages)}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Owner Comp</div>
                  <div className="text-sm font-semibold">{fmt(totals.ownerCompensation)}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Payroll Taxes</div>
                  <div className="text-sm font-semibold">{fmt(totals.payrollTaxes)}</div>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Benefits</div>
                  <div className="text-sm font-semibold">{fmt(totals.benefits)}</div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {analysisData.warnings && analysisData.warnings.length > 0 && (
              <div className="space-y-1">
                {analysisData.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-2 pt-3">
            {extracted ? (
              <>
                <CategoryTable accounts={extracted.salaryWages} label="Salary & Wages" />
                <CategoryTable accounts={extracted.ownerCompensation} label="Owner Compensation" />
                <CategoryTable accounts={extracted.payrollTaxes} label="Payroll Taxes" />
                <CategoryTable accounts={extracted.benefits} label="Benefits" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No breakdown data available</p>
            )}
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation" className="space-y-4 pt-3">
            {hasCrossValidation ? (
              <>
                {/* Comparison Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Field</TableHead>
                      <TableHead className="text-right">Payroll</TableHead>
                      <TableHead className="text-right">Financial Data</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cv!.comparisons.map((comp, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-medium">{comp.field}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(comp.payrollValue)}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(comp.financialValue)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{comp.source}</TableCell>
                        <TableCell className="text-center">
                          {comp.status === "match" && <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />}
                          {comp.status === "variance" && (
                            <div className="flex flex-col items-center">
                              <XCircle className="w-4 h-4 text-destructive" />
                              {comp.variancePercent != null && (
                                <span className="text-[10px] text-destructive">{comp.variancePercent > 0 ? "+" : ""}{comp.variancePercent.toFixed(1)}%</span>
                              )}
                            </div>
                          )}
                          {comp.status === "missing_data" && <Scale className="w-4 h-4 text-muted-foreground mx-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Flags */}
                {cv!.flags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Flags ({cv!.flags.length})
                    </div>
                    {cv!.flags.map((flag, i) => (
                      <Alert key={i} variant="destructive" className="py-2">
                        <AlertDescription className="text-xs">{flag}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No cross-validation data available yet.</p>
                <p className="text-xs mt-1">Upload financial statements (Income Statement, Tax Return) to enable payroll cross-validation.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
