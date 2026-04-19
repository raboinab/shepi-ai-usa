import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SummaryCard } from "../shared/SummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wallet, CheckCircle, AlertCircle, Plus, Trash2, Building2, CreditCard, Download, FileSpreadsheet, FileText, Loader2, Sparkles, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useProofOfCashData, parseCashAnalysis, matchPeriodToStatement } from "@/hooks/useProofOfCashData";
import { useTransferClassification } from "@/hooks/useTransferClassification";
import { TransferReviewDialog } from "@/components/workbook/shared/TransferReviewDialog";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  type: "checking" | "savings" | "credit" | "other";
  institution: string;
  dataSource?: "manual" | "statement" | "spreadsheet";
}

interface MonthlyBankData {
  periodId: string;
  accountId: string;
  beginningBalance: number;
  depositsPerBank: number;
  withdrawalsPerBank: number;
  endingBankBalance: number;
  // Book side
  beginningBookBalance: number;
  receiptsPerBooks: number;
  disbursementsPerBooks: number;
  endingBookBalance: number;
  // Reconciling items
  depositsInTransit: number;
  outstandingChecks: number;
  bankErrors: number;
  bookErrors: number;
  // Classification
  interbankTransfers: number;
  ownerDistributions: number;
  otherAdjustments: number;
  // Data source tracking
  bankDataSource?: "manual" | "statement";
  bookDataSource?: "manual" | "spreadsheet";
}

interface ProofOfCashData {
  bankAccounts: BankAccount[];
  monthlyData: MonthlyBankData[];
  // Legacy fields for backwards compatibility
  bankBalance?: number;
  bookBalance?: number;
  depositsInTransit?: number;
  outstandingChecks?: number;
  bankAdjustments?: Record<string, unknown>[];
  bookAdjustments?: Record<string, unknown>[];
}

interface ProofOfCashSectionProps {
  data: ProofOfCashData;
  updateData: (data: ProofOfCashData) => void;
  periods?: Array<{ id: string; label: string; startDate?: string; endDate?: string }>;
  projectId?: string;
  cashAnalysis?: { rawData?: string[][] };
}

const defaultBankAccount: BankAccount = {
  id: "",
  name: "",
  accountNumber: "",
  type: "checking",
  institution: "",
  dataSource: "manual",
};

const createEmptyMonthlyData = (periodId: string, accountId: string): MonthlyBankData => ({
  periodId,
  accountId,
  beginningBalance: 0,
  depositsPerBank: 0,
  withdrawalsPerBank: 0,
  endingBankBalance: 0,
  beginningBookBalance: 0,
  receiptsPerBooks: 0,
  disbursementsPerBooks: 0,
  endingBookBalance: 0,
  depositsInTransit: 0,
  outstandingChecks: 0,
  bankErrors: 0,
  bookErrors: 0,
  interbankTransfers: 0,
  ownerDistributions: 0,
  otherAdjustments: 0,
  bankDataSource: "manual",
  bookDataSource: "manual",
});

