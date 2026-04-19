import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Database, FileSpreadsheet, Users, Building, Wallet, Clock, Package, FileText, Scale, Briefcase, BookOpen } from "lucide-react";
import type { WizardReportData } from "@/lib/wizardReportBuilder";

interface DataExplorerProps {
  wizardData: Record<string, unknown>;
  wizardReports?: Record<string, WizardReportData>;
}

export const DataExplorer = ({ wizardData, wizardReports }: DataExplorerProps) => {
  const supplementary = wizardData.supplementary as Record<string, unknown> | undefined;

  const sections = [
    { key: "incomeStatement", label: "Income Statement", icon: FileSpreadsheet, reportKey: "incomeStatement" },
    { key: "balanceSheet", label: "Balance Sheet", icon: Wallet, reportKey: "balanceSheet" },
    { key: "qoeAnalysis", label: "QoE Adjustments", icon: Database, reportKey: "qoeAnalysis" },
    { key: "journalEntries", label: "Journal Entries", icon: BookOpen },
    { key: "topCustomers", label: "Top Customers", icon: Users },
    { key: "topVendors", label: "Top Vendors", icon: Building },
    { key: "arAging", label: "AR Aging", icon: Clock },
    { key: "apAging", label: "AP Aging", icon: Clock },
    { key: "fixedAssets", label: "Fixed Assets", icon: Package },
    { key: "materialContracts", label: "Material Contracts", icon: FileText },
    { key: "debtSchedule", label: "Debt Schedule", icon: Wallet },
    { key: "leaseObligations", label: "Leases", icon: Briefcase },
    { key: "contingentLiabilities", label: "Contingent", icon: Scale },
  ];

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    }
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Extracted as a proper component to support hooks (useState)
  const RawDataGrid = ({ rawData }: { rawData: string[][] }) => {
    const [periodView, setPeriodView] = useState<"summary" | "monthly" | "all">("summary");

    if (rawData.length < 2) {
      return <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data available</div>;
    }

    const headers = rawData[0];
    const rows = rawData.slice(1);

    // Partition column indices by type
    const summaryIndices = [0];
    const monthlyIndices = [0];
    headers.forEach((h, i) => {
      if (i === 0) return;
      if (/^(FY|LTM|YTD)/.test(h)) summaryIndices.push(i);
      else monthlyIndices.push(i);
    });

    const visibleIndices =
      periodView === "summary" ? summaryIndices :
      periodView === "monthly" ? monthlyIndices :
      headers.map((_, i) => i);

    // Row-type detection helpers
    const classifyRow = (row: string[]) => {
      const label = (row[0] ?? "").trim();
      const isAllCaps = label.length > 2 && label === label.toUpperCase() && /[A-Z]/.test(label);
      const valuesEmpty = row.slice(1).every(c => !c || c === "—" || c === "-");
      if (isAllCaps && valuesEmpty) return "section" as const;
      if (/^(Total|TOTAL)/.test(label)) return "total" as const;
      return "data" as const;
    };

    return (
      <div className="space-y-2">
        <ToggleGroup type="single" value={periodView} onValueChange={(v) => v && setPeriodView(v as typeof periodView)} size="sm">
          <ToggleGroupItem value="summary" className="text-xs">Summary</ToggleGroupItem>
          <ToggleGroupItem value="monthly" className="text-xs">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="all" className="text-xs">All</ToggleGroupItem>
        </ToggleGroup>

        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleIndices.map((i) => (
                  <TableHead
                    key={i}
                    className={`text-xs whitespace-nowrap ${i === 0 ? "sticky left-0 bg-background z-10" : "text-right"}`}
                  >
                    {headers[i]}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 50).map((row, ri) => {
                const rowType = classifyRow(row);
                const rowClass =
                  rowType === "section" ? "bg-muted/60 font-bold" :
                  rowType === "total" ? "font-semibold border-t border-border" : "";

                return (
                  <TableRow key={ri} className={rowClass}>
                    {visibleIndices.map((ci) => {
                      const cell = row[ci] ?? "";
                      const isLabelCol = ci === 0;
                      let display: string;
                      if (isLabelCol) {
                        display = cell || "";
                      } else if (rowType === "section") {
                        display = ""; // no dashes for section headers
                      } else {
                        display = cell || "—";
                      }
                      return (
                        <TableCell
                          key={ci}
                          className={`text-sm whitespace-nowrap ${isLabelCol ? "sticky left-0 bg-background z-10 font-medium" : "text-right"}`}
                        >
                          {display}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {rows.length > 50 && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              And {rows.length - 50} more rows...
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  const getDataForSection = (sectionKey: string): Record<string, unknown> | unknown[] | undefined => {
    if (["debtSchedule", "leaseObligations", "contingentLiabilities"].includes(sectionKey)) {
      const subData = supplementary?.[sectionKey] as { items?: unknown[] } | undefined;
      return subData?.items || [];
    }
    return wizardData[sectionKey] as Record<string, unknown> | unknown[] | undefined;
  };

  const normalizeConcentrationItems = (items: unknown[], totalAmount: number, entityKey: "customers" | "vendors") => {
    const amountField = entityKey === "customers" ? "yearlyRevenue" : "yearlySpend";
    return (items as Record<string, unknown>[]).map((item, idx) => {
      const name = (item.name as string) || `#${idx + 1}`;
      let currentYear = 0;
      let priorYear = 0;

      if (typeof item.currentYear === "number") {
        currentYear = item.currentYear as number;
        priorYear = (item.priorYear as number) || 0;
      } else if (item[amountField] && typeof item[amountField] === "object") {
        const yearly = item[amountField] as Record<string, number>;
        const years = Object.keys(yearly).sort().reverse();
        currentYear = yearly[years[0]] || 0;
        priorYear = yearly[years[1]] || 0;
      }

      const pctOfTotal = totalAmount ? ((currentYear / totalAmount) * 100) : 0;
      const yoyChange = priorYear ? (((currentYear - priorYear) / priorYear) * 100) : 0;
      const isRelatedParty = !!(item.isRelatedParty);

      return { name, currentYear, priorYear, pctOfTotal, yoyChange, isRelatedParty };
    });
  };

  const renderConcentrationTable = (items: Record<string, unknown>[], sectionKey: string, totalAmount: number) => {
    const entityKey = sectionKey === "topCustomers" ? "customers" : "vendors";
    const normalized = normalizeConcentrationItems(items, totalAmount, entityKey);
    const sorted = normalized.sort((a, b) => b.currentYear - a.currentYear);

    const top1Pct = sorted[0]?.pctOfTotal || 0;
    const top5Pct = sorted.slice(0, 5).reduce((s, i) => s + i.pctOfTotal, 0);
    const top10Pct = sorted.slice(0, 10).reduce((s, i) => s + i.pctOfTotal, 0);
    const relatedCount = sorted.filter(i => i.isRelatedParty).length;

    const formatPct = (v: number) => `${v.toFixed(1)}%`;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3 px-1">
          <Badge variant="outline" className="text-xs">Top 1: {formatPct(top1Pct)}</Badge>
          <Badge variant="outline" className="text-xs">Top 5: {formatPct(top5Pct)}</Badge>
          <Badge variant="outline" className="text-xs">Top 10: {formatPct(top10Pct)}</Badge>
          {totalAmount > 0 && <Badge variant="secondary" className="text-xs">Total: {formatValue(totalAmount)}</Badge>}
          {relatedCount > 0 && <Badge variant="destructive" className="text-xs">{relatedCount} Related Party</Badge>}
        </div>
        <ScrollArea className="h-[220px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-8">#</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs text-right">Current Year</TableHead>
                <TableHead className="text-xs text-right">Prior Year</TableHead>
                <TableHead className="text-xs text-right">% of Total</TableHead>
                <TableHead className="text-xs text-right">YoY Chg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.slice(0, 15).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="text-sm text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {item.name}
                    {item.isRelatedParty && <Badge variant="destructive" className="ml-2 text-[10px] px-1">RP</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-right">{formatValue(item.currentYear)}</TableCell>
                  <TableCell className="text-sm text-right">{formatValue(item.priorYear)}</TableCell>
                  <TableCell className="text-sm text-right">{formatPct(item.pctOfTotal)}</TableCell>
                  <TableCell className={`text-sm text-right ${item.yoyChange > 0 ? "text-green-600" : item.yoyChange < 0 ? "text-red-600" : ""}`}>
                    {item.priorYear ? `${item.yoyChange > 0 ? "+" : ""}${item.yoyChange.toFixed(1)}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sorted.length > 15 && <div className="text-center py-2 text-sm text-muted-foreground">And {sorted.length - 15} more...</div>}
        </ScrollArea>
      </div>
    );
  };

  const renderArrayData = (items: unknown[], sectionKey: string) => {
    if (items.length === 0) {
      return <div className="h-[200px] flex items-center justify-center text-muted-foreground">No items recorded</div>;
    }

    const firstItem = items[0] as Record<string, unknown>;
    let columns = Object.keys(firstItem).filter(k => !k.startsWith("_") && k !== "id");
    
    const priorityColumns: Record<string, string[]> = {
      arAging: ["name", "current", "days1to30", "days31to60", "days61to90", "days90plus", "total"],
      apAging: ["name", "current", "days1to30", "days31to60", "days61to90", "days90plus", "total"],
      fixedAssets: ["description", "category", "originalCost", "accumulatedDepreciation", "netBookValue"],
      materialContracts: ["counterparty", "type", "contractValue", "expirationDate", "hasCoC"],
      debtSchedule: ["lender", "balance", "interestRate", "maturityDate"],
      leaseObligations: ["description", "leaseType", "annualPayment", "expirationDate"],
      contingentLiabilities: ["description", "estimatedAmount", "probability"],
    };

    if (priorityColumns[sectionKey]) {
      columns = priorityColumns[sectionKey].filter(c => columns.includes(c));
    }
    columns = columns.slice(0, 6);

    return (
      <ScrollArea className="h-[250px]">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col} className="capitalize text-xs">{col.replace(/([A-Z])/g, " $1").trim()}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 10).map((item, index) => (
              <TableRow key={index}>
                {columns.map((col) => (
                  <TableCell key={col} className="text-sm">
                    {col === "hasCoC" ? (
                      (item as Record<string, unknown>)[col] ? <Badge variant="destructive" className="text-xs">Yes</Badge> : <Badge variant="outline" className="text-xs">No</Badge>
                    ) : formatValue((item as Record<string, unknown>)[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {items.length > 10 && <div className="text-center py-2 text-sm text-muted-foreground">And {items.length - 10} more items...</div>}
      </ScrollArea>
    );
  };

  const renderSectionData = (sectionKey: string, reportKey?: string) => {
    // Check for computed report data first (IS, BS, QoE)
    if (reportKey && wizardReports?.[reportKey]?.rawData && wizardReports[reportKey].rawData.length > 1) {
      return <RawDataGrid rawData={wizardReports[reportKey].rawData} />;
    }

    // Journal Entries: render flattened line items table
    if (sectionKey === "journalEntries") {
      const jeData = wizardData.journalEntries as { entries?: { id: string; txnDate: string; memo: string; lines: { accountName: string; amount: number; postingType: string }[] }[] } | undefined;
      const entries = jeData?.entries || [];
      if (entries.length === 0) return <div className="h-[200px] flex items-center justify-center text-muted-foreground">No journal entries available</div>;
      const flatLines = entries.flatMap(e => e.lines.map(l => ({ date: e.txnDate, jeId: e.id, account: l.accountName, debit: l.postingType === "DEBIT" ? l.amount : 0, credit: l.postingType === "CREDIT" ? l.amount : 0 })));
      return (
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">JE #</TableHead>
                <TableHead className="text-xs">Account</TableHead>
                <TableHead className="text-xs text-right">Debit</TableHead>
                <TableHead className="text-xs text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatLines.slice(0, 100).map((line, i) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{line.date}</TableCell>
                  <TableCell className="text-sm font-mono">{line.jeId}</TableCell>
                  <TableCell className="text-sm">{line.account}</TableCell>
                  <TableCell className="text-sm text-right">{line.debit ? formatValue(line.debit) : ""}</TableCell>
                  <TableCell className="text-sm text-right">{line.credit ? formatValue(line.credit) : ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {flatLines.length > 100 && <div className="text-center py-2 text-sm text-muted-foreground">Showing 100 of {flatLines.length} lines...</div>}
        </ScrollArea>
      );
    }

    const data = getDataForSection(sectionKey);
    
    if (!data || (Array.isArray(data) && data.length === 0) || (typeof data === "object" && Object.keys(data).length === 0)) {
      return <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data available for this section</div>;
    }

    if (typeof data === "object" && !Array.isArray(data)) {
      const objData = data as Record<string, unknown>;
      if ((sectionKey === "arAging" || sectionKey === "apAging") && objData.periodData && Array.isArray(objData.periodData)) {
        const allEntries = (objData.periodData as any[]).flatMap(p =>
          (p.entries || []).map((e: any) => ({ ...e, period: p.periodId }))
        );
        if (allEntries.length > 0) return renderArrayData(allEntries, sectionKey);
      }
      if (objData.periodData && Array.isArray(objData.periodData)) return renderArrayData(objData.periodData, sectionKey);
      if (objData.adjustments && Array.isArray(objData.adjustments)) return renderArrayData(objData.adjustments, sectionKey);
      if (sectionKey === "topCustomers" && objData.customers && Array.isArray(objData.customers)) {
        return renderConcentrationTable(objData.customers as Record<string, unknown>[], sectionKey, (objData.totalRevenue as number) || 0);
      }
      if (sectionKey === "topVendors" && objData.vendors && Array.isArray(objData.vendors)) {
        return renderConcentrationTable(objData.vendors as Record<string, unknown>[], sectionKey, (objData.totalSpend as number) || 0);
      }
      if (objData.assets && Array.isArray(objData.assets)) return renderArrayData(objData.assets, sectionKey);
      if (objData.contracts && Array.isArray(objData.contracts)) return renderArrayData(objData.contracts, sectionKey);
    }

    if (Array.isArray(data)) return renderArrayData(data, sectionKey);

    const entries = Object.entries(data as Record<string, unknown>).filter(([key]) => !key.startsWith("_") && key !== "rawData");
    return (
      <ScrollArea className="h-[250px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Field</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.slice(0, 15).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell className="font-medium capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</TableCell>
                <TableCell className="text-right text-sm">
                  {typeof value === "object" && value !== null ? <Badge variant="outline">Object</Badge> : formatValue(value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Explorer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="incomeStatement">
          <ScrollArea className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto gap-1 w-max">
              {sections.map((section) => (
                <TabsTrigger key={section.key} value={section.key} className="gap-1.5 text-xs">
                  <section.icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{section.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
          
          {sections.map((section) => (
            <TabsContent key={section.key} value={section.key}>
              {renderSectionData(section.key, (section as any).reportKey)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
