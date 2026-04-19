import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

type Category = "interbank" | "owner" | "operating";

interface ClassifiedTransaction {
  id: string;
  category: Category;
}

interface PeriodClassification {
  interbank: number;
  owner: number;
  transactions: ClassifiedTransaction[];
}

interface BankStatement {
  periodStart: string | null;
  summary: {
    openingBalance?: number;
    closingBalance?: number;
    totalCredits?: number;
    totalDebits?: number;
  };
  transactions?: Array<{
    date?: string;
    amount?: number;
    memo?: string;
    name?: string;
    descriptionLines?: string[];
  }>;
}

interface ResolvedTransaction {
  id: string;
  periodKey: string;
  date: string;
  description: string;
  amount: number;
  originalCategory: Category;
  currentCategory: Category;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawData: Record<string, PeriodClassification> | null;
  bankStatements: BankStatement[];
  onSave: (updated: Record<string, PeriodClassification>) => Promise<void>;
}

function resolveTransactions(
  rawData: Record<string, PeriodClassification>,
  bankStatements: BankStatement[]
): ResolvedTransaction[] {
  // Build bank transaction lookup: periodKey -> transactions array
  const bankByPeriod = new Map<string, BankStatement["transactions"]>();
  for (const stmt of bankStatements) {
    if (!stmt.periodStart) continue;
    const key = stmt.periodStart.substring(0, 7);
    // Merge transactions for the same period
    const existing = bankByPeriod.get(key) || [];
    bankByPeriod.set(key, [...existing, ...(stmt.transactions || [])]);
  }

  const resolved: ResolvedTransaction[] = [];

  for (const [periodKey, periodData] of Object.entries(rawData)) {
    const bankTxns = bankByPeriod.get(periodKey) || [];

    for (const ct of periodData.transactions) {
      // Parse id: "2022-01_5" -> index 5
      const parts = ct.id.split("_");
      const index = parseInt(parts[parts.length - 1], 10);
      const bankTxn = bankTxns[index];

      const description = bankTxn
        ? bankTxn.memo ||
          bankTxn.descriptionLines?.join(" ") ||
          bankTxn.name ||
          ""
        : ct.id;

      resolved.push({
        id: ct.id,
        periodKey,
        date: bankTxn?.date || periodKey,
        description: description.substring(0, 120),
        amount: Math.abs(bankTxn?.amount ?? 0),
        originalCategory: ct.category,
        currentCategory: ct.category,
      });
    }
  }

  return resolved;
}

const CATEGORY_LABELS: Record<Category, string> = {
  interbank: "Interbank",
  owner: "Owner",
  operating: "Operating",
};

const CATEGORY_COLORS: Record<Category, string> = {
  interbank: "secondary",
  owner: "destructive",
  operating: "outline",
};

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TransferReviewDialog({
  open,
  onOpenChange,
  rawData,
  bankStatements,
  onSave,
}: Props) {
  const initialTransactions = useMemo(
    () => (rawData ? resolveTransactions(rawData, bankStatements) : []),
    [rawData, bankStatements]
  );

  const [transactions, setTransactions] = useState<ResolvedTransaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Re-initialize when dialog opens
  useMemo(() => {
    if (open) {
      setTransactions(initialTransactions.map((t) => ({ ...t })));
    }
  }, [open, initialTransactions]);

  const changeCount = useMemo(
    () => transactions.filter((t) => t.currentCategory !== t.originalCategory).length,
    [transactions]
  );

  const filtered = useMemo(() => {
    if (activeTab === "all") return transactions;
    return transactions.filter((t) => t.currentCategory === activeTab);
  }, [transactions, activeTab]);

  const counts = useMemo(() => {
    const c = { interbank: 0, owner: 0, operating: 0 };
    for (const t of transactions) {
      c[t.currentCategory]++;
    }
    return c;
  }, [transactions]);

  const handleCategoryChange = (txnId: string, newCategory: Category) => {
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txnId ? { ...t, currentCategory: newCategory } : t
      )
    );
  };

  const handleSave = async () => {
    if (!rawData) return;
    setIsSaving(true);
    try {
      // Rebuild period data from updated transactions
      const updated: Record<string, PeriodClassification> = {};

      for (const t of transactions) {
        if (!updated[t.periodKey]) {
          updated[t.periodKey] = { interbank: 0, owner: 0, transactions: [] };
        }
        const p = updated[t.periodKey];
        p.transactions.push({ id: t.id, category: t.currentCategory });
        if (t.currentCategory === "interbank") p.interbank += t.amount;
        else if (t.currentCategory === "owner") p.owner += t.amount;
      }

      await onSave(updated);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save classifications:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Transfer Classifications</DialogTitle>
          <DialogDescription>
            Review and correct AI-classified transactions. Changes will update
            the Proof of Cash totals.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All ({transactions.length})</TabsTrigger>
            <TabsTrigger value="interbank">
              Interbank ({counts.interbank})
            </TabsTrigger>
            <TabsTrigger value="owner">Owner ({counts.owner})</TabsTrigger>
            <TabsTrigger value="operating">
              Operating ({counts.operating})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 min-h-0 overflow-auto mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[90px]">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px] text-right">Amount</TableHead>
                  <TableHead className="w-[150px]">Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((txn) => {
                  const changed = txn.currentCategory !== txn.originalCategory;
                  return (
                    <TableRow
                      key={txn.id}
                      className={changed ? "bg-accent/30" : ""}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {txn.date}
                      </TableCell>
                      <TableCell className="text-xs max-w-[400px] truncate">
                        {txn.description}
                        {changed && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            changed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {formatAmount(txn.amount)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={txn.currentCategory}
                          onValueChange={(v) =>
                            handleCategoryChange(txn.id, v as Category)
                          }
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interbank">Interbank</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                            <SelectItem value="operating">Operating</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No transactions in this category.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {changeCount > 0
              ? `${changeCount} transaction${changeCount > 1 ? "s" : ""} changed`
              : "No changes"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || changeCount === 0}>
              {isSaving ? (
                <>
                  <Spinner className="mr-2 h-3 w-3" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
