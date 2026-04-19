import { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Period } from "@/lib/periodUtils";

/* ── Buffered single-cell input ── */
function BufferedNumberInput({
  value,
  onCommit,
  disabled,
}: {
  value: number | undefined;
  onCommit: (v: number) => void;
  disabled?: boolean;
}) {
  const [local, setLocal] = useState(value?.toString() ?? "");

  // Sync when parent value changes (e.g. from Apply Total)
  useEffect(() => {
    setLocal(value?.toString() ?? "");
  }, [value]);

  return (
    <Input
      type="number"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const num = parseFloat(local) || 0;
        onCommit(num);
      }}
      disabled={disabled}
      className={cn(
        "w-[75px] h-8 text-right text-sm",
        "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      )}
      placeholder="0"
    />
  );
}

interface PeriodValueGridProps {
  periods: Period[];
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  disabled?: boolean;
  showTotal?: boolean;
}

type DistributionMethod = "even" | "last_period";

export function PeriodValueGrid({
  periods,
  values,
  onChange,
  disabled = false,
  showTotal = true,
}: PeriodValueGridProps) {
  const [applyTotalInput, setApplyTotalInput] = useState("");
  const [distributionMethod, setDistributionMethod] = useState<DistributionMethod>("even");

  // Format period label for display
  const formatPeriodLabel = useCallback((period: Period) => {
    if (period.label) return period.label;
    const [year, month] = period.id.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex] || month} ${year?.slice(2)}`;
  }, []);

  // Calculate total
  const total = useMemo(() => {
    return Object.values(values).reduce((sum, val) => sum + (val || 0), 0);
  }, [values]);

  // Handle single cell commit on blur
  const handleCellCommit = useCallback((periodId: string, numValue: number) => {
    const newValues = { ...values };
    if (numValue === 0) {
      delete newValues[periodId];
    } else {
      newValues[periodId] = numValue;
    }
    onChange(newValues);
  }, [values, onChange]);

  // Apply total across periods
  const applyTotal = useCallback(() => {
    const totalAmount = parseFloat(applyTotalInput) || 0;
    if (totalAmount === 0 || periods.length === 0) return;

    const newValues: Record<string, number> = {};

    if (distributionMethod === "last_period") {
      // Put everything in the last period
      newValues[periods[periods.length - 1].id] = totalAmount;
    } else {
      // Even split with cents-based remainder distribution
      const count = periods.length;
      const base = Math.floor(totalAmount / count);
      let remainder = totalAmount - base * count;

      for (let i = 0; i < count; i++) {
        let cellVal = base;
        if (remainder > 0) {
          cellVal += 1;
          remainder -= 1;
        }
        if (cellVal !== 0) {
          newValues[periods[i].id] = cellVal;
        }
      }
    }

    onChange(newValues);
    setApplyTotalInput("");
  }, [applyTotalInput, distributionMethod, periods, onChange]);

  // Format number for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (periods.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
        No periods configured. Set up project periods first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Apply Total row */}
      {!disabled && (
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            type="number"
            value={applyTotalInput}
            onChange={(e) => setApplyTotalInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyTotal(); }}
            placeholder="Enter total to distribute..."
            className={cn(
              "w-[200px] h-8 text-sm",
              "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            )}
          />
          <Select
            value={distributionMethod}
            onValueChange={(v) => setDistributionMethod(v as DistributionMethod)}
          >
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="even">Even split</SelectItem>
              <SelectItem value="last_period">Last period only</SelectItem>
            </SelectContent>
          </Select>
          <button
            type="button"
            onClick={applyTotal}
            disabled={!applyTotalInput || parseFloat(applyTotalInput) === 0}
            className={cn(
              "text-xs font-medium px-3 h-8 rounded-md transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            Apply
          </button>
        </div>
      )}

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex p-2 gap-1">
          {periods.map((period) => (
            <div
              key={period.id}
              className="flex flex-col items-center gap-1 min-w-[80px]"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {formatPeriodLabel(period)}
              </span>
              <BufferedNumberInput
                value={values[period.id]}
                onCommit={(v) => handleCellCommit(period.id, v)}
                disabled={disabled}
              />
            </div>
          ))}
          
          {showTotal && (
            <div className="flex flex-col items-center gap-1 min-w-[90px] pl-2 border-l">
              <span className="text-xs font-semibold">Total</span>
              <div className={cn(
                "w-[85px] h-8 flex items-center justify-end px-2 rounded-md text-sm font-medium",
                "bg-muted"
              )}>
                {formatNumber(total)}
              </div>
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      <p className="text-xs text-muted-foreground">
        Enter absolute values. Sign will be applied based on adjustment intent.
      </p>
    </div>
  );
}
