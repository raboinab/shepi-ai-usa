import { useRef, useState, useCallback } from "react";
import { Period } from "@/lib/periodUtils";
import { formatCurrency, parseCurrencyInput } from "@/lib/trialBalanceUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface MultiPeriodAccount {
  id: string;
  name: string;
  category?: string;
  monthlyValues: Record<string, number>;
}

interface MultiPeriodFinancialTableProps {
  accounts: MultiPeriodAccount[];
  periods: Period[];
  onAccountsChange: (accounts: MultiPeriodAccount[]) => void;
  onAddAccount?: () => void;
  showAddButton?: boolean;
  allowDelete?: boolean;
  categoryColumn?: boolean;
  summaryRows?: Array<{
    label: string;
    calculate: (periodId: string) => number;
    highlight?: boolean;
  }>;
  showFYColumn?: boolean;
  showLTMColumn?: boolean;
  showYTDColumn?: boolean;
  fiscalYearEnd?: number;
}

export function MultiPeriodFinancialTable({
  accounts,
  periods,
  onAccountsChange,
  onAddAccount,
  showAddButton = true,
  allowDelete = true,
  categoryColumn = false,
  summaryRows = [],
  showFYColumn = false,
  showLTMColumn = false,
  showYTDColumn = false,
  fiscalYearEnd = 12,
}: MultiPeriodFinancialTableProps) {
  const [editingCell, setEditingCell] = useState<{ accountId: string; periodId: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);

  // Include all periods (including stubs) for display; aggregate calcs use only non-stubs
  const displayPeriods = periods;
  const regularPeriods = periods.filter(p => !p.isStub);

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

  const handleNameChange = useCallback((accountId: string, value: string) => {
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, name: value };
      }
      return acc;
    });
    onAccountsChange(updatedAccounts);
  }, [accounts, onAccountsChange]);

  const handleCategoryChange = useCallback((accountId: string, value: string) => {
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === accountId) {
        return { ...acc, category: value };
      }
      return acc;
    });
    onAccountsChange(updatedAccounts);
  }, [accounts, onAccountsChange]);

  // Calculate FY total for an account (sum of all periods in last FY)
  const calculateAccountFY = (account: MultiPeriodAccount): number => {
    const fyEndPeriods = regularPeriods.filter(p => p.month === fiscalYearEnd);
    if (fyEndPeriods.length === 0) return 0;
    
    const lastFYEnd = fyEndPeriods[fyEndPeriods.length - 1];
    const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
    const fyStartYear = fiscalYearEnd === 12 ? lastFYEnd.year : lastFYEnd.year - 1;
    
    let total = 0;
    regularPeriods.forEach(p => {
      const isInFY = (p.year === fyStartYear && p.month >= fyStartMonth) ||
                     (p.year === lastFYEnd.year && p.month <= fiscalYearEnd);
      if (isInFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  };

  // Calculate LTM total for an account (includes stubs for complete trailing view)
  const calculateAccountLTM = (account: MultiPeriodAccount): number => {
    const last12 = periods.slice(-12);
    return last12.reduce((sum, p) => sum + (account.monthlyValues[p.id] || 0), 0);
  };

  // Calculate YTD total for an account (includes stubs for complete trailing view)
  const calculateAccountYTD = (account: MultiPeriodAccount): number => {
    if (periods.length === 0) return 0;
    
    const lastPeriod = periods[periods.length - 1];
    const fyStartMonth = fiscalYearEnd === 12 ? 1 : fiscalYearEnd + 1;
    const fyStartYear = fiscalYearEnd === 12 ? lastPeriod.year : 
      (lastPeriod.month > fiscalYearEnd ? lastPeriod.year : lastPeriod.year - 1);

    let total = 0;
    periods.forEach(p => {
      const isInCurrentFY = (p.year === fyStartYear && p.month >= fyStartMonth) ||
                            (p.year > fyStartYear);
      if (isInCurrentFY) {
        total += account.monthlyValues[p.id] || 0;
      }
    });
    return total;
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <ScrollArea className="w-full" type="always">
        <div className="min-w-max" ref={tableRef}>
          {/* Header Row */}
          <div className="flex bg-muted/50 border-b border-border sticky top-0 z-10">
            {/* Frozen columns */}
            <div className="flex sticky left-0 z-20 bg-muted/50">
              <div className="w-48 px-2 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
                Account Name
              </div>
              {categoryColumn && (
                <div className="w-32 px-2 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
                  Category
                </div>
              )}
            </div>
            
            {/* Scrollable period columns */}
            {displayPeriods.map(period => (
              <div 
                key={period.id} 
                className={`w-24 px-2 py-2 text-xs font-semibold text-muted-foreground text-right border-r border-border ${period.isStub ? 'bg-accent/50 italic' : ''}`}
              >
                {period.label}
              </div>
            ))}
            
            {/* Summary columns */}
            {showFYColumn && (
              <div className="w-24 px-2 py-2 text-xs font-semibold text-primary text-right border-r border-border bg-primary/5">FY</div>
            )}
            {showLTMColumn && (
              <div className="w-24 px-2 py-2 text-xs font-semibold text-primary text-right border-r border-border bg-primary/5">LTM</div>
            )}
            {showYTDColumn && (
              <div className="w-24 px-2 py-2 text-xs font-semibold text-primary text-right border-r border-border bg-primary/5">YTD</div>
            )}
            
            {/* Actions column */}
            {allowDelete && (
              <div className="w-12 px-2 py-2 sticky right-0 bg-muted/50"></div>
            )}
          </div>

          {/* Data Rows */}
          {accounts.map((account, index) => (
            <div 
              key={account.id} 
              className={`flex border-b border-border hover:bg-muted/30 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
            >
              {/* Frozen columns */}
              <div className={`flex sticky left-0 z-10 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                <div className="w-48 px-1 py-1 border-r border-border">
                  <Input
                    value={account.name}
                    onChange={(e) => handleNameChange(account.id, e.target.value)}
                    className="h-7 text-xs px-1"
                    placeholder="Account name"
                  />
                </div>
                {categoryColumn && (
                  <div className="w-32 px-1 py-1 border-r border-border">
                    <Input
                      value={account.category || ''}
                      onChange={(e) => handleCategoryChange(account.id, e.target.value)}
                      className="h-7 text-xs px-1"
                      placeholder="Category"
                    />
                  </div>
                )}
              </div>
              
              {/* Scrollable value columns */}
              {displayPeriods.map(period => {
                const value = account.monthlyValues[period.id] || 0;
                const isEditing = editingCell?.accountId === account.id && editingCell?.periodId === period.id;
                
                return (
                  <div 
                    key={period.id}
                    className={`w-24 px-1 py-1 border-r border-border ${period.isStub ? 'bg-accent/20' : ''}`}
                    onClick={() => !isEditing && handleCellClick(account.id, period.id, value)}
                  >
                    {isEditing ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleCellBlur}
                        onKeyDown={handleKeyDown}
                        className="h-7 text-xs text-right px-1"
                        autoFocus
                      />
                    ) : (
                      <div className={`h-7 flex items-center justify-end text-xs cursor-pointer hover:bg-muted/50 rounded px-1 ${value < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(value)}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Summary columns */}
              {showFYColumn && (
                <div className="w-24 px-2 py-1 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end">
                  {formatCurrency(calculateAccountFY(account))}
                </div>
              )}
              {showLTMColumn && (
                <div className="w-24 px-2 py-1 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end">
                  {formatCurrency(calculateAccountLTM(account))}
                </div>
              )}
              {showYTDColumn && (
                <div className="w-24 px-2 py-1 text-xs text-right border-r border-border bg-primary/5 flex items-center justify-end">
                  {formatCurrency(calculateAccountYTD(account))}
                </div>
              )}
              
              {/* Actions */}
              {allowDelete && (
                <div className={`w-12 px-1 py-1 flex items-center justify-center sticky right-0 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAccount(account.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Summary Rows */}
          {summaryRows.map((row, idx) => (
            <div key={idx} className={`flex border-b border-border ${row.highlight ? 'bg-primary/10' : 'bg-muted/30'}`}>
              <div className={`flex sticky left-0 z-10 ${row.highlight ? 'bg-primary/10' : 'bg-muted/30'}`}>
                <div className="w-48 px-2 py-2 text-xs font-semibold border-r border-border">
                  {row.label}
                </div>
                {categoryColumn && (
                  <div className="w-32 px-2 py-2 border-r border-border"></div>
                )}
              </div>
              {displayPeriods.map(period => (
                <div key={period.id} className={`w-24 px-2 py-2 text-xs text-right border-r border-border font-medium ${row.highlight ? 'font-bold text-primary' : ''} ${period.isStub ? 'bg-accent/20' : ''}`}>
                  {formatCurrency(row.calculate(period.id))}
                </div>
              ))}
              {showFYColumn && <div className="w-24 px-2 py-2 border-r border-border bg-primary/5"></div>}
              {showLTMColumn && <div className="w-24 px-2 py-2 border-r border-border bg-primary/5"></div>}
              {showYTDColumn && <div className="w-24 px-2 py-2 border-r border-border bg-primary/5"></div>}
              {allowDelete && <div className={`w-12 sticky right-0 ${row.highlight ? 'bg-primary/10' : 'bg-muted/30'}`}></div>}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Add Account Button */}
      {showAddButton && onAddAccount && (
        <div className="p-3 border-t border-border bg-muted/20">
          <Button variant="outline" size="sm" onClick={onAddAccount} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Row
          </Button>
        </div>
      )}
    </div>
  );
}

export function createEmptyMultiPeriodAccount(name: string = ''): MultiPeriodAccount {
  return {
    id: crypto.randomUUID(),
    name,
    monthlyValues: {},
  };
}
