import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  FileEdit,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Hash,
  ChevronDown,
} from "lucide-react";

interface RedFlag {
  id?: string;
  date: string;
  description: string;
  amount: number;
  reason: string;
  category?: string;
  severity: "high" | "medium" | "low";
  accounts?: string[];
}

export interface JEAnalysisData {
  entryCount?: number;
  adjustingEntries?: number;
  regularEntries?: number;
  balancedEntries?: number;
  unbalancedEntries?: number;
  oneSidedEntries?: number;
  totalDebits?: number;
  totalCredits?: number;
  netDifference?: number;
  monthlyDistribution?: Record<string, number>;
  topAccounts?: { name: string; count: number }[];
  redFlags?: RedFlag[];
  summaryFlags?: string[];
  yearEndCluster?: number;
  periodEndCluster?: number;
  weekendEntries?: number;
  roundNumberEntries?: number;
  largeEntries?: number;
  reversalPairs?: number;
  duplicateGroups?: number;
  largeEntryThreshold?: number;
  periodStart?: string;
  periodEnd?: string;
  analyzedAt?: string;
  sourceUpdatedAt?: string;
}

const timeAgo = (iso?: string): string => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

interface JournalEntryInsightsCardProps {
  analysisData: JEAnalysisData;
  documentName: string;
  className?: string;
}

const fmt = (v: number | null | undefined): string => {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};

const severityColor: Record<string, string> = {
  high: "text-destructive",
  medium: "text-amber-600",
  low: "text-muted-foreground",
};

export const JournalEntryInsightsCard = ({ analysisData, documentName, className }: JournalEntryInsightsCardProps) => {
  const [showAllFlags, setShowAllFlags] = useState(false);
  const redFlags = analysisData.redFlags || [];
  const summaryFlags = analysisData.summaryFlags || [];
  const totalFlags = redFlags.length + summaryFlags.length;
  const visibleFlags = showAllFlags ? redFlags : redFlags.slice(0, 10);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Journal Entry Analysis</CardTitle>
          </div>
          {totalFlags > 0 && (
            <Badge variant="destructive">{totalFlags} Flag{totalFlags !== 1 ? "s" : ""}</Badge>
          )}
        </div>
        <CardDescription className="truncate">{documentName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="redflags">
              Red Flags
              {redFlags.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1 h-4">{redFlags.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 pt-3">
            {/* Period */}
            {(analysisData.periodStart || analysisData.periodEnd) && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {analysisData.periodStart || "?"} – {analysisData.periodEnd || "?"}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analysisData.entryCount != null && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Hash className="w-3 h-3" /> Total Entries</div>
                  <div className="text-sm font-semibold">{analysisData.entryCount.toLocaleString()}</div>
                </div>
              )}
              {analysisData.adjustingEntries != null && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Adjusting</div>
                  <div className="text-sm font-semibold">{analysisData.adjustingEntries.toLocaleString()}</div>
                </div>
              )}
              {analysisData.regularEntries != null && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Regular</div>
                  <div className="text-sm font-semibold">{analysisData.regularEntries.toLocaleString()}</div>
                </div>
              )}
              {analysisData.largeEntries != null && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Large Entries</div>
                  <div className="text-sm font-semibold">{analysisData.largeEntries.toLocaleString()}</div>
                </div>
              )}
            </div>

            {/* Risk Indicators */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {(analysisData.periodEndCluster ?? analysisData.yearEndCluster ?? 0) > 0 && (
                <div className="p-2 border rounded text-center">
                  <div className="text-base font-bold text-amber-600">{analysisData.periodEndCluster ?? analysisData.yearEndCluster}</div>
                  <div className="text-[10px] text-muted-foreground">Period-End</div>
                </div>
              )}
              {(analysisData.weekendEntries ?? 0) > 0 && (
                <div className="p-2 border rounded text-center">
                  <div className="text-base font-bold text-amber-600">{analysisData.weekendEntries}</div>
                  <div className="text-[10px] text-muted-foreground">Weekend</div>
                </div>
              )}
              {(analysisData.roundNumberEntries ?? 0) > 0 && (
                <div className="p-2 border rounded text-center">
                  <div className="text-base font-bold text-amber-600">{analysisData.roundNumberEntries}</div>
                  <div className="text-[10px] text-muted-foreground">Round #s</div>
                </div>
              )}
              {(analysisData.reversalPairs ?? 0) > 0 && (
                <div className="p-2 border rounded text-center">
                  <div className="text-base font-bold text-destructive">{analysisData.reversalPairs}</div>
                  <div className="text-[10px] text-muted-foreground">Reversals</div>
                </div>
              )}
              {(analysisData.duplicateGroups ?? 0) > 0 && (
                <div className="p-2 border rounded text-center">
                  <div className="text-base font-bold text-destructive">{analysisData.duplicateGroups}</div>
                  <div className="text-[10px] text-muted-foreground">Duplicates</div>
                </div>
              )}
              {(analysisData.oneSidedEntries ?? 0) > 0 && (
                <div className="p-2 border rounded text-center">
                  <div className="text-base font-bold text-destructive">{analysisData.oneSidedEntries}</div>
                  <div className="text-[10px] text-muted-foreground">One-Sided</div>
                </div>
              )}
            </div>

            {analysisData.analyzedAt && (
              <div className="text-[11px] text-muted-foreground">
                Last analyzed {timeAgo(analysisData.analyzedAt)}
                {analysisData.largeEntryThreshold ? ` · large-entry threshold: ${fmt(analysisData.largeEntryThreshold)}` : ""}
              </div>
            )}

            {/* Summary Flags */}
            {summaryFlags.length > 0 && (
              <div className="space-y-2">
                {summaryFlags.map((flag, i) => (
                  <Alert key={i} variant="destructive" className="py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">{flag}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Red Flags Tab */}
          <TabsContent value="redflags" className="space-y-3 pt-3">
            {redFlags.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleFlags.map((flag, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{flag.date || "-"}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate">{flag.description}</TableCell>
                        <TableCell className="text-right text-xs font-medium">{fmt(flag.amount)}</TableCell>
                        <TableCell className={`text-xs ${severityColor[flag.severity]}`}>{flag.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {redFlags.length > 10 && !showAllFlags && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setShowAllFlags(true)}>
                    <ChevronDown className="w-4 h-4 mr-1" /> Show all {redFlags.length} flags
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                <p>No red flags detected in journal entries</p>
              </div>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 pt-3">
            {/* Top Accounts */}
            {analysisData.topAccounts && analysisData.topAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Most Active Accounts</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Entry Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisData.topAccounts.map((acct, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{acct.name}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{acct.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Monthly Distribution */}
            {analysisData.monthlyDistribution && Object.keys(analysisData.monthlyDistribution).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Monthly Distribution</div>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.entries(analysisData.monthlyDistribution)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, count]) => (
                      <div key={month} className="p-2 border rounded text-center">
                        <div className="text-[10px] text-muted-foreground">{month}</div>
                        <div className="text-sm font-medium">{count}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Debit/Credit Totals */}
            {(analysisData.totalDebits != null || analysisData.totalCredits != null) && (
              <div className="p-3 bg-muted/50 rounded-lg grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Debits:</span>
                  <span className="ml-2 font-medium">{fmt(analysisData.totalDebits)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Credits:</span>
                  <span className="ml-2 font-medium">{fmt(analysisData.totalCredits)}</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
