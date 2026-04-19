import { useState, useMemo } from "react";
import { parseLocalDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { type ContractItem } from "./MaterialContractsImportDialog";

export interface LeaseObligation {
  id: number;
  description: string;
  type: string;
  annualPayment: number;
  remainingTerm: number;
  sourceContractId?: number;
  [key: string]: unknown;
}

interface LeaseImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialContracts: ContractItem[];
  onImport: (leases: LeaseObligation[]) => void;
}

export const LeaseImportDialog = ({
  open,
  onOpenChange,
  materialContracts,
  onImport,
}: LeaseImportDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Filter to only show Lease-type contracts
  const leaseContracts = useMemo(() => {
    return materialContracts.filter(
      (c) => c.contractType?.toLowerCase() === "lease"
    );
  }, [materialContracts]);

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    if (selectedIds.size === leaseContracts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(leaseContracts.map((c) => c.id!)));
    }
  };

  const calculateRemainingYears = (expirationDate?: string): number => {
    if (!expirationDate) return 0;
    try {
      const expDate = new Date(expirationDate);
      const now = new Date();
      const diffYears = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return Math.max(0, Math.round(diffYears * 10) / 10);
    } catch {
      return 0;
    }
  };

  const handleImport = () => {
    const selectedLeases = leaseContracts
      .filter((c) => selectedIds.has(c.id!))
      .map((contract, idx) => ({
        id: idx + 1,
        description: `${contract.counterparty || "Lease"}${contract.description ? ` - ${contract.description}` : ""}`,
        type: "Operating", // Default, user can edit
        annualPayment: contract.annualValue || contract.contractValue || 0,
        remainingTerm: calculateRemainingYears(contract.expirationDate),
        sourceContractId: contract.id,
      }));

    onImport(selectedLeases);
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return parseLocalDate(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Import Leases from Material Contracts
          </DialogTitle>
          <DialogDescription>
            Select lease contracts to import into Lease Obligations. Values can
            be edited after import.
          </DialogDescription>
        </DialogHeader>

        {leaseContracts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No lease-type contracts found in Material Contracts.</p>
            <p className="text-sm mt-1">
              Add lease contracts there first, or enter leases manually.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {selectedIds.size === leaseContracts.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Badge variant="secondary">
                {selectedIds.size} of {leaseContracts.length} selected
              </Badge>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
              {leaseContracts.map((contract) => (
                <div
                  key={contract.id}
                  className={`flex items-start gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                    selectedIds.has(contract.id!)
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/30 hover:bg-muted/50 border border-transparent"
                  }`}
                  onClick={() => toggleSelection(contract.id!)}
                >
                  <Checkbox
                    checked={selectedIds.has(contract.id!)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {contract.counterparty || "Unknown Lessor"}
                    </p>
                    {contract.description && (
                      <p className="text-sm text-muted-foreground truncate">
                        {contract.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(contract.annualValue || contract.contractValue)}
                        /yr
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Exp: {formatDate(contract.expirationDate)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                <p className="font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Will import as:
                </p>
                <ul className="mt-1 text-muted-foreground list-disc list-inside">
                  <li>Lease type: Operating (editable)</li>
                  <li>Annual payment from contract value</li>
                  <li>Remaining term calculated from expiration</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedIds.size === 0}
          >
            Import {selectedIds.size} Lease{selectedIds.size !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
