import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";

export interface EmbeddedTransaction {
  id: string;
  date?: string;
  memo?: string;
  amount?: number;
  category?: string;
}

interface WaterfallDrilldownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Legacy: look up by canonical_transactions UUID */
  transactionIds?: string[];
  /** Preferred: pre-resolved transactions from classification data */
  embeddedTransactions?: EmbeddedTransaction[];
  projectId: string;
  title: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

export function WaterfallDrilldownDialog({
  open,
  onOpenChange,
  transactionIds,
  embeddedTransactions,
  projectId,
  title,
}: WaterfallDrilldownDialogProps) {
  // Only query DB when we have UUID-style IDs and no embedded data
  const shouldQueryDb = !embeddedTransactions?.length && (transactionIds?.length ?? 0) > 0;

  const { data: dbTransactions, isLoading } = useQuery({
    queryKey: ["waterfall-drilldown", projectId, transactionIds],
    queryFn: async () => {
      if (!transactionIds || transactionIds.length === 0) return [];
      const { data, error } = await supabase
        .from("canonical_transactions")
        .select("id, txn_date, description, memo, amount_signed, account_name")
        .eq("project_id", projectId)
        .in("id", transactionIds)
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open && shouldQueryDb,
  });

  // Merge: prefer embedded, fall back to DB
  const rows = embeddedTransactions?.length
    ? embeddedTransactions
    : (dbTransactions ?? []);

  const hasRows = rows.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {isLoading && shouldQueryDb ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : !hasRows ? (
          <p className="text-sm text-muted-foreground py-4">No transactions found.</p>
        ) : embeddedTransactions?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {embeddedTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {txn.date ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm max-w-[240px] truncate">
                    {txn.memo || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {txn.amount != null ? formatCurrency(Math.abs(txn.amount)) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[140px]">
                    {txn.category || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Account</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(dbTransactions ?? []).map((txn: any) => (
                <TableRow key={txn.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {txn.txn_date ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm max-w-[240px] truncate">
                    {txn.description || txn.memo || "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {txn.amount_signed != null ? formatCurrency(Number(txn.amount_signed)) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[140px]">
                    {txn.account_name || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
