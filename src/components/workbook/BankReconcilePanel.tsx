/**
 * BankReconcilePanel — second-click drill-down. Given a canonical_transactions.id,
 * shows the underlying bank/source record + a button to open the source statement.
 */
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BankReconcilePanelProps {
  txnId: string;
  onBack: () => void;
}

interface CanonicalRow {
  id: string;
  txn_date: string | null;
  payee: string | null;
  vendor: string | null;
  description: string | null;
  memo: string | null;
  amount: number | null;
  account_name: string | null;
  account_number: string | null;
  source_type: string;
  source_document_id: string | null;
  raw_payload: Record<string, unknown> | null;
  documents: {
    name: string;
    file_path: string;
    period_start: string | null;
    period_end: string | null;
    parsed_summary: Record<string, unknown> | null;
  } | null;
}

const formatCurrency = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function BankReconcilePanel({ txnId, onBack }: BankReconcilePanelProps) {
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["canonical-txn-detail", txnId],
    queryFn: async (): Promise<CanonicalRow | null> => {
      const { data, error } = await supabase
        .from("canonical_transactions")
        .select(
          "id, txn_date, payee, vendor, description, memo, amount, account_name, account_number, source_type, source_document_id, raw_payload, documents:source_document_id(name, file_path, period_start, period_end, parsed_summary)"
        )
        .eq("id", txnId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CanonicalRow | null;
    },
  });

  const openStatement = async () => {
    const path = data?.documents?.file_path;
    if (!path) return;
    const { data: signed, error: e } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 600);
    if (e || !signed?.signedUrl) {
      toast({ title: "Could not open document", description: e?.message, variant: "destructive" });
      return;
    }
    window.open(signed.signedUrl, "_blank", "noopener,noreferrer");
  };

  const isQB = data?.source_type === "quickbooks_api" || (!data?.source_document_id && !data?.documents);
  const pageNum =
    (data?.raw_payload as Record<string, unknown> | null)?.page ??
    (data?.raw_payload as Record<string, unknown> | null)?.page_number ??
    null;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1.5">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to GL lines
      </Button>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading source record…
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive py-4">Failed to load: {String(error)}</div>
      )}

      {data && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Source record</h3>
            <div className="rounded-md border divide-y text-sm">
              <Field label="Date" value={data.txn_date ?? "—"} />
              <Field label="Payee" value={data.payee || data.vendor || "—"} />
              <Field label="Description" value={data.description || "—"} />
              {data.memo && <Field label="Memo" value={data.memo} />}
              <Field
                label="Amount"
                value={<span className="font-mono">{formatCurrency(data.amount)}</span>}
              />
              <Field
                label="GL account"
                value={
                  <span className="font-mono text-xs">
                    {data.account_number ? `${data.account_number} · ` : ""}
                    {data.account_name || "—"}
                  </span>
                }
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              Reconciles to
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                {isQB ? "QuickBooks GL" : "Bank statement"}
              </Badge>
            </h3>

            {isQB ? (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                This GL line was synced directly from QuickBooks Online — no separate bank
                statement is attached. The transaction is reconciled within QuickBooks.
              </div>
            ) : data.documents ? (
              <div className="rounded-md border divide-y text-sm">
                <Field
                  label="Statement"
                  value={
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{data.documents.name}</span>
                    </span>
                  }
                />
                {(data.documents.period_start || data.documents.period_end) && (
                  <Field
                    label="Period"
                    value={`${data.documents.period_start ?? "?"} → ${
                      data.documents.period_end ?? "?"
                    }`}
                  />
                )}
                {pageNum != null && <Field label="Page" value={String(pageNum)} />}
                <div className="p-2.5">
                  <Button size="sm" variant="default" onClick={openStatement} className="gap-1.5 w-full">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open source document
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                Source document not linked.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-2.5 py-1.5">
      <span className="text-xs text-muted-foreground shrink-0 w-24">{label}</span>
      <span className="text-right min-w-0">{value}</span>
    </div>
  );
}
