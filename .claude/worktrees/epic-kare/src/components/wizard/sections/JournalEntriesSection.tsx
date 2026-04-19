import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BookOpen, Search, ChevronRight, ChevronDown } from "lucide-react";
import { QuickBooksSyncBadge } from "@/components/wizard/shared/QuickBooksSyncBadge";
import { useAutoLoadJournalEntries } from "@/hooks/useAutoLoadProcessedData";

interface JELine {
  accountName: string;
  accountId: string;
  amount: number;
  postingType: string;
}

interface JournalEntry {
  id: string;
  txnDate: string;
  totalAmount: number;
  isAdjustment: boolean;
  memo: string;
  lines: JELine[];
}

// Re-use the shared type from processedDataTransforms
import type { JournalEntriesData } from "@/lib/processedDataTransforms";

interface JournalEntriesSectionProps {
  projectId: string;
  data: JournalEntriesData;
  onUpdate?: (data: JournalEntriesData) => void;
  onGuideContextChange?: (patch: Partial<import("@/lib/adjustmentsGuideContent").GuideContext>) => void;
}

export const JournalEntriesSection = ({ projectId, data, onUpdate, onGuideContextChange }: JournalEntriesSectionProps) => {
  const [search, setSearch] = useState("");

  // Auto-load from processed_data if wizard_data is empty (self-healing pattern)
  useAutoLoadJournalEntries({
    projectId,
    data,
    updateData: onUpdate || (() => {}),
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const entries = data.entries || [];

  // Guide context emission
  useEffect(() => {
    onGuideContextChange?.({
      sectionKey: "3-3",
      hasData: entries.length > 0,
      mode: "ledger",
    });
  }, [entries.length]);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(
      (e) =>
        e.id.includes(q) ||
        e.memo.toLowerCase().includes(q) ||
        e.lines.some((l) => l.accountName.toLowerCase().includes(q))
    );
  }, [entries, search]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Summary stats
  const totalDebits = entries.reduce((s, e) => s + e.lines.filter(l => l.postingType === "DEBIT").reduce((a, l) => a + l.amount, 0), 0);
  const totalCredits = entries.reduce((s, e) => s + e.lines.filter(l => l.postingType === "CREDIT").reduce((a, l) => a + l.amount, 0), 0);
  const dateRange = entries.length > 0
    ? `${entries[entries.length - 1]?.txnDate} – ${entries[0]?.txnDate}`
    : "—";

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  if (entries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Journal Entries</h2>
            <p className="text-muted-foreground">View journal entries synced from QuickBooks</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No journal entries available yet.</p>
            <p className="text-sm mt-1">Journal entries will appear here after a QuickBooks sync.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Journal Entries</h2>
          <p className="text-muted-foreground">View journal entries synced from QuickBooks</p>
        </div>
        {data.syncSource && <QuickBooksSyncBadge lastSyncDate={data.lastSyncDate} />}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total JEs</p>
            <p className="text-lg font-bold">{entries.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Date Range</p>
            <p className="text-sm font-medium">{dateRange}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Debits</p>
            <p className="text-lg font-bold">{fmt(totalDebits)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Credits</p>
            <p className="text-lg font-bold">{fmt(totalCredits)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by JE #, memo, or account..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">JE #</TableHead>
                <TableHead className="text-xs">Memo</TableHead>
                <TableHead className="text-xs text-right">Debit</TableHead>
                <TableHead className="text-xs text-right">Credit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((entry) => {
                const isOpen = expandedRows.has(entry.id);
                const debit = entry.lines.filter(l => l.postingType === "DEBIT").reduce((s, l) => s + l.amount, 0);
                const credit = entry.lines.filter(l => l.postingType === "CREDIT").reduce((s, l) => s + l.amount, 0);

                return (
                  <Collapsible key={entry.id} open={isOpen} onOpenChange={() => toggleRow(entry.id)} asChild>
                    <>
                      <CollapsibleTrigger asChild>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="w-8">
                            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </TableCell>
                          <TableCell className="text-sm">{entry.txnDate}</TableCell>
                          <TableCell className="text-sm font-mono">
                            {entry.id}
                            {entry.isAdjustment && <Badge variant="secondary" className="ml-2 text-[10px]">Adj</Badge>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{entry.memo || "—"}</TableCell>
                          <TableCell className="text-sm text-right">{fmt(debit)}</TableCell>
                          <TableCell className="text-sm text-right">{fmt(credit)}</TableCell>
                        </TableRow>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                        <>
                          {entry.lines.map((line, li) => (
                            <TableRow key={`${entry.id}-${li}`} className="bg-muted/30">
                              <TableCell />
                              <TableCell />
                              <TableCell colSpan={2} className="text-sm pl-8">
                                {line.accountName}
                                <span className="text-muted-foreground ml-1 text-xs">({line.accountId})</span>
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                {line.postingType === "DEBIT" ? fmt(line.amount) : ""}
                              </TableCell>
                              <TableCell className="text-sm text-right">
                                {line.postingType === "CREDIT" ? fmt(line.amount) : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                        </>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > 100 && (
            <div className="text-center py-3 text-sm text-muted-foreground">
              Showing 100 of {filtered.length} entries
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
};