export const ProofOfCashSection = ({ 
  data, 
  updateData, 
  periods = [],
  projectId,
  cashAnalysis,
}: ProofOfCashSectionProps) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("accounts");
  const [isImporting, setIsImporting] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Fetch bank statement data
  const { bankStatements, isLoading: isLoadingStatements } = useProofOfCashData(projectId);

  // Transfer classification
  const {
    classifications,
    rawData: classificationRawData,
    isLoading: isLoadingClassifications,
    classify,
    isClassifying,
    updateClassifications,
  } = useTransferClassification(projectId);

  const hasClassifications = !!classifications && classifications.size > 0;

  // Auto-populate interbank/owner fields when classifications change
  useEffect(() => {
    if (!classifications || classifications.size === 0 || periods.length === 0) return;

    let changed = false;
    const newMonthlyData = [...(data?.monthlyData || [])];

    for (const [periodKey, totals] of classifications) {
      // Find matching period by id (both use "YYYY-MM" format) or derive dates from month/year
      const matchingPeriod = periods.find((p) => {
        if (p.id === periodKey) return true;
        if (p.startDate && p.startDate.substring(0, 7) === periodKey) return true;
        // Derive from month/year as fallback
        const derived = `${(p as any).year}-${String((p as any).month).padStart(2, '0')}`;
        if (derived === periodKey) return true;
        if (p.label && p.label.includes(periodKey)) return true;
        return false;
      });
      if (!matchingPeriod) continue;

      // Update all accounts for this period
      for (const account of bankAccounts) {
        const idx = newMonthlyData.findIndex(
          (d) => d.periodId === matchingPeriod.id && d.accountId === account.id
        );
        if (idx >= 0) {
          if (
            newMonthlyData[idx].interbankTransfers !== totals.interbank ||
            newMonthlyData[idx].ownerDistributions !== totals.owner
          ) {
            newMonthlyData[idx] = {
              ...newMonthlyData[idx],
              interbankTransfers: totals.interbank,
              ownerDistributions: totals.owner,
            };
            changed = true;
          }
        }
      }
    }

    if (changed) {
      updateData({ ...data, monthlyData: newMonthlyData });
    }
  }, [classifications]);

  const bankAccounts = data?.bankAccounts || [];
  const monthlyData = data?.monthlyData || [];

  // Auto-select first account when accounts exist but none is selected
  useEffect(() => {
    if (bankAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(bankAccounts[0].id);
    }
  }, [bankAccounts, selectedAccountId]);

  // Calculate totals across all accounts for summary
  const totalsByPeriod = periods.map(period => {
    const periodData = monthlyData.filter(d => d.periodId === period.id);
    return {
      periodId: period.id,
      periodLabel: period.label,
      totalBankEnding: periodData.reduce((sum, d) => sum + d.endingBankBalance, 0),
      totalBookEnding: periodData.reduce((sum, d) => sum + d.endingBookBalance, 0),
      totalDepositsInTransit: periodData.reduce((sum, d) => sum + d.depositsInTransit, 0),
      totalOutstandingChecks: periodData.reduce((sum, d) => sum + d.outstandingChecks, 0),
    };
  });

  const latestPeriod = totalsByPeriod[totalsByPeriod.length - 1];
  const adjustedBankBalance = latestPeriod 
    ? latestPeriod.totalBankEnding + latestPeriod.totalDepositsInTransit - latestPeriod.totalOutstandingChecks
    : 0;
  const adjustedBookBalance = latestPeriod?.totalBookEnding || 0;
  const variance = adjustedBankBalance - adjustedBookBalance;
  const isReconciled = Math.abs(variance) < 0.01;

  const addBankAccount = () => {
    const newAccount: BankAccount = {
      ...defaultBankAccount,
      id: crypto.randomUUID(),
      name: `Account ${bankAccounts.length + 1}`,
    };
    updateData({
      ...data,
      bankAccounts: [...bankAccounts, newAccount],
    });
    setSelectedAccountId(newAccount.id);
  };

  // Import bank statements from DocuClipper extractions
  const importFromBankStatements = () => {
    if (bankStatements.length === 0) {
      toast.error("No bank statements found", {
        description: "Upload bank statements in the Document Upload section first.",
      });
      return;
    }

    setIsImporting(true);
    try {
      let newAccounts = [...bankAccounts];
      let newMonthlyData = [...monthlyData];
      let accountsCreated = 0;
      let dataImported = 0;

      for (const stmt of bankStatements) {
        // Find or create account for this bank statement
        let account = newAccounts.find(
          (acc) =>
            (stmt.accountNumber && acc.accountNumber === stmt.accountNumber) ||
            (stmt.bankName && acc.institution === stmt.bankName && acc.name.includes(stmt.bankName))
        );

        if (!account) {
          // Create new account
          account = {
            id: crypto.randomUUID(),
            name: stmt.bankName 
              ? `${stmt.bankName}${stmt.accountNumber ? ` ****${stmt.accountNumber.slice(-4)}` : ""}`
              : `Bank Account ${newAccounts.length + 1}`,
            accountNumber: stmt.accountNumber || "",
            type: "checking" as const,
            institution: stmt.bankName || "",
            dataSource: "statement" as const,
          };
          newAccounts.push(account);
          accountsCreated++;
        }

        // Find matching period — derive start/end from month/year since startDate/endDate are often undefined
        const matchingPeriod = periods.find((p) => {
          if (!stmt.periodStart || !stmt.periodEnd) return false;
          const pAny = p as any;
          const pStart = p.startDate
            ? new Date(p.startDate)
            : (pAny.year && pAny.month ? new Date(pAny.year, pAny.month - 1, 1) : null);
          const pEnd = p.endDate
            ? new Date(p.endDate)
            : (pAny.year && pAny.month ? new Date(pAny.year, pAny.month, 0) : null);
          if (!pStart || !pEnd) return false;
          const sStart = new Date(stmt.periodStart);
          const sEnd = new Date(stmt.periodEnd);
          // Check for overlap
          return sStart <= pEnd && sEnd >= pStart;
        });

        if (matchingPeriod && account) {
          // Update or create monthly data
          const existingIndex = newMonthlyData.findIndex(
            (d) => d.periodId === matchingPeriod.id && d.accountId === account!.id
          );

          const bankData: Partial<MonthlyBankData> = {
            periodId: matchingPeriod.id,
            accountId: account.id,
            beginningBalance: stmt.summary.openingBalance || 0,
            depositsPerBank: stmt.summary.totalCredits || 0,
            withdrawalsPerBank: stmt.summary.totalDebits || 0,
            endingBankBalance: stmt.summary.closingBalance || 0,
            bankDataSource: "statement" as const,
          };

          if (existingIndex >= 0) {
            newMonthlyData[existingIndex] = {
              ...newMonthlyData[existingIndex],
              ...bankData,
            };
          } else {
            newMonthlyData.push({
              ...createEmptyMonthlyData(matchingPeriod.id, account.id),
              ...bankData,
            });
          }
          dataImported++;
        }
      }

      updateData({
        ...data,
        bankAccounts: newAccounts,
        monthlyData: newMonthlyData,
      });

      if (newAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(newAccounts[0].id);
      }

      toast.success("Bank statements imported", {
        description: `Created ${accountsCreated} accounts, imported ${dataImported} periods of data.`,
      });
    } catch (error) {
      console.error("Error importing bank statements:", error);
      toast.error("Import failed", {
        description: "There was an error importing bank statement data.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Import book data from Cash Analysis spreadsheet tab
  const importFromSpreadsheet = () => {
    const parsed = parseCashAnalysis(cashAnalysis?.rawData);
    
    if (!parsed || parsed.accounts.length === 0) {
      toast.error("No cash data found", {
        description: "Complete the data import to load the Cash tab data.",
      });
      return;
    }

    setIsImporting(true);
    try {
      let newMonthlyData = [...monthlyData];
      let dataImported = 0;

      // For each bank account, try to find matching cash account in spreadsheet
      for (const account of bankAccounts) {
        // Look for account matches in the cash analysis
        const matchingRow = parsed.accounts.find((row) => {
          const accountLower = row.account.toLowerCase();
          const nameLower = account.name.toLowerCase();
          const instLower = account.institution.toLowerCase();
          
          return (
            accountLower.includes(nameLower) ||
            nameLower.includes(accountLower) ||
            (instLower && accountLower.includes(instLower)) ||
            accountLower.includes("cash") ||
            accountLower.includes("bank")
          );
        });

        if (!matchingRow) continue;

        // Map period labels to periods
        for (const period of periods) {
          const periodLabel = period.label;
          const value = matchingRow.values[periodLabel];
          
          if (value === undefined) continue;

          const existingIndex = newMonthlyData.findIndex(
            (d) => d.periodId === period.id && d.accountId === account.id
          );

          if (existingIndex >= 0) {
            newMonthlyData[existingIndex] = {
              ...newMonthlyData[existingIndex],
              endingBookBalance: value,
              bookDataSource: "spreadsheet" as const,
            };
          } else {
            newMonthlyData.push({
              ...createEmptyMonthlyData(period.id, account.id),
              endingBookBalance: value,
              bookDataSource: "spreadsheet" as const,
            });
          }
          dataImported++;
        }
      }

      // If no accounts exist yet, create a default one from the first cash row
      if (bankAccounts.length === 0 && parsed.accounts.length > 0) {
        const firstCashRow = parsed.accounts.find(
          (row) => row.account.toLowerCase().includes("cash") || row.account.toLowerCase().includes("bank")
        ) || parsed.accounts[0];

        const newAccount: BankAccount = {
          id: crypto.randomUUID(),
          name: firstCashRow.account,
          accountNumber: "",
          type: "checking",
          institution: "",
          dataSource: "spreadsheet",
        };

        const newAccountData: MonthlyBankData[] = [];
        for (const period of periods) {
          const value = firstCashRow.values[period.label];
          if (value !== undefined) {
            newAccountData.push({
              ...createEmptyMonthlyData(period.id, newAccount.id),
              endingBookBalance: value,
              bookDataSource: "spreadsheet" as const,
            });
            dataImported++;
          }
        }

        updateData({
          ...data,
          bankAccounts: [newAccount],
          monthlyData: [...newMonthlyData, ...newAccountData],
        });
        setSelectedAccountId(newAccount.id);
      } else {
        updateData({ ...data, monthlyData: newMonthlyData });
      }

      toast.success("Book data imported", {
        description: `Imported ${dataImported} periods of book balance data from spreadsheet.`,
      });
    } catch (error) {
      console.error("Error importing from spreadsheet:", error);
      toast.error("Import failed", {
        description: "There was an error importing spreadsheet data.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const updateBankAccount = (accountId: string, updates: Partial<BankAccount>) => {
    updateData({
      ...data,
      bankAccounts: bankAccounts.map(acc => 
        acc.id === accountId ? { ...acc, ...updates } : acc
      ),
    });
  };

  const removeBankAccount = (accountId: string) => {
    updateData({
      ...data,
      bankAccounts: bankAccounts.filter(acc => acc.id !== accountId),
      monthlyData: monthlyData.filter(d => d.accountId !== accountId),
    });
    if (selectedAccountId === accountId) {
      setSelectedAccountId(bankAccounts[0]?.id || "");
    }
  };

  const getMonthlyData = (periodId: string, accountId: string): MonthlyBankData => {
    const existing = monthlyData.find(d => d.periodId === periodId && d.accountId === accountId);
    return existing || createEmptyMonthlyData(periodId, accountId);
  };

  const updateMonthlyData = (periodId: string, accountId: string, updates: Partial<MonthlyBankData>) => {
    const existingIndex = monthlyData.findIndex(d => d.periodId === periodId && d.accountId === accountId);
    let newMonthlyData: MonthlyBankData[];

    if (existingIndex >= 0) {
      newMonthlyData = monthlyData.map((d, i) => 
        i === existingIndex ? { ...d, ...updates } : d
      );
    } else {
      newMonthlyData = [...monthlyData, { ...createEmptyMonthlyData(periodId, accountId), ...updates }];
    }

    updateData({ ...data, monthlyData: newMonthlyData });
  };

  const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold">Proof of Cash</h2>
          <p className="text-muted-foreground">Bank statement reconciliation by period</p>
        </div>
        <Badge variant={isReconciled ? "default" : "destructive"} className="gap-1">
          {isReconciled ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {isReconciled ? "Reconciled" : `Variance: ${formatCurrency(Math.abs(variance))}`}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          title="Bank Accounts" 
          value={bankAccounts.length} 
          icon={Building2}
          isCurrency={false}
        />
        <SummaryCard 
          title="Adjusted Bank Balance" 
          value={adjustedBankBalance} 
          icon={Wallet}
        />
        <SummaryCard 
          title="Adjusted Book Balance" 
          value={adjustedBookBalance} 
          icon={CreditCard}
        />
        <SummaryCard 
          title="Variance" 
          value={Math.abs(variance)} 
          subtitle={isReconciled ? "Reconciled" : "Unreconciled"}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="monthly" disabled={bankAccounts.length === 0}>Monthly Data</TabsTrigger>
          <TabsTrigger value="summary" disabled={bankAccounts.length === 0}>Reconciliation Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {/* Import from Sources Card */}
          <Card className="border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-4 h-4" />
                Import from Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={importFromBankStatements}
                  disabled={isImporting || isLoadingStatements}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  Pull Bank Side from Statements
                  {bankStatements.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {bankStatements.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={importFromSpreadsheet}
                  disabled={isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  Pull Book Side from Spreadsheet
                  {cashAnalysis?.rawData && cashAnalysis.rawData.length > 1 && (
                    <Badge variant="secondary" className="ml-1">
                      Ready
                    </Badge>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bank Side: Beginning/ending balances and transaction totals from uploaded bank statements.
                Book Side: GL cash balances from the Cash tab in your spreadsheet.
              </p>
            </CardContent>
          </Card>

          {/* AI Transfer Classification Card */}
          {bankStatements.length > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Transfer Classification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  AI can analyze your bank transactions to separate interbank transfers and owner distributions from operating activity.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {!hasClassifications ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await classify();
                          toast.success("Transfers classified", {
                            description: "Interbank and owner transfer totals have been populated.",
                          });
                        } catch {
                          toast.error("Classification failed", {
                            description: "Please try again or classify manually.",
                          });
                        }
                      }}
                      disabled={isClassifying || isLoadingClassifications}
                      className="gap-2"
                    >
                      {isClassifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isClassifying ? "Classifying…" : "Classify Transfers"}
                    </Button>
                  ) : (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Classified
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReviewDialog(true)}
                        className="gap-2"
                      >
                        Review Classifications
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          try {
                            await classify();
                            toast.success("Transfers re-classified");
                          } catch {
                            toast.error("Classification failed");
                          }
                        }}
                        disabled={isClassifying}
                        className="gap-2 text-xs"
                      >
                        {isClassifying ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Re-run
                      </Button>
                    </>
                  )}
                </div>
                {hasClassifications && projectId && (
                  <p className="text-xs text-muted-foreground">
                    <Link
                      to={`/project/${projectId}/workbook`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      View detailed Proof of Cash in the Workbook
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transfer Review Dialog */}
          <TransferReviewDialog
            open={showReviewDialog}
            onOpenChange={setShowReviewDialog}
            rawData={classificationRawData ?? null}
            bankStatements={bankStatements}
            onSave={updateClassifications}
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank Accounts Setup</CardTitle>
              <Button onClick={addBankAccount} size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Add Account
              </Button>
            </CardHeader>
            <CardContent>
              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No bank accounts configured</p>
                  <p className="text-sm">Add bank accounts manually or import from bank statements above</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell>
                          <Input
                            value={account.name}
                            onChange={(e) => updateBankAccount(account.id, { name: e.target.value })}
                            placeholder="Account name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={account.accountNumber}
                            onChange={(e) => updateBankAccount(account.id, { accountNumber: e.target.value })}
                            placeholder="****1234"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={account.type}
                            onValueChange={(value) => updateBankAccount(account.id, { type: value as BankAccount["type"] })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="checking">Checking</SelectItem>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="credit">Credit Card</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={account.institution}
                            onChange={(e) => updateBankAccount(account.id, { institution: e.target.value })}
                            placeholder="Bank name"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBankAccount(account.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Label>Select Account</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.institution})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedAccount ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a bank account to enter monthly data
                </div>
              ) : periods.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No periods configured</p>
                  <p className="text-sm">Configure periods in Project Setup to enter monthly data</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">Line Item</TableHead>
                        {periods.map((period) => (
                          <TableHead key={period.id} className="text-right min-w-[120px]">
                            {period.label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Bank Section */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={periods.length + 1} className="font-semibold">
                          Bank Statement Data
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Beginning Bank Balance</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.beginningBalance || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  beginningBalance: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Deposits per Bank</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.depositsPerBank || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  depositsPerBank: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Withdrawals per Bank</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.withdrawalsPerBank || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  withdrawalsPerBank: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell className="sticky left-0 bg-card">Ending Bank Balance</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          const calculated = md.beginningBalance + md.depositsPerBank - md.withdrawalsPerBank;
                          return (
                            <TableCell key={period.id} className="text-right">
                              {formatCurrency(calculated)}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Book Section */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={periods.length + 1} className="font-semibold">
                          Book Data (per GL)
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Beginning Book Balance</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.beginningBookBalance || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  beginningBookBalance: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Receipts per Books</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.receiptsPerBooks || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  receiptsPerBooks: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Disbursements per Books</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.disbursementsPerBooks || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  disbursementsPerBooks: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell className="sticky left-0 bg-card">Ending Book Balance</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          const calculated = md.beginningBookBalance + md.receiptsPerBooks - md.disbursementsPerBooks;
                          return (
                            <TableCell key={period.id} className="text-right">
                              {formatCurrency(calculated)}
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Reconciling Items */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={periods.length + 1} className="font-semibold">
                          Reconciling Items
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Deposits in Transit</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.depositsInTransit || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  depositsInTransit: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Outstanding Checks</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.outstandingChecks || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  outstandingChecks: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>

                      {/* Classification */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={periods.length + 1} className="font-semibold">
                          Transaction Classification
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Interbank Transfers</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.interbankTransfers || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  interbankTransfers: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow>
                        <TableCell className="sticky left-0 bg-card">Owner Distributions</TableCell>
                        {periods.map((period) => {
                          const md = getMonthlyData(period.id, selectedAccount.id);
                          return (
                            <TableCell key={period.id}>
                              <Input
                                type="number"
                                value={md.ownerDistributions || ""}
                                onChange={(e) => updateMonthlyData(period.id, selectedAccount.id, { 
                                  ownerDistributions: parseFloat(e.target.value) || 0 
                                })}
                                className="text-right"
                              />
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Summary by Period</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Bank Balance</TableHead>
                    <TableHead className="text-right">+ Deposits in Transit</TableHead>
                    <TableHead className="text-right">- Outstanding Checks</TableHead>
                    <TableHead className="text-right">Adjusted Bank</TableHead>
                    <TableHead className="text-right">Book Balance</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {totalsByPeriod.map((period) => {
                    const adjBank = period.totalBankEnding + period.totalDepositsInTransit - period.totalOutstandingChecks;
                    const periodVariance = adjBank - period.totalBookEnding;
                    const periodReconciled = Math.abs(periodVariance) < 0.01;

                    return (
                      <TableRow key={period.periodId}>
                        <TableCell className="font-medium">{period.periodLabel}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.totalBankEnding)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.totalDepositsInTransit)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.totalOutstandingChecks)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(adjBank)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(period.totalBookEnding)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Math.abs(periodVariance))}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={periodReconciled ? "default" : "destructive"} className="gap-1">
                            {periodReconciled ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {periodReconciled ? "OK" : "Diff"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
