import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  BarChart3,
  Layers,
} from "lucide-react";

interface TBComparison {
  accountName: string;
  glBalance: number;
  tbBalance: number | null;
  variance: number | null;
  variancePct?: number | null;
  status: "match" | "variance" | "missing_in_tb";
}

export interface GLAnalysisData {
  accountCount?: number;
  txnCount?: number;
  totalDebits?: number;
  totalCredits?: number;
  netDifference?: number;
  accountTypeBreakdown?: Record<string, number>;
  largestAccounts?: { name: string; type: string; balance: number }[];
  reconciliation?: TBComparison[];
  reconciliationSummary?: { matched: number; variances: number; missingInTB: number; missingInGL: number };
  materialVariances?: TBComparison[];
  missingInTBList?: { name: string; balance: number }[];
  missingInGLList?: { name: string; balance: number }[];
  identityCheck?: { assets: number; liabilities: number; equity: number; netIncome: number; difference: number; balanced: boolean };
  flags?: string[];
  overallScore?: number;
  periodStart?: string;
  periodEnd?: string;
  analyzedAt?: string;
  sourceUpdatedAt?: string;
}

interface GeneralLedgerInsightsCardProps {
  analysisData: GLAnalysisData;
  documentName: string;
  className?: string;
}

const fmt = (v: number | null | undefined): string => {
  if (v == null) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
};

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

export const GeneralLedgerInsightsCard = ({ analysisData, documentName, className }: GeneralLedgerInsightsCardProps) => {
  const recon = analysisData.reconciliation || [];
  const hasRecon = recon.length > 0;
  const flags = analysisData.flags || [];

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">General Ledger Analysis</CardTitle>
          </div>
          {analysisData.overallScore != null && analysisData.overallScore >= 0 && (
            <Badge variant={analysisData.overallScore >= 80 ? "default" : analysisData.overallScore >= 50 ? "secondary" : "destructive"}>
              {analysisData.overallScore}% Reconciled
            </Badge>
          )}
        </div>
        <CardDescription className="truncate">{documentName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="flags">
              Flags
              {flags.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1 h-4">{flags.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 pt-3">
            {/* Period */}
            {(analysisData.periodStart || analysisData.periodEnd) && (
              <div className="text-xs text-muted-foreground">
                Period: {analysisData.periodStart || "?"} – {analysisData.periodEnd || "?"}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analysisData.accountCount != null && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Layers className="w-3 h-3" /> Accounts</div>
                  <div className="text-sm font-semibold">{analysisData.accountCount.toLocaleString()}</div>
                </div>
              )}
              {analysisData.txnCount != null && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">GL Transactions</div>
                  <div className="text-sm font-semibold">{analysisData.txnCount.toLocaleString()}</div>
                </div>
              )}
              {analysisData.reconciliationSummary && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Matched Accounts</div>
                  <div className="text-sm font-semibold">
                    {analysisData.reconciliationSummary.matched} / {analysisData.reconciliationSummary.matched + analysisData.reconciliationSummary.variances}
                  </div>
                </div>
              )}
              {analysisData.identityCheck && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">A − L − E − NI</div>
                  <div className={`text-sm font-semibold ${analysisData.identityCheck.balanced ? "text-green-600" : "text-destructive"}`}>
                    {analysisData.identityCheck.balanced ? "Balanced" : fmt(analysisData.identityCheck.difference)}
                  </div>
                </div>
              )}
            </div>

            {analysisData.identityCheck && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="p-2 border rounded"><span className="text-muted-foreground">Assets:</span> <span className="font-medium ml-1">{fmt(analysisData.identityCheck.assets)}</span></div>
                <div className="p-2 border rounded"><span className="text-muted-foreground">Liabilities:</span> <span className="font-medium ml-1">{fmt(analysisData.identityCheck.liabilities)}</span></div>
                <div className="p-2 border rounded"><span className="text-muted-foreground">Equity:</span> <span className="font-medium ml-1">{fmt(analysisData.identityCheck.equity)}</span></div>
                <div className="p-2 border rounded"><span className="text-muted-foreground">Net Income:</span> <span className="font-medium ml-1">{fmt(analysisData.identityCheck.netIncome)}</span></div>
              </div>
            )}

            {analysisData.analyzedAt && (
              <div className="text-[11px] text-muted-foreground">Last analyzed {timeAgo(analysisData.analyzedAt)}</div>
            )}

            {/* Account Type Breakdown */}
            {analysisData.accountTypeBreakdown && Object.keys(analysisData.accountTypeBreakdown).length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Account Types</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysisData.accountTypeBreakdown).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Largest Accounts */}
            {analysisData.largestAccounts && analysisData.largestAccounts.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Largest Accounts</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisData.largestAccounts.map((acct, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm">{acct.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{acct.type}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(acct.balance)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Reconciliation Tab */}
          <TabsContent value="reconciliation" className="space-y-4 pt-3">
            {hasRecon ? (
              <>
                {analysisData.materialVariances && analysisData.materialVariances.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Material Variances</div>
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Account</TableHead><TableHead className="text-right">GL</TableHead><TableHead className="text-right">TB</TableHead><TableHead className="text-right">Variance</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisData.materialVariances.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{r.accountName}</TableCell>
                            <TableCell className="text-right text-sm">{fmt(r.glBalance)}</TableCell>
                            <TableCell className="text-right text-sm">{fmt(r.tbBalance)}</TableCell>
                            <TableCell className="text-right text-sm text-destructive font-medium">{fmt(r.variance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {analysisData.missingInTBList && analysisData.missingInTBList.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">In GL but missing from TB ({analysisData.missingInTBList.length})</div>
                    <div className="text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                      {analysisData.missingInTBList.map((a, i) => (
                        <div key={i} className="flex justify-between"><span className="truncate">{a.name}</span><span className="font-medium ml-2">{fmt(a.balance)}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {analysisData.missingInGLList && analysisData.missingInGLList.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-sm font-medium">In TB but missing from GL ({analysisData.missingInGLList.length})</div>
                    <div className="text-xs space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                      {analysisData.missingInGLList.map((a, i) => (
                        <div key={i} className="flex justify-between"><span className="truncate">{a.name}</span><span className="font-medium ml-2">{fmt(a.balance)}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                <details>
                  <summary className="text-xs text-muted-foreground cursor-pointer">Show full reconciliation ({recon.length})</summary>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Account</TableHead><TableHead className="text-right">GL</TableHead><TableHead className="text-right">TB</TableHead><TableHead className="text-right">Variance</TableHead><TableHead className="text-center">Status</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {recon.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm">{r.accountName}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(r.glBalance)}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(r.tbBalance)}</TableCell>
                          <TableCell className="text-right text-sm">{r.variance != null ? fmt(r.variance) : "-"}</TableCell>
                          <TableCell className="text-center">
                            {r.status === "match" && <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />}
                            {r.status === "variance" && <XCircle className="w-4 h-4 text-destructive mx-auto" />}
                            {r.status === "missing_in_tb" && <Scale className="w-4 h-4 text-muted-foreground mx-auto" />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </details>
              </>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No reconciliation data available.</p>
                <p className="text-xs mt-1">Upload a Trial Balance to enable GL-TB reconciliation.</p>
              </div>
            )}
          </TabsContent>

          {/* Flags Tab */}
          <TabsContent value="flags" className="space-y-3 pt-3">
            {flags.length > 0 ? (
              flags.map((flag, i) => (
                <Alert key={i} variant="destructive" className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{flag}</AlertDescription>
                </Alert>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-60" />
                <p>No flags detected</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
