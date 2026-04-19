import { useRef, useState, useCallback, useMemo } from "react";
import { Period } from "@/lib/periodUtils";
import { 
  TrialBalanceAccount, 
  formatCurrency, 
  parseCurrencyInput,
  calculateBalanceCheck,
  getFiscalYears,
  calculateFYTotalForYear,
  getLTMReferencePeriods,
  calculateLTMAtPeriod,
  getYTDReferencePeriods,
  calculateYTDAtPeriod,
  SHORT_MONTHS,
} from "@/lib/trialBalanceUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MultiPeriodTableProps {
  accounts: TrialBalanceAccount[];
  periods: Period[];
  fiscalYearEnd: number;
  onAccountsChange: (accounts: TrialBalanceAccount[]) => void;
  onAddAccount: () => void;
  showMatchIndicators?: boolean;
}

export function MultiPeriodTable({
  accounts,
  periods,
  fiscalYearEnd,
  onAccountsChange,
  onAddAccount,
  showMatchIndicators = false,
}: MultiPeriodTableProps) {
  const [editingCell, setEditingCell] = useState<{ accountId: string; periodId: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  // Include all periods (including stubs) for display; aggregate calcs use only non-stubs
  const displayPeriods = periods;
  const regularPeriods = periods.filter(p => !p.isStub);

  // Dynamic summary columns
  const fiscalYears = useMemo(() => getFiscalYears(regularPeriods, fiscalYearEnd), [regularPeriods, fiscalYearEnd]);
  const ltmPeriods = useMemo(() => getLTMReferencePeriods(regularPeriods, fiscalYearEnd), [regularPeriods, fiscalYearEnd]);
  const ytdPeriods = useMemo(() => getYTDReferencePeriods(regularPeriods, fiscalYearEnd), [regularPeriods, fiscalYearEnd]);

  // Convert cumulative YTD → monthly activity for IS accounts (display-only).
  // This mirrors the logic in projectToDealAdapter.ts lines 214-232.
  const displayAccounts = useMemo(() => {
    const sortedPeriodIds = regularPeriods.map(p => p.id);
    const fyStartMonth = (fiscalYearEnd % 12) + 1;

    const parsePeriodMonth = (periodId: string): number | undefined => {
      const match = periodId.match(/(\d{4})-(\d{2})/);
      if (match) return parseInt(match[2], 10);
      return undefined;
    };

    return accounts.map(acc => {
      if (acc.fsType !== "IS") return acc;

      const balances = { ...acc.monthlyValues };
      const orderedIds = sortedPeriodIds.filter(id => id in balances);

      for (let i = orderedIds.length - 1; i > 0; i--) {
        const curMonth = parsePeriodMonth(orderedIds[i]);
        const prevMonth = parsePeriodMonth(orderedIds[i - 1]);
        if (curMonth === fyStartMonth) continue;
        if (prevMonth !== undefined && curMonth !== undefined) {
          balances[orderedIds[i]] -= balances[orderedIds[i - 1]];
        }
      }

      return { ...acc, monthlyValues: balances };
    });
  }, [accounts, regularPeriods, fiscalYearEnd]);

  const handleCellClick = useCallback((accountId: string, periodId: string, currentValue: number) => {
    setEditingCell({ accountId, periodId });
    setEditValue(currentValue === 0 ? "" : String(currentValue));
  }, []);

  const handleCellBlur = useCallback(() => {
    if (editingCell) {
      const newValue = parseCurrencyInput(editValue);
      const updatedAccounts = accounts.map(acc => {
        if (acc.id === editingCell.accountId) {
          return {
            ...acc,
            monthlyValues: {
              ...acc.monthlyValues,
              [editingCell.periodId]: newValue,
            },
          };
        }
        return acc;
      });
      onAccountsChange(updatedAccounts);
      setEditingCell(null);
      setEditValue("");
    }
  }, [editingCell, editValue, accounts, onAccountsChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellBlur();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  }, [handleCellBlur]);

  const handleRemoveAccount = useCallback((accountId: string) => {
    onAccountsChange(accounts.filter(acc => acc.id !== accountId));
  }, [accounts, onAccountsChange]);

  const handleMetadataChange = useCallback((
    accountId: string, 
    field: keyof Pick<TrialBalanceAccount, 'accountNumber' | 'accountName' | 'accountType' | 'accountSubtype' | 'fsType' | 'fsLineItem' | 'subAccount1' | 'subAccount2'>,
    value: string
  ) => {
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, [field]: value };
      }
      return acc;
    });
    onAccountsChange(updatedAccounts);
  }, [accounts, onAccountsChange]);

  const getBalanceCheck = (periodId: string) => calculateBalanceCheck(displayAccounts, periodId);

  return (
    <div className="border border-border rounded-lg overflow-hidden relative">
      <div className="overflow-auto max-h-[calc(100vh-280px)]" ref={tableRef}>
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex bg-muted border-b-2 border-border sticky top-0 z-20 shadow-[0_2px_4px_-1px_hsl(var(--border)/0.5)]">
            {/* Frozen columns */}
            <div className="flex sticky left-0 z-30 bg-muted shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]">
              <div className="w-16 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border">FS</div>
              <div className="w-20 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border">Acct #</div>
              <div className="w-48 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border">Account Name</div>
              <div className="w-44 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border">FS Line Item</div>
              <div className="w-36 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border">Sub-acct 1</div>
              <div className="w-36 px-2 py-3 text-xs font-semibold text-muted-foreground border-r border-border border-r-2">Sub-acct 2</div>
            </div>
            
            {/* Scrollable period columns */}
            {displayPeriods.map(period => (
              <div 
                key={period.id} 
                className={cn(
                  "w-28 px-2 py-2.5 text-xs font-semibold text-muted-foreground text-right border-r border-border bg-muted",
                  period.isStub && "bg-accent/50 italic"
                )}
              >
                {period.label}
              </div>
            ))}
            
            {/* Dynamic FY columns */}
            {fiscalYears.map(fy => (
              <div key={`fy-${fy}`} className="w-28 px-2 py-2.5 text-xs font-semibold text-primary text-right border-r border-border bg-primary/10">
                FY{fy.toString().slice(-2)}
              </div>
            ))}
            {/* Dynamic LTM columns */}
            {ltmPeriods.map(p => (
              <div key={`ltm-${p.id}`} className="w-28 px-2 py-2.5 text-xs font-semibold text-primary text-right border-r border-border bg-primary/10">
                LTM {SHORT_MONTHS[p.month - 1]}-{p.year.toString().slice(-2)}
              </div>
            ))}
            {/* Dynamic YTD columns */}
            {ytdPeriods.map(p => (
              <div key={`ytd-${p.id}`} className="w-28 px-2 py-2.5 text-xs font-semibold text-primary text-right border-r border-border bg-primary/10">
                YTD {SHORT_MONTHS[p.month - 1]}-{p.year.toString().slice(-2)}
              </div>
            ))}
            
            {/* Actions column */}
            <div className="w-12 px-2 py-2.5 sticky right-0 z-30 bg-muted"></div>
          </div>

          {/* Data Rows */}
          {displayAccounts.map((account, index) => {
            const isMatched = (account as any)._matchedFromCOA;
            const showIndicator = showMatchIndicators && isMatched !== undefined;
            
            return (
            <div 
              key={account.id} 
              className={cn(
                `flex border-b border-border hover:bg-accent/50`,
                index % 2 === 0 ? 'bg-background' : 'bg-muted/30',
                showIndicator && !isMatched && 'border-l-2 border-l-amber-400'
              )}
            >
              {/* Frozen columns */}
              <div className={cn("flex sticky left-0 z-10 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]", index % 2 === 0 ? 'bg-background' : 'bg-muted')}>
                <div className="w-16 px-1 py-2 border-r border-border flex items-center gap-1">
                  {showIndicator && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex-shrink-0">
                          {isMatched ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-amber-500" />
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isMatched ? "Matched from Chart of Accounts" : "No COA match - verify classification"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <select
                    value={account.fsType}
                    onChange={(e) => handleMetadataChange(account.id, 'fsType', e.target.value)}
                    className="w-full h-8 text-xs bg-transparent border-0 focus:ring-1 focus:ring-ring rounded"
                  >
                    <option value="BS">BS</option>
                    <option value="IS">IS</option>
                  </select>
                </div>
                <div className="w-20 px-1 py-2 border-r border-border">
                  <Input
                    value={account.accountNumber}
                    onChange={(e) => handleMetadataChange(account.id, 'accountNumber', e.target.value)}
                    className="h-8 text-xs px-1"
                    placeholder="#"
                  />
                </div>
                <div className="w-48 px-1 py-2 border-r border-border">
                  <Input
                    value={account.accountName}
                    onChange={(e) => handleMetadataChange(account.id, 'accountName', e.target.value)}
                    className="h-8 text-xs px-1"
                    placeholder="Account name"
                  />
                </div>
                <div className="w-44 px-1 py-2 border-r border-border">
                  <Input
                    value={account.fsLineItem || ''}
                    onChange={(e) => handleMetadataChange(account.id, 'fsLineItem', e.target.value)}
                    className="h-8 text-xs px-1 w-full truncate"
                    placeholder="FS Line Item"
                  />
                </div>
                <div className="w-36 px-1 py-2 border-r border-border">
                  <Input
                    value={account.subAccount1 || ''}
                    onChange={(e) => handleMetadataChange(account.id, 'subAccount1', e.target.value)}
                    className="h-8 text-xs px-1 w-full truncate"
                    placeholder="Sub-acct 1"
                  />
                </div>
                <div className="w-36 px-1 py-2 border-r border-border border-r-2">
                  <Input
                    value={account.subAccount2 || ''}
                    onChange={(e) => handleMetadataChange(account.id, 'subAccount2', e.target.value)}
                    className="h-8 text-xs px-1 w-full truncate"
                    placeholder="Sub-acct 2"
                  />
                </div>
              </div>
              
              {/* Scrollable value columns */}
              {displayPeriods.map(period => {
                const value = account.monthlyValues[period.id] || 0;
                const isEditing = editingCell?.accountId === account.id && editingCell?.periodId === period.id;
                
                return (
                  <div 
                    key={period.id}
                    className={cn("w-28 px-1 py-2 border-r border-border", period.isStub && "bg-accent/20")}
                    onClick={() => !isEditing && handleCellClick(account.id, period.id, value)}
                  >
                    {isEditing ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-xs text-right px-1"
                        autoFocus
                      />
                    ) : (
                      <div className={`h-8 flex items-center justify-end text-xs cursor-pointer hover:bg-accent/50 rounded px-1 ${value < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(value)}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Dynamic FY columns */}
              {fiscalYears.map(fy => (
                <div key={`fy-${fy}`} className="w-28 px-2 py-1.5 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end font-medium">
                  {formatCurrency(calculateFYTotalForYear(account, periods, fiscalYearEnd, fy))}
                </div>
              ))}
              {/* Dynamic LTM columns */}
              {ltmPeriods.map(p => (
                <div key={`ltm-${p.id}`} className="w-28 px-2 py-1.5 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end font-medium">
                  {formatCurrency(calculateLTMAtPeriod(account, periods, p))}
                </div>
              ))}
              {/* Dynamic YTD columns */}
              {ytdPeriods.map(p => (
                <div key={`ytd-${p.id}`} className="w-28 px-2 py-1.5 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end font-medium">
                  {formatCurrency(calculateYTDAtPeriod(account, periods, fiscalYearEnd, p))}
                </div>
              ))}
              
              {/* Actions */}
              <div className={cn("w-12 px-1 py-2 flex items-center justify-center sticky right-0 z-10", index % 2 === 0 ? 'bg-background' : 'bg-muted')}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAccount(account.id)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
          })}

          {/* Balance Check Rows */}
          <div className="flex border-b border-border bg-muted/40">
            <div className="flex sticky left-0 z-10 bg-muted/40 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]">
              <div className="w-16 px-2 py-2.5 text-xs font-semibold border-r border-border"></div>
              <div className="w-20 px-2 py-2.5 text-xs font-semibold border-r border-border"></div>
              <div className="w-48 px-2 py-2.5 text-xs font-semibold border-r border-border">Balance Sheet Total</div>
              <div className="w-44 px-2 py-2.5 border-r border-border"></div>
              <div className="w-36 px-2 py-2.5 border-r border-border"></div>
              <div className="w-36 px-2 py-2.5 border-r border-border border-r-2"></div>
            </div>
            {displayPeriods.map(period => (
              <div key={period.id} className={cn("w-28 px-2 py-2.5 text-xs text-right border-r border-border font-medium", period.isStub && "bg-accent/20")}>
                {formatCurrency(getBalanceCheck(period.id).bsTotal)}
              </div>
            ))}
            {/* Empty cells for dynamic summary columns */}
            {fiscalYears.map(fy => (
              <div key={`fy-${fy}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            {ltmPeriods.map(p => (
              <div key={`ltm-${p.id}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            {ytdPeriods.map(p => (
              <div key={`ytd-${p.id}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            <div className="w-12 sticky right-0 bg-muted/40"></div>
          </div>

          <div className="flex border-b border-border bg-muted/40">
            <div className="flex sticky left-0 z-10 bg-muted/40 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]">
              <div className="w-16 px-2 py-2.5 text-xs font-semibold border-r border-border"></div>
              <div className="w-20 px-2 py-2.5 text-xs font-semibold border-r border-border"></div>
              <div className="w-48 px-2 py-2.5 text-xs font-semibold border-r border-border">Income Statement Total</div>
              <div className="w-44 px-2 py-2.5 border-r border-border"></div>
              <div className="w-36 px-2 py-2.5 border-r border-border"></div>
              <div className="w-36 px-2 py-2.5 border-r border-border border-r-2"></div>
            </div>
            {displayPeriods.map(period => (
              <div key={period.id} className={cn("w-28 px-2 py-2.5 text-xs text-right border-r border-border font-medium", period.isStub && "bg-accent/20")}>
                {formatCurrency(getBalanceCheck(period.id).isTotal)}
              </div>
            ))}
            {/* Empty cells for dynamic summary columns */}
            {fiscalYears.map(fy => (
              <div key={`fy-${fy}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            {ltmPeriods.map(p => (
              <div key={`ltm-${p.id}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            {ytdPeriods.map(p => (
              <div key={`ytd-${p.id}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            <div className="w-12 sticky right-0 bg-muted/40"></div>
          </div>

          <div className="flex bg-muted/60">
            <div className="flex sticky left-0 z-10 bg-muted/60 shadow-[4px_0_6px_-4px_hsl(var(--border)/0.4)]">
              <div className="w-16 px-2 py-2.5 text-xs font-semibold border-r border-border"></div>
              <div className="w-20 px-2 py-2.5 text-xs font-semibold border-r border-border"></div>
              <div className="w-48 px-2 py-2.5 text-xs font-bold border-r border-border">Check (should be 0)</div>
              <div className="w-44 px-2 py-2.5 border-r border-border"></div>
              <div className="w-36 px-2 py-2.5 border-r border-border"></div>
              <div className="w-36 px-2 py-2.5 border-r border-border border-r-2"></div>
            </div>
            {displayPeriods.map(period => {
              const check = getBalanceCheck(period.id).checkTotal;
              const isBalanced = Math.abs(check) < 0.01;
              return (
                <div 
                  key={period.id} 
                  className={cn("w-28 px-2 py-2.5 text-xs text-right border-r border-border font-bold", isBalanced ? 'text-green-600' : 'text-destructive', period.isStub && "bg-accent/20")}
                >
                  {formatCurrency(check)}
                </div>
              );
            })}
            {/* Empty cells for dynamic summary columns */}
            {fiscalYears.map(fy => (
              <div key={`fy-${fy}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            {ltmPeriods.map(p => (
              <div key={`ltm-${p.id}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            {ytdPeriods.map(p => (
              <div key={`ytd-${p.id}`} className="w-28 px-2 py-2.5 border-r border-border bg-primary/5"></div>
            ))}
            <div className="w-12 sticky right-0 bg-muted/60"></div>
          </div>
        </div>
      </div>

      {/* Add Account Button */}
      <div className="p-3 border-t border-border bg-muted/20">
        <Button variant="outline" size="sm" onClick={onAddAccount} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>
    </div>
  );
}
