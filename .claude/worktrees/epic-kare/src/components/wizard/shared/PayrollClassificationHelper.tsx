import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, AlertCircle, X } from "lucide-react";

// Keywords that suggest an account might be payroll-related
const PAYROLL_KEYWORDS = [
  'salary', 'salaries', 'wage', 'wages', 'payroll', 'compensation',
  'bonus', 'bonuses', 'commission', 'officer', 'staff', 'personnel',
  'employee', 'benefits', '401k', '401(k)', 'retirement', 'pension',
  'health insurance', 'medical', 'dental', 'vision', 'fica', 'medicare',
  'futa', 'suta', 'unemployment', 'workers comp', 'workman', 'pto',
  'sick pay', 'vacation pay', 'employer contribution'
];

export interface TrialBalanceAccount {
  id: string;
  accountName: string;
  accountNumber?: string;
  fsType?: string;
  fsLineItem?: string;
  subAccount1?: string;
  subAccount2?: string;
  subAccount3?: string;
  monthlyValues?: Record<string, number>;
  payrollDismissed?: boolean;
  [key: string]: unknown;
}

interface PayrollClassificationHelperProps {
  trialBalanceAccounts: TrialBalanceAccount[];
  onTrialBalanceChange: (accounts: TrialBalanceAccount[]) => void;
}

/**
 * Determines if an account might be payroll-related based on keywords
 */
function isPotentialPayrollAccount(account: TrialBalanceAccount): boolean {
  // Only look at expense accounts (Income Statement)
  if (account.fsType !== 'IS') return false;
  
  // Skip if already classified as Payroll & Related
  if (account.subAccount1 === 'Payroll & Related') return false;
  
  // Skip if user has dismissed this account
  if (account.payrollDismissed === true) return false;
  
  const nameLower = (account.accountName || '').toLowerCase();
  return PAYROLL_KEYWORDS.some(kw => nameLower.includes(kw));
}

export const PayrollClassificationHelper = ({
  trialBalanceAccounts,
  onTrialBalanceChange,
}: PayrollClassificationHelperProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Find accounts that might be payroll but aren't classified
  const unclassifiedPayrollAccounts = trialBalanceAccounts.filter(isPotentialPayrollAccount);

  // Find accounts already classified as Payroll & Related
  const classifiedPayrollAccounts = trialBalanceAccounts.filter(
    acc => acc.subAccount1 === 'Payroll & Related'
  );

  const handleAddToPayroll = (accountId: string) => {
    const updated = trialBalanceAccounts.map(acc =>
      acc.id === accountId
        ? { ...acc, subAccount1: 'Payroll & Related' }
        : acc
    );
    onTrialBalanceChange(updated);
  };

  const handleAddSelected = () => {
    if (selectedIds.size === 0) return;
    
    const updated = trialBalanceAccounts.map(acc =>
      selectedIds.has(acc.id)
        ? { ...acc, subAccount1: 'Payroll & Related' }
        : acc
    );
    onTrialBalanceChange(updated);
    setSelectedIds(new Set());
  };

  const handleAddAll = () => {
    const updated = trialBalanceAccounts.map(acc =>
      isPotentialPayrollAccount(acc)
        ? { ...acc, subAccount1: 'Payroll & Related' }
        : acc
    );
    onTrialBalanceChange(updated);
  };

  const handleDismiss = (accountId: string) => {
    const updated = trialBalanceAccounts.map(acc =>
      acc.id === accountId
        ? { ...acc, payrollDismissed: true }
        : acc
    );
    onTrialBalanceChange(updated);
  };

  const handleDismissSelected = () => {
    if (selectedIds.size === 0) return;
    
    const updated = trialBalanceAccounts.map(acc =>
      selectedIds.has(acc.id)
        ? { ...acc, payrollDismissed: true }
        : acc
    );
    onTrialBalanceChange(updated);
    setSelectedIds(new Set());
  };

  const toggleSelection = (accountId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(accountId)) {
      newSelected.delete(accountId);
    } else {
      newSelected.add(accountId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === unclassifiedPayrollAccounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unclassifiedPayrollAccounts.map(a => a.id)));
    }
  };

  // Show nothing if no unclassified accounts found
  if (unclassifiedPayrollAccounts.length === 0) {
    if (classifiedPayrollAccounts.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">No payroll-related accounts found in the Trial Balance.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Import QuickBooks data or check that expense accounts exist in the Trial Balance.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    // All payroll accounts are classified
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Account Classification</CardTitle>
          </div>
          <CardDescription>
            All detected payroll accounts are classified. ({classifiedPayrollAccounts.length} accounts)
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Account Classification</CardTitle>
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button size="sm" onClick={handleAddSelected} className="gap-1">
                  <Plus className="w-4 h-4" />
                  Add Selected ({selectedIds.size})
                </Button>
                <Button size="sm" variant="outline" onClick={handleDismissSelected} className="gap-1">
                  <X className="w-4 h-4" />
                  Dismiss Selected
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleAddAll}>
              Add All ({unclassifiedPayrollAccounts.length})
            </Button>
          </div>
        </div>
        <CardDescription>
          These accounts may be payroll-related but aren't classified. Add them to include in the Payroll report.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.size === unclassifiedPayrollAccounts.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Account #</TableHead>
                <TableHead>Current Classification</TableHead>
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unclassifiedPayrollAccounts.map(account => (
                <TableRow key={account.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(account.id)}
                      onCheckedChange={() => toggleSelection(account.id)}
                      aria-label={`Select ${account.accountName}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{account.accountName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.accountNumber || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {account.subAccount1 || 'Unclassified'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAddToPayroll(account.id)}
                        className="h-7 px-2 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismiss(account.id)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {classifiedPayrollAccounts.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {classifiedPayrollAccounts.length} account(s) already classified as "Payroll & Related"
          </p>
        )}
      </CardContent>
    </Card>
  );
};
