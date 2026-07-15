import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  BarChart3,
  Layers,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface TBComparison {
  accountName: string;
  glBalance: number;
  tbBalance: number | null;
  variance: number | null;
  variancePct?: number | null;
  status: "match" | "variance" | "structural_variance" | "missing_in_tb" | "missing_in_gl";
  glBalanceSource?: "gl" | "tb_inferred";
  reasonCode?: string;
}

interface UnreconciledRow {
  name: string;
  glBalance: number;
  tbBalance: number | null;
  variance: number | null;
  reasonCode: string;
  status: string;
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
  reconciliationSummary?: { matched: number; structural?: number; variances: number; missingInTB: number; missingInGL: number };
  unreconciledByReason?: Record<string, number>;
  unreconciledList?: UnreconciledRow[];
  materialVariances?: TBComparison[];
  structuralVariances?: TBComparison[];
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

/** Right-aligned money cell with tabular numerals; zero renders as muted em-dash and negatives are destructive. */
const Money = ({ value, className = "" }: { value: number | null | undefined; className?: string }) => {
  if (value == null) return <span className={`text-muted-foreground ${className}`}>—</span>;
  if (Math.abs(value) < 0.5) return <span className={`text-muted-foreground tabular-nums ${className}`}>—</span>;
  const negative = value < 0;
  return (
    <span className={`tabular-nums ${negative ? "text-destructive" : ""} ${className}`}>{fmt(value)}</span>
  );
};

const REASON_LABEL: Record<string, string> = {
  MISSING_IN_TB: "In GL, not in TB",
  MISSING_IN_GL: "In TB, not in GL",
  STRUCTURAL_ROLLUP: "Parent-vs-child rollup",
  RESIDUAL_LT_1PCT: "Residual <1%",
  SIGN_MISMATCH_UNRESOLVED: "Sign mismatch",
  SNAPSHOT_DATE_MISMATCH: "Snapshot date mismatch",
  BEGINNING_EMPTY_NO_TB: "No opening balance",
  UNKNOWN: "Unclassified",
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
          <TabsList className="w-full grid grid-cols-3 sticky top-0 z-10 bg-background">
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
                {analysisData.periodStart && analysisData.periodEnd && analysisData.periodStart === analysisData.periodEnd
                  ? `As of ${analysisData.periodEnd}`
                  : `Period: ${analysisData.periodStart || "?"} – ${analysisData.periodEnd || "?"}`}
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
              <ReconciliationView data={analysisData} recon={recon} />
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

// ============================================================================
// ReconciliationView — presentation-only refactor of the Reconciliation tab.
// No math changes; consumes the same analysisData shape.
// ============================================================================

type ReconRow = NonNullable<GLAnalysisData["reconciliation"]>[number];

type NeedsSegment = "variances" | "structural" | "gl_only" | "tb_only";

const ReconciliationView = ({ data, recon }: { data: GLAnalysisData; recon: ReconRow[] }) => {
  const summary = data.reconciliationSummary;
  const material = data.materialVariances || [];
  const structural = data.structuralVariances || [];
  const missingTB = data.missingInTBList || [];
  const missingGL = data.missingInGLList || [];
  const unreconciledRows = data.unreconciledList || [];
  const reasons = data.unreconciledByReason || {};

  // Prefer the summary counts when present; fall back to derived values.
  const matched = summary?.matched ?? recon.filter(r => r.status === "match").length;
  const variancesCount = summary?.variances ?? material.length;
  const structuralCount = summary?.structural ?? structural.length;
  const glOnlyCount = summary?.missingInTB ?? missingTB.length;
  const tbOnlyCount = summary?.missingInGL ?? missingGL.length;

  // Default segment: whichever has the most rows.
  const initialSegment: NeedsSegment = useMemo(() => {
    const options: [NeedsSegment, number][] = [
      ["variances", variancesCount],
      ["structural", structuralCount],
      ["gl_only", glOnlyCount],
      ["tb_only", tbOnlyCount],
    ];
    options.sort((a, b) => b[1] - a[1]);
    return options[0][1] > 0 ? options[0][0] : "variances";
  }, [variancesCount, structuralCount, glOnlyCount, tbOnlyCount]);

  const [segment, setSegment] = useState<NeedsSegment>(initialSegment);
  const [showFull, setShowFull] = useState(false);
  const [search, setSearch] = useState("");
  const [hideZeroVariance, setHideZeroVariance] = useState(true);
  const [hideDeleted, setHideDeleted] = useState(false);
  const [sortKey, setSortKey] = useState<"variance" | "name">("variance");

  const filteredFull = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = recon.filter(r => {
      if (hideDeleted && /\(deleted\)/i.test(r.accountName)) return false;
      if (hideZeroVariance) {
        const v = r.variance;
        if (v == null || Math.abs(v) < 0.5) return false;
      }
      if (q && !r.accountName.toLowerCase().includes(q)) return false;
      return true;
    });
    rows.sort((a, b) => {
      if (sortKey === "name") return a.accountName.localeCompare(b.accountName);
      const av = Math.abs(a.variance ?? 0);
      const bv = Math.abs(b.variance ?? 0);
      return bv - av;
    });
    return rows;
  }, [recon, search, hideZeroVariance, hideDeleted, sortKey]);

  const reasonEntries = Object.entries(reasons).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);

  // Rows for the "Needs attention" segment
  const segmentRows = useMemo(() => {
    if (segment === "variances") {
      return material.map(r => ({
        name: r.accountName,
        gl: r.glBalance,
        tb: r.tbBalance,
        variance: r.variance,
        reason: r.reasonCode || "UNKNOWN",
      }));
    }
    if (segment === "structural") {
      return structural.map(r => ({
        name: r.accountName,
        gl: r.glBalance,
        tb: r.tbBalance,
        variance: r.variance,
        reason: "STRUCTURAL_ROLLUP",
      }));
    }
    if (segment === "gl_only") {
      return missingTB.map(r => ({ name: r.name, gl: r.balance, tb: null, variance: null, reason: "MISSING_IN_TB" }));
    }
    return missingGL.map(r => ({ name: r.name, gl: null, tb: r.balance, variance: r.balance != null ? -r.balance : null, reason: "MISSING_IN_GL" }));
  }, [segment, material, structural, missingTB, missingGL]);

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
        {data.overallScore != null && (
          <Badge variant={data.overallScore >= 80 ? "default" : data.overallScore >= 50 ? "secondary" : "destructive"} className="text-xs">
            {data.overallScore}% reconciled
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs"><span className="font-semibold text-foreground">{matched}</span> matched</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs"><span className="font-semibold text-foreground">{variancesCount}</span> variance</span>
        {structuralCount > 0 && (<>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs"><span className="font-semibold text-foreground">{structuralCount}</span> structural</span>
        </>)}
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs"><span className="font-semibold text-foreground">{glOnlyCount}</span> in GL only</span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs"><span className="font-semibold text-foreground">{tbOnlyCount}</span> in TB only</span>
      </div>

      {/* Reason chips */}
      {reasonEntries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reasonEntries.map(([code, n]) => (
            <Badge key={code} variant="outline" className="text-[11px] font-normal">
              {REASON_LABEL[code] || code}
              <span className="ml-1 font-semibold text-foreground">{n}</span>
            </Badge>
          ))}
        </div>
      )}

      {/* Needs attention card */}
      {(variancesCount + structuralCount + glOnlyCount + tbOnlyCount) > 0 && (
        <div className="rounded-md border">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="text-sm font-medium">Needs attention</div>
          </div>
          <div className="flex flex-wrap gap-1 border-b px-2 py-1.5 bg-muted/20">
            <SegmentButton active={segment === "variances"} onClick={() => setSegment("variances")} label="Variances" count={variancesCount} />
            <SegmentButton active={segment === "structural"} onClick={() => setSegment("structural")} label="Structural" count={structuralCount} />
            <SegmentButton active={segment === "gl_only"} onClick={() => setSegment("gl_only")} label="GL only" count={glOnlyCount} />
            <SegmentButton active={segment === "tb_only"} onClick={() => setSegment("tb_only")} label="TB only" count={tbOnlyCount} />
          </div>
          {segmentRows.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">Nothing here — pick another segment.</div>
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[42%]">Account</TableHead>
                    <TableHead className="text-right w-[14%]">GL</TableHead>
                    <TableHead className="text-right w-[14%]">TB</TableHead>
                    <TableHead className="text-right w-[14%]">Variance</TableHead>
                    <TableHead className="w-[16%]">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentRows.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm max-w-0">
                        <span className="block truncate" title={r.name}>{r.name}</span>
                      </TableCell>
                      <TableCell className="text-right text-sm"><Money value={r.gl} /></TableCell>
                      <TableCell className="text-right text-sm"><Money value={r.tb} /></TableCell>
                      <TableCell className="text-right text-sm font-medium"><Money value={r.variance} /></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-normal whitespace-nowrap">
                          {REASON_LABEL[r.reason] || r.reason}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Unreconciled account detail (from server's unreconciledList — may include reasons not surfaced above) */}
      {unreconciledRows.length > 0 && (
        <details className="rounded-md border">
          <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium flex items-center justify-between hover:bg-muted/30">
            <span>Unreconciled accounts ({unreconciledRows.length})</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground [details[open]_&]:rotate-90 transition-transform" />
          </summary>
          <div className="max-h-[360px] overflow-auto border-t">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[42%]">Account</TableHead>
                  <TableHead className="text-right w-[14%]">GL</TableHead>
                  <TableHead className="text-right w-[14%]">TB</TableHead>
                  <TableHead className="text-right w-[14%]">Variance</TableHead>
                  <TableHead className="w-[16%]">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unreconciledRows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm max-w-0">
                      <span className="block truncate" title={r.name}>{r.name}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm"><Money value={r.glBalance} /></TableCell>
                    <TableCell className="text-right text-sm"><Money value={r.tbBalance} /></TableCell>
                    <TableCell className="text-right text-sm font-medium"><Money value={r.variance} /></TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-normal whitespace-nowrap">
                        {REASON_LABEL[r.reasonCode] || r.reasonCode}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </details>
      )}

      {/* Full reconciliation, filterable */}
      <div className="rounded-md border">
        <button
          type="button"
          onClick={() => setShowFull(v => !v)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/30"
        >
          <span>Full reconciliation ({recon.length})</span>
          {showFull ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showFull && (
          <div className="border-t">
            <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-muted/20 border-b">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter account…"
                  className="h-8 pl-7 text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Switch id="hide-zero" checked={hideZeroVariance} onCheckedChange={setHideZeroVariance} />
                <Label htmlFor="hide-zero" className="text-xs cursor-pointer">Hide $0 variance</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Switch id="hide-deleted" checked={hideDeleted} onCheckedChange={setHideDeleted} />
                <Label htmlFor="hide-deleted" className="text-xs cursor-pointer">Hide (deleted)</Label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => setSortKey(k => (k === "variance" ? "name" : "variance"))}
              >
                <ArrowUpDown className="w-3 h-3" />
                Sort: {sortKey === "variance" ? "|Variance|" : "Account"}
              </Button>
              <span className="text-xs text-muted-foreground ml-auto">{filteredFull.length} shown</span>
            </div>
            {filteredFull.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No accounts match these filters.</div>
            ) : (
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead className="w-[46%]">Account</TableHead>
                      <TableHead className="text-right w-[15%]">GL</TableHead>
                      <TableHead className="text-right w-[15%]">TB</TableHead>
                      <TableHead className="text-right w-[15%]">Variance</TableHead>
                      <TableHead className="text-center w-[9%]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFull.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm max-w-0">
                          <span className="block truncate" title={r.accountName}>
                            {r.accountName}
                            {r.glBalanceSource === "tb_inferred" && (
                              <span
                                className="ml-1 text-muted-foreground cursor-help"
                                title="GL opening balance was missing from the QuickBooks export; ending balance taken from Trial Balance."
                              >*</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm"><Money value={r.glBalance} /></TableCell>
                        <TableCell className="text-right text-sm"><Money value={r.tbBalance} /></TableCell>
                        <TableCell className="text-right text-sm"><Money value={r.variance} /></TableCell>
                        <TableCell className="text-center">
                          {r.status === "match" && <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" />}
                          {r.status === "variance" && <XCircle className="w-4 h-4 text-destructive mx-auto" />}
                          {r.status === "structural_variance" && <Scale className="w-4 h-4 text-muted-foreground mx-auto" />}
                          {(r.status === "missing_in_tb" || r.status === "missing_in_gl") && <Scale className="w-4 h-4 text-muted-foreground mx-auto" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SegmentButton = ({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={count === 0}
    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
      active ? "bg-background border border-border shadow-sm" : "text-muted-foreground hover:text-foreground"
    }`}
  >
    {label}
    <span className={`ml-1.5 tabular-nums ${active ? "text-foreground" : "text-muted-foreground"}`}>{count}</span>
  </button>
);

